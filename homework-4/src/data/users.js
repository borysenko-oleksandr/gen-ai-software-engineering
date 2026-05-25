// In-memory user store. NOT production data — fixture for the pipeline demo.
const users = [
  { id: 1, username: "alice",   password: "alice-pw",   email: "alice@example.com" },
  { id: 2, username: "bob",     password: "bob-pw",     email: "bob@example.com" },
  { id: 3, username: "carol",   password: "carol-pw",   email: "carol@example.com" },
  { id: 4, username: "dave",    password: "dave-pw",    email: "dave@example.com" },
  { id: 5, username: "eve",     password: "eve-pw",     email: "eve@example.com" },
  { id: 6, username: "frank",   password: "frank-pw",   email: "frank@example.com" },
  { id: 7, username: "grace",   password: "grace-pw",   email: "grace@example.com" }
];

module.exports = { users };
