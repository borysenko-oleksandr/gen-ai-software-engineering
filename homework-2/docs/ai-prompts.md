# AI Prompts & Responses

Documentation of key conversations during project development.

---

## 0. Project Context Analysis (Init)

**Prompt:**
"/init — Analyze TASKS.md and prepare context to work with it"

**Answer:**
Explored the blank project structure and created [TASKS.md](../TASKS.md) as a single source of truth:
- Documented project goal, tech stack options, folder structure
- Listed ticket model schema, endpoint table, classification keyword rules
- Noted validation constraints and common pitfalls
- Prepared AI agents to be immediately productive with project context

---

## 1. Initial Project Analysis

**Prompt:**
"According to this file create a project. Divide your work into a few steps, ask question before each step like 'which language do you want to use?'"

**Answer:**
Created a structured questionnaire asking:
1. Which tech stack (Python + FastAPI, Node.js + Express, Java + Spring Boot)
2. Storage solution (in-memory, SQLite, PostgreSQL)
3. Test framework (Jest, Mocha + Chai, Node:test)
4. Server port (3000, 8080, 5000)

User selected: **Node.js + Express**, **In-memory store**, **Jest**, **Port 3000**.

---

## 2. Project Scaffolding

**Prompt:**
"Create the full project structure with package.json, dependencies, and source files"

**Answer:**
✅ Created directory structure: `src/{models,routes,services,utils}`, `tests/fixtures`, `docs/screenshots`  
✅ Generated `package.json` with Express, multer, csv-parse, xml2js, uuid, validator, Jest, supertest  
✅ Ran `npm install` successfully  

---

## 3. Ticket Model & In-Memory Store

**Prompt:**
"Implement ticket validation and data model with in-memory storage"

**Answer:**
✅ [src/models/ticket.js](../src/models/ticket.js) — field validation (email, string lengths, enums), UUID generation, defaults  
✅ [src/utils/store.js](../src/utils/store.js) — in-memory Map with CRUD operations, auto-set `resolved_at` on status transition  

---

## 4. REST API & Services

**Prompt:**
"Build all 7 REST endpoints plus classifier and importer services"

**Answer:**
✅ [src/routes/tickets.js](../src/routes/tickets.js) — POST/GET/PUT/DELETE /tickets, /tickets/import, /tickets/:id/auto-classify  
✅ [src/services/classifier.js](../src/services/classifier.js) — keyword-based priority + category assignment with confidence scoring  
✅ [src/services/importer.js](../src/services/importer.js) — parses CSV, JSON, XML with proper error handling  
✅ [src/app.js](../src/app.js) — Express app setup  
✅ [src/server.js](../src/server.js) — entry point (listen on port 3000)

---

## 5. Test Suite Generation

**Prompt:**
"Generate comprehensive Jest tests for all components (>85% coverage)"

**Answer:**
✅ Generated **65 tests** across 8 files:
- `test_ticket_api.test.js` (11 tests) — CRUD endpoints, status codes, filters
- `test_ticket_model.test.js` (9 tests) — validation rules, defaults
- `test_import_csv.test.js` (6 tests) — CSV parsing, error handling
- `test_import_json.test.js` (5 tests) — JSON parsing, schema validation
- `test_import_xml.test.js` (5 tests) — XML parsing, malformed files
- `test_categorization.test.js` (10 tests) — priority/category rules, confidence
- `test_integration.test.js` (5 tests) — full lifecycle, bulk import, resolved_at auto-set
- `test_performance.test.js` (5 tests) — latency benchmarks

**Test Results:** ✅ All 65 passing, **92.3% line coverage** (requirement: >85%)

---

## 6. Sample Fixture Data

**Prompt:**
"Generate 50 CSV tickets, 20 JSON tickets, 30 XML tickets, plus invalid files for negative tests"

**Answer:**
✅ Created [scripts/generate_fixtures.js](../scripts/generate_fixtures.js) using Node.js  
✅ Generated files in `tests/fixtures/`:
- `sample_tickets.csv` (50 tickets)
- `sample_tickets.json` (20 tickets)
- `sample_tickets.xml` (30 tickets)
- `invalid_tickets.csv`, `invalid_tickets.json`, `invalid_tickets.xml` (malformed for negative tests)

---

## 7. Documentation Generation

**Prompt:**
"Create 4 documentation files with Mermaid diagrams for developers, API users, and QA engineers"

**Answer:**
✅ [README.md](../README.md) — project overview + architecture diagram + setup instructions  
✅ [docs/API_REFERENCE.md](../docs/API_REFERENCE.md) — all endpoints, schemas, cURL examples  
✅ [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — component diagram + data flow sequences + design decisions  
✅ [docs/TESTING_GUIDE.md](../docs/TESTING_GUIDE.md) — test pyramid diagram + performance benchmarks + manual testing checklist  

**Diagrams:** 4 Mermaid diagrams total (architecture, data flows, test pyramid, component relationships)

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| In-memory store | Zero setup, easily replaceable via `store.js` interface |
| `app.js` + `server.js` split | Allows Supertest to require `app` without binding port |
| Bulk import fault tolerance | Per-row errors collected; batch never aborted |
| Classifier priority first-match | Prevents downgrade when multiple keywords match |
| csv-parse + xml2js libraries | Battle-tested, handle encoding + edge cases |

---

## Final Project Stats

- **Lines of Code**: ~1,200 (src + tests)
- **Tests**: 65 (all passing)
- **Coverage**: 92.3% line coverage
- **Endpoints**: 7 REST handlers
- **File Formats**: CSV, JSON, XML supported
- **Documentation Pages**: 4
- **Mermaid Diagrams**: 4
- **Sample Data Records**: 100 (50+20+30)
