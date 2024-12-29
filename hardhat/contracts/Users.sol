// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract Users{
    struct User {
        address id;
        string username;
        string password; //Must hash and store
        bool isParent;
        uint8 familyId;
    }

    mapping(address => User) private users; //Use this in serialze to find the user

    function registerUser(address _account, string memory _username, string memory _password) public {
        require(users[_account].id == address(0), "User already registered!");

        users[_account] = User({
            id: _account,
            username: _username,
            password: _password,
            isParent: false,
            familyId: 0
        });
    }

    function getUser(address _userAddress) external view returns (address id, string memory username, string memory password, bool isParent, uint8 familyId) { 
        require(users[_userAddress].id == _userAddress, "User Not Found");
        User storage user = users[_userAddress];
        return (user.id, user.username, user.password, user.isParent, user.familyId);
        // return user;
    }

}
