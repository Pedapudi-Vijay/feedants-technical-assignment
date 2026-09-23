const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth, attachUserIfPresent } = require('../middleware/auth');
const { listCompetitions, getCompetitionDetails } = require('../controllers/competitionController');
const { registerForCompetition, cancelRegistration } = require('../controllers/registrationController');
const { submitEntry } = require('../controllers/submissionController');

const router = express.Router();

// Registration is the hottest, most contention-prone endpoint (everyone hitting
// "Register" the second a popular competition opens), so it gets its own tighter
// rate limit on top of the global one in server.js. Keyed by user, not just IP,
// so it can't be trivially bypassed and doesn't unfairly block users behind a
// shared corporate/mobile NAT IP.
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : req.ip),
  message: { message: 'Too many registration attempts, please slow down.' },
});

router.get('/', listCompetitions);
router.get('/:id', attachUserIfPresent, getCompetitionDetails);

router.post('/:id/register', requireAuth, registerLimiter, registerForCompetition);
router.delete('/:id/register', requireAuth, cancelRegistration);

router.post('/:id/submissions', requireAuth, submitEntry);

module.exports = router;
