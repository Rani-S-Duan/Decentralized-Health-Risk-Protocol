// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Roles.sol";
import "./HealthRiskPool.sol";

/**
 * @title MembershipManager
 * @notice Manages participant and healthcare provider memberships
 *         for the Decentralized Health Risk Protocol
 */
contract MembershipManager is Roles {
    // =========================
    // ENUMS
    // =========================

    enum Tier {
        Basic,
        Standard,
        Premium
    }

    enum ProviderStatus {
        Pending,
        Approved,
        Rejected
    }

    // =========================
    // STRUCTS
    // =========================

    struct Participant {
        Tier tier;
        bool isActive;
        uint256 lastPaymentTimestamp;
    }

    struct HealthcareProvider {
        ProviderStatus status;
        bool isRegistered;
    }

    // =========================
    // STATE VARIABLES
    // =========================

    uint256 public constant PAYMENT_GRACE_PERIOD = 10 days;

    mapping(address => Participant) public participants;
    mapping(address => HealthcareProvider) public healthcareProviders;

    mapping(Tier => uint256) public monthlyFee;

    address public adminTreasury;
    HealthRiskPool public healthRiskPool;

    // =========================
    // EVENTS
    // =========================

    event ParticipantRegistered(address indexed participant, Tier tier);
    event MembershipPaid(address indexed participant, Tier tier, uint256 amount);
    event MembershipStatusUpdated(address indexed participant, bool isActive);

    event HealthcareProviderRegistered(address indexed provider);
    event HealthcareProviderApproved(address indexed provider);
    event HealthcareProviderRejected(address indexed provider);

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor(address admin, address treasury, address poolAddress) {
        adminTreasury = treasury;
        healthRiskPool = HealthRiskPool(payable(poolAddress));

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        // Default monthly fees (can be updated)
        monthlyFee[Tier.Basic] = 0.01 ether;
        monthlyFee[Tier.Standard] = 0.03 ether;
        monthlyFee[Tier.Premium] = 0.05 ether;
    }

    // =========================
    // PARTICIPANT LOGIC
    // =========================

    function registerParticipant(Tier tier) external payable {
        require(monthlyFee[tier] > 0, "Invalid tier");
        require(msg.value == monthlyFee[tier], "Incorrect payment");

        participants[msg.sender] = Participant({
            tier: tier,
            isActive: true,
            lastPaymentTimestamp: block.timestamp
        });

        _distributeFee(msg.value);

        emit ParticipantRegistered(msg.sender, tier);
    }

    function payMonthlyFee() external payable {
        Participant storage participant = participants[msg.sender];
        require(monthlyFee[participant.tier] > 0, "Not registered");
        require(msg.value == monthlyFee[participant.tier], "Incorrect payment");

        participant.lastPaymentTimestamp = block.timestamp;
        participant.isActive = true;

        _distributeFee(msg.value);

        emit MembershipPaid(msg.sender, participant.tier, msg.value);
        emit MembershipStatusUpdated(msg.sender, true);
    }

    function updateMembershipStatus(address user) external {
        Participant storage participant = participants[user];
        require(monthlyFee[participant.tier] > 0, "Not registered");

        if (block.timestamp > participant.lastPaymentTimestamp + PAYMENT_GRACE_PERIOD) {
            participant.isActive = false;
            emit MembershipStatusUpdated(user, false);
        }
    }

    function changeTier(Tier newTier) external payable {
        Participant storage participant = participants[msg.sender];
        require(monthlyFee[newTier] > 0, "Invalid tier");
        require(msg.value == monthlyFee[newTier], "Incorrect payment");

        participant.tier = newTier;
        participant.isActive = true;
        participant.lastPaymentTimestamp = block.timestamp;

        _distributeFee(msg.value);

        emit MembershipPaid(msg.sender, newTier, msg.value);
    }

    function isActiveParticipant(address user) external view returns (bool) {
        Participant memory participant = participants[user];
        if (monthlyFee[participant.tier] == 0) return false;

        return
            participant.isActive &&
            block.timestamp <= participant.lastPaymentTimestamp + PAYMENT_GRACE_PERIOD;
    }

    // =========================
    // HEALTHCARE PROVIDER LOGIC
    // =========================

    function registerHealthcareProvider() external {
        require(!healthcareProviders[msg.sender].isRegistered, "Already registered");

        healthcareProviders[msg.sender] = HealthcareProvider({
            status: ProviderStatus.Pending,
            isRegistered: true
        });

        emit HealthcareProviderRegistered(msg.sender);
    }

    function approveHealthcareProvider(address provider)
        external
        onlyRole(ADMIN_ROLE)
    {
        HealthcareProvider storage hp = healthcareProviders[provider];
        require(hp.isRegistered, "Not registered");

        hp.status = ProviderStatus.Approved;
        _grantRole(HOSPITAL_ROLE, provider);

        emit HealthcareProviderApproved(provider);
    }

    function rejectHealthcareProvider(address provider)
        external
        onlyRole(ADMIN_ROLE)
    {
        HealthcareProvider storage hp = healthcareProviders[provider];
        require(hp.isRegistered, "Not registered");

        hp.status = ProviderStatus.Rejected;

        emit HealthcareProviderRejected(provider);
    }

    function isApprovedProvider(address provider) external view returns (bool) {
        return
            healthcareProviders[provider].isRegistered &&
            healthcareProviders[provider].status == ProviderStatus.Approved;
    }

    // =========================
    // INTERNAL
    // =========================

    function _distributeFee(uint256 amount) internal {
        uint256 adminFee = (amount * 5) / 100;
        uint256 poolAmount = amount - adminFee;

        // Transfer ke admin treasury
        (bool adminSuccess, ) = adminTreasury.call{value: adminFee}("");
        require(adminSuccess, "Admin fee transfer failed");

        // Transfer ke HealthRiskPool
        (bool poolSuccess, ) = address(healthRiskPool).call{value: poolAmount}("");
        require(poolSuccess, "Pool transfer failed");
    }

    receive() external payable {}
}