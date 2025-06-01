// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPollManager.sol";
import "./interfaces/IFundingManager.sol";
import "./interfaces/IResponseManager.sol";
import "./interfaces/ITokenManager.sol";
import "./libraries/PollStructs.sol";
import "./TokenManager.sol";
import "./PollManager.sol";
import "./ResponseManager.sol";
import "./FundingManager.sol";

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

    struct LocalCreatePollParams {
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

    function createPoll(LocalCreatePollParams memory params) external payable {
        // Validate parameters
        pollManager.validateCreatePollParams(
            params.options,
            params.durationDays,
            params.minContribution,
            params.targetFund,
            params.rewardPerResponse,
            params.maxResponses
        );

        // Validate funding
        fundingManager.validateFunding(
            params.rewardToken,
            params.isOpenImmediately,
            params.targetFund,
            msg.value
        );

        // Create poll
        uint256 pollId = pollManager.createPoll(
            PollStructs.CreatePollParams({
                creator: msg.sender,
                subject: params.subject,
                description: params.description,
                category: params.category,
                viewType: params.viewType,
                options: params.options,
                rewardPerResponse: params.rewardPerResponse,
                durationDays: params.durationDays,
                maxResponses: params.maxResponses,
                minContribution: params.minContribution,
                fundingType: params.fundingType,
                isOpenImmediately: params.isOpenImmediately,
                targetFund: params.targetFund,
                rewardToken: params.rewardToken,
                rewardDistribution: params.rewardDistribution
            })
        );

        // Handle funding if immediate
        if (params.isOpenImmediately && params.rewardToken == address(0)) {
            fundingManager.handleImmediateFunding(pollId, msg.value);
        }

        emit PollCreated(pollId, msg.sender, params.subject);
    }

    function submitResponse(uint256 pollId, string memory response) external payable nonReentrant {
        responseManager.submitResponse(pollId, msg.sender, response);
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

    function getPoll(uint256 pollId) external view returns (PollStructs.PollView memory) {
        return pollManager.getPoll(pollId);
    }

    function getPollResponses(uint256 pollId) external view returns (IResponseManager.PollResponse[] memory) {
        return responseManager.getPollResponses(pollId);
    }

    function getUserPolls(address user) external view returns (PollStructs.Poll[] memory) {
        return pollManager.getUserPolls(user);
    }

    function getUserActivePolls(address user) external view returns (PollStructs.Poll[] memory) {
        return pollManager.getUserActivePolls(user);
    }

    function getActivePolls() external view returns (PollStructs.Poll[] memory) {
        return pollManager.getActivePolls();
    }
} 