// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract Users{
    struct User {
        address id;
        address username;
        string password; //Must hash and store
        bool isParent;
        uint8 familyId;
    }

    mapping(address => User) private users; //Use this in serialze to find the user

    constructor(){
        users[msg.sender] = User({
            id: msg.sender,
            username: msg.sender,
            password: "password",
            isParent: true,
            familyId: 1
        });
    }

    function registerUser(address _account, string memory _password) public {
        require(users[_account].id == address(0), "User already registered!");

        users[_account] = User({
            id: _account,
            username: _account,
            password: _password,
            isParent: false,
            familyId: 0
        });
    }

    function getUser(address _userAddress) external view returns (address id, address username, string memory password, bool isParent, uint8 familyId) { 
        require(users[_userAddress].id == _userAddress, "User Not Found");
        User storage user = users[_userAddress];
        return (user.id, user.username, user.password, user.isParent, user.familyId);
        // return user;
    }

    function addMember(address _account, bool _isParent) public {
        require(users[msg.sender].isParent, "Only parent can add members");
        require(users[_account].id != address(0), "Family Member not registered! They must create an account to be added as a member.");

        users[_account].familyId = users[msg.sender].familyId;
        users[_account].isParent = _isParent;
    }

}
