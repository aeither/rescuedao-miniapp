import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { saveDeployment } from "./utils";

// Task to deploy the SimpleConfidentialNFT contract
task("deploy-nft", "Deploy the SimpleConfidentialNFT contract to the selected network").setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;

    console.log(`Deploying SimpleConfidentialNFT to ${network.name}...`);

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);

    // Deploy the contract
    const SimpleConfidentialNFT = await ethers.getContractFactory("SimpleConfidentialNFT");
    const nft = await SimpleConfidentialNFT.deploy(
      "Confidential Cats", // name
      "CCAT", // symbol
      deployer.address, // owner
    );
    await nft.waitForDeployment();

    const nftAddress = await nft.getAddress();
    console.log(`SimpleConfidentialNFT deployed to: ${nftAddress}`);
    console.log(`Name: Confidential Cats`);
    console.log(`Symbol: CCAT`);
    console.log(`Owner: ${deployer.address}`);

    // Save the deployment
    saveDeployment(network.name, "SimpleConfidentialNFT", nftAddress);

    return nftAddress;
  },
);
