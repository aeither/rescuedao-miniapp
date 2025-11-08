import { donationReceiverAbi } from "./DonationReceiver";
import { donationSenderAbi } from "./DonationSenderABI";
import { badgeAbi } from "./ImpactBadgeNFTABI";
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * CCIP-related contracts deployed on Base Sepolia and Ethereum Sepolia
 */
const externalContracts = {
  // Base Sepolia - Source chain
  84532: {
    DonationSender: {
      address: "0x4aE0e7CC9F62b9963166dE9EffCe4C5efab44a86",
      abi: donationSenderAbi,
      inheritedFunctions: {},
    },
  },
  // Ethereum Sepolia - Destination chain
  11155111: {
    DonationReceiver: {
      address: "0xfec273b8AECDa0ef0f74b14305E106A7A63fd98D",
      abi: donationReceiverAbi,
      inheritedFunctions: {},
    },
    ImpactBadgeNFT: {
      address: "0xF1D5Ff863625F8c20AD67D4dE1F6D008FDa5FBCC",
      abi: badgeAbi,
      inheritedFunctions: {},
    },
    Treasury: {
      address: "0x0dba585a86bb828708b14d2f83784564ae03a5d0",
      abi: [], // Treasury is just an EOA/multisig address
      inheritedFunctions: {},
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
