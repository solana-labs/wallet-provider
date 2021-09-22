import { Wallet, WalletName } from '@solana/wallet-adapter-wallets';
import { PublicKey } from '@solana/web3.js';

export interface WalletState {
    wallets: Wallet[];
    wallet: Wallet | null;
    adapter: ReturnType<Wallet['adapter']> | null;
    connecting: boolean;
    disconnecting: boolean;
    connected: boolean;
    ready: boolean;
    publicKey: PublicKey | null;
    autoConnect: boolean;
}

export interface WalletConfig {
    wallets: Wallet[];
    localStorageKey?: string;
    autoConnect?: boolean;
    onError?: (error: unknown) => void;
}
