// In-memory user store. NOT production data — fixture for the pipeline demo.
// Passwords are stored as scrypt-derived hex strings.
// Salt: Buffer.from("pipeline-demo-salt"), keylen: 32.
// Pre-computed with: crypto.scryptSync(plaintext, salt, 32).toString("hex")
const users = [
  { id: 1, username: "alice", passwordHash: "b4341644fd16dc100ee2e51ac8243c538621214b57608afd55cfbb91cdf93e54", email: "alice@example.com" },
  { id: 2, username: "bob",   passwordHash: "bdadbd7360e6ec019625d0acc173eeb324e209d523166a6d0b8f6d302e5116a3", email: "bob@example.com" },
  { id: 3, username: "carol", passwordHash: "88d2e54e9c7c4df7e639a937ca7ed5b9b71409a5a3da3e968f6db82c9050d241", email: "carol@example.com" },
  { id: 4, username: "dave",  passwordHash: "a6fcb1eaeb39e2aa2f3d5ffaba968889009a4004d97062a6e873d4a484a25d0f", email: "dave@example.com" },
  { id: 5, username: "eve",   passwordHash: "9f141faf5ec8827d36417b786f0b1b571b82d00715349ce4c43ddf4164d1f773", email: "eve@example.com" },
  { id: 6, username: "frank", passwordHash: "5a769cc711b53a462705d49ed29a5adca4964b656c0710bc63dcacd92ffefa45", email: "frank@example.com" },
  { id: 7, username: "grace", passwordHash: "421c52dfdcd8172e9bd3f5ad2ffdf839fdb4ace4b89fc5271f1e7f7c5103dd59", email: "grace@example.com" }
];

module.exports = { users };
