# Privacy Policy

**APEX** is a personal fitness tracking app. It is not published on the App Store and is used solely by the developer.

## Data Collection

- All workout data is stored locally on-device in SQLite. No data is sent to external servers.
- When connected to WHOOP, the app fetches recovery, sleep, and strain data from the WHOOP API. This data is stored locally on-device. No WHOOP data is shared with third parties.
- OAuth tokens for WHOOP are stored in the device's encrypted keychain via `expo-secure-store`.

## Third-Party Services

- **WHOOP API** — Used to fetch health and recovery data. Subject to [WHOOP's privacy policy](https://www.whoop.com/privacy/).
- **Cloudflare Workers** — A lightweight proxy handles OAuth token exchange. Only authorization codes and tokens pass through; no user health data is stored or logged.

## Data Sharing

No data is shared with, sold to, or disclosed to any third party.

## Contact

This is a personal project. For questions, open an issue at [github.com/bgibso4/apex](https://github.com/bgibso4/apex).

*Last updated: March 22, 2026*
