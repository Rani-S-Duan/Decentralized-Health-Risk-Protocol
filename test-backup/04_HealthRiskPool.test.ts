import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { HealthRiskPool, Roles } from "../typechain-types";

describe("HealthRiskPool", function () {
  let roles: Roles;
  let pool: HealthRiskPool;
  let owner: Signer;
  let participant: Signer;
  let other: Signer;

  const ADMIN_FEE_PERCENT = 5n; // BigInt untuk ethers v6

  beforeEach(async function () {
    [owner, participant, other] = await ethers.getSigners();

    // Deploy Roles contract
    const RolesFactory = await ethers.getContractFactory("Roles");
    roles = await RolesFactory.deploy();
    await roles.waitForDeployment();

    // Grant admin role to owner
    const ADMIN_ROLE = await roles.DEFAULT_ADMIN_ROLE();
    await roles.grantRole(ADMIN_ROLE, await owner.getAddress());

    // Deploy HealthRiskPool
    const PoolFactory = await ethers.getContractFactory("HealthRiskPool");
    pool = await PoolFactory.deploy(roles.target, ADMIN_FEE_PERCENT);
    await pool.waitForDeployment();
  });

  it("should accept deposits and allocate 5% to admin fee", async function () {
    const depositAmount = 1000n;

    await pool.connect(participant).deposit({ value: depositAmount });

    const totalAdminFee = await pool.totalAdminFees();
    const totalPoolBalance = await pool.totalPoolBalance();

    // 5% dari deposit ke admin
    expect(totalAdminFee).to.equal((depositAmount * ADMIN_FEE_PERCENT) / 100n);

    // Sisanya di pool
    expect(totalPoolBalance).to.equal(
      depositAmount - (depositAmount * ADMIN_FEE_PERCENT) / 100n
    );
  });

  it("should track total claims correctly", async function () {
    const depositAmount = 1000n;
    const claimAmount = 200n;

    await pool.connect(participant).deposit({ value: depositAmount });

    // Make a claim
    await pool.connect(owner).recordClaim(claimAmount);

    const totalClaims = await pool.totalClaims();
    expect(totalClaims).to.equal(claimAmount);

    const totalPoolBalance = await pool.totalPoolBalance();
    expect(totalPoolBalance).to.equal(
      depositAmount - (depositAmount * ADMIN_FEE_PERCENT) / 100n - claimAmount
    );
  });

  it("should track total deposits, admin fees, claims, and remaining pool", async function () {
    const depositAmount1 = 1000n;
    const depositAmount2 = 500n;
    const claimAmount = 300n;

    await pool.connect(participant).deposit({ value: depositAmount1 });
    await pool.connect(other).deposit({ value: depositAmount2 });

    await pool.connect(owner).recordClaim(claimAmount);

    const totalDeposits = await pool.totalDeposits();
    const totalAdminFees = await pool.totalAdminFees();
    const totalClaims = await pool.totalClaims();
    const totalPoolBalance = await pool.totalPoolBalance();

    const expectedAdminFees = ((depositAmount1 + depositAmount2) * ADMIN_FEE_PERCENT) / 100n;
    const expectedPoolBalance = depositAmount1 + depositAmount2 - expectedAdminFees - claimAmount;

    expect(totalDeposits).to.equal(depositAmount1 + depositAmount2);
    expect(totalAdminFees).to.equal(expectedAdminFees);
    expect(totalClaims).to.equal(claimAmount);
    expect(totalPoolBalance).to.equal(expectedPoolBalance);
  });
});
