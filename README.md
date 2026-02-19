# n8n-nodes-appstore-connect

An [n8n](https://n8n.io) community node for the [Apple App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi).

Automate app management, TestFlight beta testing, customer review responses, and sales reporting from your n8n workflows.

[![npm](https://img.shields.io/npm/v/@gre4ixin/n8n-nodes-appstore-connect)](https://www.npmjs.com/package/@gre4ixin/n8n-nodes-appstore-connect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Supported Operations

| Resource | Operations |
|---|---|
| **App** | Get, Get All |
| **App Store Version** | Get, List |
| **Customer Review** | List, Get Response, Create Response, Update Response, Delete Response |
| **TestFlight** | List Beta Groups, List Beta Testers, Create Beta Tester, Add Tester to Group, Remove Tester from Group, List Builds |
| **Sales Report** | Download Sales Report, Download Finance Report |

---

## Installation

### From n8n UI (recommended)

Go to **Settings > Community Nodes** and install:

```
@gre4ixin/n8n-nodes-appstore-connect
```

### Self-hosted (npm)

```bash
npm install @gre4ixin/n8n-nodes-appstore-connect
```

---

## Authentication

This node uses **App Store Connect API Keys** (JWT-based authentication with ES256 signing).

### Setup Steps

1. In [App Store Connect](https://appstoreconnect.apple.com), go to **Users and Access > Integrations > App Store Connect API**
2. Click **+** to generate a new **Team Key**. Download the `.p8` file — it can only be downloaded **once**
3. Note your **Issuer ID** (shown at the top of the Keys page) and the **Key ID** next to your new key
4. In n8n, create a new **App Store Connect API** credential:
   - **Issuer ID**: from step 3
   - **Key ID**: from step 3
   - **Private Key**: paste the **full contents** of your `.p8` file, including the `-----BEGIN PRIVATE KEY-----` header and `-----END PRIVATE KEY-----` footer

**Tip — copy .p8 contents to clipboard in one command:**

```bash
# macOS
cat AuthKey_XXXXXXXXXX.p8 | pbcopy

# Linux
cat AuthKey_XXXXXXXXXX.p8 | xclip -selection clipboard

# Windows (PowerShell)
Get-Content AuthKey_XXXXXXXXXX.p8 | Set-Clipboard
```

### Required API Key Roles

Different operations require different App Store Connect API key roles:

| Feature | Minimum Role |
|---|---|
| Read apps, versions, builds | Developer |
| TestFlight management | App Manager |
| Respond to reviews | Admin ⚠️ |
| Download sales reports | Sales |
| Download finance reports | Finance |

> **⚠️ Note:** The "Customer Support" role **cannot be assigned to API keys** despite appearing in Apple's documentation. To respond to reviews, your API key must have the **Admin** role.

---

## Usage Examples

**Monitor negative reviews and send Slack alerts:**

```
Schedule Trigger (every hour)
  → App Store Connect: Get All Apps
  → App Store Connect: List Reviews (filter: rating 1-2, sort: most recent)
  → Slack: Post Message
```

**Add new employee to internal TestFlight group:**

```
Webhook (new employee onboarded)
  → App Store Connect: Create Beta Tester (email, firstName, lastName)
  → App Store Connect: Add Tester to Group (betaGroupId, testerId from previous step)
```

**Daily sales report to Google Sheets:**

```
Schedule Trigger (daily at 10:00)
  → App Store Connect: Download Sales Report (DAILY, SALES, SUMMARY, yesterday's date)
  → Code (parse TSV rows)
  → Google Sheets: Append Rows
```

**Track build processing status:**

```
Schedule Trigger (every 5 minutes)
  → App Store Connect: List Builds (filter: processingState = PROCESSING)
  → IF (count > 0)
    → Slack: Notify "Builds still processing: {{$json.count}}"
```

---

## Sales Reports Notes

- Sales and Finance reports are returned as **binary TSV files** (auto-decompressed from gzip)
- Use the **n8n Code node** to parse the TSV content: `$binary.data` → split by newline → split by `\t`
- Daily reports are typically available within **24 hours** after the reporting period ends
- Finance reports are available around the **15th of the following month**
- If a report is not yet available, the node returns `{ available: false, message: "..." }` instead of an error — ideal for polling workflows

---

## Resources

- [n8n Community Nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [App Store Connect API documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [Generating tokens for API requests](https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests)
- [Report an issue](https://github.com/gre4ixin/n8n-nodes-appstore-connect/issues)

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Lint
npm run lint

# Test locally with n8n
npm link
cd ~/.n8n/nodes
npm link @gre4ixin/n8n-nodes-appstore-connect
npx n8n start
```

---

## License

[MIT](LICENSE.md)
