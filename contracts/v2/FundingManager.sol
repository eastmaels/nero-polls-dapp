// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IFundingManager.sol";
import "./interfaces/IPollManager.sol";
import "./interfaces/ITokenManager.sol";
import "./libraries/PollStructs.sol";

/// @title FundingManager
/// @notice Manages poll funding and reward distribution
contract FundingManager is IFundingManager {
    IPollManager public pollManager;
    ITokenManager public tokenManager;

    mapping(uint256 => PollResponse[]) public pollResponses;
    mapping(uint256 => uint256) public pollFunds;

    constructor(address _pollManager, address _tokenManager) {
        pollManager = IPollManager(_pollManager);
        tokenManager = ITokenManager(_tokenManager);
    }

    function validateFunding(
        address rewardToken,
        bool isOpenImmediately,
        uint256 targetFund,
        uint256 value,
        string memory fundingType
    ) public pure override {
        if (isOpenImmediately) {
            require(rewardToken == address(0), "Immediate open only supports native token");
            require(value == targetFund, "Insufficient funds");
        }
        
        // Validate funding type
        require(
            keccak256(bytes(fundingType)) == keccak256(bytes("crowdfunded"))
            || keccak256(bytes(fundingType)) == keccak256(bytes("unfunded"))
            || keccak256(bytes(fundingType)) == keccak256(bytes("self-funded")),
            "Invalid funding type"
        );
    }

    function handleImmediateFunding(uint256 pollId, uint256 amount) public override {
        pollFunds[pollId] = amount;
    }

    function updateTargetFund(
        uint256 pollId,
        uint256 newTargetFund,
        address caller
    ) public override returns (uint256) {
        PollStructs.PollView memory poll = pollManager.getPoll(pollId);
        require(caller == poll.creator, "Not creator");
        require(keccak256(bytes(poll.status)) == keccak256(bytes("new")), "Not funding");
        require(newTargetFund >= poll.minContribution, "Target < min");
        require(newTargetFund >= pollFunds[pollId], "Target < funds");

        uint256 oldTarget = poll.targetFund;
        pollFunds[pollId] = newTargetFund;
        
        return oldTarget;
    }

    function fundPoll(uint256 pollId, uint256 amount) public override {
        PollStructs.PollView memory poll = pollManager.getPoll(pollId);
        require(keccak256(bytes(poll.status)) == keccak256(bytes("for-funding")), "Not funding");
        require(amount >= poll.minContribution, "Below min");
        require(pollFunds[pollId] + amount <= poll.targetFund, "Exceeds target");

        pollFunds[pollId] += amount;
    }

    function fundPollWithToken(uint256 pollId, uint256 amount, address caller) public override {
        PollStructs.PollView memory poll = pollManager.getPoll(pollId);
        require(keccak256(bytes(poll.status)) == keccak256(bytes("for-funding")), "Not funding");
        require(amount >= poll.minContribution, "Below min");
        require(pollFunds[pollId] + amount <= poll.targetFund, "Exceeds target");
        require(poll.rewardToken != address(0), "Native token only");
        require(tokenManager.isTokenWhitelisted(poll.rewardToken), "Token not whitelisted");

        IERC20(poll.rewardToken).transferFrom(caller, address(this), amount);
        pollFunds[pollId] += amount;
    }

    function claimReward(uint256 pollId, address caller) public override {
        PollStructs.PollView memory poll = pollManager.getPoll(pollId);
        require(keccak256(bytes(poll.status)) == keccak256(bytes("for-claiming")), "Not claiming");
        
        bool found = false;
        uint256 totalReward = 0;
        
        for (uint256 i = 0; i < pollResponses[pollId].length; i++) {
            if (pollResponses[pollId][i].responder == caller && !pollResponses[pollId][i].isClaimed) {
                pollResponses[pollId][i].isClaimed = true;
                totalReward += pollResponses[pollId][i].reward;
                found = true;
            }
        }
        
        require(found, "No rewards");
        require(totalReward > 0, "Zero reward");

        if (poll.rewardToken == address(0)) {
            require(address(this).balance >= totalReward, "Low balance");
            (bool success, ) = caller.call{value: totalReward}("");
            require(success, "Transfer failed");
        } else {
            require(IERC20(poll.rewardToken).balanceOf(address(this)) >= totalReward, "Low balance");
            require(IERC20(poll.rewardToken).transfer(caller, totalReward), "Transfer failed");
        }
    }
} 