// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PollStructs.sol";
import "./TokenManager.sol";

contract PollBase is Ownable {
    using PollStructs for PollStructs.Poll;

    TokenManager public tokenManager;
    uint256 public pollCounter;
    uint256[] public pollIds;
    mapping(uint256 => PollStructs.Poll) public polls;
    mapping(address => PollStructs.Poll[]) private userPolls;

    event PollCreated(uint256 pollId, address creator, string subject);
    event PollUpdated(uint256 pollId, address creator, string sub);
    event PollClosed(uint256 pollId);
    event TargetFundUpdated(uint256 pollId, uint256 oldTarget, uint256 newTarget);
    event PollFeatured(uint256 pollId, bool isFeatured);

    constructor(address _tokenManager) Ownable(msg.sender) {
        tokenManager = TokenManager(_tokenManager);
    }

    function _addPollToUser(address user, PollStructs.Poll storage poll) internal {
        userPolls[user].push(poll);
    }

    function getUserPolls(address user) external view returns (PollStructs.Poll[] memory) {
        return userPolls[user];
    }

    function getUserActivePolls(address user) external view returns (PollStructs.Poll[] memory) {
        return userPolls[user];
    }
} 