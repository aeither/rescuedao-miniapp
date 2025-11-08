"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ConnectWalletButton } from "~~/components/ConnectWalletButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface NFTData {
  tokenId: bigint;
  publicURI: string;
  encryptedURI: string;
}

const NFTsPage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true);

  // Read contract data
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "SimpleConfidentialNFT",
    functionName: "totalSupply",
  });

  const { data: allTokenIds } = useScaffoldReadContract({
    contractName: "SimpleConfidentialNFT",
    functionName: "getAllMintedTokens",
  });

  const { data: contractName } = useScaffoldReadContract({
    contractName: "SimpleConfidentialNFT",
    functionName: "name",
  });

  const { data: contractSymbol } = useScaffoldReadContract({
    contractName: "SimpleConfidentialNFT",
    functionName: "symbol",
  });

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
          // Note: In a real implementation, you'd need to fetch these from the contract
          // For now, we'll just return the token ID
          return {
            tokenId,
            publicURI: `Token #${tokenId.toString()}`,
            encryptedURI: "Encrypted",
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

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-6xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold mb-2">{contractName || "Confidential NFT Collection"}</span>
          <span className="block text-xl opacity-70">{contractSymbol || "NFT"}</span>
        </h1>

        <div className="flex justify-center items-center space-x-2 flex-col mb-8">
          <ConnectWalletButton />
          {isConnected && <p className="text-sm mt-2">Connected: {connectedAddress}</p>}
        </div>

        {/* Collection Stats */}
        <div className="stats shadow mb-8 w-full">
          <div className="stat">
            <div className="stat-title">Total Supply</div>
            <div className="stat-value">{totalSupply?.toString() || "0"}</div>
            <div className="stat-desc">NFTs minted</div>
          </div>
        </div>

        {/* Info about minting */}
        <div className="alert mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-info shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div>
            <h3 className="font-bold">How to mint NFTs</h3>
            <div className="text-sm">
              Use the Hardhat task:{" "}
              <code className="bg-base-300 px-2 py-1 rounded">npx hardhat mint-cats --network baseSepolia</code>
            </div>
          </div>
        </div>

        {/* NFT List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">NFT Collection</h2>
          {isLoadingNFTs ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-12 opacity-70">
              <p>No NFTs minted yet. Use the Hardhat task to mint your first NFT!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map(nft => (
                <NFTCard key={nft.tokenId.toString()} nft={nft} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * NFTCard Component
 * Displays individual NFT information
 */
const NFTCard = ({ nft }: { nft: NFTData }) => {
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

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">NFT #{nft.tokenId.toString()}</h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold opacity-70">Public URI:</p>
            <p className="text-xs break-all">{publicURI || "Loading..."}</p>
          </div>
          <div>
            <p className="text-sm font-semibold opacity-70">Private URI (Encrypted):</p>
            <p className="text-xs break-all">{encryptedURI || "Loading..."}</p>
          </div>
        </div>
        {publicURI && publicURI.toString().startsWith("ipfs://") && (
          <div className="card-actions justify-end mt-4">
            <a
              href={`https://ipfs.io/ipfs/${publicURI.toString().replace("ipfs://", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline"
            >
              View on IPFS
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTsPage;
