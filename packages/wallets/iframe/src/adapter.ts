import type { WalletName } from '@solana/wallet-adapter-base';
import {
    BaseMessageSignerWalletAdapter,
    scopePollingDetectionStrategy,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletNotConnectedError,
    WalletReadyState,
    WalletSignMessageError,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import type { TransactionVersion, VersionedTransaction } from '@solana/web3.js';
import { PublicKey, Transaction } from '@solana/web3.js';

export const IframeWalletName = 'Iframe Wallet' as WalletName<'Iframe Wallet'>;

type MessageType = 'install' | 'connect' | 'disconnect' | 'signMessage' | 'signTransaction';
const MESSAGE_TARGET = 'iframe-wallet-adapter';

interface WalletMessage {
    target: string;
    id: string;
    type: MessageType;
    payload?: any;
}

export class IframeWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = IframeWalletName;
    icon =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iMzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zNCAxMC42djIuN2wtOS41IDE2LjVoLTQuNmw2LTEwLjVhMi4xIDIuMSAwIDEgMCAyLTMuNGw0LjgtOC4zYTQgNCAwIDAgMSAxLjMgM1ptLTQuMyAxOS4xaC0uNmw0LjktOC40djQuMmMwIDIuMy0yIDQuMy00LjMgNC4zWm0yLTI4LjRjLS4zLS44LTEtMS4zLTItMS4zaC0xLjlsLTIuNCA0LjNIMzBsMS43LTNabS0zIDVoLTQuNkwxMC42IDI5LjhoNC43TDI4LjggNi40Wk0xOC43IDBoNC42bC0yLjUgNC4zaC00LjZMMTguNiAwWk0xNSA2LjRoNC42TDYgMjkuOEg0LjJjLS44IDAtMS43LS4zLTIuNC0uOEwxNSA2LjRaTTE0IDBIOS40TDcgNC4zaDQuNkwxNCAwWm0tMy42IDYuNEg1LjdMMCAxNi4ydjhMMTAuMyA2LjRaTTQuMyAwaC40TDAgOC4ydi00QzAgMiAxLjkgMCA0LjMgMFoiIGZpbGw9IiM5OTQ1RkYiLz48L3N2Zz4=';
    url = 'https://github.com/anza-xyz/wallet-adapter';
    supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(['legacy', 0]);

    private _connecting: boolean;
    private _publicKey: PublicKey | null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined' || window.parent === window
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;
    private _messageHandlers: Map<string, (response: any) => void>;

    constructor(name?: string, icon?: string, url?: string) {
        super();
        if (name) {
            this.name = name as WalletName<'Iframe Wallet'>;
        }
        if (icon) {
            this.icon = icon;
        }
        if (url) {
            this.url = url;
        }
        this._connecting = false;
        this._publicKey = null;
        this._messageHandlers = new Map();
        if (this._readyState !== WalletReadyState.Unsupported) {
            window.addEventListener('message', this._handleMessage);
            scopePollingDetectionStrategy(() => {
                if (this._readyState === WalletReadyState.Installed) {
                    return true;
                }
                this._sendMessage('install')
                    .then(() => {
                        this._readyState = WalletReadyState.Installed;
                        this.emit('readyStateChange', this._readyState);
                    })
                    .catch(() => {
                        // skip
                    });
                return false;
            });
        }
    }

    get publicKey() {
        return this._publicKey;
    }

    get connecting() {
        return this._connecting;
    }

    get readyState() {
        return this._readyState;
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) {
                return;
            }
            this._connecting = true;
            const response = await this._sendMessage('connect');
            if (response.error) {
                throw new WalletConnectionError(response.error);
            }
            this._publicKey = new PublicKey(response.publicKey);
            this.emit('connect', this._publicKey);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wasConnected = this.connected;
        this._publicKey = null;
        try {
            await this._sendMessage('disconnect');
        } catch (error: any) {
            this.emit('error', new WalletDisconnectionError(error?.message, error));
        }
        if (wasConnected) {
            this.emit('disconnect');
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            if (!this.connected) {
                throw new WalletNotConnectedError();
            }

            const response = await this._sendMessage('signMessage', {
                message: Array.from(message),
            });

            if (response.error) {
                throw new WalletSignMessageError(response.error);
            }

            return new Uint8Array(response.signature);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        try {
            if (!this.connected) {
                throw new WalletNotConnectedError();
            }

            const response = await this._sendMessage('signTransaction', {
                transaction: Array.from(transaction.serialize({ verifySignatures: false })),
            });

            if (response.error) {
                throw new WalletSignTransactionError(response.error);
            }

            return Transaction.from(response.signedTransaction) as T;
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    private _handleMessage = (event: MessageEvent) => {
        const message = event.data as WalletMessage;
        if (message.target !== MESSAGE_TARGET) {
            return;
        }

        const handler = this._messageHandlers.get(message.id);
        if (handler) {
            handler(message.payload);
            this._messageHandlers.delete(message.id);
        }
    };

    private async _sendMessage(type: MessageType, payload?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(8);
            const message: WalletMessage = { target: MESSAGE_TARGET, type, payload, id };

            this._messageHandlers.set(id, resolve);
            window.parent.postMessage(message, '*');

            setTimeout(() => {
                this._messageHandlers.delete(id);
                reject(new Error('Request timeout'));
            }, 10_000);
        });
    }
}
