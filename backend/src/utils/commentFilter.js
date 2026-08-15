/* ==========================================================================
   SEMS Backend — Simple Profanity / Spam Filter
   Blocks abusive words and generic spam patterns so bad comments never get
   published. Comments that trip the filter are stored as blocked=true.
   ========================================================================== */

const BLOCKED_WORDS = [
  'fuck', 'fck', 'f*ck', 'shit', 'bitch', 'bastard', 'asshole', 'dick',
  'cunt', 'nigga', 'nigger', 'faggot', 'whore', 'slut', 'piss', 'suck my',
  'kill yourself', 'hate you', 'stupid bitch', 'moron', 'idiot', 'loser',
];

// Simple spelling-distance tolerant match via lowercase substring.
export function isProfane(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

export function hasSpamPattern(text) {
  if (!text) return false;
  // URLs or long repeated gibberish
  if (/https?:\/\/|www\./i.test(text)) return true;
  if (/(.)\1{8,}/.test(text)) return true;
  return false;
}

export function isBlockedContent(text) {
  return isProfane(text) || hasSpamPattern(text);
}