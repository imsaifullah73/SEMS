/* ==========================================================================
   SEMS Backend — Comment Controller
   Public comments + replies, with automatic profanity/spam blocking.
   Owner (isOwner) comments are testimonials that show at the top.
   Owner account (email: imsaifullah73@gmail.com) can reply & unblock.
   ========================================================================== */

import { prisma } from '../config/prismaClient.js';
import { isBlockedContent } from '../utils/commentFilter.js';
import { config } from '../config/env.js';

const OWNER_EMAIL = 'imsaifullah73@gmail.com';

function isOwner(req) {
  return req.user && req.user.email === OWNER_EMAIL;
}

function sanitize(comment) {
  const { parentId, parent, ...safe } = comment;
  return safe;
}

export async function listComments(req, res, next) {
  try {
    const comments = await prisma.comment.findMany({
      where: { isReply: false },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }],
    });

    // Visitors never see blocked comments. Owners see them flagged.
    let visible = comments.map((c) => {
      const filtered = c.blocked ? { ...c, replies: c.replies.filter((r) => !r.blocked) } : c;
      return filtered;
    });
    if (!isOwner(req)) {
      visible = visible.filter((c) => !c.blocked);
    }
    res.json({ comments: visible.map(sanitize) });
  } catch (error) {
    next(error);
  }
}

export async function createComment(req, res, next) {
  try {
    const { author, text } = req.body;

    if (!author || !author.trim()) {
      return res.status(400).json({ error: 'Your name is required.' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }
    if (text.trim().length > 500) {
      return res.status(400).json({ error: 'Comments must be under 500 characters.' });
    }

    const blocked = isBlockedContent(text);

    const comment = await prisma.comment.create({
      data: {
        author: author.trim().slice(0, 60),
        text: text.trim(),
        blocked,
      },
    });

    res.status(201).json({ comment: sanitize(comment) });
  } catch (error) {
    next(error);
  }
}

export async function replyComment(req, res, next) {
  try {
    if (!isOwner(req)) {
      return res.status(403).json({ error: 'Only the owner can reply to comments.' });
    }
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Reply text is required.' });
    }

    const parent = await prisma.comment.findUnique({ where: { id } });
    if (!parent) return res.status(404).json({ error: 'Comment not found.' });

    const blocked = isBlockedContent(text);

    const reply = await prisma.comment.create({
      data: {
        author: 'Saif Ullah',
        text: text.trim(),
        isOwner: true,
        isReply: true,
        parentId: id,
        blocked,
      },
    });

    res.status(201).json({ comment: sanitize(reply) });
  } catch (error) {
    next(error);
  }
}

export async function setBlocked(req, res, next) {
  try {
    if (!isOwner(req)) {
      return res.status(403).json({ error: 'Only the owner can manage comments.' });
    }
    const { id } = req.params;
    const { blocked } = req.body;

    const comment = await prisma.comment.update({
      where: { id },
      data: { blocked: Boolean(blocked) },
    });

    res.json({ comment: sanitize(comment) });
  } catch (error) {
    next(error);
  }
}