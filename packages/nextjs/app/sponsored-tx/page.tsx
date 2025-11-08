"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount, useCapabilities, useSendCalls } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { getPaymasterUrl } from "~~/utils/baseAccount";

const SponsoredTransactions: NextPage = () => {
  const { isConnected } = useAccount();
  const { data: capabilities } = useCapabilities();
  const { sendCalls, isPending, data: callsId } = useSendCalls();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("0.001");

  // Use the configured target network from scaffold.config.ts
  const targetNetwork = scaffoldConfig.targetNetworks[0];
  const baseCapabilities = capabilities?.[targetNetwork.id];
  const supportsPaymaster = baseCapabilities?.paymasterService?.supported;
  const paymasterUrl = getPaymasterUrl();

  const handleSendBatchTransaction = () => {
    if (!recipientAddress) {
      alert("Please enter a recipient address");
      return;
    }

    try {
      // Example: Send batch of transactions
      sendCalls({
        calls: [
          {
            to: recipientAddress as `0x${string}`,
            value: parseEther(amount),
          },
          // You can add more transactions here for batch operations
          // Example: Approve and swap
          // {
          //   to: tokenAddress,
          //   data: encodeFunctionData({
          //     abi: erc20Abi,
          //     functionName: 'approve',
          //     args: [spenderAddress, amount]
          //   })
          // },
        ],
        chainId: targetNetwork.id,
        // Include paymaster capability if supported and URL is configured
        ...(supportsPaymaster &&
          paymasterUrl && {
            capabilities: {
              paymasterService: {
                url: paymasterUrl,
              },
            },
          }),
      });
    } catch (error) {
      console.error("Error sending batch transaction:", error);
      alert("Transaction failed. See console for details.");
    }
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-4xl">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold mb-2">Sponsored Transactions</span>
            <span className="block text-lg opacity-70">Test gasless transactions with Base Account</span>
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
              <span>Please connect your wallet to use Base Account features</span>
            </div>
          ) : (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Base Account Features</h2>

                {/* Capabilities Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Paymaster Support:</span>
                    {supportsPaymaster ? (
                      <span className="badge badge-success">Enabled (Gasless Transactions)</span>
                    ) : (
                      <span className="badge badge-ghost">Not Available</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Paymaster Configured:</span>
                    {paymasterUrl ? (
                      <span className="badge badge-success">Yes</span>
                    ) : (
                      <span className="badge badge-warning">
                        No (Add NEXT_PUBLIC_PAYMASTER_URL to enable gasless transactions)
                      </span>
                    )}
                  </div>

                  {baseCapabilities && (
                    <div className="text-xs opacity-70">
                      <details className="collapse collapse-arrow bg-base-200">
                        <summary className="collapse-title text-sm font-medium">View All Capabilities</summary>
                        <div className="collapse-content">
                          <pre className="text-xs overflow-auto">{JSON.stringify(baseCapabilities, null, 2)}</pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                <div className="divider"></div>

                {/* Batch Transaction Demo */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Send Batch Transaction</h3>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Recipient Address</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      className="input input-bordered"
                      value={recipientAddress}
                      onChange={e => setRecipientAddress(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Amount (ETH)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0.001"
                      className="input input-bordered"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary w-full"
                    onClick={handleSendBatchTransaction}
                    disabled={isPending || !recipientAddress}
                  >
                    {isPending ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Sending...
                      </>
                    ) : (
                      "Send Transaction"
                    )}
                  </button>

                  {callsId && (
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
                      <div className="flex flex-col">
                        <span>Transaction sent successfully!</span>
                        <code className="text-xs">{callsId.id}</code>
                      </div>
                    </div>
                  )}
                </div>

                <div className="alert alert-info mt-4">
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
                  <div className="text-sm">
                    {supportsPaymaster && paymasterUrl ? (
                      <span>Gas fees will be sponsored by the app paymaster</span>
                    ) : supportsPaymaster ? (
                      <span>
                        To enable gasless transactions, get a paymaster API key from{" "}
                        <a
                          href="https://docs.cdp.coinbase.com/paymaster/introduction/welcome"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link"
                        >
                          Coinbase Developer Platform
                        </a>
                      </span>
                    ) : (
                      <span>Connect with Base Account in the Base App to enable gasless transactions</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-6 bg-base-200 rounded-lg">
            <h2 className="text-xl font-bold mb-4">How it Works</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Connect your wallet using Base Account in the Coinbase Wallet</li>
              <li>Configure a paymaster URL to enable gasless transactions</li>
              <li>Send transactions without paying gas fees (sponsored by the app)</li>
              <li>Batch multiple transactions together for efficiency</li>
            </ul>
          </div>

          <div className="mt-6 p-6 bg-base-300 rounded-lg">
            <h3 className="text-lg font-bold mb-3">Setup Instructions</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>
                Get a paymaster API key from{" "}
                <a
                  href="https://docs.cdp.coinbase.com/paymaster/introduction/welcome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  Coinbase Developer Platform
                </a>
              </li>
              <li>Add the API key to your environment variables as NEXT_PUBLIC_PAYMASTER_URL</li>
              <li>Connect your wallet with Base Account support</li>
              <li>Start sending gasless transactions</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default SponsoredTransactions;
