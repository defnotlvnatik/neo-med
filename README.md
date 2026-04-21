# Neo-Med: Web3 Electronic Health Records (EHR) System

A fully decentralized Electronic Health Records platform. Patients maintain ownership of their encrypted medical records on IPFS and manage doctor access permissions securely via the Ethereum blockchain.

## Features
- **Decentralized Storage:** Patient files are encrypted (AES-256-GCM) and uploaded to standard IPFS nodes via Pinata.
- **Role-Based Access Control:** Patients can dynamically grant or revoke read access to their encrypted URLs for specific Ethereum addresses (Doctors).
- **Web3 Authenticaton:** Identity is fully proven via MetaMask signatures (Ethers.js v6).
- **Responsive UI:** Full-stack React + TailwindCSS styling.

---

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v18+)
- [MetaMask](https://metamask.io/) browser extension

---

## 1. Local Setup

### Clone and Install
1. Clone the repository to your local machine.
2. Install Hardhat dependencies in the project root:
   ```bash
   npm install
   ```
3. Install React frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Environment Variables
**Root directory (`/.env`):**
Create a `.env` file in the root for your smart contract deployments.
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_metamask_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Frontend directory (`/frontend/.env`):**
Create a `.env` file in the `frontend` folder for Pinata integration.
```env
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET=your_pinata_secret_key
```

---

## 2. Testing the Smart Contract
You can run the full suite of Hardhat tests measuring RBAC systems and assignments:
```bash
npx hardhat test
```

---

## 3. Deploying to Sepolia Testnet

1. Ensure your `PRIVATE_KEY` has some Sepolia test ETH. (You can grab some from a [Sepolia Faucet](https://sepoliafaucet.com/)).
2. Make sure your `SEPOLIA_RPC_URL` is valid.
3. Run the deployment script:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
   **Note**: The deployment script will automatically inject the newly deployed contract address into your `frontend/src/config.js`!

*(Optional)* Verify the contract on Etherscan:
```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

---

## 4. Connecting MetaMask to Sepolia
If you don't see Sepolia in MetaMask:
1. Open MetaMask.
2. Click the Network Dropdown at the top left.
3. Toggle "Show test networks".
4. Select **Sepolia**. 
   *(If it's not present, click "Add network" -> "Add a network manually", and set the RPC to `https://rpc.sepolia.org` with Chain ID `11155111`)*

---

## 5. Running the Frontend Locally

Once your contract is deployed and config updated, launch the application:
```bash
cd frontend
npm run dev
```

Your app will be live at `http://localhost:5173`. Connect your primary MetaMask account to emulate a Patient. Then switch to a secondary MetaMask account to emulate a Doctor testing access constraints!
