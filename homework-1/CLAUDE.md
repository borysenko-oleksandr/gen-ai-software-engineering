# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is **Homework 1** of an AI-Assisted Development course. The goal is to build a minimal REST Banking Transactions API (Node.js or Python) using AI coding tools, while documenting the AI-assisted workflow. The `src/` directory is currently empty — implementation is the primary task.

## What to Build

A REST API with in-memory storage (no database) exposing:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions` | Create a new transaction |
| `GET` | `/transactions` | List all transactions (supports filters) |
| `GET` | `/transactions/:id` | Get a transaction by ID |
| `GET` | `/accounts/:accountId/balance` | Get account balance |

Plus **at least one** optional feature from: transaction summary, interest calculation, CSV export, or rate limiting.

### Transaction Model

```json
{
  "id": "string (auto-generated)",
  "fromAccount": "string",
  "toAccount": "string",
  "amount": "number",
  "currency": "string (ISO 4217)",
  "type": "deposit | withdrawal | transfer",
  "timestamp": "ISO 8601",
  "status": "pending | completed | failed"
}
```

### Validation Rules

- `amount`: positive number, max 2 decimal places
- `accountId`: format `ACC-XXXXX` (alphanumeric X)
- `currency`: valid ISO 4217 codes (USD, EUR, GBP, JPY, …)
- `GET /transactions` supports query filters: `?accountId=`, `?type=`, `?from=`, `?to=`

### HTTP Status Codes

- `200` OK, `201` Created, `400` Bad Request (validation), `404` Not Found

## Architecture

Express app (`src/index.js`) mounts two routers:

- `src/routes/transactions.js` — handles `POST /transactions`, `GET /transactions` (with filters), `GET /transactions/:id`
- `src/routes/accounts.js` — handles `GET /accounts/:accountId/balance` and `GET /accounts/:accountId/summary`

All data lives in `src/store.js` — a plain in-memory array. No database, no persistence between restarts.

Validation lives in `src/validators/transaction.js`. Rules differ by transaction type:
- `deposit` requires only `toAccount`
- `withdrawal` requires only `fromAccount`
- `transfer` requires both, and they must differ

Balance is calculated on every request by iterating all transactions: incoming (`toAccount === id`) add to balance, outgoing (`fromAccount === id`) subtract. The same logic feeds the summary endpoint.

## Commands

```bash
npm install        # install dependencies
npm start          # start server on http://localhost:3000 (PORT env var to override)
npm run dev        # start with nodemon (auto-reload)
```
