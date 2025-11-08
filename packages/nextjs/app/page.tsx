"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FHECounterComponent } from "./FHECounterComponent";
import { useComposeCast, useMiniKit } from "@coinbase/onchainkit/minikit";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ConnectWalletButton } from "~~/components/ConnectWalletButton";
import { Address } from "~~/components/scaffold-eth";
import { minikitConfig } from "~~/minikit.config";

const Home: NextPage = () => {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { composeCast } = useComposeCast();
  const { address: connectedAddress, isConnected } = useAccount();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleShareApp = () => {
    const userName = context?.user?.username || "demo";
    composeCast({
      text: `Check out ${minikitConfig.miniapp.name}! 🚀`,
      embeds: [`${minikitConfig.miniapp.homeUrl}/share/${userName}`],
    });
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">
              Welcome {context?.user?.displayName ? `${context.user.displayName}!` : "to"}
            </span>
            <span className="block text-4xl font-bold mb-2">CoFHE-ETH</span>
            <a
              className="flex justify-center items-center gap-1"
              href="https://cofhe-docs.fhenix.zone/"
              target="_blank"
              rel="noreferrer"
            >
              <span className="link">Fhenix CoFHE Documentation</span>
            </a>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col mt-4 mb-4">
            <ConnectWalletButton />
            {isConnected && <p className="text-sm mt-2">Wallet Connected!</p>}
          </div>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>

          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              FHECounter.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code>
          </p>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <FHECounterComponent />
          </div>

          {/* Mini App Features */}
          <div className="mt-12 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Mini App Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/profile" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <h3 className="card-title text-lg">👤 Profile</h3>
                  <p className="text-sm opacity-70">View your Farcaster profile and connect your wallet</p>
                </div>
              </Link>
              <Link href="/notification" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <h3 className="card-title text-lg">🔔 Notifications</h3>
                  <p className="text-sm opacity-70">Enable notifications and test notification features</p>
                </div>
              </Link>
              <button
                onClick={handleShareApp}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow text-left"
              >
                <div className="card-body">
                  <h3 className="card-title text-lg">🚀 Share</h3>
                  <p className="text-sm opacity-70">Share this Mini App with your Farcaster network</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
