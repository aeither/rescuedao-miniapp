"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sdk } from "@farcaster/miniapp-sdk";
import type { NextPage } from "next";
import { BellIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

const NotificationPage: NextPage = () => {
  const [notificationStatus, setNotificationStatus] = useState<{
    enabled: boolean;
    token?: string;
    message?: string;
  }>({ enabled: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);

  useEffect(() => {
    sdk.actions.ready();
    setIsSDKReady(true);
  }, []);

  const handleAddMiniApp = async () => {
    if (!isSDKReady) {
      setNotificationStatus({
        enabled: false,
        message: "SDK not loaded yet. Please wait...",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sdk.actions.addMiniApp();

      if (result.notificationDetails) {
        // Mini app was added and notifications were enabled
        setNotificationStatus({
          enabled: true,
          token: result.notificationDetails.token,
          message: "Mini app added successfully! Notifications are enabled.",
        });
        console.log("Notification token:", result.notificationDetails.token);
      } else if (!result.notificationDetails) {
        // Mini app was added but notifications were not enabled
        setNotificationStatus({
          enabled: false,
          message: "Mini app added, but notifications were not enabled.",
        });
      } else {
        // User cancelled or something went wrong
        setNotificationStatus({
          enabled: false,
          message: "Failed to add mini app. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error adding mini app:", error);
      setNotificationStatus({
        enabled: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center flex-col grow pt-10 px-5">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <Link href="/" className="btn btn-ghost btn-sm">
            ← Back to Home
          </Link>
        </div>

        <div className="flex items-center justify-center mb-8">
          <BellIcon className="h-12 w-12 mr-3 text-primary" />
          <h1 className="text-4xl font-bold">Notification Testing</h1>
        </div>

        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Neynar Notification Integration</h2>
            <p className="text-sm opacity-70 mb-4">
              Test the notification integration by adding this mini app to your Farcaster client. Once added with
              notifications enabled, you&apos;ll be able to receive push notifications.
            </p>

            <div className="divider"></div>

            {notificationStatus.message && (
              <div className={`alert ${notificationStatus.enabled ? "alert-success" : "alert-warning"} mb-4`}>
                {notificationStatus.enabled ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <XCircleIcon className="h-6 w-6" />
                )}
                <span>{notificationStatus.message}</span>
              </div>
            )}

            {notificationStatus.token && (
              <div className="bg-base-300 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Notification Token:</h3>
                <code className="text-xs break-all block p-2 bg-base-100 rounded">{notificationStatus.token}</code>
                <p className="text-xs opacity-70 mt-2">
                  This token is used by Neynar to send notifications to this user.
                </p>
              </div>
            )}

            <button
              className={`btn btn-primary ${isLoading ? "loading" : ""}`}
              onClick={handleAddMiniApp}
              disabled={!isSDKReady || isLoading}
            >
              {isLoading ? "Adding..." : "Add Mini App & Enable Notifications"}
            </button>

            <div className="text-sm opacity-70 mt-2">{!isSDKReady && "⏳ Waiting for SDK to load..."}</div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">How to Send Notifications</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Option 1: Neynar UI</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to dev.neynar.com</li>
                  <li>Select your app</li>
                  <li>Navigate to the Mini App tab</li>
                  <li>Use the Broadcast Notification form</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Option 2: API</h3>
                <p className="text-sm mb-2">Use the Neynar SDK to send notifications programmatically:</p>
                <div className="mockup-code text-xs">
                  <pre data-prefix="$">
                    <code>npm install @neynar/nodejs-sdk</code>
                  </pre>
                  <pre data-prefix="">
                    <code></code>
                  </pre>
                  <pre data-prefix="">
                    <code>const client = new NeynarAPIClient(API_KEY);</code>
                  </pre>
                  <pre data-prefix="">
                    <code>await client.publishFrameNotifications({"{"})</code>
                  </pre>
                  <pre data-prefix="">
                    <code> targetFids: [], // empty = all users</code>
                  </pre>
                  <pre data-prefix="">
                    <code> notification: {"{"}</code>
                  </pre>
                  <pre data-prefix="">
                    <code> title: &quot;Hello!&quot;,</code>
                  </pre>
                  <pre data-prefix="">
                    <code> body: &quot;Test notification&quot;,</code>
                  </pre>
                  <pre data-prefix="">
                    <code> target_url: &quot;your-url&quot;</code>
                  </pre>
                  <pre data-prefix="">
                    <code> {"}"}</code>
                  </pre>
                  <pre data-prefix="">
                    <code>{"}"});</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Option 3: Custom API Endpoint</h3>
                <p className="text-sm mb-2">Send notifications using the built-in API endpoint:</p>
                <div className="mockup-code text-xs">
                  <pre data-prefix="$">
                    <code>
                      curl -X POST {process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/notifications/send \
                    </code>
                  </pre>
                  <pre data-prefix="">
                    <code> -H &quot;Content-Type: application/json&quot; \</code>
                  </pre>
                  <pre data-prefix="">
                    <code>{`  -d '{"}`}</code>
                  </pre>
                  <pre data-prefix="">
                    <code> &quot;targetFids&quot;: [],</code>
                  </pre>
                  <pre data-prefix="">
                    <code> &quot;notification&quot;: {"{"}</code>
                  </pre>
                  <pre data-prefix="">
                    <code> &quot;title&quot;: &quot;Hello from RescueDAO!&quot;,</code>
                  </pre>
                  <pre data-prefix="">
                    <code> &quot;body&quot;: &quot;Check out our latest update&quot;,</code>
                  </pre>
                  <pre data-prefix="">
                    <code>
                      {" "}
                      &quot;target_url&quot;: &quot;{process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}&quot;
                    </code>
                  </pre>
                  <pre data-prefix="">
                    <code> {"}"}</code>
                  </pre>
                  <pre data-prefix="">
                    <code>{`  }'`}</code>
                  </pre>
                </div>
              </div>

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
                <div className="text-sm">
                  <p className="font-semibold">Note:</p>
                  <p>
                    Make sure your Farcaster manifest includes the Neynar webhook URL. Check the manifest at{" "}
                    <code>/.well-known/farcaster.json</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const dynamic = "force-dynamic";

export default NotificationPage;
