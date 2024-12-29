const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const dotenv = require("dotenv");
dotenv.config();

const {ethers} = hre;
async function deployContract() {
    // Connect to the Ethereum network
    // const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    // const wallet = new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY, provider);

    let accounts = await ethers.getSigners();
    const contractOwnerAccount = accounts[10];

    // Read the compiled contract code
    console.log("direname>>", __dirname);
    const usersContractPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'Users.sol', 'Users.json');
    const usersContractJson = JSON.parse(fs.readFileSync(usersContractPath, 'utf8'));
    const bytecode = usersContractJson.bytecode;
    const abi = usersContractJson.abi;

    // Create a Contract Factory
    const factory = new ethers.ContractFactory(abi, bytecode, contractOwnerAccount);

    // Deploy the contract
    const contract = await factory.deploy();

    //Instead of deploying each time server starts, must deploy only once and use the deployed contract address ethers.getContractAt...
    const address = await contract.getAddress();
    console.log('Users Contract deployed at address:', address);

    return contract;
}

module.exports = deployContract;