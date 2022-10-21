/* eslint-disable no-underscore-dangle */
import {
  BaseMessageSignerWalletAdapter,
  EventEmitter,
  SendTransactionOptions,
  WalletAccountError,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletDisconnectionError,
  WalletError,
  WalletName,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSendTransactionError,
  WalletSignMessageError,
  WalletSignTransactionError,
  WalletWindowClosedError,
  scopePollingDetectionStrategy,
} from '@solana/wallet-adapter-base';
import { Connection, PublicKey, SendOptions, Signer, Transaction, TransactionSignature } from '@solana/web3.js';

interface NitrogenWalletEvents {
    connect(...args: unknown[]): unknown;
    disconnect(...args: unknown[]): unknown;
}

interface NitrogenWallet extends EventEmitter<NitrogenWalletEvents> {
    _handleDisconnect(...args: unknown[]): unknown;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected: boolean;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    signAndSendTransaction(
        transaction: Transaction,
        options?: SendOptions
    ): Promise<{ signature: TransactionSignature }>;
    signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    isNitrogen?: boolean;
    publicKey?: { toBytes(): Uint8Array };
}

interface NitrogenWindow extends Window {
    // NOTE: If you are contributing a wallet adapter, **DO NOT COPY** this.
    // Multiple wallet adapters cannot be detected properly if they all try to write to the same window global.
    // All wallets that currently do this have committed to migrating away from using `window.solana`.
    // This must be changed to `window.yourWalletName` in your adapter, and must not use `window.solana`.
    solana?: NitrogenWallet;
}

declare const window: NitrogenWindow;

export interface NitrogenWalletAdapterConfig {}

export const NitrogenWalletName = 'Nitrogen' as WalletName;

export class NitrogenWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = NitrogenWalletName;
    url = 'https://nitrogen.app';
    // eslint-disable-next-line max-len
    icon = 'data:image/png;base64,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';

    private _connecting: boolean;
    private _wallet: NitrogenWallet | null;
    private _publicKey: PublicKey | null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
          ? WalletReadyState.Unsupported
          : WalletReadyState.NotDetected;

    constructor(config: NitrogenWalletAdapterConfig = {}) {
      super();
      this._connecting = false;
      this._wallet = null;
      this._publicKey = null;

      if (this._readyState !== WalletReadyState.Unsupported) {
        scopePollingDetectionStrategy(() => {
          if (window.solana?.isNitrogen) {
            this._readyState = WalletReadyState.Installed;
            this.emit('readyStateChange', this._readyState);
            return true;
          }
          return false;
        });
      }
    }

    get publicKey(): PublicKey | null {
      return this._publicKey;
    }

    get connecting(): boolean {
      return this._connecting;
    }

    get connected(): boolean {
      return !!this._wallet?.isConnected;
    }

    get readyState(): WalletReadyState {
      return this._readyState;
    }

    async connect(): Promise<void> {
      try {
        if (this.connected || this.connecting) return;
        if (this._readyState !== WalletReadyState.Installed) throw new WalletNotReadyError();

        this._connecting = true;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const wallet = window!.solana!;

        if (!wallet.isConnected) {
          // NOTE: If you are contributing a wallet adapter, **DO NOT COPY** this.
          // The Nitrogen adapter code has hacks because the Promise returned by `wallet.connect()` is not rejected if the user closes the window.
          // If your adapter fulfills the Promise correctly, you don't need events, or the hacky override of the private `_handleDisconnect` API.
          //
          // HACK: Nitrogen doesn't reject or emit an event if the popup is closed
          const handleDisconnect = wallet._handleDisconnect;
          try {
            await new Promise<void>((resolve, reject) => {
              const connect = () => {
                wallet.off('connect', connect);
                resolve();
              };

              wallet._handleDisconnect = (...args: unknown[]) => {
                wallet.off('connect', connect);
                reject(new WalletWindowClosedError());
                return handleDisconnect.apply(wallet, args);
              };

              wallet.on('connect', connect);

              wallet.connect().catch((reason: any) => {
                wallet.off('connect', connect);
                reject(reason);
              });
            });
          } catch (error: any) {
            if (error instanceof WalletError) throw error;
            throw new WalletConnectionError(error?.message, error);
          } finally {
            wallet._handleDisconnect = handleDisconnect;
          }
        }

        if (!wallet.publicKey) throw new WalletAccountError();

        let publicKey: PublicKey;
        try {
          publicKey = new PublicKey(wallet.publicKey.toBytes());
        } catch (error: any) {
          throw new WalletPublicKeyError(error?.message, error);
        }

        wallet.on('disconnect', this._disconnected);

        this._wallet = wallet;
        this._publicKey = publicKey;

        this.emit('connect', publicKey);
      } catch (error: any) {
        this.emit('error', error);
        throw error;
      } finally {
        this._connecting = false;
      }
    }

    async disconnect(): Promise<void> {
      const wallet = this._wallet;
      if (wallet) {
        wallet.off('disconnect', this._disconnected);

        this._wallet = null;
        this._publicKey = null;

        try {
          await wallet.disconnect();
        } catch (error: any) {
          this.emit('error', new WalletDisconnectionError(error?.message, error));
        }
      }

      this.emit('disconnect');
    }

    async sendTransaction(
      transaction: Transaction,
      connection: Connection,
      options: SendTransactionOptions = {},
    ): Promise<TransactionSignature> {
      try {
        const wallet = this._wallet;
        if (!wallet) throw new WalletNotConnectedError();

        try {
          transaction = await this.prepareTransaction(transaction, connection);

          const { signers, ...sendOptions } = options;
          if (signers?.length) {
            transaction.partialSign(...signers as Array<Signer>);
          }

          const { signature } = await wallet.signAndSendTransaction(transaction, sendOptions);
          return signature;
        } catch (error: any) {
          if (error instanceof WalletError) throw error;
          throw new WalletSendTransactionError(error?.message, error);
        }
      } catch (error: any) {
        this.emit('error', error);
        throw error;
      }
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
      try {
        const wallet = this._wallet;
        if (!wallet) throw new WalletNotConnectedError();

        try {
          return (await wallet.signTransaction(transaction)) || transaction;
        } catch (error: any) {
          throw new WalletSignTransactionError(error?.message, error);
        }
      } catch (error: any) {
        this.emit('error', error);
        throw error;
      }
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
      try {
        const wallet = this._wallet;
        if (!wallet) throw new WalletNotConnectedError();

        try {
          return (await wallet.signAllTransactions(transactions)) || transactions;
        } catch (error: any) {
          throw new WalletSignTransactionError(error?.message, error);
        }
      } catch (error: any) {
        this.emit('error', error);
        throw error;
      }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
      try {
        const wallet = this._wallet;
        if (!wallet) throw new WalletNotConnectedError();

        try {
          const { signature } = await wallet.signMessage(message);
          return signature;
        } catch (error: any) {
          throw new WalletSignMessageError(error?.message, error);
        }
      } catch (error: any) {
        this.emit('error', error);
        throw error;
      }
    }

    private _disconnected = () => {
      const wallet = this._wallet;
      if (wallet) {
        wallet.off('disconnect', this._disconnected);

        this._wallet = null;
        this._publicKey = null;

        this.emit('error', new WalletDisconnectedError());
        this.emit('disconnect');
      }
    };
}

