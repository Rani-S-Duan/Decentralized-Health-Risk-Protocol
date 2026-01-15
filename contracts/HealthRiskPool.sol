// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Roles.sol";

contract HealthRiskPool is Roles {
    uint256 public totalPoolBalance;

    event Deposit(address indexed user, uint256 amount);
    event ClaimPaid(address indexed to, uint256 amount);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CLAIM_MANAGER_ROLE, admin);
    }

    /// @notice User deposits ETH into the risk pool
    function deposit() external payable {
        require(msg.value > 0, "Deposit must be > 0");

        totalPoolBalance += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Pay approved insurance claim (only Claim Manager)
    function payClaim(address payable to, uint256 amount)
        external
        onlyRole(CLAIM_MANAGER_ROLE)
    {
        require(amount <= address(this).balance, "Insufficient pool balance");

        totalPoolBalance -= amount;

        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit ClaimPaid(to, amount);
    }

    /// @notice Current ETH balance of pool
    function poolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Receive ETH from MembershipManager
    receive() external payable {
        totalPoolBalance += msg.value;
    }
}