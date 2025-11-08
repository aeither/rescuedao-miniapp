import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import type { CreateConnectorFn } from "@wagmi/core";
import { rainbowkitBurnerWallet } from "burner-connector";
import * as chains from "viem/chains";
import { baseSepolia } from "viem/chains";
import { baseAccount } from "wagmi/connectors";
import scaffoldConfig from "~~/scaffold.config";

const { onlyLocalBurnerWallet, targetNetworks } = scaffoldConfig;

const wallets = [
  metaMaskWallet,
  walletConnectWallet,
  ledgerWallet,
  coinbaseWallet,
  rainbowWallet,
  safeWallet,
  ...(!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet
    ? [rainbowkitBurnerWallet as any]
    : []),
];

/**
 * wagmi connectors for the wagmi context
 * Includes Farcaster MiniApp connector for MiniKit support
 */
export const wagmiConnectors: CreateConnectorFn[] = [
  miniAppConnector(),
  baseAccount({
    appName: "RescueDAO",
    subAccounts: {
      creation: "on-connect",
      defaultAccount: "sub",
    },
    paymasterUrls: {
      [baseSepolia.id]: process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL || "",
    },
  }),
  ...connectorsForWallets(
    [
      {
        groupName: "Supported Wallets",
        wallets,
      },
    ],

    {
      appName: "scaffold-eth-2",
      projectId: scaffoldConfig.walletConnectProjectId,
    },
  ),
];
