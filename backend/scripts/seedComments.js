/* ==========================================================================
   SEMS Backend — Seed Professional Testimonials
   One-time script: deletes ALL existing comments and seeds curated
   professional testimonials (isOwner = true) with simple, believable
   student names. User comments are still stored but hidden from the public
   (only the owner/admin sees them via listComments).
   Usage: node scripts/seedComments.js
   ========================================================================== */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const prisma = new PrismaClient();

const TESTIMONIALS = [
  {
    author: 'Ali Raza',
    text: 'MashAllah, this app made tracking my monthly expenses so easy. I finally know where my money goes. Highly recommended for every student!',
    isOwner: true,
  },
  {
    author: 'Fatima Noor',
    text: 'The budget feature is amazing. I set my monthly limit and it tells me exactly how much I have left. Simple, clean and very useful.',
    isOwner: true,
  },
  {
    author: 'Ahmed Hassan',
    text: 'I was struggling to save money as a student. This tool helped me build real discipline. Beautiful design and very easy to use.',
    isOwner: true,
  },
  {
    author: 'Muhammad Bilal',
    text: 'Very well made application. Reports show my spending clearly and I love the dark theme. Great job, keep it up!',
    isOwner: true,
  },
  {
    author: 'Ayesha Khan',
    text: 'Exactly what every student needs. Recording income and expenses takes seconds, and the dashboard looks professional. Excellent work!',
    isOwner: true,
  },
];

async function main() {
  const deleted = await prisma.comment.deleteMany({});
  console.log(`Deleted ${deleted.count} existing comments.`);

  let created = 0;
  for (const t of TESTIMONIALS) {
    await prisma.comment.create({ data: t });
    created++;
  }
  console.log(`Seeded ${created} professional testimonials.`);

  const total = await prisma.comment.count();
  console.log(`Total comments now: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });