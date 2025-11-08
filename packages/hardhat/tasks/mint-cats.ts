import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { cofhejs, Encryptable } from "cofhejs/node";
import { getDeployment } from "./utils";

// Cat NFTs with public and private URIs
const CATS = [
  {
    name: "Cat #1",
    publicURI: "ipfs://bafkreiag2j7daypteygynev5yqvftkpasqel2ined42pog6jrnmsarkaq4",
    privateURI: "ipfs://bafkreiaymzwud7cqdlk6jilwhv4d6cn6p353xxpehgaieuj72hzmgqftwi",
  },
  {
    name: "Cat #2",
    publicURI: "ipfs://bafkreiag2j7daypteygynev5yqvftkpasqel2ined42pog6jrnmsarkaq4",
    privateURI: "ipfs://bafkreiaymzwud7cqdlk6jilwhv4d6cn6p353xxpehgaieuj72hzmgqftwi",
  },
  {
    name: "Cat #3",
    publicURI: "ipfs://bafkreiag2j7daypteygynev5yqvftkpasqel2ined42pog6jrnmsarkaq4",
    privateURI: "ipfs://bafkreiaymzwud7cqdlk6jilwhv4d6cn6p353xxpehgaieuj72hzmgqftwi",
  },
];

// Task to mint cat NFTs
task("mint-cats", "Mint cat NFTs with public and private URIs")
  .addOptionalParam("count", "Number of cats to mint", "3")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;

    // Get the NFT contract address
    const nftAddress = getDeployment(network.name, "SimpleConfidentialNFT");
    if (!nftAddress) {
      console.error(`No SimpleConfidentialNFT deployment found for network ${network.name}`);
      console.error(`Please deploy first using: npx hardhat deploy-nft --network ${network.name}`);
      return;
    }

    console.log(`Using SimpleConfidentialNFT at ${nftAddress} on ${network.name}`);

    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log(`Using account: ${signer.address}`);

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
        console.log("cofhejs initialized successfully with TESTNET environment");
      }
    }

    // Get the contract instance
    const SimpleConfidentialNFT = await ethers.getContractFactory("SimpleConfidentialNFT");

    const nft = SimpleConfidentialNFT.attach(nftAddress) as any;

    // Get total supply before minting
    const totalSupplyBefore = await nft.totalSupply();
    console.log(`\nTotal supply before minting: ${totalSupplyBefore}`);

    // Parse count parameter
    const count = Math.min(parseInt(taskArgs.count), CATS.length);
    console.log(`\nMinting ${count} cat NFT(s)...`);

    // Mint each cat
    for (let i = 0; i < count; i++) {
      const cat = CATS[i];
      console.log(`\n--- Minting ${cat.name} ---`);
      console.log(`Public URI: ${cat.publicURI}`);
      console.log(`Private URI: ${cat.privateURI}`);

      // Encrypt the owner address (the signer"s address)
      console.log(`Encrypting owner address: ${signer.address}`);
      const encryptedOwner = await cofhejs.encrypt([Encryptable.address(signer.address)] as const);

      if (!encryptedOwner || !encryptedOwner.data) {
        console.error("Failed to encrypt owner address");
        continue;
      }

      // Use the encrypted data directly (it"s already in InEaddress format)
      const inEaddress = encryptedOwner.data[0];

      // Mint the NFT
      console.log("Minting...");
      const tx = await nft.mint(inEaddress, cat.publicURI, cat.privateURI);
      const receipt = await tx.wait();
      console.log(`Transaction hash: ${tx.hash}`);

      // Extract token ID from event
      if (receipt && receipt.logs.length > 0) {
        // Find NFTMinted event
        const mintEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = nft.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            return parsed?.name === "NFTMinted";
          } catch {
            return false;
          }
        });

        if (mintEvent) {
          const parsed = nft.interface.parseLog({
            topics: mintEvent.topics as string[],
            data: mintEvent.data,
          });
          if (parsed) {
            console.log(`✅ Minted token ID: ${parsed.args[0]}`);
          }
        }
      }
    }

    // Get total supply after minting
    const totalSupplyAfter = await nft.totalSupply();
    console.log(`\n✅ Minting complete!`);
    console.log(`Total supply: ${totalSupplyBefore} → ${totalSupplyAfter}`);

    // Get all minted tokens
    const allTokens = await nft.getAllMintedTokens();
    console.log(`\nAll minted token IDs: ${allTokens.join(", ")}`);
  });
