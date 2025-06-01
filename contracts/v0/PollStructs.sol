// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library PollStructs {
    struct PollResponse {
        address responder;
        string response;
        uint256 weight;
        uint256 timestamp;
        bool isClaimed;
        uint256 reward;
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
        string voteWeight;
        uint256 baseContributionAmount;
        uint256 maxWeight;
        mapping(address => uint256) contributions;
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
        bool isFeatured;
    }

    struct Poll {
        PollContent content;
        PollSettings settings;
        PollResponse[] responses;
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
        bool isFeatured;
        string voteWeight;
        uint256 baseContributionAmount;
        uint256 maxWeight;
    }

    struct CreatePollInput {
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
        string voteWeight;
        uint256 baseContributionAmount;
        uint256 maxWeight;
    }

    function calculateVoteWeight(
        string memory voteWeightType,
        uint256 contribution,
        uint256 baseContributionAmount,
        uint256 maxWeight
    ) internal pure returns (uint256) {
        if (keccak256(bytes(voteWeightType)) == keccak256(bytes("simple"))) {
            return 1;
        } else if (keccak256(bytes(voteWeightType)) == keccak256(bytes("weighted"))) {
            uint256 weight = (contribution * 1e18) / baseContributionAmount;
            return weight > maxWeight ? maxWeight : weight;
        } else if (keccak256(bytes(voteWeightType)) == keccak256(bytes("quadratic"))) {
            // Using Babylonian method for square root
            uint256 x = (contribution * 1e18) / baseContributionAmount;
            if (x == 0) return 0;
            
            uint256 result = x;
            uint256 delta = x;
            
            while (delta > 1) {
                result = (result + (x * 1e18) / result) / 2;
                delta = result > delta ? result - delta : delta - result;
            }
            
            return result;
        }
        revert("Invalid vote weight type");
    }
} 