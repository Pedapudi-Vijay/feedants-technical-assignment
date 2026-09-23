/**
 * Computes the competition's current lifecycle stage and the set of things
 * the requesting user is allowed to do right now.
 *
 * This is intentionally computed on every read from `dates` + `bookedSpots`
 * rather than stored, so it can never go stale (no cron job needed to "close"
 * a competition at midnight - the server just checks Date.now() on request).
 *
 * @param {object} competition - a Competition mongoose doc (or plain object with the same shape)
 * @param {object} [userState] - { isRegistered: boolean, hasSubmitted: boolean }
 * @param {Date} [now]
 */
function computeCompetitionState(competition, userState = {}, now = new Date()) {
  const { registrationOpensAt, registrationClosesAt, submissionStartsAt, submissionEndsAt, resultDate } =
    competition.dates;

  const spotsLeft = Math.max(competition.totalSpots - competition.bookedSpots, 0);
  const isFull = spotsLeft <= 0;
  const isRegistered = Boolean(userState.isRegistered);
  const hasSubmitted = Boolean(userState.hasSubmitted);

  const registrationOpen = now >= registrationOpensAt && now < registrationClosesAt;
  const submissionOpen = now >= submissionStartsAt && now < submissionEndsAt;
  const resultsOut = now >= resultDate;

  // Human-readable lifecycle stage, mainly for display/analytics - business rules
  // below use the underlying booleans, not this string, to avoid edge-case drift.
  let stage = 'upcoming';
  if (resultsOut) stage = 'results_declared';
  else if (now >= submissionEndsAt) stage = 'submission_closed';
  else if (submissionOpen) stage = 'submission_open';
  else if (now >= registrationClosesAt) stage = 'registration_closed';
  else if (registrationOpen) stage = 'registration_open';

  const canRegister = registrationOpen && !isFull && !isRegistered && !resultsOut;
  const canSubmit = isRegistered && submissionOpen && !resultsOut;
  const canCancelRegistration = isRegistered && !hasSubmitted && now < submissionStartsAt;

  // Primary call-to-action button, mirroring the "Upload Submission / Registered" button
  // at the bottom of the design, generalized to every reachable state.
  let primaryAction = 'VIEW_ONLY';
  if (resultsOut) primaryAction = 'VIEW_RESULTS';
  else if (isRegistered && submissionOpen && !hasSubmitted) primaryAction = 'UPLOAD_SUBMISSION';
  else if (isRegistered && hasSubmitted) primaryAction = 'SUBMISSION_RECEIVED';
  else if (isRegistered) primaryAction = 'REGISTERED'; // registered, but submission window not open yet
  else if (canRegister) primaryAction = 'REGISTER_NOW';
  else if (isFull && registrationOpen) primaryAction = 'SPOTS_FULL';
  else if (!registrationOpen && !isRegistered) primaryAction = 'REGISTRATION_CLOSED';

  return {
    stage,
    spotsLeft,
    isFull,
    isRegistered,
    hasSubmitted,
    flags: {
      registrationOpen,
      submissionOpen,
      resultsOut,
    },
    permissions: {
      canRegister,
      canSubmit,
      canCancelRegistration,
    },
    primaryAction,
    // Countdown target the client should render (e.g. "Registration closes in").
    // Falls back to null once there's nothing left to count down to.
    countdownTarget: registrationOpen
      ? registrationClosesAt
      : submissionOpen
      ? submissionEndsAt
      : null,
  };
}

module.exports = { computeCompetitionState };
