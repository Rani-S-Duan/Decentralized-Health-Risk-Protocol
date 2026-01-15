import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    mantleTestnet: {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: ["8cd9ae2190f504470f11ada120fd4fa96753f29bdca23c699172de61907cbdea"],
    },
    hardhat: {},
  },
};

export default config;