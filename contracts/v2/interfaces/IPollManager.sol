// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IPollManager {
    struct PollContent {
        address creator;
        string subject;
        string description;
        string category;
        string status;
        string viewType;
        string[] options;
        bool isOpen;
    }

    struct PollSettings {
        uint256 rewardPerResponse;
        uint256 maxResponses;
        uint256 durationDays;
        uint256 minContribution;
        string fundingType;
        uint256 targetFund;
        uint256 endTime;
        uint256 totalResponses;
        uint256 funds;
        address rewardToken;
        string rewardDistribution;
    }

    struct Poll {
        PollContent content;
        PollSettings settings;
    }

    struct PollView {
        address creator;
        string subject;
        string description;
        string category;
        string status;
        string viewType;
        string[] options;
        uint256 rewardPerResponse;
        uint256 maxResponses;
        uint256 durationDays;
        uint256 minContribution;
        string fundingType;
        uint256 targetFund;
        uint256 endTime;
        bool isOpen;
        uint256 totalResponses;
        uint256 funds;
        address rewardToken;
        string rewardDistribution;
    }

    function validateCreatePollParams(
        string[] memory options,
        uint256 durationDays,
        uint256 minContribution,
        uint256 targetFund,
        uint256 rewardPerResponse,
        uint256 maxResponses
    ) external pure;

    function createPoll(
        address creator,
        string memory subject,
        string memory description,
        string memory category,
        string memory viewType,
        string[] memory options,
        uint256 rewardPerResponse,
        uint256 durationDays,
        uint256 maxResponses,
        uint256 minContribution,
        string memory fundingType,
        bool isOpenImmediately,
        uint256 targetFund,
        address rewardToken,
        string memory rewardDistribution
    ) external returns (uint256);

    function closePoll(uint256 pollId, address caller) external;
    function cancelPoll(uint256 pollId, address caller) external;
    function openPoll(uint256 pollId, address caller) external;
    function forClaiming(uint256 pollId, address caller) external;
    function forFunding(uint256 pollId, address caller) external;
    function getPollSubject(uint256 pollId) external view returns (string memory);
    function getOptions(uint256 pollId) external view returns (string[] memory);
    function getPollStatus(uint256 pollId) external view returns (bool, uint256, uint256);
    function getAllPollIds() external view returns (uint256[] memory);
    function getPoll(uint256 pollId) external view returns (PollView memory);
    function getUserPolls(address user) external view returns (Poll[] memory);
    function getUserActivePolls(address user) external view returns (Poll[] memory);
    function getActivePolls() external view returns (Poll[] memory);
} 