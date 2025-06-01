// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IFundingManager {
    struct PollResponse {
        address responder;
        string response;
        uint256 weight;
        uint256 timestamp;
        bool isClaimed;
        uint256 reward;
    }

    function validateFunding(
        address rewardToken,
        bool isOpenImmediately,
        uint256 targetFund,
        uint256 value
    ) external pure;

    function handleImmediateFunding(uint256 pollId, uint256 amount) external;
    function updateTargetFund(uint256 pollId, uint256 newTargetFund, address caller) external returns (uint256);
    function fundPoll(uint256 pollId, uint256 amount) external;
    function fundPollWithToken(uint256 pollId, uint256 amount, address caller) external;
    function claimReward(uint256 pollId, address caller) external;
} 