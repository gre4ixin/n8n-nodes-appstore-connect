# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n8n community node package (`n8n-nodes-appstoreconnect`) for integrating the Apple App Store Connect API into n8n workflows. Supports app management, TestFlight, customer reviews, and sales/finance reports.

## Commands

```bash
npm run build         # Compile TypeScript to dist/
npm run dev           # Watch mode for development
npm run lint          # Lint with n8n's ESLint config
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format with Prettier (100 char width, tabs, semicolons, trailing commas)
npm run prepublishOnly  # build + lint (runs automatically before npm publish)
```

No test suite exists currently.

## Architecture

### Resource-Operation Pattern

The node follows n8n's standard resource-operation dispatch model:

- `nodes/AppStoreConnect/AppStoreConnect.node.ts` — Main node class. Routes `resource` + `operation` combinations to handlers. Contains credential test logic.
- `nodes/AppStoreConnect/transport.ts` — All HTTP communication. Handles JWT generation (ES256), pagination (cursor-based `links.next`), token refresh (tokens valid max 20 min), gzip decompression for reports, and error mapping.
- `nodes/AppStoreConnect/actions/[resource]/index.ts` — Resource router: exports operation descriptions and dispatches execution.
- `nodes/AppStoreConnect/actions/[resource]/[operation].operation.ts` — Individual operation: exports `description: INodeProperties[]` and `execute()` function.
- `credentials/AppStoreConnectApi.credentials.ts` — Credential fields: Issuer ID, Key ID, Private Key (.p8).

### Key Conventions

- **Parameter UI**: Each operation's `description` array uses `displayOptions.show` keyed on `resource` and `operation` to conditionally show fields.
- **Pagination**: Use the "Return All" / "Limit" pattern. `apiRequestAllItems()` in transport handles cursor-based pagination automatically with token refresh.
- **Reports**: `apiRequestReport()` returns gzip-decompressed TSV wrapped in n8n binary format. 404 on reports → return `{ available: false }` (pending report, not an error).
- **Paired items**: All outputs must include `pairedItem: { item: index }` for n8n workflow item linking.
- **Error handling**: Wrap execution in try-catch with `continueOnFail()` support in the main node. Map Apple API error codes to descriptive messages in transport.

### Authentication

JWT signed with ES256. Claims: `iss` (Issuer ID), `iat`, `exp` (+1200 sec max), `aud: "appstoreconnect-v1"`. Key ID goes in JWT header as `kid`.

### API Base

`https://api.appstoreconnect.apple.com/v1`

## Code Style

- TypeScript strict mode (ES2019 target, CommonJS modules)
- Prettier: 100 char width, tabs (not spaces), semicolons, trailing commas, single quotes
- Follow n8n ESLint rules (`@n8n/node-cli/eslint`)

## Publishing

Tagged pushes (`v*`) trigger the GitHub Actions workflow: build → lint → `npm publish` using the `NPM_TOKEN` secret.