/**
 * Seeds one demo user and one competition whose static content mirrors the
 * provided design reference (Feedants Classical Dance), but with dates shifted
 * relative to "now" so you can actually see the dynamic states in action:
 * registration currently open, ~1 day left, 1/20 spots booked.
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Competition = require('../models/Competition');
const User = require('../models/User');
const Registration = require('../models/Registration');

async function seed() {
  await connectDB();

  await Promise.all([Competition.deleteMany({}), User.deleteMany({}), Registration.deleteMany({})]);

  const demoUser = await User.create({
    name: 'Demo User',
    email: 'demo@feedants.com',
    passwordHash: await User.hashPassword('password123'),
  });

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const competition = await Competition.create({
    title: 'Feedants Classical Dance',
    tags: ['Dance', 'Multi-Win'],
    winnersGetCertificate: true,
    prizePool: 1500,
    entryFee: 99,
    totalSpots: 20,
    bookedSpots: 1,
    judge: {
      name: 'Manju Dubey',
      title: 'Professional Kathak Dancer',
      experienceLabel: '12+ Years of Experience',
      photoUrl: 'https://example.com/judges/manju-dubey.jpg',
      introVideoUrl: 'https://example.com/videos/judge-intro.mp4',
    },
    dates: {
      registrationOpensAt: new Date(now - 5 * day),
      registrationClosesAt: new Date(now + day + 6 * 60 * 60 * 1000 + 28 * 60 * 1000), // ~1d 6h 28m from now
      submissionStartsAt: new Date(now - 2 * day),
      submissionEndsAt: new Date(now + 8 * day),
      resultDate: new Date(now + 10 * day),
    },
    previousWinners: [
      { name: 'Riya Shah', position: '1st Winner', photoUrl: '', videoUrl: '' },
      { name: 'Aarav Mehta', position: '1st Winner', photoUrl: '', videoUrl: '' },
      { name: 'Neha Verma', position: '2nd Winner', photoUrl: '', videoUrl: '' },
      { name: 'Ishita Chopra', position: '3rd Winner', photoUrl: '', videoUrl: '' },
    ],
    about: {
      summary:
        'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.',
      details:
        'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance. Entries are judged on technique, expression (abhinaya), rhythm alignment (taal), and overall presentation. Participants may perform any classical Indian dance style (Bharatanatyam, Kathak, Odissi, Kuchipudi, Manipuri, Mohiniyattam, or Kathakali).',
    },
    judgingParameters: [
      'Technique and form (30%)',
      'Expression and storytelling / abhinaya (25%)',
      'Rhythm and timing / taal alignment (25%)',
      'Overall presentation and costume (20%)',
    ],
    rulesAndEligibility: [
      'Open to all age groups; no prior competition win required.',
      'One submission per participant; re-uploads allowed until the deadline.',
      'Performance video must be a single, unedited take between 1-3 minutes.',
      'Only entries from paid, registered participants are eligible for judging.',
    ],
    rewards: [
      { position: 1, label: '1st Winner', amount: 550 },
      { position: 2, label: '2nd Winner', amount: 300 },
      { position: 3, label: '3rd Winner', amount: 240 },
      { position: 4, label: '4th Winner', amount: 200 },
      { position: 5, label: '5th Winner', amount: 130 },
      { position: 6, label: '6th Winner', amount: 80 },
    ],
    disclaimer: 'Only contributions from paid participants will be considered for judging.',
    refundPolicyUrl: 'https://feedants.com/refund-policy',
    paymentPartnerLabel: 'Razorpay',
    referral: {
      enabled: true,
      rewardText: 'You earn ₹10 for every signup',
      linkTemplate: 'https://feedants.com/r/referral123',
    },
    isPublished: true,
  });

  console.log('Seeded demo user:', demoUser.email, '(password: password123)');
  console.log('Seeded competition id:', competition._id.toString());

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
