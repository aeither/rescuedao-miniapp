import Link from "next/link";
import { Metadata } from "next";
import type { NextPage } from "next";
import { minikitConfig } from "~~/minikit.config";

interface SharePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  try {
    const { username } = await params;

    return {
      title: minikitConfig.miniapp.name,
      description: minikitConfig.miniapp.description,
      other: {
        "fc:miniapp": JSON.stringify({
          version: minikitConfig.miniapp.version,
          imageUrl: `${minikitConfig.miniapp.homeUrl}/api/og/${username}`,
          button: {
            title: `Launch ${minikitConfig.miniapp.name}`,
            action: {
              name: `Launch ${minikitConfig.miniapp.name}`,
              type: "launch_frame",
              url: `${minikitConfig.miniapp.homeUrl}`,
            },
          },
        }),
      },
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Failed to generate metadata",
        error: errorMessage,
      }),
    );

    return {
      title: minikitConfig.miniapp.name,
      description: minikitConfig.miniapp.description,
    };
  }
}

const SharePage: NextPage<SharePageProps> = async ({ params }) => {
  const { username } = await params;

  return (
    <div className="flex items-center flex-col grow pt-10 px-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <Link href="/" className="btn btn-ghost btn-sm">
            ← Back to Home
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h1 className="card-title text-4xl mb-4 justify-center">🚀 RescueDAO Mini App</h1>

            <div className="py-8">
              <p className="text-2xl mb-4">Shared by:</p>
              <p className="text-3xl font-bold text-primary">@{username}</p>
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <p className="text-lg">Experience Fully Homomorphic Encryption powered dApps on Farcaster!</p>

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
                <span>
                  This Mini App brings privacy-preserving smart contracts to Farcaster using CoFHE technology.
                </span>
              </div>

              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-2">What you can do:</h3>
                  <ul className="list-disc list-inside text-left space-y-2">
                    <li>Interact with encrypted smart contracts</li>
                    <li>Maintain privacy while using DeFi</li>
                    <li>Experience cutting-edge FHE technology</li>
                    <li>Connect your wallet seamlessly</li>
                  </ul>
                </div>
              </div>

              <Link href="/" className="btn btn-primary btn-lg w-full mt-6">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
