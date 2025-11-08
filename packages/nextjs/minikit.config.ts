const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const NEYNAR_APP_ID = process.env.NEXT_PUBLIC_NEYNAR_APP_ID;

// Use Neynar webhook if app ID is configured, otherwise use custom webhook
const webhookUrl = NEYNAR_APP_ID ? `https://api.neynar.com/f/app/${NEYNAR_APP_ID}/event` : `${ROOT_URL}/api/webhook`;

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header:
      "eyJmaWQiOjIxNjM4MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxNEQxNzJDMERjNjBmQTUxNERmOTU0QTgyOGJjQzU1MkJlMzA4MTUifQ",
    payload: "eyJkb21haW4iOiJyZXNjdWVkYW8tbWluaWFwcC1uZXh0anMudmVyY2VsLmFwcCJ9",
    signature: "E6fHjZCyHSM+QjHJitLp9HSD0K3fwAw2cMxy8NzRfZ4j03u2Nn+3lthBnDxlGASFAvafzBKoeJbcLqZq6Tq7bRs=",
  },
  miniapp: {
    version: "1",
    name: "Fhenix MiniApp Demo",
    subtitle: "Privacy onchain",
    description: "Experience Fully Homomorphic Encryption powered dApps",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#011623",
    homeUrl: ROOT_URL,
    webhookUrl,
    primaryCategory: "social",
    tags: ["fhenix", "fhe", "encryption", "privacy", "defi"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Privacy onchain",
    ogTitle: "Fhenix MiniApp Demo",
    ogDescription: "Experience confidential computing powered by Fully Homomorphic Encryption",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;
