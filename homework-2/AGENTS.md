# Homework 2 – Intelligent Customer Support System

> Full spec: [TASKS.md](./TASKS.md)

## Project Goal
REST API for support ticket management with multi-format import (CSV / JSON / XML), keyword-based auto-classification, and a comprehensive test suite (>85% coverage).

## Tech Stack
Pick **one** before starting and stick to it:
- Python + FastAPI (recommended — quickest to scaffold with built-in validation)
- Node.js + Express
- Java + Spring Boot

Place all source code under `src/`, tests under `tests/`, sample data under `tests/fixtures/`.

## Architecture at a Glance
```
src/
├── main.py (or app.js / Application.java)  # entry point
├── models/          # Ticket data model + validation
├── routes/          # REST endpoint handlers
├── services/
│   ├── importer.py  # CSV / JSON / XML parsing
│   └── classifier.py  # keyword-based auto-classification
└── utils/           # helpers (e.g. UUID generation, logging)

tests/
├── fixtures/        # sample_tickets.{csv,json,xml} + invalid files
├── test_ticket_api.*
├── test_ticket_model.*
├── test_import_{csv,json,xml}.*
├── test_categorization.*
├── test_integration.*
└── test_performance.*

docs/
├── screenshots/     # test_coverage.png goes here
├── API_REFERENCE.md
├── ARCHITECTURE.md
└── TESTING_GUIDE.md
```

## Ticket Model (canonical)
```json
{
  "id": "UUID",
  "customer_id": "string",
  "customer_email": "email",
  "customer_name": "string",
  "subject": "string (1-200 chars)",
  "description": "string (10-2000 chars)",
  "category": "account_access | technical_issue | billing_question | feature_request | bug_report | other",
  "priority": "urgent | high | medium | low",
  "status": "new | in_progress | waiting_customer | resolved | closed",
  "created_at": "datetime",
  "updated_at": "datetime",
  "resolved_at": "datetime|null",
  "assigned_to": "string|null",
  "tags": ["array"],
  "metadata": {
    "source": "web_form | email | api | chat | phone",
    "browser": "string",
    "device_type": "desktop | mobile | tablet"
  }
}
```

## Key Endpoints
| Method | Path | Notes |
|--------|------|-------|
| POST | `/tickets` | Create; optionally auto-classify when `?auto_classify=true` |
| POST | `/tickets/import` | Bulk import CSV/JSON/XML; return summary (total/success/failed) |
| GET | `/tickets` | List with filters (category, priority, status) |
| GET | `/tickets/:id` | Fetch single |
| PUT | `/tickets/:id` | Update (allow manual category/priority override) |
| DELETE | `/tickets/:id` | Delete |
| POST | `/tickets/:id/auto-classify` | Classify; return category, priority, confidence, reasoning, keywords |

## Classification Rules
Priority keywords (searched in subject + description, case-insensitive):
- **urgent**: `can't access`, `critical`, `production down`, `security`
- **high**: `important`, `blocking`, `asap`
- **low**: `minor`, `cosmetic`, `suggestion`
- **medium**: default when no keyword matches

Category keywords:
- `account_access`: login, password, 2FA
- `technical_issue`: bug, error, crash
- `billing_question`: payment, invoice, refund
- `feature_request`: enhancement, suggestion
- `bug_report`: defect, reproduce, steps to reproduce

Store `confidence` (0-1) and `reasoning` string on the ticket after classification. Log every decision.

## Test Coverage Requirements
- Overall >85% line coverage
- Run coverage report and save screenshot to `docs/screenshots/test_coverage.png`
- Required test files: test_ticket_api (11 tests), test_ticket_model (9), test_import_csv (6), test_import_json (5), test_import_xml (5), test_categorization (10), test_integration (5), test_performance (5)

## Documentation to Generate (Task 4)
Generate these files using AI (use different models per file as an experiment):
1. `README.md` — developer overview + Mermaid architecture diagram + setup
2. `docs/API_REFERENCE.md` — all endpoints, schemas, cURL examples
3. `docs/ARCHITECTURE.md` — component diagram + data flow sequence diagrams
4. `docs/TESTING_GUIDE.md` — test pyramid diagram + how to run + benchmarks table

At least **3 Mermaid diagrams** total across docs.

## Sample Data Deliverables
- `tests/fixtures/sample_tickets.csv` — 50 tickets
- `tests/fixtures/sample_tickets.json` — 20 tickets
- `tests/fixtures/sample_tickets.xml` — 30 tickets
- `tests/fixtures/invalid_*.{csv,json,xml}` — malformed files for negative tests

## Validation Rules
- `customer_email`: valid email format
- `subject`: 1–200 chars, required
- `description`: 10–2000 chars, required
- All enum fields must be one of the listed values
- Return 400 with field-level error details on validation failure
- Return 404 when ticket not found
- Return 201 on creation, 200 on success otherwise

## Common Pitfalls
- XML parsing: handle namespaces and encoding issues
- CSV: treat first row as header; handle quoted fields with commas
- UUIDs: generate server-side; never accept from client on creation
- Bulk import errors must NOT abort the whole batch — collect and report per-row errors
- `resolved_at` must be set automatically when status transitions to `resolved`
