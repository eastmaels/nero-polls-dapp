// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITokenManager.sol";

/// @title TokenManager
/// @notice Manages token whitelisting and validation
contract TokenManager is ITokenManager, Ownable {
    mapping(address => bool) public whitelistedTokens;
    address public nativeToken;

    event TokenWhitelisted(address token);
    event TokenRemoved(address token);
    event NativeTokenSet(address token);

    constructor() Ownable(msg.sender) {
        nativeToken = address(0); // Default to native ETH
    }

    function whitelistToken(address token) external override onlyOwner {
        require(token != address(0), "Invalid token");
        whitelistedTokens[token] = true;
        emit TokenWhitelisted(token);
    }

    function removeToken(address token) external override onlyOwner {
        whitelistedTokens[token] = false;
        emit TokenRemoved(token);
    }

    function setNativeToken(address token) external override onlyOwner {
        require(token != address(0), "Invalid token");
        nativeToken = token;
        emit NativeTokenSet(token);
    }

    function isTokenWhitelisted(address token) external view override returns (bool) {
        return whitelistedTokens[token];
    }

    function getNativeToken() external view override returns (address) {
        return nativeToken;
    }
} 