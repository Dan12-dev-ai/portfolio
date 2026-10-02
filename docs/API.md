# API Reference

Every endpoint returns JSON. This document describes the contract each one honours.

- [Conventions](#conventions)
- [Public Endpoints](#public-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Authentication](#authentication)
- [Rate Limits](#rate-limits)
- [Error Codes](#error-codes)

---

## Conventions

### Success

```json
{
  "ok": true,
  "...": "endpoint-specific payload"
}
```

### Failure

```json
{
  "ok": false,
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable explanation",
    "fields": { "field": "Field-level message" }
  }
}
```

`fields` is present only on validation failures.

### Status codes

| Code | Meaning |
| --- | --- |
| `200` | Successful read or update |
| `201` | Resource created |
| `302` | Redirect, used by the connect gateway |
| `400` | Malformed request body, or a rejected bot submission |
| `401` | Missing or invalid admin token |
| `404` | Unknown platform |
| `422` | Semantically invalid payload; `fields` explains why |
| `429` | Rate limit exceeded. `POST /api/contact` also sets `Retry-After` |

### Authentication header

```http
Authorization: Bearer <ADMIN_TOKEN>
```

`x-admin-token: <ADMIN_TOKEN>` and `?token=<ADMIN_TOKEN>` are accepted as alternatives for convenience.

---

## Public Endpoints

### GET /api/profile

The entire portfolio as structured data. This is the endpoint to read instead of scraping HTML.

**Response fields**

| Field | Description |
| --- | --- |
| `profile` | Profile record, with `email` resolved from the environment |
| `socials` | Platform links. Private channels report a call to action and expose an internal `/api/connect/...` URL instead of the destination |
| `nav` | Navigation model |
| `stats` | Headline statistics |
| `services` | Service offerings with deliverables |
| `skills` | Skill groups by category |
| `timeline` | Career track steps |
| `experience` | Career entries with highlights and stacks |
| `projects` | Project summaries. Each carries `url: "/experience"`, where the detailed write-up now lives |
| `contactTopics` | Valid values for the contact form topic field |
| `highSignalTopics` | Topic labels shown on the contact page |
| `telemetry` | Message, subscriber and click counts |

**Example**

```bash
curl https://danid.vercel.app/api/profile
```

---

### GET /api/health

Liveness probe and backend telemetry. The footer status pill on every page renders from this response.

| Field | Description |
| --- | --- |
| `status` | Always `operational` when the process is serving |
| `service`, `version` | Service identity |
| `time` | ISO timestamp |
| `uptimeSeconds` | Process uptime, rounded |
| `node` | Runtime version |
| `profile` | Name, role, location, availability, timezone |
| `stats` | Headline statistics |
| `routes` | Public route paths |
| `platforms` | Configured platforms and their display handles |
| `data` | Record counts and the resolved data directory |

> The `data.directory` field makes write-location fallback observable. If it reports a temporary directory, persistent storage is unavailable on the host.

---

### GET /api/projects

Project summaries: slug, title, tagline, category, status and the canonical URL.

---

### GET /api/experience

Career entries, the career timeline and skill groups.

---

### GET /api/connect/[platform]

Tracked redirect gateway for outbound links.

Accepted platforms: `linkedin`, `github`, `x`, `telegram`, `email`.

Records the click, then issues a `302` to the destination. The redirect is a plain HTTP redirect, so it functions with JavaScript disabled.

Email routes to `/contact#transmit` rather than opening a mail client, because a visitor arriving from a portfolio is more likely to want the form than a bare mail tab.

**Inspect without redirecting**

```bash
curl "https://danid.vercel.app/api/connect/github?json=1"
```

Private channels keep their destination server-side and report only the call to action.

**Response headers**

| Header | Description |
| --- | --- |
| `Location` | Redirect destination |
| `X-Portfolio-Platform` | Resolved platform key |

---

### POST /api/click

Click beacon, sent by the client runtime through `navigator.sendBeacon`. Best effort: the response is deliberately minimal because the page may be unloading.

**Request body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `platform` | string | yes | Platform key; matched case-insensitively |
| `referer` | string | no | Referring page, capped at 200 characters |

**Limits** 60 requests per minute per client.

---

### POST /api/contact

Submits a contact message.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | yes | 2 to 80 characters after sanitisation |
| `email` | string | yes | Pattern-validated, max 160 characters, normalised to lowercase |
| `topic` | string | yes | Must be one of `contactTopics` |
| `message` | string | yes | 20 to 4000 characters |
| `consent` | boolean | yes | Must be truthy: `true`, `"true"` or `"on"` |
| `company` | string | no | Honeypot. Must be empty |
| `subscribe` | boolean | no | Opt in to project updates |
| `elapsedMs` | number | no | Form completion time. A value under 1200 is treated as automated |

**Response** `201` with the stored message identifier.

**Bot signals** The honeypot and completion-time checks reject automated submissions with `400` before any record is written.

---

### POST /api/subscribers

Subscribes an address to project updates.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | yes | Pattern-validated, normalised to lowercase |
| `source` | string | no | Attribution label, capped at 40 characters. Defaults to `footer` |

Re-subscribing an existing address is a no-op and returns the existing record rather than creating a duplicate.

---

## Admin Endpoints

All require the admin token. Unauthenticated requests receive `401`.

### GET /api/messages

Contact messages, newest first.

**Query parameters**

| Parameter | Default | Description |
| --- | --- | --- |
| `status` | `all` | One of `new`, `read`, `archived`, `all` |
| `search` | empty | Free-text match against message content |
| `limit` | 50 | Maximum records returned |
| `offset` | 0 | Number of records to skip, for pagination |

### PATCH /api/messages

Updates the status of one message.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | Message identifier |
| `status` | string | yes | One of `new`, `read`, `archived` |

Returns `404` when the identifier is unknown.

### DELETE /api/messages

Deletes one message. The identifier is supplied as an `id` query parameter. Returns `404` when the identifier is unknown.

### GET /api/subscribers

Lists subscribers with their source and creation timestamp.

### DELETE /api/subscribers

Removes a subscriber by `email`. This is the opt-out path; the address is matched after normalisation. Returns `404` when no subscriber matches.

### GET /api/clicks

Click analytics.

| Field | Description |
| --- | --- |
| `total` | Recorded clicks within the retained window |
| `byPlatform` | Counts and last-seen timestamps, sorted by count |
| `recent` | The 25 most recent click records |

---

## Authentication

`isAdmin()` in `src/lib/api.ts` compares the supplied credential against `ADMIN_TOKEN`, falling back to the compiled-in default when the variable is unset.

```ts
export const DEFAULT_ADMIN_TOKEN = 'daniel-degu-admin'
```

That fallback exists so the console is reachable during local development. **It is public knowledge and must be overridden in any deployed environment.** When unset, the console and every admin endpoint are open to anyone who has read this repository.

The console stores the token in session storage and sends it as a bearer header. Closing the tab ends the session.

---

## Rate Limits

| Endpoint | Limit | Window |
| --- | --- | --- |
| `POST /api/contact` | 5 | per 10 minutes |
| `POST /api/subscribers` | 5 | per 10 minutes |
| `POST /api/click` | 60 | per minute |

Limits are keyed on the client address, resolved from `x-forwarded-for`, `x-real-ip` or `cf-connecting-ip` in that order.

When exceeded, the response is `429`. Only `POST /api/contact` includes a `Retry-After` header; the other two return `429` with a message only.

> The limiter is an in-memory sliding window. It is per-process, resets when the process restarts, and is not shared between instances. It prevents accidental duplicate submissions and casual spam. It is not a security boundary.

---

## Error Codes

| Code | Status | Meaning |
| --- | --- | --- |
| `INVALID_JSON` | 400 | Request body could not be parsed |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `UNAUTHORIZED` | 401 | Missing or invalid admin token |
| `NOT_FOUND` | 404 | Unknown record or platform |
| `UNKNOWN_PLATFORM` | 404 | No platform matches the requested key |
| `VALIDATION_FAILED` | 422 | Payload failed validation; see `fields` |
| `ERR_NAME_REQUIRED` | 422 | Name missing or too short |
| `ERR_EMAIL_INVALID` | 422 | Email failed pattern validation |
| `ERR_TOPIC_INVALID` | 422 | Topic is not one of `contactTopics` |
| `ERR_PAYLOAD_SHORT` | 422 | Message is shorter than 20 characters |
| `ERR_CONSENT_REQUIRED` | 422 | Consent acknowledgement not set |
| `ERR_BOT_SUSPECTED` | 400 | Honeypot filled or completed implausibly fast |
