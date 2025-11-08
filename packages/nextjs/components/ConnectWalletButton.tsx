"use client";

import { useEffect } from "react";
import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from "@coinbase/onchainkit/wallet";
import { useAccount, useSwitchChain } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

export function ConnectWalletButton() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const targetChainId = scaffoldConfig.targetNetworks[0].id;

  // Automatically switch to target chain if connected to wrong chain
  useEffect(() => {
    if (isConnected && chainId !== targetChainId) {
      switchChain?.({ chainId: targetChainId });
    }
  }, [isConnected, chainId, switchChain, targetChainId]);

  return (
    <Wallet>
      <ConnectWallet />
      <WalletDropdown>
        <Identity hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}
