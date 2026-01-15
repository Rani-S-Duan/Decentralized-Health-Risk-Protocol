import { expect } from "chai";
import { ethers } from "hardhat";
import type { Roles } from "../typechain-types"; // <- pastikan typechain sudah generate

describe("Roles", function () {
  let roles: Roles;
  let admin: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();
    const RolesFactory = await ethers.getContractFactory("Roles");
    roles = (await RolesFactory.deploy()) as Roles;
    await roles.waitForDeployment(); // ethers v6
  });

  it("should assign DEFAULT_ADMIN_ROLE to deployer", async function () {
    const DEFAULT_ADMIN_ROLE = await roles.DEFAULT_ADMIN_ROLE();
    expect(await roles.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
  });

  it("admin can grant ADMIN_ROLE", async function () {
    const ADMIN_ROLE = await roles.ADMIN_ROLE();
    await roles.connect(admin).grantRole(ADMIN_ROLE, user1.address);
    expect(await roles.hasRole(ADMIN_ROLE, user1.address)).to.be.true;
  });

  it("admin can grant CLAIM_MANAGER_ROLE", async function () {
    const CLAIM_MANAGER_ROLE = await roles.CLAIM_MANAGER_ROLE();
    await roles.connect(admin).grantRole(CLAIM_MANAGER_ROLE, user1.address);
    expect(await roles.hasRole(CLAIM_MANAGER_ROLE, user1.address)).to.be.true;
  });

  it("admin can grant HOSPITAL_ROLE", async function () {
    const HOSPITAL_ROLE = await roles.HOSPITAL_ROLE();
    await roles.connect(admin).grantRole(HOSPITAL_ROLE, user1.address);
    expect(await roles.hasRole(HOSPITAL_ROLE, user1.address)).to.be.true;
  });

  it("non-admin cannot grant roles", async function () {
    const ADMIN_ROLE = await roles.ADMIN_ROLE();
    try {
      await roles.connect(user1).grantRole(ADMIN_ROLE, user2.address);
      expect.fail("Expected grantRole to fail for non-admin");
    } catch (err: any) {
      // cek error muncul karena AccessControl
      const errorString = err.message.toString();
      expect(
        errorString.includes("AccessControl") || errorString.includes("missing role")
      ).to.be.true;
    }
  });
});
