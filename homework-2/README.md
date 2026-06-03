# Intelligent Customer Support System

> **Student Name**: Oleksandr Borysenko
> **Date Submitted**: May 10, 2026
> **AI Tools Used**: GitHub Copilot (Claude Sonnet 4.6)

---

## Project Overview

REST API for customer support ticket management with:
- Multi-format bulk import (CSV / JSON / XML)
- Keyword-based auto-classification (category + priority)
- Comprehensive test suite (65 tests, 92% coverage)

## Architecture

```mermaid
graph TD
    Client -->|HTTP| API[Express API :3000]
    API --> Routes[/tickets router]
    Routes --> Store[(In-Memory Store)]
    Routes --> Classifier[Classifier Service]
    Routes --> Importer[Importer Service]
    Importer -->|CSV| csv-parse
    Importer -->|XML| xml2js
    Classifier -->|logs| Logger
```

## Setup

```bash
npm install
npm start          # http://localhost:3000
npm test           # run tests + coverage
```

## Project Structure

```
src/
├── app.js               # Express app (no listen)
├── server.js            # Entry point (listen)
├── models/ticket.js     # Validation + factory
├── routes/tickets.js    # All REST handlers
├── services/
│   ├── classifier.js    # Keyword classifier
│   └── importer.js      # CSV/JSON/XML parser
└── utils/
    ├── store.js         # In-memory Map store
    └── logger.js        # Simple console logger

tests/
├── fixtures/            # 50 CSV / 20 JSON / 30 XML + invalid files
├── test_ticket_api.test.js
├── test_ticket_model.test.js
├── test_import_csv.test.js
├── test_import_json.test.js
├── test_import_xml.test.js
├── test_categorization.test.js
├── test_integration.test.js
└── test_performance.test.js
```

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/tickets` | Create ticket (`?auto_classify=true`) |
| POST | `/tickets/import` | Bulk import CSV/JSON/XML |
| GET | `/tickets` | List with filters |
| GET | `/tickets/:id` | Get single ticket |
| PUT | `/tickets/:id` | Update ticket |
| DELETE | `/tickets/:id` | Delete ticket |
| POST | `/tickets/:id/auto-classify` | Classify ticket |

See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for full details.

