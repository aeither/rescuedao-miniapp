"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sdk } from "@farcaster/miniapp-sdk";
import type { NextPage } from "next";
import { ConnectWalletButton } from "~~/components/ConnectWalletButton";

interface UserContext {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

const Profile: NextPage = () => {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserContext = async () => {
      try {
        // Get the context from the SDK
        const context = await sdk.context;

        if (context?.user) {
          setUserContext({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          });
        } else {
          setError("No user context available. This page should be accessed from within a Farcaster client.");
        }
      } catch (err) {
        console.error("Error fetching user context:", err);
        setError("Failed to load user context. Make sure you're running this as a mini app.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserContext();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <div className="alert alert-error">
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
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
          <Link href="/" className="btn btn-primary mt-4">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col grow pt-10 px-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <Link href="/" className="btn btn-ghost btn-sm">
            ← Back to Home
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl mb-6">Profile</h1>

            {userContext && (
              <div className="space-y-6">
                {/* Profile Picture */}
                {userContext.pfpUrl && (
                  <div className="flex justify-center">
                    <div className="avatar">
                      <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <Image
                          src={userContext.pfpUrl}
                          alt={userContext.displayName || userContext.username || "Profile picture"}
                          width={128}
                          height={128}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Display Name */}
                {userContext.displayName && (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{userContext.displayName}</h2>
                  </div>
                )}

                {/* User Details */}
                <div className="space-y-4">
                  {userContext.username && (
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold text-sm opacity-70">Username</label>
                      <div className="p-4 bg-base-200 rounded-lg">
                        <code className="text-lg">@{userContext.username}</code>
                      </div>
                    </div>
                  )}

                  {userContext.fid && (
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold text-sm opacity-70">Farcaster ID (FID)</label>
                      <div className="p-4 bg-base-200 rounded-lg">
                        <code className="text-lg">{userContext.fid}</code>
                      </div>
                    </div>
                  )}

                  {userContext.pfpUrl && (
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold text-sm opacity-70">Profile Picture URL</label>
                      <div className="p-4 bg-base-200 rounded-lg break-all">
                        <code className="text-sm">{userContext.pfpUrl}</code>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Connection */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-sm opacity-70">Wallet Connection</label>
                  <div className="flex justify-center">
                    <ConnectWalletButton />
                  </div>
                </div>

                {/* Additional Info Card */}
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
                    ></path>
                  </svg>
                  <span>This information is provided by the Farcaster Mini App SDK</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
