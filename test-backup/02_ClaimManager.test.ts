import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("ClaimManager", function () {
  let membershipManager: Contract;
  let claimManager: Contract;
  let admin: any;
  let participant: any;
  let healthcareProvider: any;
  let treasury: any;

  const tierFee = ethers.parseEther("0.01");

  beforeEach(async function () {
    [admin, participant, healthcareProvider, treasury] = await ethers.getSigners();

    // deploy MembershipManager
    const MembershipManager = await ethers.getContractFactory("MembershipManager");
    membershipManager = await MembershipManager.deploy(admin.address, treasury.address);
    await membershipManager.waitForDeployment();

    // deploy ClaimManager
    const ClaimManager = await ethers.getContractFactory("ClaimManager");
    claimManager = await ClaimManager.deploy(membershipManager.address, treasury.address);
    await claimManager.waitForDeployment();

    // register participant
    await membershipManager.connect(participant).registerParticipant(0, { value: tierFee });

    // register and approve healthcare provider
    await membershipManager.connect(healthcareProvider).registerHealthcareProvider();
    await membershipManager.connect(admin).approveHealthcareProvider(healthcareProvider.address);
  });

  it("should allow participant to submit a claim", async function () {
    const claimAmount = ethers.parseEther("0.005");

    const tx = await claimManager.connect(participant).submitClaim(claimAmount);
    const receipt = await tx.wait();

    const event = receipt.events?.find((e: any) => e.event === "ClaimSubmitted");
    expect(event).to.not.be.undefined;
    expect(event?.args?.participant).to.equal(participant.address);
    expect(event?.args?.amount).to.equal(claimAmount);

    const claim = await claimManager.claims(participant.address);
    expect(claim.amount).to.equal(claimAmount);
    expect(claim.status).to.equal(0); // pending
  });

  it("should allow healthcare provider to approve claim", async function () {
    const claimAmount = ethers.parseEther("0.005");
    await claimManager.connect(participant).submitClaim(claimAmount);

    const tx = await claimManager.connect(healthcareProvider).approveClaim(participant.address);
    const receipt = await tx.wait();

    const event = receipt.events?.find((e: any) => e.event === "ClaimApproved");
    expect(event).to.not.be.undefined;
    expect(event?.args?.participant).to.equal(participant.address);

    const claim = await claimManager.claims(participant.address);
    expect(claim.status).to.equal(1); // approved
  });

  it("should allow healthcare provider to reject claim", async function () {
    const claimAmount = ethers.parseEther("0.005");
    await claimManager.connect(participant).submitClaim(claimAmount);

    const tx = await claimManager.connect(healthcareProvider).rejectClaim(participant.address);
    const receipt = await tx.wait();

    const event = receipt.events?.find((e: any) => e.event === "ClaimRejected");
    expect(event).to.not.be.undefined;
    expect(event?.args?.participant).to.equal(participant.address);

    const claim = await claimManager.claims(participant.address);
    expect(claim.status).to.equal(2); // rejected
  });

  it("should prevent non-participants from submitting claims", async function () {
    const nonParticipant = treasury;
    const claimAmount = ethers.parseEther("0.005");

    await expect(
      claimManager.connect(nonParticipant).submitClaim(claimAmount)
    ).to.be.revertedWith("Not an active participant");
  });

  it("should prevent non-approved providers from approving/rejecting", async function () {
    const claimAmount = ethers.parseEther("0.005");
    await claimManager.connect(participant).submitClaim(claimAmount);

    const nonProvider = treasury;

    await expect(
      claimManager.connect(nonProvider).approveClaim(participant.address)
    ).to.be.revertedWith("Not an approved provider");

    await expect(
      claimManager.connect(nonProvider).rejectClaim(participant.address)
    ).to.be.revertedWith("Not an approved provider");
  });
});
