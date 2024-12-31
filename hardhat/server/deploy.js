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
    const contractPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'FamilyWallet.sol', 'FamilyWallet.json');
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const bytecode = contractJson.bytecode;
    const abi = contractJson.abi;
    
    // Verify if contract exists at the address
    const familyWalletContractAddress = process.env.FAMILY_WALLET_CONTRACT_ADDRESS || "";
    console.log("existingContractAddress>>", familyWalletContractAddress);
    const code = familyWalletContractAddress ? await provider.getCode(familyWalletContractAddress) : "0x";
    if (!code || code === "0x") {
        console.log("No contract found at the specified address on this network! Deploying new instance...");
        // Create a Contract Factory
        const familyWalletFactory = new ethers.ContractFactory(abi, bytecode, contractOwner);

        // Deploy the contract
        contractInstance = await familyWalletFactory.deploy();
        const contractAddress = await contractInstance.getAddress();
        console.log('Deployed FamilyWallet Contract to>>', contractAddress);
    } else {
        console.log("Contract is deployed on this network.");
        //Instead of deploying each time server starts, must deploy only once and use the deployed contract address ethers.getContractAt...
        contractInstance = await ethers.getContractAt(abi, familyWalletContractAddress, contractOwner);
    }

    return [contractInstance, provider];
}

module.exports = deployContract;