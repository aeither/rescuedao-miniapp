import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";

/**
 * Get Neynar API client instance
 */
const getNeynarClient = () => {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    throw new Error("NEYNAR_API_KEY environment variable is not set");
  }
  return new NeynarAPIClient(new Configuration({ apiKey }));
};

/**
 * Parameters for sending a notification via Neynar
 */
export interface SendNotificationParams {
  /**
   * Array of FIDs to target. If empty, sends to all users with notifications enabled.
   */
  targetFids?: number[];

  /**
   * Filters to narrow down recipients
   */
  filters?: {
    /**
     * Exclude specific FIDs
     */
    exclude_fids?: number[];

    /**
     * Only send to users following this FID
     */
    following_fid?: number;

    /**
     * Only send to users with score >= this value (0-1)
     */
    minimum_user_score?: number;

    /**
     * Only send to users near a specific location
     */
    near_location?: {
      latitude: number;
      longitude: number;
      /**
       * Distance in meters (optional, defaults to 50km)
       */
      radius?: number;
    };
  };

  /**
   * Notification content
   */
  notification: {
    /**
     * Notification title
     */
    title: string;

    /**
     * Notification body
     */
    body: string;

    /**
     * URL to open when notification is clicked
     */
    target_url: string;
  };
}

/**
 * Send a notification to Farcaster mini app users via Neynar
 *
 * @example
 * // Send to all users
 * await sendNotification({
 *   targetFids: [],
 *   notification: {
 *     title: "Hello!",
 *     body: "Check out our latest update",
 *     target_url: "https://your-app.com/update"
 *   }
 * });
 *
 * @example
 * // Send to specific users with filters
 * await sendNotification({
 *   targetFids: [123, 456],
 *   filters: {
 *     minimum_user_score: 0.5
 *   },
 *   notification: {
 *     title: "Premium Feature",
 *     body: "New feature for engaged users",
 *     target_url: "https://your-app.com/premium"
 *   }
 * });
 */
export async function sendNotification({ targetFids = [], filters = {}, notification }: SendNotificationParams) {
  try {
    const client = getNeynarClient();

    const response = await client.publishFrameNotifications({
      targetFids,
      filters,
      notification,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
