// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Users.sol";


contract FamilyWallet is ERC20, Users {
    struct Txn {
        uint32 id;
        address from;
        address to;
        uint32 amount;
        uint256 date;
        string purpose;
        string status;
    }

    Txn[] public transactions;

    modifier OnlyParent() {
        (
            ,
            ,
            ,
            bool isParent, /*uint8 familyId*/

        ) = getUser(msg.sender);
        require(
            isParent == true,
            "Only Parents can authorize the transactions"
        );
        _;
    }

    constructor() ERC20("Family Wallet", "FAM") Users(msg.sender) {
        _mint(msg.sender, 100);
    }

    //3 methods related to transaction => makePayment(creates new entry with status "pending approval"), approveOrRejectTxn(if approved, transfers the amount, changes the status of the txn entry to "approved"/"rejected"), getTransactions

    function getTransactions() public view returns (Txn[] memory) {
        return transactions;
    }

    // Create a new payment request
    function makePayment(
        address _to,
        uint32 _amountToSend,
        string memory _purpose
    ) public {
        Txn memory newTxn = Txn({
            id: uint32(transactions.length + 1),
            from: msg.sender,
            to: _to,
            amount: _amountToSend,
            date: block.timestamp,
            purpose: _purpose,
            status: "pending approval"
        });

        transactions.push(newTxn); //storing the new entry in transaction array
    }

    function approveOrRejectTxn(uint32 _transactionId, bool _approved)
        public
        OnlyParent
        returns (bool)
    {
        Txn memory txn = transactions[_transactionId - 1];
        if (_approved) {
            //change the status of entry to "approved"
            bool transferSuccessful = transfer(
                txn.to,
                txn.amount
            );
            if (transferSuccessful) {
                transactions[_transactionId - 1].status = "approved";
                return true;
            }
            return false;
        } else {
            transactions[_transactionId - 1].status = "rejected";
            return true;
        }
    }

    // Mint new tokens
    function mint(address account, uint256 amount) OnlyParent public {
        _mint(account, amount);
    }
}
