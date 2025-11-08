"use client";

import { useEffect, useState } from "react";
import { useComposeCast, useMiniKit } from "@coinbase/onchainkit/minikit";
import type { NextPage } from "next";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ConnectWalletButton } from "~~/components/ConnectWalletButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { minikitConfig } from "~~/minikit.config";

interface NFTMetadata {
  name: string;
  age?: string;
  location?: string;
  image: string;
  description?: string;
}

interface NFTData {
  tokenId: bigint;
  publicURI: string;
  encryptedURI: string;
  catName: string;
  catEmoji: string;
}

// Contract addresses and ABIs
const DONATION_SENDER_ADDRESS = "0x4aE0e7CC9F62b9963166dE9EffCe4C5efab44a86";
const CCIP_BNM_TOKEN = "0x88A2d74F47a237a62e7A51cdDa67270CE381555e";
const ETHEREUM_SEPOLIA_CHAIN_SELECTOR = "16015286601757825753";
const DONATION_RECEIVER_ADDRESS = "0xfec273b8AECDa0ef0f74b14305E106A7A63fd98D";
const DONATION_AMOUNT = "0.1"; // Fixed donation amount

const donationSenderAbi = [
  {
    type: "function",
    name: "sendDonation",
    inputs: [
      { name: "destinationChainSelector", type: "uint64" },
      { name: "receiver", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "campaignId", type: "string" },
    ],
    outputs: [{ name: "messageId", type: "bytes32" }],
    stateMutability: "payable",
  },
] as const;

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// Cat names for each NFT
const CAT_NAMES = [
  { name: "Whiskers", emoji: "😺" },
  { name: "Luna", emoji: "🌙" },
  { name: "Shadow", emoji: "🐱" },
  { name: "Mittens", emoji: "🧤" },
  { name: "Tiger", emoji: "🐯" },
  { name: "Simba", emoji: "🦁" },
  { name: "Felix", emoji: "😸" },
  { name: "Garfield", emoji: "🧡" },
  { name: "Snowball", emoji: "❄️" },
  { name: "Patches", emoji: "🎨" },
];

const CatsPage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { context } = useMiniKit();
  const { composeCast } = useComposeCast();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true);
  const [donatingTokenId, setDonatingTokenId] = useState<string | null>(null);

  // Read contract data
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "SimpleConfidentialNFT",
    functionName: "totalSupply",
  });

  const { data: allTokenIds } = useScaffoldReadContract({
    contractName: "SimpleConfidentialNFT",
    functionName: "getAllMintedTokens",
  });

  // Read token balance and allowance
  const { data: tokenBalance } = useReadContract({
    address: CCIP_BNM_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
  });

  const { data: tokenAllowance } = useReadContract({
    address: CCIP_BNM_TOKEN,
    abi: erc20Abi,
    functionName: "allowance",
    args: connectedAddress ? [connectedAddress, DONATION_SENDER_ADDRESS as `0x${string}`] : undefined,
  });

  // Approve and send donation hooks
  const { writeContract: approveToken, isPending: isApproving } = useWriteContract();

  const { writeContract: sendDonation, data: donationHash } = useWriteContract();
  const { isSuccess: isDonationSuccess } = useWaitForTransactionReceipt({ hash: donationHash });

  // Load NFTs when token IDs are available
  useEffect(() => {
    const loadNFTs = async () => {
      if (!allTokenIds || (allTokenIds as bigint[]).length === 0) {
        setIsLoadingNFTs(false);
        setNfts([]);
        return;
      }

      setIsLoadingNFTs(true);
      const nftPromises = (allTokenIds as bigint[]).map(async tokenId => {
        try {
          const catInfo = CAT_NAMES[Number(tokenId) % CAT_NAMES.length];
          return {
            tokenId,
            publicURI: `Token #${tokenId.toString()}`,
            encryptedURI: "Encrypted",
            catName: catInfo.name,
            catEmoji: catInfo.emoji,
          };
        } catch (error) {
          console.error(`Error loading NFT ${tokenId}:`, error);
          return null;
        }
      });

      const loadedNFTs = await Promise.all(nftPromises);
      setNfts(loadedNFTs.filter((nft): nft is NFTData => nft !== null));
      setIsLoadingNFTs(false);
    };

    loadNFTs();
  }, [allTokenIds]);

  const handleApprove = async (tokenId: string) => {
    const amountInWei = parseUnits(DONATION_AMOUNT, 18);
    setDonatingTokenId(tokenId);
    approveToken({
      address: CCIP_BNM_TOKEN,
      abi: erc20Abi,
      functionName: "approve",
      args: [DONATION_SENDER_ADDRESS as `0x${string}`, amountInWei],
    });
  };

  const handleDonate = async (tokenId: string, catName?: string) => {
    const amountInWei = parseUnits(DONATION_AMOUNT, 18);
    const estimatedFees = parseUnits("0.01", 18);
    const campaignId = `rescue-cat-${(catName || "unknown").toLowerCase()}`;

    setDonatingTokenId(tokenId);
    sendDonation({
      address: DONATION_SENDER_ADDRESS,
      abi: donationSenderAbi,
      functionName: "sendDonation",
      args: [
        BigInt(ETHEREUM_SEPOLIA_CHAIN_SELECTOR),
        DONATION_RECEIVER_ADDRESS as `0x${string}`,
        CCIP_BNM_TOKEN as `0x${string}`,
        amountInWei,
        campaignId,
      ],
      value: estimatedFees,
    });
  };

  const handleShare = (catName: string, catEmoji: string) => {
    const userName = context?.user?.username || "demo";
    composeCast({
      text: `I just found ${catEmoji} ${catName}! Help rescue this adorable cat by donating! 🐱💝`,
      embeds: [`${minikitConfig.miniapp.homeUrl}/share/${userName}`],
    });
  };

  useEffect(() => {
    if (isDonationSuccess) {
      setDonatingTokenId(null);
    }
  }, [isDonationSuccess]);

  const needsApproval = tokenAllowance !== undefined && BigInt(tokenAllowance) < parseUnits(DONATION_AMOUNT, 18);

  return (
    <div className="flex items-center flex-col grow pt-6 pb-12 bg-gradient-to-b from-base-100 via-base-200 to-base-100 min-h-screen">
      <div className="px-5 w-full max-w-7xl">
        {/* Compact Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-1 shadow-2xl">
          <div className="bg-base-100 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-2 bg-pink-500/20 border border-pink-500 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <span className="animate-pulse">💝</span>
                  RESCUE WITH PRIVACY
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight flex items-center justify-center md:justify-start gap-2">
                  <span>Rescue Cats</span>
                  <span className="text-4xl">🐾</span>
                </h1>
                <p className="text-base md:text-lg opacity-80 font-semibold">Every donation makes a real difference</p>
              </div>
              {!isConnected && (
                <div className="text-center">
                  <ConnectWalletButton />
                  <p className="text-xs opacity-70 mt-2">Connect to start rescuing</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Connection Card - Compact */}
        {isConnected && (
          <div className="card bg-base-100 border border-base-300 shadow-lg mb-6">
            <div className="card-body p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                  </div>
                  <div>
                    <p className="font-black text-sm">Connected</p>
                    <p className="text-xs opacity-70">{connectedAddress}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-3">
                  <p className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {tokenBalance ? Number(formatUnits(tokenBalance as bigint, 18)).toFixed(2) : "0.00"}
                  </p>
                  <p className="text-xs text-purple-700 font-semibold">CCIP-BnM Balance</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collection Stats - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card bg-gradient-to-br from-pink-50 to-rose-100 border-2 border-pink-200 shadow-lg">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="bg-pink-500 text-white rounded-xl p-3 shadow-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-pink-700 font-bold text-xs mb-1">Cats Waiting</p>
                  <p className="text-3xl font-black text-pink-900">{totalSupply?.toString() || "0"}</p>
                  <p className="text-xs text-pink-600">Each donation saves a life</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-indigo-100 border-2 border-purple-200 shadow-lg">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 text-white rounded-xl p-3 shadow-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-purple-700 font-bold text-xs mb-1">Donation Amount</p>
                  <p className="text-3xl font-black text-purple-900">{DONATION_AMOUNT}</p>
                  <p className="text-xs text-purple-600">CCIP-BnM per rescue</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card - Compact */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 text-white rounded-lg p-2 shadow-lg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-base text-blue-900 mb-1">How It Works 🎯</h3>
              <p className="text-sm text-blue-800 font-medium mb-2">
                Click <strong>Donate</strong> ({DONATION_AMOUNT} CCIP-BnM) • Crosses chains via Chainlink • Earn Impact
                Badge NFT
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge badge-sm bg-blue-100 text-blue-700 border-blue-300">🔒 Private</span>
                <span className="badge badge-sm bg-cyan-100 text-cyan-700 border-cyan-300">⚡ Instant</span>
                <span className="badge badge-sm bg-teal-100 text-teal-700 border-teal-300">✓ Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message - Compact */}
        {isDonationSuccess && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 mb-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 text-white rounded-lg p-2 shadow-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base text-green-900 mb-1">🎉 Donation Successful!</h3>
                <p className="text-sm text-green-800 font-medium mb-2">
                  Amazing! You&apos;ll receive an Impact Badge NFT as proof of your generosity!
                </p>
                {donationHash && (
                  <a
                    href={`https://ccip.chain.link/msg/${donationHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-xs bg-green-500 hover:bg-green-600 text-white border-0 shadow-md"
                  >
                    Track on CCIP Explorer →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cats Grid - Compact Layout */}
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-black mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <span>🐾</span>
              <span>Meet the Rescue Cats</span>
              <span>🐾</span>
            </h2>
            <p className="text-sm opacity-70">Each cat is waiting for your help 💝</p>
          </div>
          {isLoadingNFTs ? (
            <div className="flex flex-col justify-center items-center py-20">
              <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
              <p className="text-lg font-semibold opacity-70">Loading adorable cats...</p>
            </div>
          ) : nfts.length === 0 ? (
            <div className="card bg-gradient-to-br from-base-100 to-base-200 border-2 border-base-300 shadow-xl">
              <div className="card-body text-center py-16">
                <div className="text-6xl mb-4">😿</div>
                <h3 className="text-2xl font-black mb-4">No Cats Available Yet</h3>
                <p className="text-lg opacity-70 mb-6">Use the Hardhat task to add rescue cats to the platform!</p>
                <div className="bg-base-300 rounded-lg p-4 max-w-xl mx-auto">
                  <code className="text-sm font-mono font-semibold">npx hardhat mint-cats --network baseSepolia</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {nfts.map(nft => (
                <CatCard
                  key={nft.tokenId.toString()}
                  nft={nft}
                  onDonate={needsApproval ? handleApprove : handleDonate}
                  onShare={handleShare}
                  isConnected={isConnected}
                  isDonating={donatingTokenId === nft.tokenId.toString()}
                  isApproving={isApproving && donatingTokenId === nft.tokenId.toString()}
                  needsApproval={needsApproval}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CatCardProps {
  nft: NFTData;
  onDonate: (tokenId: string, catName?: string) => void;
  onShare: (catName: string, catEmoji: string) => void;
  isConnected: boolean;
  isDonating: boolean;
  isApproving: boolean;
  needsApproval: boolean;
}

const CatCard = ({ nft, onDonate, onShare, isConnected, isDonating, isApproving, needsApproval }: CatCardProps) => {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { data: publicURI } = useScaffoldReadContract({
    contractName: "SimpleConfidentialNFT",
    functionName: "publicTokenURI",
    args: [nft.tokenId],
  });

  const { data: encryptedURI } = useScaffoldReadContract({
    contractName: "SimpleConfidentialNFT",
    functionName: "encryptedTokenURI",
    args: [nft.tokenId],
  });

  // Fetch metadata from IPFS when publicURI is available
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!publicURI || typeof publicURI !== "string") return;

      try {
        setIsLoadingMetadata(true);
        let ipfsUrl = publicURI.toString();

        // Convert ipfs:// to https://ipfs.io/ipfs/
        if (ipfsUrl.startsWith("ipfs://")) {
          ipfsUrl = ipfsUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
        }

        const response = await fetch(ipfsUrl);
        const json = await response.json();

        // Convert image URL if it's an IPFS URL
        if (json.image && json.image.startsWith("ipfs://")) {
          json.image = json.image.replace("ipfs://", "https://ipfs.io/ipfs/");
        }

        setMetadata(json);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [publicURI]);

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
      <div className="relative card bg-gradient-to-br from-base-100 to-base-200 border-2 border-base-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden">
        <div className="card-body p-0">
          {/* Cat Image Header */}
          {isLoadingMetadata ? (
            <div className="h-64 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <div className="text-center">
                <span className="loading loading-spinner loading-lg text-primary mb-2"></span>
                <p className="text-sm font-semibold opacity-70">Loading metadata...</p>
              </div>
            </div>
          ) : metadata?.image && !imageError ? (
            <div className="relative h-64 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
              <img
                src={metadata.image}
                alt={metadata.name || nft.catName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white text-sm font-bold">NFT #{nft.tokenId.toString()}</span>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-7xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {nft.catEmoji}
                </div>
                <div className="badge badge-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300">
                  NFT #{nft.tokenId.toString()}
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Cat Info */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-black mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {metadata?.name || nft.catName}
              </h3>
              {metadata && (
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {metadata.age && (
                    <div className="badge badge-md bg-blue-100 text-blue-700 border-blue-300 gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {metadata.age}
                    </div>
                  )}
                  {metadata.location && (
                    <div className="badge badge-md bg-green-100 text-green-700 border-green-300 gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {metadata.location}
                    </div>
                  )}
                </div>
              )}
              {metadata?.description && <p className="text-sm opacity-80 line-clamp-2 mb-3">{metadata.description}</p>}
            </div>

            {/* Technical Details - Compact */}
            <details className="collapse collapse-arrow bg-base-200 rounded-lg mb-4">
              <summary className="collapse-title text-xs font-semibold min-h-0 py-2 px-3">
                Technical Details (IPFS & FHE)
              </summary>
              <div className="collapse-content px-3 pb-3">
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <p className="font-bold text-xs text-blue-900">Public IPFS URI:</p>
                    </div>
                    <p className="text-xs text-blue-700 break-all">{publicURI || "Loading..."}</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="font-bold text-xs text-purple-900">Private URI (FHE):</p>
                      <span className="badge badge-xs bg-purple-200 text-purple-900 border-0">🔒</span>
                    </div>
                    <p className="text-xs text-purple-700 break-all">{encryptedURI || "Loading..."}</p>
                  </div>
                </div>
              </div>
            </details>

            {/* Action Buttons */}
            <div className="card-actions flex-col w-full gap-3">
              {isConnected ? (
                <>
                  <button
                    className={`btn w-full font-black text-white border-0 shadow-lg hover:scale-105 transition-transform duration-200 ${
                      needsApproval
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    }`}
                    onClick={() => onDonate(nft.tokenId.toString(), nft.catName)}
                    disabled={isDonating || isApproving}
                  >
                    {isDonating || isApproving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="font-black">{needsApproval ? "Approving..." : "Donating..."}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        {needsApproval ? "Approve " : "Donate "}
                        {DONATION_AMOUNT} CCIP-BnM
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline border-2 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent w-full font-bold shadow-md hover:scale-105 transition-all duration-200"
                    onClick={() => onShare(nft.catName, nft.catEmoji)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share {nft.catEmoji}
                  </button>
                </>
              ) : (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4 text-center">
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <p className="text-sm font-bold text-orange-900">Connect wallet to donate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatsPage;
