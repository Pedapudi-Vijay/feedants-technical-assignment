// Point this at your backend. When running the backend locally and testing on
// a physical device via Expo Go, use your machine's LAN IP (not "localhost") -
// e.g. http://192.168.1.23:4000. On an Android emulator, 10.0.2.2 maps to your
// host machine's localhost.
export const API_BASE_URL = 'http://192.168.0.105:4000/api';

// A hardcoded demo competition id is convenient for local testing without
// building a full "Explore" list screen (out of scope for this assignment).
// Replace with the id printed by `npm run seed` in the backend.
export const DEMO_COMPETITION_ID = '6ab2ca1f4d7c5a174f59f0cf';
