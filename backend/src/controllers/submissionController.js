const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const { ApiError } = require('../middleware/errorHandler');

/**
 * POST /api/competitions/:id/submissions
 *
 * In this reference implementation the client sends a fileUrl (as if a file was
 * already uploaded directly to object storage via a pre-signed URL - the standard
 * production pattern, since routing large video files through the API server
 * doesn't scale well). Swap fileUrl for real S3/GCS pre-signed upload logic
 * without changing anything else here.
 */
async function submitEntry(req, res, next) {
  const competitionId = req.params.id;
  const userId = req.user._id;
  const { fileUrl, fileType } = req.body;

  try {
    if (!fileUrl) {
      throw new ApiError(400, 'fileUrl is required');
    }

    const competition = await Competition.findById(competitionId).lean();
    if (!competition) throw new ApiError(404, 'Competition not found');

    const registration = await Registration.findOne({
      competition: competitionId,
      user: userId,
      status: 'confirmed',
    });
    if (!registration) {
      throw new ApiError(403, 'You must be registered for this competition to submit an entry', {
        code: 'NOT_REGISTERED',
      });
    }

    const now = new Date();
    const { submissionStartsAt, submissionEndsAt } = competition.dates;
    if (now < submissionStartsAt) {
      throw new ApiError(400, 'The submission window has not opened yet', { code: 'SUBMISSION_NOT_OPEN' });
    }
    if (now >= submissionEndsAt) {
      throw new ApiError(400, 'The submission window has closed', { code: 'SUBMISSION_CLOSED' });
    }

    // upsert: allow replacing an entry up until the deadline, per the unique index
    // on (competition, user).
    const submission = await Submission.findOneAndUpdate(
      { competition: competitionId, user: userId },
      {
        $set: {
          fileUrl,
          fileType: fileType || 'video',
          status: 'submitted',
          registration: registration._id,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ data: submission });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitEntry };
