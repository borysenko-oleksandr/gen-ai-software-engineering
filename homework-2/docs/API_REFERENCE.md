# API Reference

Base URL: `http://localhost:3000`

---

## Endpoints

### POST /tickets
Create a new support ticket.

**Query params:** `?auto_classify=true` — run auto-classification after creation.

**Request body:**
```json
{
  "customer_id": "cust-001",
  "customer_email": "user@example.com",
  "customer_name": "Alice",
  "subject": "Cannot login",
  "description": "I have been unable to login for the past 2 hours.",
  "category": "account_access",
  "priority": "urgent",
  "status": "new",
  "tags": ["auth", "login"],
  "metadata": { "source": "web_form", "browser": "Chrome", "device_type": "desktop" }
}
```

**Response 201:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "cust-001",
  "customer_email": "user@example.com",
  ...
  "created_at": "2026-05-10T12:00:00.000Z",
  "updated_at": "2026-05-10T12:00:00.000Z",
  "resolved_at": null
}
```

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"c1","customer_email":"a@b.com","customer_name":"Alice","subject":"Login issue","description":"Cannot login since yesterday afternoon."}'
```

---

### POST /tickets/import
Bulk import tickets from a file.

**Query params:** `?auto_classify=true`

**Body:** `multipart/form-data`, field name `file`, formats: `.csv`, `.json`, `.xml`

**Response 200:**
```json
{ "total": 20, "successful": 19, "failed": [{ "row": 5, "errors": [...] }] }
```

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@tests/fixtures/sample_tickets.json"
```

---

### GET /tickets
List all tickets with optional filters.

**Query params:** `category`, `priority`, `status`

```bash
curl "http://localhost:3000/tickets?category=billing_question&priority=high"
```

---

### GET /tickets/:id
Get a single ticket by UUID.

**Response 200** — ticket object  
**Response 404** — `{ "error": "Ticket not found" }`

```bash
curl http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### PUT /tickets/:id
Update a ticket (partial update, all fields optional except required ones on merge).

```bash
curl -X PUT http://localhost:3000/tickets/550e8400-... \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved","priority":"low"}'
```

---

### DELETE /tickets/:id
Delete a ticket.

**Response 200** — `{ "message": "Ticket deleted" }`

```bash
curl -X DELETE http://localhost:3000/tickets/550e8400-...
```

---

### POST /tickets/:id/auto-classify
Run auto-classification on an existing ticket and persist the result.

**Response 200:**
```json
{
  "category": "account_access",
  "priority": "urgent",
  "confidence": 0.8,
  "reasoning": "Matched keywords: [login, can't access]. Assigned priority=\"urgent\", category=\"account_access\".",
  "keywords": ["login", "can't access"],
  "ticket": { ... }
}
```

```bash
curl -X POST http://localhost:3000/tickets/550e8400-.../auto-classify
```

---

## Ticket Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Generated server-side |
| customer_id | string | yes | |
| customer_email | email | yes | Valid email format |
| customer_name | string | yes | |
| subject | string | yes | 1–200 chars |
| description | string | yes | 10–2000 chars |
| category | enum | no | Default: `other` |
| priority | enum | no | Default: `medium` |
| status | enum | no | Default: `new` |
| created_at | ISO datetime | auto | |
| updated_at | ISO datetime | auto | |
| resolved_at | ISO datetime\|null | auto | Set on `resolved` transition |
| assigned_to | string\|null | no | |
| tags | string[] | no | |
| metadata.source | enum | no | Default: `api` |
| metadata.browser | string | no | |
| metadata.device_type | enum | no | Default: `desktop` |
| confidence | float 0–1 | auto | Set after classification |
| reasoning | string | auto | Set after classification |

### Enum Values

- **category**: `account_access`, `technical_issue`, `billing_question`, `feature_request`, `bug_report`, `other`
- **priority**: `urgent`, `high`, `medium`, `low`
- **status**: `new`, `in_progress`, `waiting_customer`, `resolved`, `closed`
- **metadata.source**: `web_form`, `email`, `api`, `chat`, `phone`
- **metadata.device_type**: `desktop`, `mobile`, `tablet`

---

## Error Responses

**400 Validation error:**
```json
{
  "errors": [
    { "field": "customer_email", "message": "customer_email must be a valid email address" },
    { "field": "subject", "message": "subject is required and must be 1-200 characters" }
  ]
}
```

**404 Not found:**
```json
{ "error": "Ticket not found" }
```
