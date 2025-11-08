"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ConnectWalletButton } from "~~/components/ConnectWalletButton";
import { Address } from "~~/components/scaffold-eth";

interface UserContext {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

const Home: NextPage = () => {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address: connectedAddress, isConnected } = useAccount();
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Load user context
  useEffect(() => {
    const fetchUserContext = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setUserContext({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          });
        }
      } catch (err) {
        console.error("Error fetching user context:", err);
      }
    };

    fetchUserContext();
  }, []);

  return (
    <div className="flex items-center flex-col grow pt-6 pb-12 bg-gradient-to-b from-base-100 via-base-200 to-base-100">
      <div className="px-5 w-full max-w-6xl">
        {/* Mobile-Optimized Hero Section */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-1 shadow-2xl">
          <div className="bg-base-100 rounded-2xl p-5">
            <div className="text-center">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 bg-success/20 border border-success text-success text-[10px] font-bold px-2.5 py-1 rounded-full mb-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                </span>
                LIVE ON BASE
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-black mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                RescueDAO 🐱
              </h1>

              {/* Tagline */}
              <p className="text-sm md:text-base font-bold opacity-80 mb-4 max-w-md mx-auto">
                Rescue real cats, own the impact—blockchain privacy for charity
              </p>

              {/* Tech Badges - Compact */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                <div className="group relative">
                  <span className="badge badge-sm bg-purple-100 text-purple-700 border-purple-300 gap-1 cursor-help text-[10px] font-bold">
                    🔒 FHE Privacy
                  </span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-purple-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                    Private donations with Fhenix
                  </div>
                </div>
                <div className="group relative">
                  <span className="badge badge-sm bg-blue-100 text-blue-700 border-blue-300 gap-1 cursor-help text-[10px] font-bold">
                    ⚡ CCIP Cross-Chain
                  </span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-blue-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                    Instant cross-chain via Chainlink
                  </div>
                </div>
                <div className="group relative">
                  <span className="badge badge-sm bg-pink-100 text-pink-700 border-pink-300 gap-1 cursor-help text-[10px] font-bold">
                    🎁 NFT Badges
                  </span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-pink-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                    Earn proof-of-impact badges
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col items-center gap-3">
                <ConnectWalletButton />
                {!isConnected && (
                  <p className="text-xs opacity-60 max-w-[220px]">Connect to earn badges & rescue cats</p>
                )}
                {isConnected && (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-2 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-success">✓ Connected</span>
                      <Address address={connectedAddress} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Mini Card (if logged in) */}
        {userContext && (
          <div className="card bg-base-100 border border-base-300 shadow-lg mb-6">
            <div className="card-body p-4">
              <div className="flex items-center gap-4">
                {userContext.pfpUrl && (
                  <div className="avatar online">
                    <div className="w-14 rounded-full ring ring-primary ring-offset-2">
                      <Image
                        src={userContext.pfpUrl}
                        alt={userContext.displayName || userContext.username || "Profile"}
                        width={56}
                        height={56}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  {userContext.displayName && <h3 className="font-black text-lg">{userContext.displayName}</h3>}
                  <div className="flex items-center gap-2 flex-wrap">
                    {userContext.username && <p className="text-sm opacity-70">@{userContext.username}</p>}
                    {userContext.fid && <span className="badge badge-sm badge-outline">FID: {userContext.fid}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main CTA - Compact & Action-Focused */}
        <div className="relative group mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black mb-2 text-white drop-shadow-lg flex items-center justify-center md:justify-start gap-2">
                  <span>Save a Life Today!</span>
                  <span className="text-4xl">🐾</span>
                </h2>
                <p className="text-white text-base md:text-lg opacity-95 mb-3 font-medium">
                  Every donation rescues cats in need. Private, cross-chain, instant.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start text-xs text-white/90">
                  <span>⚡ Instant</span>
                  <span>•</span>
                  <span>🔒 Private</span>
                  <span>•</span>
                  <span>🎁 Earn Badges</span>
                </div>
              </div>
              <Link
                href="/cats"
                className="btn btn-lg bg-white text-purple-600 hover:bg-gray-100 border-0 text-lg px-8 font-black shadow-2xl hover:scale-105 transition-transform duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Rescue Cats Now
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid - Compact & Informative */}
        <div className="mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-black mb-2">Technology Stack 🔧</h2>
            <p className="text-sm opacity-70">Built with the best tools in blockchain</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="card-body p-5 items-center text-center">
                <div className="bg-purple-500 text-white rounded-xl p-3 mb-3 shadow-lg">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-purple-900 mb-2">FHE Privacy</h3>
                <p className="text-sm text-purple-800 font-medium mb-2">
                  Fully Homomorphic Encryption keeps NFT ownership completely private
                </p>
                <div className="badge badge-sm bg-purple-200 text-purple-900 border-0">Fhenix Powered</div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="card-body p-5 items-center text-center">
                <div className="bg-blue-500 text-white rounded-xl p-3 mb-3 shadow-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-blue-900 mb-2">CCIP Cross-Chain</h3>
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Seamless donations from Base to Ethereum using Chainlink CCIP
                </p>
                <div className="badge badge-sm bg-blue-200 text-blue-900 border-0">Chainlink CCIP</div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="card-body p-5 items-center text-center">
                <div className="bg-pink-500 text-white rounded-xl p-3 mb-3 shadow-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-pink-900 mb-2">Impact NFT Badges</h3>
                <p className="text-sm text-pink-800 font-medium mb-2">
                  Earn unique NFT badges as proof of your donations
                </p>
                <div className="badge badge-sm bg-pink-200 text-pink-900 border-0">On-chain Proof</div>
              </div>
            </div>
          </div>
        </div>

        {/* Built With Section */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <div className="text-xs font-bold opacity-70">BUILT WITH:</div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="badge badge-lg bg-white border-slate-300 gap-2 font-bold">🏗️ Scaffold-ETH 2</span>
              <span className="badge badge-lg bg-white border-slate-300 gap-2 font-bold">🔵 Base Mini App</span>
              <span className="badge badge-lg bg-white border-slate-300 gap-2 font-bold">🔗 Chainlink CCIP</span>
              <span className="badge badge-lg bg-white border-slate-300 gap-2 font-bold">⚡ Farcaster Frames</span>
            </div>
          </div>
        </div>

        {/* Quick Links - Compact Grid with Cat Paws */}
        <div className="card bg-base-100 border-2 border-base-300 shadow-xl mb-6">
          <div className="card-body p-5">
            <h2 className="text-xl font-black mb-4 text-center flex items-center justify-center gap-2">
              <span>🐾</span>
              <span>Explore RescueDAO</span>
              <span>🐾</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                href="/cats"
                className="btn btn-md bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 hover:scale-105 transition-transform flex-col h-auto py-4 shadow-lg"
              >
                <span className="text-2xl mb-1">🐱</span>
                <span className="font-bold text-sm">Rescue Cats</span>
              </Link>
              <Link
                href="/profile"
                className="btn btn-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 hover:scale-105 transition-transform flex-col h-auto py-4 shadow-lg"
              >
                <span className="text-2xl mb-1">👤</span>
                <span className="font-bold text-sm">My Profile</span>
              </Link>
              <Link
                href="/donations"
                className="btn btn-md bg-gradient-to-br from-green-500 to-teal-500 text-white border-0 hover:scale-105 transition-transform flex-col h-auto py-4 shadow-lg"
              >
                <span className="text-2xl mb-1">💰</span>
                <span className="font-bold text-sm">Donations</span>
              </Link>
              <Link
                href="/nfts"
                className="btn btn-md bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 hover:scale-105 transition-transform flex-col h-auto py-4 shadow-lg"
              >
                <span className="text-2xl mb-1">🎨</span>
                <span className="font-bold text-sm">NFT Badges</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Getting Started - Compact & Actionable */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="bg-blue-500 text-white rounded-full p-3 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-black text-blue-900 mb-1">Need test tokens?</h3>
              <p className="text-sm text-blue-800 font-medium">
                Get free CCIP-BnM tokens from{" "}
                <a
                  href="https://faucets.chain.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 hover:text-blue-700 underline decoration-2"
                >
                  Chainlink Faucet
                </a>{" "}
                to start rescuing cats!
              </p>
            </div>
            <a
              href="https://faucets.chain.link"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg font-bold"
            >
              Get Tokens →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
