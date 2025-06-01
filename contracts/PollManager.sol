// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PollStructs.sol";
import "./TokenManager.sol";
import "./PollBase.sol";
import "./PollFunding.sol";

contract PollManager is PollBase {
    using PollStructs for PollStructs.Poll;
    using PollStructs for PollStructs.PollContent;
    using PollStructs for PollStructs.PollSettings;
    using PollStructs for PollStructs.CreatePollParams;

    PollFunding public pollFunding;

    constructor(address _tokenManager) PollBase(_tokenManager) {
        pollFunding = new PollFunding(_tokenManager);
    }

    function _initializePollContent(
        address creator,
        string memory subject,
        string memory description,
        string memory category,
        string memory viewType,
        string[] memory options,
        string memory status
    ) private pure returns (PollStructs.PollContent memory) {
        return PollStructs.PollContent({
            creator: creator,
            subject: subject,
            description: description,
            category: category,
            status: status,
            viewType: viewType,
            options: options,
            isOpen: false,
            isFeatured: false
        });
    }

    function _initializePollSettings(
        uint256 rewardPerResponse,
        uint256 durationDays,
        uint256 maxResponses,
        uint256 minContribution,
        string memory fundingType,
        uint256 targetFund,
        address rewardToken,
        string memory rewardDistribution,
        string memory voteWeight,
        uint256 baseContributionAmount,
        uint256 maxWeight
    ) private view returns (PollStructs.PollSettings memory) {
        require(rewardToken == address(0) || tokenManager.isTokenWhitelisted(rewardToken), "Token not whitelisted");
        return PollStructs.PollSettings({
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
            rewardDistribution: rewardDistribution,
            voteWeight: voteWeight,
            baseContributionAmount: baseContributionAmount,
            maxWeight: maxWeight
        });
    }

    function _validateCreatePollParams(PollStructs.CreatePollParams memory params) private pure {
        require(params.options.length >= 2, "Min 2 options");
        require(params.durationDays > 0, "Invalid duration");
        require(params.minContribution > 0, "Min contribution > 0");
        require(params.targetFund >= params.minContribution, "Target >= min");
        require(params.targetFund >= params.rewardPerResponse * params.maxResponses, "Target >= rewards");
    }

    function _validateFunding(PollStructs.CreatePollParams memory params) private view {
        require(params.rewardToken == address(0) || tokenManager.isTokenWhitelisted(params.rewardToken), "Token not whitelisted");
        if (params.isOpenImmediately) {
            require(params.rewardToken == address(0), "Immediate open only supports native token");
        }
    }

    function createPoll(PollStructs.CreatePollInput memory input) external payable {
        bool isSplitReward = keccak256(bytes(input.rewardDistribution)) == keccak256(bytes("split"));
        PollStructs.CreatePollParams memory params = PollStructs.CreatePollParams({
            subject: input.subject,
            description: input.description,
            category: input.category,
            viewType: input.viewType,
            options: input.options,
            rewardPerResponse: isSplitReward ? 0 : input.rewardPerResponse,
            durationDays: input.durationDays,
            maxResponses: input.maxResponses,
            minContribution: input.minContribution,
            fundingType: input.fundingType,
            isOpenImmediately: input.isOpenImmediately,
            targetFund: isSplitReward ? input.targetFund : 0,
            rewardToken: input.rewardToken,
            rewardDistribution: input.rewardDistribution,
            voteWeight: input.voteWeight,
            baseContributionAmount: input.baseContributionAmount,
            maxWeight: input.maxWeight
        });

        _validateCreatePollParams(params);
        _validateFunding(params);

        if (params.isOpenImmediately && params.rewardToken == address(0)) {
            require(msg.value == params.targetFund, "Insufficient funds");
        }

        PollStructs.PollContent memory content = _initializePollContent(
            msg.sender,
            params.subject,
            params.description,
            params.category,
            params.viewType,
            params.options,
            params.isOpenImmediately ? "open" : "new"
        );

        PollStructs.PollSettings memory settings = _initializePollSettings(
            params.rewardPerResponse,
            params.durationDays,
            params.maxResponses,
            params.minContribution,
            params.fundingType,
            params.targetFund,
            params.rewardToken,
            params.rewardDistribution,
            params.voteWeight,
            params.baseContributionAmount,
            params.maxWeight
        );

        if (params.isOpenImmediately && params.rewardToken == address(0)) {
            settings.funds = msg.value;
            settings.contributions[msg.sender] = msg.value;
        }

        PollStructs.Poll storage p = polls[pollCounter];
        p.content = content;
        p.settings = settings;

        pollIds.push(pollCounter);
        _addPollToUser(msg.sender, p);

        emit PollCreated(pollCounter, msg.sender, params.subject);
        pollCounter++;
    }

    function createUnfundedPoll(
        string memory subject,
        string memory description,
        string memory category,
        string memory viewType,
        string[] memory options,
        uint256 durationDays,
        uint256 maxResponses,
        bool isOpenImmediately
    ) external {
        require(options.length >= 2, "Min 2 options");
        require(durationDays > 0, "Invalid duration");

        PollStructs.PollContent memory content = _initializePollContent(
            msg.sender,
            subject,
            description,
            category,
            viewType,
            options,
            isOpenImmediately ? "open" : "new"  // Set status based on isOpenImmediately
        );

        PollStructs.PollSettings memory settings = _initializePollSettings(
            0,  // rewardPerResponse
            durationDays,
            maxResponses,
            0,  // minContribution
            "none",  // fundingType
            0,  // targetFund
            address(0),  // rewardToken
            "none",  // rewardDistribution
            "",  // voteWeight
            0,  // baseContributionAmount
            0  // maxWeight
        );

        settings.funds = 0;
        content.isOpen = isOpenImmediately;  // Set isOpen based on isOpenImmediately

        PollStructs.Poll storage p = polls[pollCounter];
        p.content = content;
        p.settings = settings;

        pollIds.push(pollCounter);
        _addPollToUser(msg.sender, p);

        emit PollCreated(pollCounter, msg.sender, subject);
        pollCounter++;
    }

    function updatePoll(
        uint256 pollId,
        string memory subject,
        string memory description,
        uint256 rewardPerResponse,
        uint256 durationDays,
        uint256 maxResponses,
        uint256 minContribution,
        uint256 targetFund
    ) external payable {
        PollStructs.Poll storage p = polls[pollId];

        require(msg.sender == p.content.creator, "Not creator");
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("new")), "Not new");
        require(durationDays > 0, "Invalid duration");
        require(minContribution > 0, "Min contribution > 0");
        require(targetFund >= minContribution, "Target >= min");
        require(targetFund >= rewardPerResponse * maxResponses, "Target >= rewards");

        p.content.subject = subject;
        p.content.description = description;

        p.settings.maxResponses = maxResponses;
        p.settings.durationDays = durationDays;
        p.settings.minContribution = minContribution;
        p.settings.targetFund = targetFund;
        p.settings.endTime = block.timestamp + (durationDays * 1 days);

        emit PollUpdated(pollId, msg.sender, p.content.subject);
    }

    function closePoll(uint256 pollId) external payable {
        PollStructs.Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");
        require(p.content.isOpen, "Already closed");
        require(block.timestamp >= p.settings.endTime || p.settings.totalResponses >= p.settings.maxResponses, "Too early");

        p.content.isOpen = false;
        p.content.status = "closed";
        emit PollClosed(pollId);
    }

    function cancelPoll(uint256 pollId) external payable {
        PollStructs.Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");
        require(p.content.isOpen, "Already closed");

        p.content.isOpen = false;
        p.content.status = "cancelled";
        emit PollClosed(pollId);
    }

    function openPoll(uint256 pollId) external payable {
        PollStructs.Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");
        require(!p.content.isOpen, "Already open");
        require(p.settings.funds >= p.settings.targetFund, "Target not reached");

        p.content.isOpen = true;
        p.content.status = "open";
        p.settings.endTime = block.timestamp + (p.settings.durationDays * 1 days);
        emit PollUpdated(pollId, msg.sender, p.content.subject);
    }

    function forClaiming(uint256 pollId) external payable {
        PollStructs.Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");

        p.content.status = "for-claiming";
        emit PollUpdated(pollId, msg.sender, p.content.subject);
    }

    function forFunding(uint256 pollId) external payable {
        PollStructs.Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");

        p.content.status = "for-funding";
        emit PollUpdated(pollId, msg.sender, p.content.subject);
    }

    function getOptions(uint256 pollId) external view returns (string[] memory) {
        return polls[pollId].content.options;
    }

    function getPollStatus(uint256 pollId) external view returns (bool, uint256, uint256) {
        PollStructs.Poll storage p = polls[pollId];
        return (p.content.isOpen, p.settings.endTime, p.settings.totalResponses);
    }

    function getAllPollIds() external view returns (uint256[] memory) {
        return pollIds;
    }

    function getPoll(uint256 pollId) external view returns (PollStructs.PollView memory) {
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
            rewardDistribution: p.settings.rewardDistribution,
            isFeatured: p.content.isFeatured
        });
    }

    function getPollResponses(uint256 pollId) external view returns (PollStructs.PollResponse[] memory) {
        return polls[pollId].responses;
    }

    function getActivePolls() external view returns (PollStructs.Poll[] memory) {
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

    function setPollFeatured(uint256 pollId, bool isFeatured) external onlyOwner {
        PollStructs.Poll storage p = polls[pollId];
        require(p.content.creator != address(0), "Poll does not exist");
        p.content.isFeatured = isFeatured;
        emit PollFeatured(pollId, isFeatured);
    }

    function getFeaturedPolls() external view returns (PollStructs.Poll[] memory) {
        uint256 featuredCount = 0;
        
        for (uint256 i = 0; i < pollIds.length; i++) {
            if (polls[pollIds[i]].content.isFeatured) {
                featuredCount++;
            }
        }
        
        PollStructs.Poll[] memory featuredPolls = new PollStructs.Poll[](featuredCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < pollIds.length; i++) {
            if (polls[pollIds[i]].content.isFeatured) {
                featuredPolls[currentIndex] = polls[pollIds[i]];
                currentIndex++;
            }
        }
        
        return featuredPolls;
    }

    // Add functions to delegate to PollFunding
    function updateTargetFund(uint256 pollId, uint256 newTargetFund) external payable {
        pollFunding.updateTargetFund(pollId, newTargetFund);
    }

    function fundPoll(uint256 pollId) external payable {
        PollStructs.Poll storage p = polls[pollId];
        require(p.content.isOpen, "Poll not open");
        require(msg.value >= p.settings.minContribution, "Below min contribution");
        
        p.settings.funds += msg.value;
        p.settings.contributions[msg.sender] += msg.value;
        
        emit PollFunded(pollId, msg.sender, msg.value);
    }

    function fundPollWithToken(uint256 pollId, uint256 amount) external {
        PollStructs.Poll storage p = polls[pollId];
        require(p.content.isOpen, "Poll not open");
        require(amount >= p.settings.minContribution, "Below min contribution");
        require(p.settings.rewardToken != address(0), "No token set");
        
        // Transfer tokens from user to contract
        IERC20(p.settings.rewardToken).transferFrom(msg.sender, address(this), amount);
        
        p.settings.funds += amount;
        p.settings.contributions[msg.sender] += amount;
        
        emit PollFunded(pollId, msg.sender, amount);
    }

    function submitResponse(uint256 pollId, string memory response) external payable {
        PollStructs.Poll storage p = polls[pollId];
        require(p.content.isOpen, "Poll not open");
        require(p.settings.totalResponses < p.settings.maxResponses, "Max responses reached");
        require(block.timestamp <= p.settings.endTime, "Poll ended");

        // Get user's contribution to this poll
        uint256 contribution = p.settings.contributions[msg.sender];
        
        // Calculate vote weight based on the poll's vote weight type and user's contribution
        uint256 weight = PollStructs.calculateVoteWeight(
            p.settings.voteWeight,
            contribution,
            p.settings.baseContributionAmount,
            p.settings.maxWeight
        );

        PollStructs.PollResponse memory newResponse = PollStructs.PollResponse({
            responder: msg.sender,
            response: response,
            weight: weight,
            timestamp: block.timestamp,
            isClaimed: false,
            reward: 0
        });

        p.responses.push(newResponse);
        p.settings.totalResponses++;

        emit ResponseSubmitted(pollId, msg.sender, response, weight);
    }

    function claimReward(uint256 pollId) external payable {
        pollFunding.claimReward(pollId);
    }

    function getContribution(uint256 pollId, address contributor) external view returns (uint256) {
        return polls[pollId].settings.contributions[contributor];
    }
} 