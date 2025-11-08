"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

// Import ABIs
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

const badgeAbi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ownerOf",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "donationAmount",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "campaignId",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
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

// Contract addresses - Ethereum Sepolia (source) and Arbitrum Sepolia (destination)
const DONATION_SENDER_ADDRESS = "0x05455067484e775E494AEEcAb6C6Ad9a6A9A1B44";
const DONATION_RECEIVER_ADDRESS = "0xa7861f0F89c3Fc61Eaf7343720c7958284DeFF77";
const BADGE_NFT_ADDRESS = "0x10Fe174685FbEbFb96d263B3A3282f19e5469d7f";
const TREASURY_ADDRESS = "0x0dba585a86bb828708b14d2f83784564ae03a5d0";

// CCIP Chain Selectors
const ARBITRUM_SEPOLIA_CHAIN_SELECTOR = "3478487238524512106"; // Arbitrum Sepolia
// CCIP-BnM token on Ethereum Sepolia (example token for donations)
const CCIP_BNM_TOKEN = "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05";

interface Badge {
  tokenId: number;
  amount: string;
  campaignId: string;
  tokenURI: string;
}

const Donations: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [amount, setAmount] = useState("1");
  const [campaignId, setCampaignId] = useState("rescue-dao-emergency-fund");
  const [messageId, setMessageId] = useState<string>("");
  const [userBadges, setUserBadges] = useState<Badge[]>([]);

  // Read token balance
  const { data: tokenBalance } = useReadContract({
    address: CCIP_BNM_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
  });

  // Read token allowance
  const { data: tokenAllowance } = useReadContract({
    address: CCIP_BNM_TOKEN,
    abi: erc20Abi,
    functionName: "allowance",
    args: connectedAddress ? [connectedAddress, DONATION_SENDER_ADDRESS as `0x${string}`] : undefined,
  });

  // Read badge balance
  const { data: badgeBalance } = useReadContract({
    address: BADGE_NFT_ADDRESS,
    abi: badgeAbi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
  });

  // Read total supply of badges
  const { data: totalSupply } = useReadContract({
    address: BADGE_NFT_ADDRESS,
    abi: badgeAbi,
    functionName: "totalSupply",
  });

  // Approve token spending
  const { writeContract: approveToken, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Send donation
  const { writeContract: sendDonation, data: donationHash, isPending: isDonating } = useWriteContract();
  const { isSuccess: isDonationSuccess } = useWaitForTransactionReceipt({ hash: donationHash });

  // Fetch user badges
  useEffect(() => {
    const fetchBadges = async () => {
      if (!connectedAddress || !badgeBalance || Number(badgeBalance) === 0) {
        setUserBadges([]);
        return;
      }

      // This is a simplified approach - in production, you'd want to use events or a subgraph
      const badges: Badge[] = [];
      const total = Number(totalSupply || 0);

      // Check last N badges to find user's badges (this is inefficient but works for demo)
      for (let i = Math.max(0, total - 50); i < total; i++) {
        try {
          // Would need to implement actual owner checking here
          // For now, we'll just show placeholder data
          badges.push({
            tokenId: i,
            amount: "0",
            campaignId: "",
            tokenURI: "",
          });
        } catch {
          // Token doesn't belong to user
        }
      }

      setUserBadges(badges);
    };

    fetchBadges();
  }, [connectedAddress, badgeBalance, totalSupply]);

  const handleApprove = async () => {
    const amountInWei = parseUnits(amount, 18);
    approveToken({
      address: CCIP_BNM_TOKEN,
      abi: erc20Abi,
      functionName: "approve",
      args: [DONATION_SENDER_ADDRESS as `0x${string}`, amountInWei],
    });
  };

  const handleDonate = async () => {
    const amountInWei = parseUnits(amount, 18);

    // Estimate fees - for demo, using 0.01 ETH
    const estimatedFees = parseUnits("0.01", 18);

    sendDonation({
      address: DONATION_SENDER_ADDRESS,
      abi: donationSenderAbi,
      functionName: "sendDonation",
      args: [
        BigInt(ARBITRUM_SEPOLIA_CHAIN_SELECTOR),
        DONATION_RECEIVER_ADDRESS as `0x${string}`,
        CCIP_BNM_TOKEN as `0x${string}`,
        amountInWei,
        campaignId,
      ],
      value: estimatedFees,
    });
  };

  useEffect(() => {
    if (isDonationSuccess && donationHash) {
      // In a real implementation, you'd parse the transaction receipt to get the messageId
      setMessageId(donationHash);
    }
  }, [isDonationSuccess, donationHash]);

  const needsApproval = tokenAllowance !== undefined && BigInt(tokenAllowance) < parseUnits(amount || "0", 18);

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-6xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold mb-2">Cross-Chain Donations</span>
          <span className="block text-lg opacity-70">Send donations and earn impact badges via CCIP</span>
        </h1>

        {!isConnected ? (
          <div className="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Please connect your wallet to make donations</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donation Form */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Make a Donation</h2>

                <div className="space-y-4">
                  <div className="alert alert-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="stroke-current shrink-0 w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm">
                      <p>Source: Ethereum Sepolia</p>
                      <p>Destination: Arbitrum Sepolia</p>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Your Token Balance</span>
                    </label>
                    <div className="text-2xl font-bold">
                      {tokenBalance ? formatUnits(tokenBalance as bigint, 18) : "0"} CCIP-BnM
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Campaign ID</span>
                    </label>
                    <input
                      type="text"
                      placeholder="rescue-dao-emergency-fund"
                      className="input input-bordered"
                      value={campaignId}
                      onChange={e => setCampaignId(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Donation Amount (CCIP-BnM)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="1.0"
                      className="input input-bordered"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                    <label className="label">
                      <span className="label-text-alt">Estimated fee: 0.01 ETH (for CCIP cross-chain transfer)</span>
                    </label>
                  </div>

                  {needsApproval ? (
                    <button
                      className="btn btn-warning w-full"
                      onClick={handleApprove}
                      disabled={isApproving || !amount}
                    >
                      {isApproving ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Approving...
                        </>
                      ) : (
                        "Approve Tokens"
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary w-full"
                      onClick={handleDonate}
                      disabled={isDonating || !amount || !campaignId}
                    >
                      {isDonating ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Sending Donation...
                        </>
                      ) : (
                        "Send Cross-Chain Donation"
                      )}
                    </button>
                  )}

                  {isApproveSuccess && (
                    <div className="alert alert-success">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Approval successful! Now you can send the donation.</span>
                    </div>
                  )}

                  {messageId && (
                    <div className="alert alert-success">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex flex-col gap-2">
                        <span>Donation sent! Track your transaction:</span>
                        <a
                          href={`https://ccip.chain.link/msg/${messageId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary text-xs break-all"
                        >
                          View on CCIP Explorer
                        </a>
                        <span className="text-xs">
                          Your Impact Badge NFT will be minted on Arbitrum Sepolia in 1-2 minutes
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract Information */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Contract Information</h2>

                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-1">DonationSender (Ethereum Sepolia)</p>
                    <Address address={DONATION_SENDER_ADDRESS} />
                  </div>

                  <div>
                    <p className="font-semibold mb-1">DonationReceiver (Arbitrum Sepolia)</p>
                    <Address address={DONATION_RECEIVER_ADDRESS} />
                  </div>

                  <div>
                    <p className="font-semibold mb-1">Impact Badge NFT (Arbitrum Sepolia)</p>
                    <Address address={BADGE_NFT_ADDRESS} />
                  </div>

                  <div>
                    <p className="font-semibold mb-1">Treasury (Arbitrum Sepolia)</p>
                    <Address address={TREASURY_ADDRESS} />
                  </div>

                  <div>
                    <p className="font-semibold mb-1">CCIP-BnM Token (Ethereum Sepolia)</p>
                    <Address address={CCIP_BNM_TOKEN} />
                  </div>

                  <div className="divider"></div>

                  <div className="alert alert-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="stroke-current shrink-0 w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Get CCIP-BnM Test Tokens:</p>
                      <a
                        href="https://faucets.chain.link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        Chainlink Faucet
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Badges */}
            <div className="card bg-base-100 shadow-xl lg:col-span-2">
              <div className="card-body">
                <h2 className="card-title">Your Impact Badges</h2>

                <div className="alert alert-info mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm">
                    <p>Total Badges Minted: {totalSupply?.toString() || "0"}</p>
                    <p>Your Badges: {badgeBalance?.toString() || "0"}</p>
                  </div>
                </div>

                {badgeBalance && Number(badgeBalance) > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userBadges.map(badge => (
                      <div key={badge.tokenId} className="card bg-base-200 shadow-sm">
                        <div className="card-body">
                          <h3 className="card-title text-sm">Badge #{badge.tokenId}</h3>
                          <p className="text-xs opacity-70">Campaign: {badge.campaignId || "Loading..."}</p>
                          <p className="text-xs opacity-70">Amount: {badge.amount || "Loading..."} tokens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 opacity-70">
                    <p>No badges yet. Make your first donation to earn an Impact Badge NFT!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-8 p-6 bg-base-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4">How Cross-Chain Donations Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Donation Flow:</h3>
              <ol className="space-y-2 list-decimal list-inside text-sm">
                <li>Approve CCIP-BnM tokens on Ethereum Sepolia</li>
                <li>Send donation with campaign ID via CCIP</li>
                <li>CCIP transfers tokens to Arbitrum Sepolia</li>
                <li>DonationReceiver forwards tokens to treasury</li>
                <li>Impact Badge NFT is minted to your address</li>
                <li>Track your donation on CCIP Explorer</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Benefits:</h3>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>Trustless cross-chain transfers via Chainlink CCIP</li>
                <li>Automatic NFT badge as proof of donation</li>
                <li>Transparent treasury management</li>
                <li>Campaign tracking and analytics</li>
                <li>Composable with other DeFi protocols</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="mt-6 p-6 bg-base-300 rounded-lg">
          <h3 className="text-lg font-bold mb-3">Setup Guide</h3>
          <ol className="space-y-2 list-decimal list-inside text-sm">
            <li>
              Get testnet ETH for Ethereum Sepolia from{" "}
              <a
                href="https://sepoliafaucet.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary"
              >
                Sepolia Faucet
              </a>
            </li>
            <li>
              Get CCIP-BnM test tokens from{" "}
              <a
                href="https://faucets.chain.link"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary"
              >
                Chainlink Faucet
              </a>
            </li>
            <li>Connect your wallet to Ethereum Sepolia network</li>
            <li>Approve tokens and send your first cross-chain donation</li>
            <li>Wait 1-2 minutes for CCIP to process the transaction</li>
            <li>Switch to Arbitrum Sepolia to view your Impact Badge NFT</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Donations;
