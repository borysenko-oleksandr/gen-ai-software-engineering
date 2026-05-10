# Architecture

## Component Diagram

```mermaid
graph LR
    subgraph Client
        HTTP[HTTP Client]
    end

    subgraph API Layer
        App[app.js<br/>Express]
        Router[routes/tickets.js]
    end

    subgraph Business Logic
        Classifier[services/classifier.js<br/>Keyword Rules]
        Importer[services/importer.js<br/>CSV · JSON · XML]
    end

    subgraph Data Layer
        Store[utils/store.js<br/>In-Memory Map]
        Model[models/ticket.js<br/>Validation · Factory]
    end

    HTTP --> App --> Router
    Router --> Model
    Router --> Store
    Router --> Classifier
    Router --> Importer
```

## Data Flow — Create & Classify

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant M as Model
    participant CL as Classifier
    participant S as Store

    C->>R: POST /tickets?auto_classify=true
    R->>M: validateTicket(body)
    M-->>R: [] (no errors)
    R->>M: createTicket(body)
    M-->>R: ticket (with UUID)
    R->>CL: classify(ticket)
    CL-->>R: {category, priority, confidence, reasoning, keywords}
    R->>S: save(ticket)
    R-->>C: 201 ticket
```

## Data Flow — Bulk Import

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant I as Importer
    participant M as Model
    participant S as Store

    C->>R: POST /tickets/import (multipart file)
    R->>I: importJson/importCsv/importXml(buffer)
    I-->>R: rawRecords[]
    loop for each record
        R->>M: validateTicket(record)
        alt valid
            R->>M: createTicket(record)
            R->>S: save(ticket)
        else invalid
            R->>R: collect error
        end
    end
    R-->>C: {total, successful, failed[]}
```

## Component Descriptions

| Component | Responsibility |
|-----------|---------------|
| `app.js` | Mounts router, error handlers; exported for testing |
| `server.js` | Calls `app.listen(3000)` — entry point only |
| `routes/tickets.js` | Handles all 7 endpoints, wires services |
| `models/ticket.js` | Field validation, UUID generation, default values |
| `services/classifier.js` | Priority + category keyword matching, confidence scoring |
| `services/importer.js` | Parses CSV (csv-parse), JSON, XML (xml2js) |
| `utils/store.js` | CRUD over an in-memory `Map`; `resolved_at` auto-set |
| `utils/logger.js` | Thin wrapper over `console` with timestamps |

## Design Decisions

- **In-memory store**: Zero dependencies, trivially replaceable with any DB via the same `store.js` interface.
- **`app.js` vs `server.js` split**: Allows Supertest to require `app` without binding a port.
- **`/tickets/import` route ordering**: Registered before `/:id` in Express to avoid shadowing.
- **Classifier priority**: Rules evaluated in urgency order; first match wins to prevent downgrade.
- **Bulk import fault tolerance**: Per-row errors collected and returned; batch never aborted.

## Security Considerations

- UUIDs generated server-side; client cannot inject IDs.
- All enum fields validated before persistence.
- File uploads limited to 10 MB via Multer.
- Input validated with `validator.js` (email format).
