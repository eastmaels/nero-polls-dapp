// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./interfaces/IPollManager.sol";

/// @title PollManager
/// @notice Manages poll creation and basic poll operations
contract PollManager is IPollManager {
    uint256 public pollCounter;
    uint256[] public pollIds;
    mapping(uint256 => Poll) public polls;
    mapping(address => Poll[]) private userPolls;

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
    ) public override returns (uint256) {
        PollContent memory content = PollContent({
            creator: creator,
            subject: subject,
            description: description,
            category: category,
            status: isOpenImmediately ? "open" : "new",
            viewType: viewType,
            options: options,
            isOpen: isOpenImmediately
        });

        PollSettings memory settings = PollSettings({
            rewardPerResponse: rewardPerResponse,
            maxResponses: maxResponses,
            durationDays: durationDays,
            minContribution: minContribution,
            fundingType: fundingType,
            targetFund: targetFund,
            endTime: block.timestamp + (durationDays * 1 days),
            totalResponses: 0,
            funds: 0,
            rewardToken: rewardToken,
            rewardDistribution: rewardDistribution
        });

        Poll storage p = polls[pollCounter];
        p.content = content;
        p.settings = settings;

        pollIds.push(pollCounter);
        userPolls[creator].push(p);

        return pollCounter++;
    }

    function closePoll(uint256 pollId, address caller) public override {
        Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        require(p.content.isOpen, "Already closed");
        require(block.timestamp >= p.settings.endTime || p.settings.totalResponses >= p.settings.maxResponses, "Too early");

        p.content.isOpen = false;
        p.content.status = "closed";
    }

    function cancelPoll(uint256 pollId, address caller) public override {
        Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        require(p.content.isOpen, "Already closed");

        p.content.isOpen = false;
        p.content.status = "cancelled";
    }

    function openPoll(uint256 pollId, address caller) public override {
        Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        require(!p.content.isOpen, "Already open");
        require(p.settings.funds >= p.settings.targetFund, "Target not reached");

        p.content.isOpen = true;
        p.content.status = "open";
        p.settings.endTime = block.timestamp + (p.settings.durationDays * 1 days);
    }

    function forClaiming(uint256 pollId, address caller) public override {
        Poll storage p = polls[pollId];
        require(caller == p.content.creator, "Not creator");
        p.content.status = "for-claiming";
    }

    function forFunding(uint256 pollId, address caller) public override {
        Poll storage p = polls[pollId];
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
        Poll storage p = polls[pollId];
        return (p.content.isOpen, p.settings.endTime, p.settings.totalResponses);
    }

    function getAllPollIds() public view override returns (uint256[] memory) {
        return pollIds;
    }

    function getPoll(uint256 pollId) public view override returns (PollView memory) {
        Poll storage p = polls[pollId];
        return PollView({
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

    function getUserPolls(address user) public view override returns (Poll[] memory) {
        return userPolls[user];
    }

    function getUserActivePolls(address user) public view override returns (Poll[] memory) {
        return userPolls[user];
    }

    function getActivePolls() public view override returns (Poll[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < pollIds.length; i++) {
            if (polls[pollIds[i]].content.isOpen) {
                activeCount++;
            }
        }
        
        Poll[] memory activePolls = new Poll[](activeCount);
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