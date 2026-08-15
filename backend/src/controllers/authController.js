/* ==========================================================================
   SEMS Backend — Auth Controller
   Handles register, login, and "who am I" (/me). Passwords are hashed with
   bcryptjs before ever touching the database — plaintext passwords are
   never stored or logged.
   ========================================================================== */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prismaClient.js';
import { generateToken } from '../utils/generateToken.js';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories.js';
import { sendOtpEmail, sendWelcomeEmail } from '../utils/mailer.js';
import { config } from '../config/env.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function issueOtp(user) {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(Date.now() + config.otpTtlMinutes * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { otpHash, otpExpiresAt },
  });

  await sendOtpEmail(user.email, otp);
  return otp;
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const errors = {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Name is required.';
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      errors.email = 'A valid email is required.';
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ errors: { email: 'An account with this email already exists.' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      },
    });

    // Give the new user their own copy of the default categories.
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id })),
    });

    await issueOtp(user);

    res.status(201).json({
      message: 'Account created. A verification code has been sent to your email.',
      requiresVerification: true,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email first.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = generateToken(user.id, user.email);
    res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email.' });
    }

    if (user.emailVerified) {
      const token = generateToken(user.id, user.email);
      return res.json({ user: sanitizeUser(user), token });
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ error: 'No verification code pending. Please register again.' });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'This verification code has expired. Please request a new one.' });
    }

    const otpMatches = await bcrypt.compare(otp, user.otpHash);
    if (!otpMatches) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, otpHash: null, otpExpiresAt: null },
    });

    const verified = await prisma.user.findUnique({ where: { id: user.id } });
    sendWelcomeEmail(verified.email, verified.name).catch((err) => {
      console.error('[SEMS API] Welcome email failed (non-fatal):', err.message);
    });

    const token = generateToken(user.id, user.email);
    res.json({ user: sanitizeUser(verified), token });
  } catch (error) {
    next(error);
  }
}

export async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'This email is already verified.' });
    }

    await issueOtp(user);
    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
}