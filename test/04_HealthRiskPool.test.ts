import { expect } from "chai";
import { ethers } from "hardhat";

describe("HealthRiskPool", function () {
  let pool: any;
  let admin: any;
  let user: any;
  let claimManagerUser: any;
  let randomUser: any;

  beforeEach(async function () {
    [admin, user, claimManagerUser, randomUser] = await ethers.getSigners();
    
    const PoolFactory = await ethers.getContractFactory("HealthRiskPool");
    pool = await PoolFactory.deploy(admin.address);
    await pool.waitForDeployment();

    // Grant CLAIM_MANAGER_ROLE to claimManagerUser
    const CLAIM_MANAGER_ROLE = await pool.CLAIM_MANAGER_ROLE();
    await pool.connect(admin).grantRole(CLAIM_MANAGER_ROLE, claimManagerUser.address);
  });

  it("should accept deposits", async function () {
    const depositAmount = ethers.parseEther("0.1");
    
    await expect(
      pool.connect(user).deposit({ value: depositAmount })
    ).to.emit(pool, "Deposit")
     .withArgs(user.address, depositAmount);

    const balance = await pool.poolBalance();
    expect(balance).to.equal(depositAmount);
  });

  it("should allow claim manager to pay claims", async function () {
    // First deposit
    const depositAmount = ethers.parseEther("0.5");
    await pool.connect(user).deposit({ value: depositAmount });

    // Pay claim
    const claimAmount = ethers.parseEther("0.1");
    const recipient = admin.address;
    
    await expect(
      pool.connect(claimManagerUser).payClaim(recipient, claimAmount)
    ).to.emit(pool, "ClaimPaid")
     .withArgs(recipient, claimAmount);

    const newBalance = await pool.poolBalance();
    expect(newBalance).to.equal(depositAmount - claimAmount);
  });

  it("should prevent non-claim-manager from paying claims", async function () {
    const depositAmount = ethers.parseEther("0.5");
    await pool.connect(user).deposit({ value: depositAmount });

    const claimAmount = ethers.parseEther("0.1");
    
    // randomUser should NOT be able to pay claim
    await expect(
      pool.connect(randomUser).payClaim(user.address, claimAmount)
    ).to.be.revertedWithCustomError(pool, "AccessControlUnauthorizedAccount");
  });
});