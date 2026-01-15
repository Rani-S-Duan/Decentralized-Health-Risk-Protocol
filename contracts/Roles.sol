// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Roles is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CLAIM_MANAGER_ROLE = keccak256("CLAIM_MANAGER_ROLE");
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender); // Tambah ini untuk konsistensi
    }
}