// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

interface IUsers {
    function registerUser(address _account, string memory _username, string memory _password) external;
    function getUser(address _userAddress) external view returns (address id, string memory username, string memory password, bool isParent, uint8 familyId);
}

contract FamilyWallet{
    IUsers public usersContract;
    address public owner;

    constructor(address _usersContractAddress){
        usersContract = IUsers(_usersContractAddress);
        owner = msg.sender;
    }
    
    function fetchUserDetails(address _userAddress) public view returns (address id, string memory username, string memory password, bool isParent, uint8 familyId) {
        return usersContract.getUser(_userAddress);
    }

    function registerNewUser(address _account, string memory _username, string memory _password) public{
        usersContract.registerUser(_account, _username, _password); 
    }

}