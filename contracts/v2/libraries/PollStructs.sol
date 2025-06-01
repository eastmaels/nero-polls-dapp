// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library PollStructs {
    struct CreatePollParams {
        address creator;
        string subject;
        string description;
        string category;
        string viewType;
        string[] options;
        uint256 rewardPerResponse;
        uint256 durationDays;
        uint256 maxResponses;
        uint256 minContribution;
        string fundingType;
        bool isOpenImmediately;
        uint256 targetFund;
        address rewardToken;
        string rewardDistribution;
    }

    struct CreateUnfundedPollParams {
        string subject;
        string description;
        string category;
        string viewType;
        string[] options;
        uint256 durationDays;
        bool isOpenImmediately;
    }

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
} 