import { SafeArea } from "@coinbase/onchainkit/minikit";
import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { minikitConfig } from "~~/minikit.config";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata = getMetadata({ title: "Scaffold-ETH 2 App", description: "Built with 🏗 Scaffold-ETH 2" });

  return {
    ...baseMetadata,
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: ` ${minikitConfig.miniapp.name}`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
    },
  };
}

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            <SafeArea>{children}</SafeArea>
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
