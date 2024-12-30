const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const dotenv = require("dotenv");
dotenv.config();

const { ethers } = hre;
async function deployContract() {
    let provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const network = await ethers.provider.getNetwork();
    console.log('Network:', network);

    let contractInstance;

    let contractOwner = await provider.getSigner(10);
    console.log("contractOwnerAccount>>", contractOwner.address);//0xBcd4042DE499D14e55001CcbB24a551F3b954096

    // Read the compiled contract code
    const usersContractPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'Users.sol', 'Users.json');
    const usersContractJson = JSON.parse(fs.readFileSync(usersContractPath, 'utf8'));
    const bytecode = usersContractJson.bytecode;
    const abi = usersContractJson.abi;
    
    // Verify if contract exists at the address
    const existingContractAddress = process.env.USERS_CONTRACT_ADDRESS || "";
    console.log("existingContractAddress>>", existingContractAddress);
    // let code = await provider.getCode(existingContractAddress);
    const code = existingContractAddress ? await provider.getCode(existingContractAddress) : "0x";
    if (!code || code === "0x") {
        console.log("No contract found at the specified address on this network! Deploying new instance...");
        // Create a Contract Factory
        const factory = new ethers.ContractFactory(abi, bytecode, contractOwner);

        // Deploy the contract
        contractInstance = await factory.deploy();
        const contractAddress = await contractInstance.getAddress();
        console.log('Deployed Users Contract to>>', contractAddress);
    } else {
        console.log("Contract is deployed on this network.");
        //Instead of deploying each time server starts, must deploy only once and use the deployed contract address ethers.getContractAt...
        contractInstance = await ethers.getContractAt(abi, existingContractAddress, contractOwner);
    }

    return contractInstance;
}

module.exports = deployContract;