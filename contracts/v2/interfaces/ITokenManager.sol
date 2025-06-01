// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ITokenManager {
    function whitelistToken(address token) external;
    function removeToken(address token) external;
    function setNativeToken(address token) external;
    function isTokenWhitelisted(address token) external view returns (bool);
    function getNativeToken() external view returns (address);
} 