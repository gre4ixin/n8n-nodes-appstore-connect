# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-19

### Added

- **App resource**: Get All Apps, Get App by ID
- **App Store Version resource**: List Versions (with platform and state filters), Get Version by ID
- **Customer Review resource**: List Reviews (with rating and sort filters), Get Response, Create Response, Update Response, Delete Response
- **TestFlight resource**: List Beta Groups, List Beta Testers, Create Beta Tester, Add Tester to Group, Remove Tester from Group, List Builds (with platform and processing state filters)
- **Sales Report resource**: Download Sales Report (gzip → TSV binary), Download Finance Report (gzip → TSV binary)
- JWT ES256 authentication with App Store Connect API keys (Issuer ID + Key ID + .p8 private key)
- Graceful handling of unavailable reports (404 → `{ available: false }` instead of error)
- Descriptive error messages for 401, 403, 404, 409, 422, 429 responses
- n8n standard pagination pattern (Return All / Limit) on all list operations
- `pairedItem` tracking on all output items for n8n workflow item linking
- `Continue on Fail` support
