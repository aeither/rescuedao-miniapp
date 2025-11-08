import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { cofhejs, Encryptable } from "cofhejs/node";
import { getDeployment } from "./utils";

// Task to transfer a cat NFT
task("transfer-cat", "Transfer a cat NFT to another address")
  .addParam("tokenid", "The token ID to transfer")
  .addOptionalParam("to", "The recipient address", "0xb3d6f8c9be8c7c4ae9ae5f124f7a70c285d3c076")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;

    // Get the NFT contract address
    const nftAddress = getDeployment(network.name, "SimpleConfidentialNFT");
    if (!nftAddress) {
      console.error(`No SimpleConfidentialNFT deployment found for network ${network.name}`);
      console.error(`Please deploy first using: npx hardhat deploy-nft --network ${network.name}`);
      return;
    }

    console.log(`\n🔄 Confidential Cat NFT Transfer`);
    console.log(`Contract: ${nftAddress}`);
    console.log(`Network: ${network.name}`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);

    const tokenId = taskArgs.tokenid;
    const toAddress = taskArgs.to;

    console.log(`Token ID: #${tokenId}`);
    console.log(`Recipient: ${toAddress}`);

    // Validate recipient address
    if (!ethers.isAddress(toAddress)) {
      console.error(`\n❌ Invalid recipient address: ${toAddress}`);
      return;
    }

    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log(`From: ${signer.address}\n`);

    // Initialize cofhejs with the provider and signer
    if (network.name === "hardhat" || network.name === "localcofhe") {
      // For local/mock networks, use the plugin helper via hre.cofhe
      await hre.cofhe.initializeWithHardhatSigner(signer);
    } else {
      // For real testnets, initialize cofhejs with TESTNET environment
      console.log(`Initializing cofhejs for testnet...`);

      // Wrap the provider to add missing getChainId method
      const wrappedProvider = Object.create(ethers.provider);
      wrappedProvider.getChainId = async () => {
        const network = await ethers.provider.getNetwork();
        return Number(network.chainId);
      };

      const initResult = await cofhejs.initialize({
        provider: wrappedProvider as any,
        signer: signer as any,
        environment: "TESTNET",
      });

      if (!initResult.success) {
        console.error("Failed to initialize cofhejs:", initResult.error);
        console.error("Cannot proceed without proper CoFHE initialization for encryption");
        return;
      } else {
        console.log("✅ cofhejs initialized successfully\n");
      }
    }

    // Get the contract instance
    const SimpleConfidentialNFT = await ethers.getContractFactory("SimpleConfidentialNFT");

    const nft = SimpleConfidentialNFT.attach(nftAddress) as any;

    // Verify token exists
    try {
      //const totalSupply = await nft.totalSupply()
      const allTokens = await nft.getAllMintedTokens();

      if (!allTokens.includes(BigInt(tokenId))) {
        console.error(`❌ Token #${tokenId} does not exist`);
        console.error(`Available tokens: ${allTokens.join(", ")}`);
        return;
      }
    } catch (error: any) {
      console.error(`❌ Error checking token: ${error.message}`);
      return;
    }

    // Get token info before transfer
    console.log(`📋 Token Info:`);
    try {
      const publicURI = await nft.publicTokenURI(tokenId);
      const privateURI = await nft.encryptedTokenURI(tokenId);
      console.log(`   Public URI: ${publicURI}`);
      console.log(`   Private URI: ${privateURI}`);
    } catch (error: any) {
      console.error(`   Could not fetch token URIs: ${error.message}`);
    }

    // Encrypt the recipient address
    console.log(`\n🔐 Encrypting recipient address...`);
    const encryptedRecipient = await cofhejs.encrypt([Encryptable.address(toAddress)] as const);

    if (!encryptedRecipient || !encryptedRecipient.data) {
      console.error("❌ Failed to encrypt recipient address");
      return;
    }

    // Use the encrypted data directly (it"s already in InEaddress format)
    const inEaddress = encryptedRecipient.data[0];

    // Perform the transfer
    console.log(`🚀 Initiating confidential transfer...`);
    try {
      // Use the specific function signature to avoid ambiguity
      const tx = await nft["confidentialTransfer(uint256,address,(uint256,uint8,uint8,bytes))"](
        tokenId,
        toAddress,
        inEaddress,
      );
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);

      const receipt = await tx.wait();

      console.log(`\n✅ Transfer completed!`);
      console.log(`   Transaction hash: ${tx.hash}`);
      console.log(`   Block number: ${receipt.blockNumber}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

      // Show block explorer link
      if (network.name === "eth-sepolia") {
        console.log(`\n🔍 View on Etherscan:`);
        console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
      } else if (network.name === "arb-sepolia") {
        console.log(`\n🔍 View on Arbiscan:`);
        console.log(`   https://sepolia.arbiscan.io/tx/${tx.hash}`);
      }

      console.log(`\n🎉 Cat #${tokenId} has been confidentially transferred!`);
      console.log(`   From: ${signer.address}`);
      console.log(`   To: ${toAddress}`);
      console.log(`   (Ownership is encrypted on-chain)`);
    } catch (error: any) {
      console.error(`\n❌ Transfer failed: ${error.message}`);
      if (error.message.includes("UnauthorizedCaller")) {
        console.error(`   You may not be the owner of this token.`);
      }
    }

    console.log(`\n═══════════════════════════════════════════════════════════════\n`);
  });
