// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IResponseManager {
    struct PollResponse {
        address responder;
        string response;
        uint256 weight;
        uint256 timestamp;
        bool isClaimed;
        uint256 reward;
    }

    function submitResponse(
        uint256 pollId,
        address responder,
        string memory response
    ) external;

    function getPollResponses(uint256 pollId) external view returns (PollResponse[] memory);
} 