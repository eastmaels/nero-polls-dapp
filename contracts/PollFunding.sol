// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PollStructs.sol";
import "./TokenManager.sol";
import "./PollBase.sol";

contract PollFunding is PollBase {
    using PollStructs for PollStructs.Poll;

    constructor(address _tokenManager) PollBase(_tokenManager) {}

    modifier nonReentrant() {
        bool locked;
        require(!locked, "Reentrant");
        locked = true;
        _;
        locked = false;
    }

    function updateTargetFund(uint256 pollId, uint256 newTargetFund) external payable nonReentrant {
        PollStructs.Poll storage p = polls[pollId];
        require(msg.sender == p.content.creator, "Not creator");
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("new")), "Not funding");
        require(newTargetFund >= p.settings.minContribution, "Target < min");
        require(newTargetFund >= p.settings.funds, "Target < funds");

        uint256 oldTarget = p.settings.targetFund;
        p.settings.targetFund = newTargetFund;
        
        emit TargetFundUpdated(pollId, oldTarget, newTargetFund);
    }

    function fundPoll(uint256 pollId) external payable nonReentrant {
        PollStructs.Poll storage p = polls[pollId];
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("for-funding")), "Not funding");
        require(msg.value >= p.settings.minContribution, "Below min");
        require(p.settings.funds + msg.value <= p.settings.targetFund, "Exceeds target");

        p.settings.funds += msg.value;
    }

    function fundPollWithToken(uint256 pollId, uint256 amount) external nonReentrant {
        PollStructs.Poll storage p = polls[pollId];
        require(keccak256(bytes(p.content.status)) == keccak256(bytes("for-funding")), "Not funding");
        require(amount >= p.settings.minContribution, "Below min");
        require(p.settings.funds + amount <= p.settings.targetFund, "Exceeds target");
        require(p.settings.rewardToken != address(0), "Native token only");
        require(tokenManager.isTokenWhitelisted(p.settings.rewardToken), "Token not whitelisted");

        IERC20(p.settings.rewardToken).transferFrom(msg.sender, address(this), amount);
        p.settings.funds += amount;
    }

    function submitResponse(uint256 pollId, string memory response) external payable nonReentrant {
        PollStructs.Poll storage p = polls[pollId];
        require(p.content.isOpen, "Closed");
        require(block.timestamp < p.settings.endTime, "Ended");
        require(p.settings.totalResponses < p.settings.maxResponses, "Max reached");

        p.responses.push(PollStructs.PollResponse({
            responder: msg.sender,
            response: response,
            weight: 1,
            timestamp: block.timestamp,
            isClaimed: false,
            reward: p.settings.rewardPerResponse
        }));
        p.settings.totalResponses++;
    }

    function claimReward(uint256 pollId) external payable nonReentrant {
        PollStructs.Poll storage p = polls[pollId];
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