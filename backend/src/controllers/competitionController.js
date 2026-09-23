const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const { computeCompetitionState } = require('../utils/computeStatus');
const { ApiError } = require('../middleware/errorHandler');

/**
 * GET /api/competitions
 * Basic list for a home/explore screen. Not the focus of this assignment, but
 * included so the mobile app has something to navigate from.
 */
async function listCompetitions(req, res, next) {
  try {
    const { tag } = req.query;
    const filter = { isPublished: true };
    if (tag) filter.tags = tag;

    const competitions = await Competition.find(filter)
      .select('title tags prizePool entryFee totalSpots bookedSpots dates')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ data: competitions });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/competitions/:id
 * The main endpoint backing the Competition Details screen. Auth is optional:
 * logged-out users get the public view; logged-in users get personalized state.
 */
async function getCompetitionDetails(req, res, next) {
  try {
    const competition = await Competition.findById(req.params.id).lean();
    if (!competition || !competition.isPublished) {
      throw new ApiError(404, 'Competition not found');
    }

    let userState = {};
    if (req.user) {
      const [registration, submission] = await Promise.all([
        Registration.findOne({ competition: competition._id, user: req.user._id, status: 'confirmed' }).lean(),
        Submission.findOne({ competition: competition._id, user: req.user._id }).lean(),
      ]);
      userState = {
        isRegistered: Boolean(registration),
        hasSubmitted: Boolean(submission),
      };
    }

    const computed = computeCompetitionState(competition, userState);

    res.json({
      data: {
        ...competition,
        spotsLeft: computed.spotsLeft,
        computed, // { stage, permissions, primaryAction, countdownTarget, ... }
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCompetitions, getCompetitionDetails };
