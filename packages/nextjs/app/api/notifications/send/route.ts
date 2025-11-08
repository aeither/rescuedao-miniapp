import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "../../../../utils/neynar";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/send
 *
 * Send notifications to Farcaster mini app users via Neynar
 *
 * Request Body:
 * {
 *   targetFids?: number[],           // Optional: Array of FIDs to target (empty/omit = all users with notifications enabled)
 *   filters?: {                      // Optional: Filters to narrow down recipients
 *     exclude_fids?: number[],       // Exclude specific FIDs
 *     following_fid?: number,        // Only send to users following this FID
 *     minimum_user_score?: number,   // Only send to users with score >= this value
 *     near_location?: {              // Only send to users near a specific location
 *       latitude: number,
 *       longitude: number,
 *       radius?: number              // Distance in meters (optional, defaults to 50km)
 *     }
 *   },
 *   notification: {                  // Required: Notification content
 *     title: string,
 *     body: string,
 *     target_url: string
 *   }
 * }
 *
 * Example curl command:
 * curl -X POST http://localhost:3000/api/notifications/send \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "targetFids": [],
 *     "filters": {
 *       "minimum_user_score": 0.5
 *     },
 *     "notification": {
 *       "title": "🚀 RescueDAO",
 *       "body": "Check out the latest updates!",
 *       "target_url": "https://your-miniapp-domain.com/notification-destination"
 *     }
 *   }'
 */
export async function POST(request: NextRequest) {
  try {
    // Check if NEYNAR_API_KEY is set
    if (!process.env.NEYNAR_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "NEYNAR_API_KEY environment variable is not set",
        },
        { status: 500 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.notification) {
      return NextResponse.json(
        {
          success: false,
          error: "notification field is required",
        },
        { status: 400 },
      );
    }

    const { title, body: notifBody, target_url } = body.notification;

    if (!title || !notifBody || !target_url) {
      return NextResponse.json(
        {
          success: false,
          error: "notification must include title, body, and target_url",
        },
        { status: 400 },
      );
    }

    // Send notification
    const result = await sendNotification({
      targetFids: body.targetFids || [],
      filters: body.filters || {},
      notification: {
        title,
        body: notifBody,
        target_url,
      },
    });

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: "Notification sent successfully",
          data: result.data,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in /api/notifications/send:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
