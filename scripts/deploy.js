const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying EHR contract to Sepolia testnet...");

  const EHR = await hre.ethers.getContractFactory("EHR");
  
  const ehr = await EHR.deploy();
  await ehr.waitForDeployment();

  const contractAddress = await ehr.getAddress();
  
  console.log(`\n======================================================`);
  console.log(`🚀 EHR contract deployed successfully to: ${contractAddress}`);
  console.log(`🔗 Etherscan link: https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log(`======================================================\n`);

  // Auto-update frontend config containing ABI and ADDRESS structurally
  const configPath = path.join(__dirname, "../frontend/src/config.js");
  const artifactPath = path.join(__dirname, "../artifacts/contracts/EHR.sol/EHR.json");
  
  if (fs.existsSync(configPath) && fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    
    // Completely rewrite config.js capturing all the new AccessControl role ABIs correctly
    const newConfigContent = `export const CONTRACT_ADDRESS = "${contractAddress}";\n\nexport const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};\n`;
    
    fs.writeFileSync(configPath, newConfigContent);
    console.log(`✅ Successfully extracted structural ABI and updated CONTRACT_ADDRESS in ${configPath}`);
  } else {
    console.log(`⚠️ Warning: Could not locate config.js or built artifact. Verify manually.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
