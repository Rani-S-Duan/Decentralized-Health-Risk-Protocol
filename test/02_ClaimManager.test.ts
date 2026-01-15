import { expect } from "chai";
import { ethers } from "hardhat";

describe("ClaimManager", function () {
  let membershipManager: any;
  let claimManager: any;
  let admin: any;
  let participant: any;
  let healthcareProvider: any;
  let treasury: any;

  beforeEach(async function () {
    [admin, participant, healthcareProvider, treasury] = await ethers.getSigners();

    // Deploy HealthRiskPool
    const PoolFactory = await ethers.getContractFactory("HealthRiskPool");
    const pool = await PoolFactory.deploy(admin.address);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();

    // Deploy MembershipManager
    const MembershipManager = await ethers.getContractFactory("MembershipManager");
    membershipManager = await MembershipManager.deploy(
      admin.address, 
      treasury.address,
      poolAddress
    );
    await membershipManager.waitForDeployment();

    // Deploy ClaimManager
    const ClaimManager = await ethers.getContractFactory("ClaimManager");
    claimManager = await ClaimManager.deploy(await membershipManager.getAddress());
    await claimManager.waitForDeployment();

    // Grant HOSPITAL_ROLE di ClaimManager
    await claimManager.connect(admin).grantRole(
      await claimManager.HOSPITAL_ROLE(),
      healthcareProvider.address
    );

    // Register participant
    const basicFee = await membershipManager.monthlyFee(0);
    await membershipManager.connect(participant).registerParticipant(0, { 
      value: basicFee 
    });

    // Register and approve healthcare provider
    await membershipManager.connect(healthcareProvider).registerHealthcareProvider();
    await membershipManager.connect(admin).approveHealthcareProvider(healthcareProvider.address);
  });

  it("should allow participant to submit a claim with details", async function () {
    const claimAmount = ethers.parseEther("0.005");
    const treatmentType = 1; // 0 = Emergency, 1 = Outpatient, 2 = Inpatient
    const patientCode = "PATIENT-001";

    await expect(
      claimManager.connect(participant).submitClaim(claimAmount, treatmentType, patientCode)
    ).to.emit(claimManager, "ClaimSubmitted")
     .withArgs(1, participant.address, claimAmount, treatmentType);

    // Test getClaim function
    const claim = await claimManager.getClaim(1);
    expect(claim[0]).to.equal(participant.address); // participant
    expect(claim[1]).to.equal(claimAmount); // amount
    expect(claim[2]).to.equal(0); // status = Pending (0)
    expect(claim[3]).to.equal(treatmentType); // treatmentType
    expect(claim[4]).to.equal(patientCode); // patientCode
  });

  it("should allow healthcare provider to approve claim", async function () {
    const claimAmount = ethers.parseEther("0.005");
    const treatmentType = 0; // Emergency
    const patientCode = "PATIENT-002";
    
    await claimManager.connect(participant).submitClaim(claimAmount, treatmentType, patientCode);

    await expect(
      claimManager.connect(healthcareProvider).approveClaim(1)
    ).to.emit(claimManager, "ClaimApproved")
     .withArgs(1, healthcareProvider.address);

    const claim = await claimManager.getClaim(1);
    expect(claim[2]).to.equal(1); // status = Approved (1)
  });

  it("should allow healthcare provider to reject claim", async function () {
    const claimAmount = ethers.parseEther("0.005");
    const treatmentType = 2; // Inpatient
    const patientCode = "PATIENT-003";
    
    await claimManager.connect(participant).submitClaim(claimAmount, treatmentType, patientCode);

    await expect(
      claimManager.connect(healthcareProvider).rejectClaim(1)
    ).to.emit(claimManager, "ClaimRejected")
     .withArgs(1, healthcareProvider.address);

    const claim = await claimManager.getClaim(1);
    expect(claim[2]).to.equal(2); // status = Rejected (2)
  });

  it("should prevent non-participants from submitting claims", async function () {
    const nonParticipant = treasury;
    const claimAmount = ethers.parseEther("0.005");
    const treatmentType = 1;
    const patientCode = "PATIENT-004";

    await expect(
      claimManager.connect(nonParticipant).submitClaim(claimAmount, treatmentType, patientCode)
    ).to.be.revertedWith("Only active participants can submit claims");
  });
});