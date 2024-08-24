import type { WalletName } from '@solana/wallet-adapter-base';
import React from 'react';
import { Button } from './Button.js';
import { WalletIcon } from './WalletIcon.js';

type Props = React.ComponentProps<typeof Button> & {
    walletIcon?: string;
    walletName?: WalletName;
};

export function BaseWalletConnectionButton({ walletIcon, walletName, className, ...props }: Props) {
    return (
        <Button
            {...props}
            className={`wallet-adapter-button-trigger ${className || ''}`}
            startIcon={
                walletIcon && walletName ? (
                    <WalletIcon wallet={{ adapter: { icon: walletIcon, name: walletName } }} />
                ) : undefined
            }
        />
    );
}
