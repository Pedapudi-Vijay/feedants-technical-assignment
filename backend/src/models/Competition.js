const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * A single "reward" row, e.g. { position: 1, label: '1st Winner', amount: 550 }
 */
const rewardSchema = new Schema(
  {
    position: { type: Number, required: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const previousWinnerSchema = new Schema(
  {
    name: { type: String, required: true },
    position: { type: String, required: true }, // "1st Winner", "2nd Winner" etc. (kept as label, not enum, for flexibility)
    photoUrl: { type: String },
    videoUrl: { type: String },
  },
  { _id: false }
);

const judgeSchema = new Schema(
  {
    name: { type: String, required: true },
    title: { type: String }, // e.g. "Professional Kathak Dancer"
    experienceLabel: { type: String }, // e.g. "12+ Years of Experience"
    photoUrl: { type: String },
    introVideoUrl: { type: String },
  },
  { _id: false }
);

/**
 * Competitions go through a lifecycle driven purely by dates + capacity, never by a
 * manually-flipped "status" field (that would drift out of sync). The lifecycle is
 * computed on read - see utils/computeStatus.js.
 *
 *   upcoming -> registration_open -> registration_closed -> submission_open
 *            -> submission_closed -> results_declared
 *
 * registration_open and submission_open can overlap (design shows "Submission Starts"
 * before "Register Before" in some cases), so both windows are modeled independently
 * rather than assuming they're sequential.
 */
const competitionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] }, // ["Dance", "Multi-Win"]
    winnersGetCertificate: { type: Boolean, default: false },

    prizePool: { type: Number, required: true, min: 0 },
    entryFee: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },

    // Capacity. bookedSpots is only ever mutated via atomic $inc operations guarded
    // by a condition (see registrationController) so it can never exceed totalSpots
    // even under concurrent requests.
    totalSpots: { type: Number, required: true, min: 1 },
    bookedSpots: { type: Number, default: 0, min: 0 },

    judge: judgeSchema,

    dates: {
      registrationOpensAt: { type: Date, required: true },
      registrationClosesAt: { type: Date, required: true },
      submissionStartsAt: { type: Date, required: true },
      submissionEndsAt: { type: Date, required: true },
      resultDate: { type: Date, required: true },
    },

    previousWinners: { type: [previousWinnerSchema], default: [] },

    about: {
      summary: { type: String, default: '' }, // short teaser shown before "View more"
      details: { type: String, default: '' }, // full text shown after "View more"
    },
    judgingParameters: { type: [String], default: [] }, // simple bullet list; could become rich objects later
    rulesAndEligibility: { type: [String], default: [] },

    rewards: { type: [rewardSchema], default: [] },

    disclaimer: { type: String, default: '' },
    refundPolicyUrl: { type: String, default: '' },
    paymentPartnerLabel: { type: String, default: 'Razorpay' },

    referral: {
      enabled: { type: Boolean, default: false },
      rewardText: { type: String, default: '' }, // "You earn ₹10 for every signup"
      linkTemplate: { type: String, default: '' }, // e.g. "https://feedants.com/r/{code}"
    },

    // Soft "kill switch" for admins, independent of date-based lifecycle.
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Frequently queried when listing/filtering competitions and when computing status.
competitionSchema.index({ 'dates.registrationClosesAt': 1 });
competitionSchema.index({ tags: 1 });
competitionSchema.index({ isPublished: 1, createdAt: -1 });

competitionSchema.virtual('spotsLeft').get(function spotsLeft() {
  return Math.max(this.totalSpots - this.bookedSpots, 0);
});

competitionSchema.set('toJSON', { virtuals: true });
competitionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Competition', competitionSchema);
