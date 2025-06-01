// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPollManager.sol";
import "./interfaces/IFundingManager.sol";
import "./interfaces/IResponseManager.sol";
import "./interfaces/ITokenManager.sol";

/// @title PollsDApp
/// @notice A decentralized polling application
/// @dev Modular contract structure for better maintainability
contract PollsDApp is Ownable {
    // Reentrancy Guard
    bool private locked;
    
    modifier nonReentrant() {
        require(!locked, "Reentrant");
        locked = true;
        _;
        locked = false;
    }

    // Core poll management
    IPollManager public pollManager;
    // Funding and rewards management
    IFundingManager public fundingManager;
    // Response management
    IResponseManager public responseManager;
    // Token management
    ITokenManager public tokenManager;

    event PollCreated(uint256 pollId, address creator, string subject);
    event PollUpdated(uint256 pollId, address creator, string sub);
    event PollClosed(uint256 pollId);
    event TargetFundUpdated(uint256 pollId, uint256 oldTarget, uint256 newTarget);

    constructor() Ownable(msg.sender) {
        // Deploy token manager first
        tokenManager = new TokenManager();
        
        // Deploy poll manager
        pollManager = new PollManager();
        
        // Deploy response manager with poll manager reference
        responseManager = new ResponseManager(address(pollManager));
        
        // Deploy funding manager with both poll and token manager references
        fundingManager = new FundingManager(address(pollManager), address(tokenManager));
    }

    function createPoll(
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
    ) external payable {
        // Validate parameters
        pollManager.validateCreatePollParams(
            options,
            durationDays,
            minContribution,
            targetFund,
            rewardPerResponse,
            maxResponses
        );

        // Validate funding
        fundingManager.validateFunding(
            rewardToken,
            isOpenImmediately,
            targetFund,
            msg.value
        );

        // Create poll
        uint256 pollId = pollManager.createPoll(
            msg.sender,
            subject,
            description,
            category,
            viewType,
            options,
            rewardPerResponse,
            durationDays,
            maxResponses,
            minContribution,
            fundingType,
            isOpenImmediately,
            targetFund,
            rewardToken,
            rewardDistribution
        );

        // Handle funding if immediate
        if (isOpenImmediately && rewardToken == address(0)) {
            fundingManager.handleImmediateFunding(pollId, msg.value);
        }

        emit PollCreated(pollId, msg.sender, subject);
    }

    function submitResponse(uint256 pollId, string memory response) external payable nonReentrant {
        responseManager.submitResponse(pollId, msg.sender, response, msg.value);
    }

    function closePoll(uint256 pollId) external payable {
        pollManager.closePoll(pollId, msg.sender);
        emit PollClosed(pollId);
    }

    function cancelPoll(uint256 pollId) external payable {
        pollManager.cancelPoll(pollId, msg.sender);
        emit PollClosed(pollId);
    }

    function openPoll(uint256 pollId) external payable {
        pollManager.openPoll(pollId, msg.sender);
        emit PollUpdated(pollId, msg.sender, pollManager.getPollSubject(pollId));
    }

    function forClaiming(uint256 pollId) external payable {
        pollManager.forClaiming(pollId, msg.sender);
        emit PollUpdated(pollId, msg.sender, pollManager.getPollSubject(pollId));
    }

    function forFunding(uint256 pollId) external payable {
        pollManager.forFunding(pollId, msg.sender);
        emit PollUpdated(pollId, msg.sender, pollManager.getPollSubject(pollId));
    }

    function updateTargetFund(uint256 pollId, uint256 newTargetFund) external payable nonReentrant {
        uint256 oldTarget = fundingManager.updateTargetFund(pollId, newTargetFund, msg.sender);
        emit TargetFundUpdated(pollId, oldTarget, newTargetFund);
    }

    function fundPoll(uint256 pollId) external payable nonReentrant {
        fundingManager.fundPoll(pollId, msg.value);
    }

    function fundPollWithToken(uint256 pollId, uint256 amount) external nonReentrant {
        fundingManager.fundPollWithToken(pollId, amount, msg.sender);
    }

    function claimReward(uint256 pollId) external payable nonReentrant {
        fundingManager.claimReward(pollId, msg.sender);
    }

    // View functions
    function getOptions(uint256 pollId) external view returns (string[] memory) {
        return pollManager.getOptions(pollId);
    }

    function getPollStatus(uint256 pollId) external view returns (bool, uint256, uint256) {
        return pollManager.getPollStatus(pollId);
    }

    function getAllPollIds() external view returns (uint256[] memory) {
        return pollManager.getAllPollIds();
    }

    function getPoll(uint256 pollId) external view returns (IPollManager.PollView memory) {
        return pollManager.getPoll(pollId);
    }

    function getPollResponses(uint256 pollId) external view returns (IResponseManager.PollResponse[] memory) {
        return responseManager.getPollResponses(pollId);
    }

    function getUserPolls(address user) external view returns (IPollManager.Poll[] memory) {
        return pollManager.getUserPolls(user);
    }

    function getUserActivePolls(address user) external view returns (IPollManager.Poll[] memory) {
        return pollManager.getUserActivePolls(user);
    }

    function getActivePolls() external view returns (IPollManager.Poll[] memory) {
        return pollManager.getActivePolls();
    }
} 