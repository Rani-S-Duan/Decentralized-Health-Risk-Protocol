import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const treasuryAddress = deployer.address;

  // =========================
  // DEPLOY HealthRiskPool
  // =========================
  console.log("\n1. Deploying HealthRiskPool...");
  const PoolFactory = await ethers.getContractFactory("HealthRiskPool");
  const poolInstance = await PoolFactory.deploy(deployer.address);
  await poolInstance.waitForDeployment();
  const poolAddress = await poolInstance.getAddress();
  console.log("HealthRiskPool deployed to:", poolAddress);

  // =========================
  // DEPLOY MembershipManager
  // =========================
  console.log("\n2. Deploying MembershipManager...");
  const MembershipFactory = await ethers.getContractFactory("MembershipManager");
  const membershipInstance = await MembershipFactory.deploy(
    deployer.address,
    treasuryAddress,
    poolAddress
  );
  await membershipInstance.waitForDeployment();
  const membershipAddress = await membershipInstance.getAddress();
  console.log("MembershipManager deployed to:", membershipAddress);

  // =========================
  // DEPLOY ClaimManager
  // =========================
  console.log("\n3. Deploying ClaimManager...");
  const ClaimFactory = await ethers.getContractFactory("ClaimManager");
  const claimInstance = await ClaimFactory.deploy(membershipAddress);
  await claimInstance.waitForDeployment();
  const claimAddress = await claimInstance.getAddress();
  console.log("ClaimManager deployed to:", claimAddress);

  // =========================
  // SETUP ROLES
  // =========================
  console.log("\n4. Setting up roles...");
  
  // Grant CLAIM_MANAGER_ROLE to ClaimManager
  await poolInstance.grantRole(
    await poolInstance.CLAIM_MANAGER_ROLE(),
    claimAddress
  );
  console.log("✓ Granted CLAIM_MANAGER_ROLE to ClaimManager");

  // Grant HOSPITAL_ROLE to admin for testing
  await membershipInstance.grantRole(
    await membershipInstance.HOSPITAL_ROLE(),
    deployer.address
  );
  console.log("✓ Granted HOSPITAL_ROLE to admin");

  // Grant ADMIN_ROLE to MembershipManager
  await membershipInstance.grantRole(
    await membershipInstance.ADMIN_ROLE(),
    deployer.address
  );
  console.log("✓ Granted ADMIN_ROLE to admin");

  // =========================
  // VERIFICATION
  // =========================
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("HealthRiskPool:", poolAddress);
  console.log("MembershipManager:", membershipAddress);
  console.log("ClaimManager:", claimAddress);
  console.log("\nAdmin Address:", deployer.address);
  console.log("Treasury Address:", treasuryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});