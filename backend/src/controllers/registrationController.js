const mongoose = require('mongoose');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const { computeCompetitionState } = require('../utils/computeStatus');
const { ApiError } = require('../middleware/errorHandler');

/**
 * POST /api/competitions/:id/register
 *
 * This is the operation most exposed to "thousands of concurrent users" - many
 * requests can arrive at the same instant when only a handful of spots remain
 * (a classic last-seats-on-a-flight problem). Correctness here relies on two
 * independent DB-level guarantees rather than any in-application locking
 * (in-app locks don't work once you have more than one server process/instance):
 *
 *   1. Spot capacity: bookedSpots is incremented with an atomic
 *      findOneAndUpdate({ bookedSpots: { $lt: totalSpots } }, { $inc: { bookedSpots: 1 } }).
 *      MongoDB guarantees only one such update can "win" the last available spot;
 *      any request that finds no matching document (because capacity is already
 *      full) is rejected before an increment ever happens. This means bookedSpots
 *      can mathematically never exceed totalSpots, no matter the request volume.
 *
 *   2. One registration per user: enforced by the unique compound index on
 *      Registration({ competition, user }). Even if a user double-taps "Register"
 *      and two requests race past the initial "already registered?" check, only
 *      one insert can succeed - the second throws a duplicate key error (11000),
 *      which we catch and translate into a friendly 409.
 *
 * If step 1 succeeds (spot reserved) but step 2 fails for a reason OTHER than
 * "already registered" (e.g. a transient DB error), we release the reserved spot
 * by decrementing bookedSpots back down, so a failed request never permanently
 * eats a spot.
 *
 * Production note: with a MongoDB replica set (e.g. Atlas), the reserve+insert
 * could instead be wrapped in a multi-document transaction for stronger
 * atomicity. The reserve-then-compensate approach here is deliberately chosen
 * because it also works against a single standalone mongod (common in local/dev
 * setups) and avoids the extra latency of a transaction for the common case.
 */
async function registerForCompetition(req, res, next) {
  const competitionId = req.params.id;
  const userId = req.user._id;

  try {
    const competition = await Competition.findById(competitionId).lean();
    if (!competition || !competition.isPublished) {
      throw new ApiError(404, 'Competition not found');
    }

    const now = new Date();
    const { registrationOpensAt, registrationClosesAt } = competition.dates;
    if (now < registrationOpensAt) {
      throw new ApiError(400, 'Registration has not opened yet', { code: 'REGISTRATION_NOT_OPEN' });
    }
    if (now >= registrationClosesAt) {
      throw new ApiError(400, 'Registration is closed for this competition', { code: 'REGISTRATION_CLOSED' });
    }

    // Fast pre-check for a friendlier error message. Not relied on for correctness -
    // the unique index below is what actually prevents a double booking.
    const existing = await Registration.findOne({ competition: competitionId, user: userId, status: 'confirmed' });
    if (existing) {
      throw new ApiError(409, 'You are already registered for this competition', { code: 'ALREADY_REGISTERED' });
    }

    // --- Step 1: atomically reserve a spot ---
    const reserved = await Competition.findOneAndUpdate(
      { _id: competitionId, $expr: { $lt: ['$bookedSpots', '$totalSpots'] } },
      { $inc: { bookedSpots: 1 } },
      { new: true }
    );

    if (!reserved) {
      throw new ApiError(409, 'All spots have been booked for this competition', { code: 'SPOTS_FULL' });
    }

    // --- Step 2: create the registration record ---
    let registration;
    try {
      registration = await Registration.create({
        competition: competitionId,
        user: userId,
        entryFeePaid: competition.entryFee,
        status: 'confirmed',
        // In production this would be set only after a verified payment webhook
        // (Razorpay), and the registration would move from "pending" -> "confirmed".
        paymentReference: `sim_${new mongoose.Types.ObjectId().toString()}`,
      });
    } catch (err) {
      // Release the spot we reserved above, since the registration didn't actually happen.
      await Competition.updateOne({ _id: competitionId }, { $inc: { bookedSpots: -1 } });

      if (err.code === 11000) {
        // Lost a race to another concurrent request from the same user.
        throw new ApiError(409, 'You are already registered for this competition', { code: 'ALREADY_REGISTERED' });
      }
      throw err;
    }

    const computed = computeCompetitionState(reserved.toObject(), { isRegistered: true, hasSubmitted: false });

    res.status(201).json({
      data: {
        registration,
        spotsLeft: computed.spotsLeft,
        computed,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/competitions/:id/register
 * Cancels a registration and releases the spot, but only before the submission
 * window opens (mirrors canCancelRegistration in computeStatus.js) to avoid
 * churn once people have started submitting entries.
 */
async function cancelRegistration(req, res, next) {
  const competitionId = req.params.id;
  const userId = req.user._id;

  try {
    const competition = await Competition.findById(competitionId).lean();
    if (!competition) throw new ApiError(404, 'Competition not found');

    const registration = await Registration.findOne({
      competition: competitionId,
      user: userId,
      status: 'confirmed',
    });
    if (!registration) throw new ApiError(404, 'No active registration found');

    const now = new Date();
    if (now >= competition.dates.submissionStartsAt) {
      throw new ApiError(400, 'Registrations can no longer be cancelled once submissions have opened', {
        code: 'CANCELLATION_WINDOW_CLOSED',
      });
    }

    registration.status = 'cancelled';
    registration.cancelledAt = now;
    await registration.save();

    // Release the spot back into the pool. Guard with $gt: 0 so a duplicate/late
    // retry of this request can never push bookedSpots negative.
    await Competition.updateOne({ _id: competitionId, bookedSpots: { $gt: 0 } }, { $inc: { bookedSpots: -1 } });

    res.json({ data: { message: 'Registration cancelled' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerForCompetition, cancelRegistration };
