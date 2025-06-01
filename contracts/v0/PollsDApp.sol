// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PollStructs.sol";
import "./TokenManager.sol";
import "./PollManager.sol";

contract PollsDApp is PollManager {
    constructor() 
        PollManager(address(this))
    {}

    // The main contract inherits all functionality from PollManager
    // Additional functionality can be added here if needed
} 