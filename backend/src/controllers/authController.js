/* ==========================================================================
   SEMS Backend — Auth Controller
   Handles register, login, and "who am I" (/me). Passwords are hashed with
   bcryptjs before ever touching the database — plaintext passwords are
   never stored or logged.
   ========================================================================== */

import bcrypt from 'bcryptjs';
import { prisma } from '../config/prismaClient.js';
import { generateToken } from '../utils/generateToken.js';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const token = generateToken(user.id);
    res.status(201).json({ user: sanitizeUser(user), token });
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

    const token = generateToken(user.id);
    res.json({ user: sanitizeUser(user), token });
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