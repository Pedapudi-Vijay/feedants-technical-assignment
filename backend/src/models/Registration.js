const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * One document per (user, competition) registration attempt.
 *
 * The unique compound index on { competition, user } is the actual source of
 * truth that prevents a user from booking two spots in the same competition -
 * even if two requests from the same user land at the exact same millisecond,
 * MongoDB's unique index guarantees only one insert succeeds. Application-level
 * "have they already registered?" checks are just a fast pre-check / nicer error
 * message; the index is what makes it safe under concurrency.
 */
const registrationSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    entryFeePaid: { type: Number, required: true, min: 0 },
    paymentReference: { type: String, default: '' }, // Razorpay order/payment id in a real integration
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

registrationSchema.index({ competition: 1, user: 1 }, { unique: true });
registrationSchema.index({ competition: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
