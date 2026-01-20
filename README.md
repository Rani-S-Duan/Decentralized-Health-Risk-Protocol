# DECENTRALIZED HEALTH RISK PROTOCOL (DHRP-GLOBAL)
 
## Project Overview
Decentralized Health Risk Protocol is a blockchain-based health insurance system that automates claim processing with borderless coverage. Patients can submit medical claims from anywhere in the world, making it ideal for travelers, international students, and workers on short-term assignments. Approved hospitals can review claims through secure role-based access control on Ethereum.

Built For Mantle Hackathon 2025
Category : RWA (Real World Asset) + DeFi

## Hackathon Progress
Built during the hackathon with Solidity 0.8.28 and Hardhat. Features include complete claim management, role-based access control, comprehensive testing, and testnet deployment configuration.

## TECH STACK
Smart Contracts : Solidity 0.8.28, OpenZeppelin
Development : Hardhat, TypeScript, ethers.js
Web3 Libraries : ethers.js
Package Manager : yarn
Testing : Hardhat Network, Chai
Security : OpenZeppelin Contracts

## FEATURES:
Submit health insurance claims
Hospital approval/rejection system
Role-based access control
Borderless global coverage
Transparent blockchain records

## KEY ADVANTAGES
Borderless Healthcare
Submit claims from any country
Perfect for travelers and expats
No geographic restrictions
Instant claim processing

## SECURE & TRANSPARENT
Immutable blockchain records
Eliminates paperwork
Direct hospital-patient interaction

## QUICK START

### PREREQUISITES
- Node.js
- yarn package manager
- Metamask Wallet

### INSTALLATION
Clone Repository : 
git clone https://github.com/Rani-S-Duan/Decentralized-Health-Risk-Protocol.git
cd Decentralized-Health-Risk-Protocol

### Install dependencies : yarn install
Compile Contracts : yarn hardhat compile
Run Tests : yarn hardhat test

### ENVIRONMENT SETUP

Create .env file :
PRIVATE_KEY=your_wallet_private_key
ALCHEMY_API_KEY=your_alchemy_key
ETHERSCAN_API_KEY=your_etherscan_key

### DEPLOYMENT 
Local Deployment : 
yarn hardhat node
yarn hardhat ignition deploy ./ignition/modules/Lock.ts --network localhost
Testnet (Mantle Sepolia) :
yarn hardhat ignition deploy ./ignition/modules/Lock.ts --network sepolia

### TESTING :
Run all tests : yarn hardhat test
Run specific test file : yarn hardhat test ./test/HealthRiskProtocol.test.ts

### DEPLOYMENT CONTRACT :
HealthRiskPool: 0x38a024C0b412B9d1db8BC398140D00F5Af3093D4
MembershipManager: 0x5fc748f1FEb28d7b76fa1c6B07D8ba2d5535177c
ClaimManager: 0xB82008565FdC7e44609fA118A4a681E92581e680
 
### Network Information:
Network : Mantle Sepolia Testnet
Chain ID : 5003
RPC URL : https://rpc.sepolia.mantle.xyz
Block Explorer : https://explorer.sepolia.mantle.xyz

### How to Verify:
1. Add Mantle Sepolia to MetaMask
2. Get test MNT from faucet
3. Interact with contracts via explorer

## HOW IT WORKS

### User Roles & Permissions
- **Patients/Members**: Can purchase insurance policies, submit initial claims, track claim status, and receive payouts
- **Hospitals/Providers**: Can review claims, verify patient identity, input medical data (Treatment Days & Cost), and approve claims
- **Admin**: Can manage approved hospitals, update system parameters, and access emergency controls

### Claim Process Flow

#### Phase 1: Claim Submission by Patient
1. **Patient/Member** submits a claim with their DHRP Member ID and basic information
2. **System** validates the patient's active insurance policy and assigns claim to the treating hospital
3. Claim status: **PENDING_HOSPITAL_REVIEW**

#### Phase 2: Medical Data Input by Hospital  
4. **Hospital** receives notification of new claim
5. **Hospital** verifies the patient's identity and treatment details
6. **Hospital** inputs three key medical data points:
   - **Patient ID** (Verification)
   - **Treatment Days** (Number of hospitalization days)
   - **Treatment Cost** (Total medical expenses)
7. Claim status: **PROCESSED_WITH_DATA**

#### Phase 3: Automated Processing & Payout
8. **System** automatically calculates coverage amount based on policy terms
9. **Hospital** approves the claim for payout after verification
10. **Smart Contract** automatically transfers funds from HealthRiskPool to patient's wallet
11. Claim status: **PAID**

#### Phase 4: Immutable Recording
12. **All steps** are permanently recorded on the blockchain
13. **Transparent audit trail** available for verification
14. **Patient** receives notification of payment completion

### Key Mechanisms & Features
- **Two-Step Verification**: Patient submits → Hospital validates & inputs data
- **Automated Payouts**: No manual intervention required for payments
- **Real-Time Tracking**: Patients can monitor claim status at every stage
- **Borderless Processing**: Works globally with any approved hospital
- **Transparent Records**: Every transaction visible and verifiable on-chain
- **Role-Based Security**: Each role has specific, secure permissions
