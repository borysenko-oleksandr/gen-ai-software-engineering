# How to Run the Application

## Prerequisites

- Node.js v18+ ([nodejs.org](https://nodejs.org))
- npm (included with Node.js)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```

The API will be available at `http://localhost:3000`.

To use a different port:
```bash
PORT=8080 npm start
```

## Development (auto-reload on file changes)

```bash
npm run dev
```

## One-command start (demo script)

```bash
bash demo/run.sh
```

## Testing the API

### With curl

```bash
# Health check
curl http://localhost:3000/

# Create a deposit
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount":"ACC-12345","amount":1000,"currency":"USD","type":"deposit"}'

# Get all transactions
curl http://localhost:3000/transactions

# Get transactions for a specific account
curl "http://localhost:3000/transactions?accountId=ACC-12345"

# Get account balance
curl http://localhost:3000/accounts/ACC-12345/balance

# Get account summary
curl http://localhost:3000/accounts/ACC-12345/summary
```

### With VS Code REST Client

Open `demo/sample-requests.http` in VS Code (requires the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension) and click **Send Request** above any block.
