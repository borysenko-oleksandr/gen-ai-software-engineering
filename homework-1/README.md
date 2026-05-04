# Banking Transactions API

> **Student Name**: Oleksandr Borysenko
> **Date Submitted**: 2026-04-28
> **AI Tools Used**: Claude Code (claude.ai/code), claude-sonnet-4-6

---

## Project Overview

REST API для банківських транзакцій, побудований на Node.js + Express з in-memory сховищем. Реалізовано всі обов'язкові завдання (Tasks 1–3) та опціональна фіча Option A (Transaction Summary).

### Реалізовані ендпоїнти

| Method | Endpoint | Опис |
|--------|----------|------|
| `POST` | `/transactions` | Створити транзакцію |
| `GET` | `/transactions` | Список всіх транзакцій (з фільтрами) |
| `GET` | `/transactions/:id` | Отримати транзакцію за ID |
| `GET` | `/accounts/:accountId/balance` | Баланс акаунту |
| `GET` | `/accounts/:accountId/summary` | Зведення по акаунту (бонус) |

### Архітектура

```
src/
├── index.js              # Express app, монтування роутів
├── store.js              # in-memory сховище (масив транзакцій)
├── routes/
│   ├── transactions.js   # HTTP-шар: отримати → сервіс → відповісти
│   └── accounts.js       # HTTP-шар: отримати → сервіс → відповісти
├── services/
│   ├── transactionService.js  # бізнес-логіка + фільтрація
│   └── accountService.js      # розрахунок балансу і summary
└── validators/
    └── transaction.js    # валідація вхідних даних
```

---

## AI-Assisted Development

Повна документація промптів та опис AI-взаємодії: [docs/ai-prompts.md](docs/ai-prompts.md)
