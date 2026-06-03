// In-memory store for tickets
const tickets = new Map();

function getAll() {
  return Array.from(tickets.values());
}

function getById(id) {
  return tickets.get(id) || null;
}

function save(ticket) {
  tickets.set(ticket.id, ticket);
  return ticket;
}

function update(id, changes) {
  const existing = tickets.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...changes, id, updated_at: new Date().toISOString() };
  // Auto-set resolved_at when transitioning to resolved
  if (changes.status === 'resolved' && existing.status !== 'resolved') {
    updated.resolved_at = new Date().toISOString();
  }
  tickets.set(id, updated);
  return updated;
}

function remove(id) {
  return tickets.delete(id);
}

function clear() {
  tickets.clear();
}

module.exports = { getAll, getById, save, update, remove, clear };
