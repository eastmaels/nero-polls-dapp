// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PollsDApp
/// @notice A decentralized polling application
/// @dev Optimized for contract size
contract PollsDApp is Ownable {
    // Reentrancy Guard
    bool private locked;
    
    modifier nonReentrant() {
        require(!locked, "Reentrant");
        locked = true;
        _;
        locked = false;
    }

    // Whitelist for allowed ERC20 tokens
    mapping(address => bool) public whitelistedTokens;
    address public nativeToken; // Address(0) for native ETH

    event TokenWhitelisted(address token);
    event TokenRemoved(address token);
    event NativeTokenSet(address token);

    constructor() Ownable(msg.sender) {
        nativeToken = address(0); // Default to native ETH
    }

    function whitelistToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        whitelistedTokens[token] = true;
        emit TokenWhitelisted(token);
    }

    function removeToken(address token) external onlyOwner {
        whitelistedTokens[token] = false;
        emit TokenRemoved(token);
    }

    function setNativeToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        nativeToken = token;
        emit NativeTokenSet(token);
    }

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
    }

    struct CreatePollParams {
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

    uint256 public pollCounter;
    uint256[] public pollIds;
    mapping(uint256 => Poll) public polls;
    mapping(address => Poll[]) private userPolls;

    event PollCreated(uint256 pollId, address creator, string subject);
    event PollUpdated(uint256 pollId, address creator, string sub);
    event PollClosed(uint256 pollId);
    event TargetFundUpdated(uint256 pollId, uint256 oldTarget, uint256 newTarget);

    function _initializePollContent(
        address creator,
        string memory subject,
        string memory description,
        string memory category,
        string memory viewType,
        string[] memory options,
        string memory status
    ) private pure returns (PollContent memory) {
        return PollContent({
            creator: creator,
            subject: subject,
            description: description,
            category: category,
            status: status,
            viewType: viewType,
            options: options,
            isOpen: false
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
        string memory rewardDistribution
    ) private view returns (PollSettings memory) {
        require(rewardToken == address(0) || whitelistedTokens[rewardToken], "Token not whitelisted");
        return PollSettings({
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
    }

    function _validateCreatePollParams(CreatePollParams memory params) private pure {
        require(params.options.length >= 2, "Min 2 options");
        require(params.durationDays > 0, "Invalid duration");
        require(params.minContribution > 0, "Min contribution > 0");
        require(params.targetFund >= params.minContribution, "Target >= min");
        require(params.targetFund >= params.rewardPerResponse * params.maxResponses, "Target >= rewards");
    }

    function _validateFunding(CreatePollParams memory params) private view {
        require(params.rewardToken == address(0) || whitelistedTokens[params.rewardToken], "Token not whitelisted");
        if (params.isOpenImmediately) {
            require(params.rewardToken == address(0), "Immediate open only supports native token");
        }
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
        bool isSplitReward = keccak256(bytes(rewardDistribution)) == keccak256(bytes("split"));
        CreatePollParams memory params = CreatePollParams({
            subject: subject,
            description: description,
            category: category,
            viewType: viewType,
            options: options,
            rewardPerResponse: isSplitReward ? 0 : rewardPerResponse,
            durationDays: durationDays,
            maxResponses: maxResponses,
            minContribution: minContribution,
            fundingType: fundingType,
            isOpenImmediately: isOpenImmediately,
            targetFund: isSplitReward ? targetFund : 0,
            rewardToken: rewardToken,
            rewardDistribution: rewardDistribution
        });

        _validateCreatePollParams(params);
        _validateFunding(params);

        if (params.isOpenImmediately && params.rewardToken == address(0)) {
            require(msg.value == params.targetFund, "Insufficient funds");
        }

        PollContent memory content = _initializePollContent(
            msg.sender,
            params.subject,
            params.description,
            params.category,
            params.viewType,
            params.options,
            params.isOpenImmediately ? "open" : "new"
        );

        PollSettings memory settings = _initializePollSettings(
            params.rewardPerResponse,
            params.durationDays,
            params.maxResponses,
            params.minContribution,
            params.fundingType,
            params.targetFund,
            params.rewardToken,
            params.rewardDistribution
        );

        if (params.isOpenImmediately && params.rewardToken == address(0)) {
            settings.funds = msg.value;
        }

        Poll storage p = polls[pollCounter];
        p.content = content;
        p.settings = settings;

        pollIds.push(pollCounter);
        userPolls[msg.sender].push(p);

        emit PollCreated(pollCounter, msg.sender, params.subject);
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
        Poll storage p = polls[pollId];

        require(msg.sender == p.content.creator, "Not creator");
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("new")), "Not new");
        require(durationDays > 0, "Invalid duration");
        require(minContribution > 0, "Min contribution > 0");
        require(targetFund >= minContribution, "Target >= min");
        require(targetFund >= rewardPerResponse * maxResponses, "Target >= rewards");

        p.content.subject = subject;
        p.content.description = description;

        //p.settings.rewardPerResponse = rewardPerResponse;
        p.settings.maxResponses = maxResponses;
        p.settings.durationDays = durationDays;
        p.settings.minContribution = minContribution;
        p.settings.targetFund = targetFund;
        p.settings.endTime = block.timestamp + (durationDays * 1 days);

        emit PollUpdated(pollId, msg.sender, p.content.subject);
    }

    function submitResponse(uint256 pollId, string memory response) external payable nonReentrant {
        Poll storage p = polls[pollId];
        require(p.content.isOpen, "Closed");
        require(block.timestamp < p.settings.endTime, "Ended");
        require(p.settings.totalResponses < p.settings.maxResponses, "Max reached");

        p.responses.push(PollResponse({
            responder: msg.sender,
            response: response,
            weight: 1,
            timestamp: block.timestamp,
            isClaimed: false,
            reward: p.settings.rewardPerResponse
        }));
        p.settings.totalResponses++;
    }

    function closePoll(uint256 pollId) external payable {
        Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");
        require(p.content.isOpen, "Already closed");
        require(block.timestamp >= p.settings.endTime || p.settings.totalResponses >= p.settings.maxResponses, "Too early");

        p.content.isOpen = false;
        p.content.status = "closed";
        emit PollClosed(pollId);
    }

    function cancelPoll(uint256 pollId) external payable {
        Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");
        require(p.content.isOpen, "Already closed");

        p.content.isOpen = false;
        p.content.status = "cancelled";
        emit PollClosed(pollId);
    }

    function openPoll(uint256 pollId) external payable {
        Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");
        require(!p.content.isOpen, "Already open");
        require(p.settings.funds >= p.settings.targetFund, "Target not reached");

        p.content.isOpen = true;
        p.content.status = "open";
        p.settings.endTime = block.timestamp + (p.settings.durationDays * 1 days);
        emit PollUpdated(pollId, msg.sender, p.content.subject);
    }

    function forClaiming(uint256 pollId) external payable {
        Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");

        p.content.status = "for-claiming";
        emit PollUpdated(pollId, msg.sender, p.content.subject);
    }

    function forFunding(uint256 pollId) external payable {
        Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");

        p.content.status = "for-funding";
        emit PollUpdated(pollId, msg.sender, p.content.subject);
    }

    function getOptions(uint256 pollId) external view returns (string[] memory) {
        return polls[pollId].content.options;
    }

    function getPollStatus(uint256 pollId) external view returns (bool, uint256, uint256) {
        Poll storage p = polls[pollId];
        return (p.content.isOpen, p.settings.endTime, p.settings.totalResponses);
    }

    function getAllPollIds() external view returns (uint256[] memory) {
        return pollIds;
    }

    function getPoll(uint256 pollId) external view returns (PollView memory) {
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

    function getPollResponses(uint256 pollId) external view returns (PollResponse[] memory) {
        return polls[pollId].responses;
    }

    function getUserPolls(address user) external view returns (Poll[] memory) {
        return userPolls[user];
    }

    function getUserActivePolls(address user) external view returns (Poll[] memory) {
        return userPolls[user];
    }

    function getActivePolls() external view returns (Poll[] memory) {
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

    function updateTargetFund(uint256 pollId, uint256 newTargetFund) external payable nonReentrant {
        Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("new")), "Not funding");
        require(newTargetFund >= p.settings.minContribution, "Target < min");
        require(newTargetFund >= p.settings.funds, "Target < funds");

        uint256 oldTarget = p.settings.targetFund;
        p.settings.targetFund = newTargetFund;
        
        emit TargetFundUpdated(pollId, oldTarget, newTargetFund);
    }

    function fundPoll(uint256 pollId) external payable nonReentrant {
        Poll storage p = polls[pollId];
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("for-funding")), "Not funding");
        require(msg.value >= p.settings.minContribution, "Below min");
        require(p.settings.funds + msg.value <= p.settings.targetFund, "Exceeds target");

        p.settings.funds += msg.value;
    }

    function fundPollWithToken(uint256 pollId, uint256 amount) external nonReentrant {
        Poll storage p = polls[pollId];
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("for-funding")), "Not funding");
        require(amount >= p.settings.minContribution, "Below min");
        require(p.settings.funds + amount <= p.settings.targetFund, "Exceeds target");
        require(p.settings.rewardToken != address(0), "Native token only");
        require(whitelistedTokens[p.settings.rewardToken], "Token not whitelisted");

        IERC20(p.settings.rewardToken).transferFrom(msg.sender, address(this), amount);
        p.settings.funds += amount;
    }

    function claimReward(uint256 pollId) external payable nonReentrant {
        Poll storage p = polls[pollId];
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("for-claiming")), "Not claiming");
        
        bool found = false;
        uint256 totalReward = 0;
        
        for (uint256 i = 0; i < p.responses.length; i++) {
            if (p.responses[i].responder == msg.sender && !p.responses[i].isClaimed) {
                p.responses[i].isClaimed = true;
                totalReward += p.responses[i].reward;
                found = true;
            }
        }
        
        require(found, "No rewards");
        require(totalReward > 0, "Zero reward");

        if (p.settings.rewardToken == address(0)) {
            require(address(this).balance >= totalReward, "Low balance");
            (bool success, ) = msg.sender.call{value: totalReward}("");
            require(success, "Transfer failed");
        } else {
            require(IERC20(p.settings.rewardToken).balanceOf(address(this)) >= totalReward, "Low balance");
            require(IERC20(p.settings.rewardToken).transfer(msg.sender, totalReward), "Transfer failed");
        }
    }
}
