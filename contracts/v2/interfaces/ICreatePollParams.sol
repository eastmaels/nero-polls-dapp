// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ICreatePollParams {
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
} 