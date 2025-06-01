// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./interfaces/IResponseManager.sol";
import "./interfaces/IPollManager.sol";

/// @title ResponseManager
/// @notice Manages poll responses
contract ResponseManager is IResponseManager {
    IPollManager public pollManager;
    mapping(uint256 => PollResponse[]) public pollResponses;

    constructor(address _pollManager) {
        pollManager = IPollManager(_pollManager);
    }

    function submitResponse(
        uint256 pollId,
        address responder,
        string memory response
    ) public override {
        IPollManager.PollView memory poll = pollManager.getPoll(pollId);
        require(poll.isOpen, "Closed");
        require(block.timestamp < poll.endTime, "Ended");
        require(poll.totalResponses < poll.maxResponses, "Max reached");

        pollResponses[pollId].push(PollResponse({
            responder: responder,
            response: response,
            weight: 1,
            timestamp: block.timestamp,
            isClaimed: false,
            reward: poll.rewardPerResponse
        }));
    }

    function getPollResponses(uint256 pollId) public view override returns (PollResponse[] memory) {
        return pollResponses[pollId];
    }
} 