const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


module.exports = buildModule("FamilyWallet", (m) => {
  const contract = m.contract("FamilyWallet", ['0x5FbDB2315678afecb367f032d93F642f64180aa3']);

  return { contract };
});


