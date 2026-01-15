import { expect } from "chai";
import { ethers } from "hardhat";
import { MembershipManager } from "../typechain-types";

describe("MembershipManager", function () {
  let membershipManager: MembershipManager;
  let admin: any;
  let treasury: any;
  let participant: any;
  let healthcareProvider: any;

  beforeEach(async function () {
    [admin, treasury, participant, healthcareProvider] = await ethers.getSigners();

    const MembershipFactory = await ethers.getContractFactory("MembershipManager");
    membershipManager = (await MembershipFactory.deploy(admin.address, treasury.address)) as MembershipManager;
    // tidak perlu .deployed() di ethers v6
  });

  // =====================
  // PARTICIPANT TESTS
  // =====================

  it("should register a participant with Basic tier", async function () {
    const basicFee = await membershipManager.monthlyFee(0); // Tier.Basic = 0
    await expect(
      membershipManager.connect(participant).registerParticipant(0, { value: basicFee })
    ).to.emit(membershipManager, "ParticipantRegistered")
     .withArgs(participant.address, 0);
  });

  it("should pay monthly fee and reactivate participant", async function () {
    // register first
    const basicFee = await membershipManager.monthlyFee(0);
    await membershipManager.connect(participant).registerParticipant(0, { value: basicFee });

    // participant pays monthly fee again
    await expect(
      membershipManager.connect(participant).payMonthlyFee({ value: basicFee })
    ).to.emit(membershipManager, "MembershipPaid")
     .withArgs(participant.address, 0, basicFee);
  });

  it("should correctly reflect active status", async function () {
    const basicFee = await membershipManager.monthlyFee(0);
    await membershipManager.connect(participant).registerParticipant(0, { value: basicFee });

    const isActive = await membershipManager.isActiveParticipant(participant.address);
    expect(isActive).to.be.true;
  });

  // =====================
  // HEALTHCARE PROVIDER TESTS
  // =====================

  it("should register a healthcare provider", async function () {
    await expect(
      membershipManager.connect(healthcareProvider).registerHealthcareProvider()
    ).to.emit(membershipManager, "HealthcareProviderRegistered")
     .withArgs(healthcareProvider.address);
  });

  it("admin should approve a healthcare provider", async function () {
    await membershipManager.connect(healthcareProvider).registerHealthcareProvider();

    await expect(
      membershipManager.connect(admin).approveHealthcareProvider(healthcareProvider.address)
    ).to.emit(membershipManager, "HealthcareProviderApproved")
     .withArgs(healthcareProvider.address);

    const isApproved = await membershipManager.isApprovedProvider(healthcareProvider.address);
    expect(isApproved).to.be.true;
  });

  it("admin should reject a healthcare provider", async function () {
    await membershipManager.connect(healthcareProvider).registerHealthcareProvider();

    await expect(
      membershipManager.connect(admin).rejectHealthcareProvider(healthcareProvider.address)
    ).to.emit(membershipManager, "HealthcareProviderRejected")
     .withArgs(healthcareProvider.address);

    const isApproved = await membershipManager.isApprovedProvider(healthcareProvider.address);
    expect(isApproved).to.be.false;
  });
});
