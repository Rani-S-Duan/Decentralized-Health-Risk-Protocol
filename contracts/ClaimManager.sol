// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Roles.sol";
import "./IMembershipManager.sol";

/**
 * @title ClaimManager
 * @notice Manages participant claims for the Decentralized Health Risk Protocol
 */
contract ClaimManager is Roles {
    // =========================
    // ENUMS
    // =========================

    enum ClaimStatus {
        Pending,
        Approved,
        Rejected
    }

    enum TreatmentType {
        Emergency,
        Outpatient,
        Inpatient
    }

    // =========================
    // STRUCTS
    // =========================

    struct Claim {
        address participant;
        uint256 amount;
        ClaimStatus status;
        TreatmentType treatmentType;
        string patientCode;
    }

    // =========================
    // STATE VARIABLES
    // =========================

    IMembershipManager public membershipManager;
    uint256 public claimCounter;
    mapping(uint256 => Claim) public claims;

    // =========================
    // EVENTS
    // =========================

    event ClaimSubmitted(
        uint256 indexed claimId, 
        address indexed participant, 
        uint256 amount,
        TreatmentType treatmentType
    );
    event ClaimApproved(uint256 indexed claimId, address indexed provider);
    event ClaimRejected(uint256 indexed claimId, address indexed provider);

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor(address _membershipManager) {
        membershipManager = IMembershipManager(_membershipManager);
    }

    // =========================
    // CLAIM LOGIC
    // =========================

    function submitClaim(
        uint256 amount, 
        TreatmentType treatmentType, 
        string memory patientCode
    ) external {
        // Pastikan pengirim adalah peserta aktif
        require(
            membershipManager.isActiveParticipant(msg.sender),
            "Only active participants can submit claims"
        );

        claimCounter += 1;
        claims[claimCounter] = Claim({
            participant: msg.sender,
            amount: amount,
            status: ClaimStatus.Pending,
            treatmentType: treatmentType,
            patientCode: patientCode
        });

        emit ClaimSubmitted(claimCounter, msg.sender, amount, treatmentType);
    }

    function approveClaim(uint256 claimId) external onlyRole(HOSPITAL_ROLE) {
        Claim storage claim = claims[claimId];

        // Pastikan claim masih pending
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");

        // Pastikan provider terdaftar dan disetujui
        require(
            membershipManager.isApprovedProvider(msg.sender),
            "Only approved providers can approve claims"
        );

        claim.status = ClaimStatus.Approved;

        emit ClaimApproved(claimId, msg.sender);
    }

    function rejectClaim(uint256 claimId) external onlyRole(HOSPITAL_ROLE) {
        Claim storage claim = claims[claimId];

        // Pastikan claim masih pending
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");

        // Pastikan provider terdaftar dan disetujui
        require(
            membershipManager.isApprovedProvider(msg.sender),
            "Only approved providers can reject claims"
        );

        claim.status = ClaimStatus.Rejected;

        emit ClaimRejected(claimId, msg.sender);
    }

    function getClaim(uint256 claimId) external view returns (
        address participant,
        uint256 amount,
        ClaimStatus status,
        TreatmentType treatmentType,
        string memory patientCode
    ) {
        Claim memory claim = claims[claimId];
        return (
            claim.participant,
            claim.amount,
            claim.status,
            claim.treatmentType,
            claim.patientCode
        );
    }
}