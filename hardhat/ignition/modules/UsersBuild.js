const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Users", (m) => {
  const users = m.contract("Users", []);

  return { users };
});

