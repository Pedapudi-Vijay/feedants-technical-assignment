# Feedants — Competition Details Screen (Full-Stack Technical Assignment)

A functional, data-driven implementation of the Competition Details screen: **React Native**
(Expo) frontend, **Node.js + Express** backend, **MongoDB** database. Nothing on the screen is
hardcoded — every dynamic element (spots left, countdown, CTA button, registration state) is
served from the backend and computed from the competition's dates and capacity at request time.

```
feedants-assignment/
├── backend/     Node.js + Express + MongoDB API
├── mobile/      React Native (Expo) app — Competition Details screen
└── README.md    (this file)
```

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm run seed               # creates a demo user + one competition matching the design
npm run dev                 # starts the API on http://localhost:4000
```

`npm run seed` prints the seeded competition's `_id` and the demo login
(`demo@feedants.com` / `password123`). Copy that id.

Requires a running MongoDB instance. Easiest options:
- Local: `mongod` (or `brew services start mongodb-community`), then leave `MONGO_URI` as the
  default local URI in `.env.example`.
- Hosted: create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and paste its
  connection string into `MONGO_URI`.

**Environment variables** (`backend/.env`):

| Variable | Description |
|---|---|
| `PORT` | API port (default `4000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens — set to a long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CORS_ORIGIN` | `*` for local dev, or a comma-separated list of allowed origins |

### 2. Mobile app

```bash
cd mobile
npm install
```

Open `mobile/src/api/config.js` and set:
- `API_BASE_URL` — your machine's LAN IP if testing on a physical device via Expo Go
  (e.g. `http://192.168.1.23:4000/api`); `http://10.0.2.2:4000/api` on the Android emulator;
  `http://localhost:4000/api` on iOS simulator.
- `DEMO_COMPETITION_ID` — the id printed by `npm run seed`.

```bash
npm start          # opens Expo dev tools — scan the QR code with Expo Go, or press i/a
```

The app opens on a simple login screen (email/password fields are pre-filled with the seeded
demo account) and then the Competition Details screen, pulling live data from the backend.

## API overview

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | – | Create an account |
| `POST` | `/api/auth/login` | – | Get a JWT |
| `GET` | `/api/competitions` | optional | List competitions |
| `GET` | `/api/competitions/:id` | optional | Full details + computed state (personalized if logged in) |
| `POST` | `/api/competitions/:id/register` | required | Register / book a spot |
| `DELETE` | `/api/competitions/:id/register` | required | Cancel registration (before submissions open) |
| `POST` | `/api/competitions/:id/submissions` | required | Upload/replace a submission |

`GET /api/competitions/:id` returns the competition document plus a `computed` object:
`{ stage, spotsLeft, isFull, isRegistered, hasSubmitted, flags, permissions, primaryAction,
countdownTarget }`. The mobile app renders purely off `computed` — it never re-derives lifecycle
logic client-side — so the UI can't drift from what the server considers true (e.g. it can't show
"Register Now" past the deadline just because the phone's clock is wrong).

## How dynamic state is handled

- **Nothing is hardcoded.** Title, prize pool, entry fee, spots, judge, dates, previous winners,
  about/judging/rules text, rewards table, and referral info all come from the `Competition`
  document in MongoDB (see `backend/src/models/Competition.js`).
- **Lifecycle is computed, not stored.** `backend/src/utils/computeStatus.js` derives the
  competition's stage (`upcoming → registration_open → registration_closed → submission_open →
  submission_closed → results_declared`) from `Date.now()` vs. the competition's date fields on
  every request. There's no cron job flipping a status flag at midnight, so it can never go stale.
- **The CTA button is a pure function of server state.** `primaryAction` in the computed object
  (`REGISTER_NOW`, `REGISTERED`, `UPLOAD_SUBMISSION`, `SUBMISSION_RECEIVED`, `SPOTS_FULL`,
  `REGISTRATION_CLOSED`, `VIEW_RESULTS`) maps 1:1 to what the button in the design does
  ("Upload Submission" / "Registered").
- **Concurrency-safe registration.** With thousands of users hitting "Register" on a
  near-full competition, correctness can't rely on reading `spotsLeft` and then writing —
  that has an obvious race window. Instead `backend/src/controllers/registrationController.js`:
  1. Atomically reserves a spot with `findOneAndUpdate({ bookedSpots: { $lt: totalSpots } }, {
     $inc: { bookedSpots: 1 } })` — MongoDB guarantees this can't push `bookedSpots` past
     `totalSpots` no matter how many requests arrive simultaneously.
  2. Creates the `Registration` document, whose **unique compound index on `{ competition, user
     }`** is the real guarantee against double-booking, even if two requests from the same user
     race past an initial "already registered?" check.
  3. If step 2 fails for any reason other than "already registered," the reserved spot is
     released (`$inc: -1`) so a failed request never permanently eats a spot.

## Assumptions

- **Auth is deliberately minimal.** Email/password + JWT is enough to demonstrate
  per-user state (registered/not, submitted/not); a real deployment would likely use the
  company's existing identity provider/SSO, OTP login, or a social login flow.
- **Payments are simulated.** Registration accepts the competition's `entryFee` and stores a
  `paymentReference`, but there's no real Razorpay integration. In production, registration
  would create a `pending` registration tied to a Razorpay order, and a **verified webhook**
  (not the client) would flip it to `confirmed` — never trust the client to say "payment
  succeeded."
- **File upload is simulated.** The submission endpoint accepts a `fileUrl` as if the video was
  already uploaded to object storage (S3/GCS) via a client-obtained pre-signed URL. Routing large
  video files through the API server doesn't scale, so a real build would add an endpoint to mint
  pre-signed upload URLs and have the mobile app upload directly to storage.
- **One active registration and one active submission per user per competition** — matches "1 /
  20 Booked" style capacity semantics in the design; re-submission is allowed (replaces the
  previous entry) until the submission deadline, since the design doesn't suggest submissions are
  locked immediately on upload.
- **Cancellation** is allowed only before the submission window opens, to keep the "spots
  left" number meaningful and avoid last-minute churn once people are producing entries — this
  wasn't specified in the design and is a reasonable interpretation of "user participation or
  registration state."
- **"Only contributions from paid participants will be considered for judging"** (the design's
  disclaimer) is enforced implicitly: submission requires an active, confirmed (paid)
  registration.

## Major technical decisions

- **Status computed on read, not stored.** Avoids a background job to "close" competitions and
  guarantees consistency between what's displayed and what the business rules actually allow.
- **Reserve-then-insert with compensation, rather than a Mongo transaction, for spot booking.**
  This works against a single standalone `mongod` (common for local/dev setups and this
  assignment) as well as a replica set, and avoids transaction overhead for the common path. A
  production deployment on a replica set (e.g. MongoDB Atlas) could instead wrap the reserve +
  insert in a session transaction for stronger atomicity — noted as a possible upgrade below.
- **Rate limiting on the registration endpoint specifically** (`backend/src/routes/
  competitionRoutes.js`), keyed by user id rather than IP, since this is the endpoint most likely
  to see a burst of concurrent traffic (everyone registering the moment a popular competition
  opens) and the one where fairness matters most.
- **Mongoose virtuals (`spotsLeft`) instead of a stored field**, so it's always derived from
  `totalSpots - bookedSpots` and can't drift out of sync.
- **Optional auth on `GET /competitions/:id`** so the screen is still browsable by logged-out
  users (public view), but returns fully personalized state once a token is present.
- **Screen built from small, single-purpose components** (`JudgeCard`, `SpotsProgressBar`,
  `CountdownBanner`, `DateCard`, `PreviousWinners`, `InfoTabs`, `RewardsList`,
  `PrimaryActionButton`) rather than one large screen file, matching how the design itself is
  composed of clearly separable cards/sections — makes each piece independently testable and
  reusable on other competition-style screens.

## Trade-offs considered

- **Transactions vs. reserve-and-compensate** for booking a spot — chosen the latter for
  portability (works without a replica set) at the cost of a very small window where a reserved
  spot could be "in limbo" if the process crashes between steps 1 and 2 (mitigated by the
  compensation step running in the same request; a production system would add a periodic
  reconciliation job to catch true crash scenarios).
- **Polling/pull-to-refresh vs. real-time updates (WebSockets).** The screen re-fetches on pull-
  to-refresh and after any user action, rather than subscribing to live spot-count updates. Real-
  time "spots left" ticking down as other users register would be nicer but adds infrastructure
  (WebSocket/SSE server, connection scaling) that's arguably out of scope for a details screen —
  flagged as a good next step below.
- **JWT in AsyncStorage vs. secure storage.** Used `AsyncStorage` for simplicity; a production
  app should use `expo-secure-store` (Keychain/Keystore-backed) for the auth token.
- **Denormalized competition document vs. normalized collections** for things like rewards and
  previous winners — kept as embedded arrays since they're small, read-heavy, and always fetched
  together with the competition (classic MongoDB "data that's accessed together, stored
  together"), rather than splitting into their own collections with joins.

## What I'd improve for production

- Real-time spot count via WebSockets/SSE (or short-interval polling) so "X spots left" updates
  live without a manual refresh, which matters most in the final moments before a popular
  competition fills up.
- Real payment integration (Razorpay order creation + signature-verified webhook) instead of the
  simulated `paymentReference`.
- Real file upload via pre-signed URLs, with client-side upload progress and background upload
  support (the mobile OS can kill the app mid-upload on a large video).
- Idempotency keys on the register/submit endpoints so a retried request from a flaky mobile
  network never risks a duplicate side effect, on top of the existing unique-index protection.
- Move the reserve-then-insert registration flow to a Mongo session transaction once running on a
  replica set, for stronger atomicity guarantees under process crashes.
- Push notifications for "registration closing soon" / "results are out," reusing the same
  computed lifecycle stage server-side to decide when to send them.
- Proper pagination and caching (e.g. Redis) on `GET /competitions` for the list/explore screen
  once there are many competitions.
- Automated tests: unit tests for `computeStatus.js` (the state machine is the highest-risk logic
  in this codebase) and an integration/load test simulating concurrent registration requests
  against a near-full competition to verify `bookedSpots` never exceeds `totalSpots`.

## Screen recording & repository

This zip contains the full source only. To complete the submission:
1. Push `backend/` and `mobile/` to a GitHub repository (a single repo with both folders, as
   structured here, works fine — or split into two repos if preferred).
2. Record a short screen capture showing: browsing the details screen, registering, the spots
   counter and countdown updating, and (once the submission window is open) uploading a
   submission.
