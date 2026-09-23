const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registration: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
    fileUrl: { type: String, required: true }, // in production: S3/Cloud Storage URL from a pre-signed upload
    fileType: { type: String, default: 'video' },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'accepted', 'rejected'],
      default: 'submitted',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// A user may re-submit before the submission window closes (replacing their entry),
// but should only have one *active* submission per competition.
submissionSchema.index({ competition: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
