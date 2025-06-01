// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../libraries/PollStructs.sol";

interface IPollManager {
    function validateCreatePollParams(
        string[] memory options,
        uint256 durationDays,
        uint256 minContribution,
        uint256 targetFund,
        uint256 rewardPerResponse,
        uint256 maxResponses
    ) external pure;

    function createPoll(PollStructs.CreatePollParams memory params) external returns (uint256);

    function closePoll(uint256 pollId, address caller) external;
    function cancelPoll(uint256 pollId, address caller) external;
    function openPoll(uint256 pollId, address caller) external;
    function forClaiming(uint256 pollId, address caller) external;
    function forFunding(uint256 pollId, address caller) external;
    function getPollSubject(uint256 pollId) external view returns (string memory);
    function getOptions(uint256 pollId) external view returns (string[] memory);
    function getPollStatus(uint256 pollId) external view returns (bool, uint256, uint256);
    function getAllPollIds() external view returns (uint256[] memory);
    function getPoll(uint256 pollId) external view returns (PollStructs.PollView memory);
    function getUserPolls(address user) external view returns (PollStructs.Poll[] memory);
    function getUserActivePolls(address user) external view returns (PollStructs.Poll[] memory);
    function getActivePolls() external view returns (PollStructs.Poll[] memory);
} 