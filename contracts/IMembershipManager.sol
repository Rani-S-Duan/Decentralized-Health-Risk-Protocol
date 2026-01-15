// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMembershipManager {
    function isActiveParticipant(address user) external view returns (bool);
    function isApprovedProvider(address provider) external view returns (bool);
}