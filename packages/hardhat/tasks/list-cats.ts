import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getDeployment } from "./utils";

// Task to list all minted cat NFTs and their information
task("list-cats", "List all minted cat NFTs and their information").setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;

    // Get the NFT contract address
    const nftAddress = getDeployment(network.name, "SimpleConfidentialNFT");
    if (!nftAddress) {
      console.error(`No SimpleConfidentialNFT deployment found for network ${network.name}`);
      console.error(`Please deploy first using: npx hardhat deploy-nft --network ${network.name}`);
      return;
    }

    console.log(`\n📋 Confidential Cats NFT Collection`);
    console.log(`Contract: ${nftAddress}`);
    console.log(`Network: ${network.name}`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);

    // Get the contract instance
    const SimpleConfidentialNFT = await ethers.getContractFactory("SimpleConfidentialNFT");

    const nft = SimpleConfidentialNFT.attach(nftAddress) as any;

    // Get collection info
    const name = await nft.name();
    const symbol = await nft.symbol();
    const totalSupply = await nft.totalSupply();
    const owner = await nft.owner();

    console.log(`Collection Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Owner: ${owner}`);
    console.log(`Total Supply: ${totalSupply}`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);

    // Check if any tokens exist
    if (totalSupply == 0) {
      console.log("ℹ️  No cats have been minted yet.");
      console.log(`\nMint some cats with: npx hardhat mint-cats --network ${network.name}`);
      return;
    }

    // Get all minted token IDs
    const allTokens = await nft.getAllMintedTokens();
    console.log(`🐱 Found ${allTokens.length} cat(s):\n`);

    // Display each token
    for (let i = 0; i < allTokens.length; i++) {
      const tokenId = allTokens[i];
      console.log(`┌─ Cat #${tokenId} ─────────────────────────────────────────────────`);
      console.log(`│`);

      try {
        // Get token URIs
        const publicURI = await nft.publicTokenURI(tokenId);
        const encryptedURI = await nft.encryptedTokenURI(tokenId);

        console.log(`│ 🌐 Public URI:`);
        console.log(`│    ${publicURI}`);
        console.log(`│`);
        console.log(`│ 🔒 Private URI:`);
        console.log(`│    ${encryptedURI}`);
        console.log(`│`);

        // Get encrypted owner
        const encryptedOwner = await nft.encryptedOwnerOf(tokenId);
        console.log(`│ 👤 Encrypted Owner:`);
        console.log(`│    ${encryptedOwner}`);
        console.log(`│    (This is the FHE encrypted address of the owner)`);
      } catch (error: any) {
        console.log(`│ ❌ Error fetching token info: ${error.message}`);
      }

      console.log(`└────────────────────────────────────────────────────────────────`);

      if (i < allTokens.length - 1) {
        console.log(``);
      }
    }

    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`✨ Total: ${allTokens.length} confidential cat NFT(s)`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);

    // Show IPFS gateway links
    console.log(`💡 Tip: View IPFS content using these gateways:`);
    console.log(`   - https://ipfs.io/ipfs/<hash>`);
    console.log(`   - https://gateway.pinata.cloud/ipfs/<hash>`);
    console.log(`   - https://cloudflare-ipfs.com/ipfs/<hash>`);

    // Block explorer link
    if (network.name === "eth-sepolia") {
      console.log(`\n🔍 View contract on Etherscan:`);
      console.log(`   https://sepolia.etherscan.io/address/${nftAddress}`);
    } else if (network.name === "arb-sepolia") {
      console.log(`\n🔍 View contract on Arbiscan:`);
      console.log(`   https://sepolia.arbiscan.io/address/${nftAddress}`);
    }

    console.log(``);
  },
);
