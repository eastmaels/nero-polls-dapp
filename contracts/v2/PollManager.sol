// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./interfaces/IPollManager.sol";
import "./libraries/PollStructs.sol";

/// @title PollManager
/// @notice Manages poll creation and basic poll operations
contract PollManager is IPollManager {
    using PollStructs for PollStructs.Poll;
    using PollStructs for PollStructs.PollContent;
    using PollStructs for PollStructs.PollSettings;

    uint256 public pollCounter;
    uint256[] public pollIds;
    mapping(uint256 => PollStructs.Poll) public polls;
    mapping(address => PollStructs.Poll[]) private userPolls;

    function validateCreatePollParams(
        string[] memory options,
        uint256 durationDays,
        uint256 minContribution,
        uint256 targetFund,
        uint256 rewardPerResponse,
        uint256 maxResponses
    ) public pure override {
        require(options.length >= 2, "Min 2 options");
        require(durationDays > 0, "Invalid duration");
        require(minContribution > 0, "Min contribution > 0");
        require(targetFund >= minContribution, "Target >= min");
        require(targetFund >= rewardPerResponse * maxResponses, "Target >= rewards");
    }

    function createPoll(PollStructs.CreatePollParams memory params) public override returns (uint256) {
        // Validate parameters
        validateCreatePollParams(
            params.options,
            params.durationDays,
            params.minContribution,
            params.targetFund,
            params.rewardPerResponse,
            params.maxResponses
        );

        PollStructs.PollContent memory content = PollStructs.PollContent({
            creator: msg.sender,
            subject: params.subject,
            description: params.description,
            category: params.category,
            status: params.isOpenImmediately ? "open" : "new",
            viewType: params.viewType,
            options: params.options,
            isOpen: params.isOpenImmediately
        });

        PollStructs.PollSettings memory settings = PollStructs.PollSettings({
            rewardPerResponse: params.rewardPerResponse,
            maxResponses: params.maxResponses,
            durationDays: params.durationDays,
            minContribution: params.minContribution,
            fundingType: params.fundingType,
            targetFund: params.targetFund,
            endTime: block.timestamp + (params.durationDays * 1 days),
            totalResponses: 0,
            funds: 0,
            rewardToken: params.rewardToken,
            rewardDistribution: params.rewardDistribution
        });

        PollStructs.Poll storage p = polls[pollCounter];
        p.content = content;
        p.settings = settings;

        pollIds.push(pollCounter);
        userPolls[params.creator].push(p);

        return pollCounter++;
    }

    function createUnfundedPoll(PollStructs.CreateUnfundedPollParams memory params) public returns (uint256) {
        require(params.options.length >= 2, "Min 2 options");
        require(params.durationDays > 0, "Invalid duration");

        PollStructs.PollContent memory content = PollStructs.PollContent({
            creator: msg.sender,
            subject: params.subject,
            description: params.description,
            category: params.category,
            status: params.isOpenImmediately ? "open" : "new",
            viewType: params.viewType,
            options: params.options,
            isOpen: params.isOpenImmediately
        });

        PollStructs.PollSettings memory settings = PollStructs.PollSettings({
            rewardPerResponse: 0,
            maxResponses: type(uint256).max,
            durationDays: params.durationDays,
            minContribution: 0,
            fundingType: "unfunded",
            targetFund: 0,
            endTime: block.timestamp + (params.durationDays * 1 days),
            totalResponses: 0,
            funds: 0,
            rewardToken: address(0),
            rewardDistribution: "none"
        });

        PollStructs.Poll storage p = polls[pollCounter];
        p.content = content;
        p.settings = settings;

        pollIds.push(pollCounter);
        userPolls[msg.sender].push(p);

        return pollCounter++;
    }

    function closePoll(uint256 pollId, address caller) public override {
        PollStructs.Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        require(p.content.isOpen, "Already closed");
        require(block.timestamp >= p.settings.endTime || p.settings.totalResponses >= p.settings.maxResponses, "Too early");

        p.content.isOpen = false;
        p.content.status = "closed";
    }

    function cancelPoll(uint256 pollId, address caller) public override {
        PollStructs.Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        require(p.content.isOpen, "Already closed");

        p.content.isOpen = false;
        p.content.status = "cancelled";
    }

    function openPoll(uint256 pollId, address caller) public override {
        PollStructs.Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        require(!p.content.isOpen, "Already open");
        require(p.settings.funds >= p.settings.targetFund, "Target not reached");

        p.content.isOpen = true;
        p.content.status = "open";
        p.settings.endTime = block.timestamp + (p.settings.durationDays * 1 days);
    }

    function forClaiming(uint256 pollId, address caller) public override {
        PollStructs.Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        p.content.status = "for-claiming";
    }

    function forFunding(uint256 pollId, address caller) public override {
        PollStructs.Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        p.content.status = "for-funding";
    }

    function getPollSubject(uint256 pollId) public view override returns (string memory) {
        return polls[pollId].content.subject;
    }

    function getOptions(uint256 pollId) public view override returns (string[] memory) {
        return polls[pollId].content.options;
    }

    function getPollStatus(uint256 pollId) public view override returns (bool, uint256, uint256) {
        PollStructs.Poll storage p = polls[pollId];
        return (p.content.isOpen, p.settings.endTime, p.settings.totalResponses);
    }

    function getAllPollIds() public view override returns (uint256[] memory) {
        return pollIds;
    }

    function getPoll(uint256 pollId) public view override returns (PollStructs.PollView memory) {
        PollStructs.Poll storage p = polls[pollId];
        return PollStructs.PollView({
            creator: p.content.creator,
            subject: p.content.subject,
            description: p.content.description,
            category: p.content.category,
            status: p.content.status,
            viewType: p.content.viewType,
            options: p.content.options,
            rewardPerResponse: p.settings.rewardPerResponse,
            maxResponses: p.settings.maxResponses,
            durationDays: p.settings.durationDays,
            minContribution: p.settings.minContribution,
            fundingType: p.settings.fundingType,
            targetFund: p.settings.targetFund,
            endTime: p.settings.endTime,
            isOpen: p.content.isOpen,
            totalResponses: p.settings.totalResponses,
            funds: p.settings.funds,
            rewardToken: p.settings.rewardToken,
            rewardDistribution: p.settings.rewardDistribution
        });
    }

    function getUserPolls(address user) public view override returns (PollStructs.Poll[] memory) {
        return userPolls[user];
    }

    function getUserActivePolls(address user) public view override returns (PollStructs.Poll[] memory) {
        return userPolls[user];
    }

    function getActivePolls() public view override returns (PollStructs.Poll[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < pollIds.length; i++) {
            if (polls[pollIds[i]].content.isOpen) {
                activeCount++;
            }
        }
        
        PollStructs.Poll[] memory activePolls = new PollStructs.Poll[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < pollIds.length; i++) {
            if (polls[pollIds[i]].content.isOpen) {
                activePolls[currentIndex] = polls[pollIds[i]];
                currentIndex++;
            }
        }
        
        return activePolls;
    }
} 