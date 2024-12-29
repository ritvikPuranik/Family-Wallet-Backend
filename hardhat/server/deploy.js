const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const dotenv = require("dotenv");
dotenv.config();

const {ethers} = hre;
async function deployContract() {

    let accounts = await ethers.getSigners();
    const contractOwnerAccount = accounts[10];
    console.log("contractOwnerAccount>>", contractOwnerAccount);//0xBcd4042DE499D14e55001CcbB24a551F3b954096

    // Read the compiled contract code
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