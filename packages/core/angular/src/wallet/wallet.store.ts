import { Inject, Injectable, Optional } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import {
    SendTransactionOptions,
    WalletAdapter,
    WalletNotConnectedError,
    WalletNotReadyError,
} from '@solana/wallet-adapter-base';
import { Wallet, WalletName } from '@solana/wallet-adapter-wallets';
import { Connection, Transaction } from '@solana/web3.js';
import { combineLatest, defer, EMPTY, from, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, concatMap, filter, finalize, first, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { fromAdapterEvent, isNotNull } from '../operators';
import { LocalStorageService } from './local-storage';
import { WalletNotSelectedError } from './wallet.errors';
import { signAllTransactions, signMessage, signTransaction } from './wallet.signer';
import { WALLET_CONFIG } from './wallet.tokens';
import { WalletConfig, WalletState } from './wallet.types';

export const WALLET_DEFAULT_CONFIG: WalletConfig = {
    wallets: [],
    autoConnect: false,
    localStorageKey: 'walletName',
};

const initialState: {
    wallet: Wallet | null;
    adapter: ReturnType<Wallet['adapter']> | null;
} & Pick<WalletAdapter, 'ready' | 'publicKey' | 'connected'> = {
    wallet: null,
    adapter: null,
    ready: false,
    publicKey: null,
    connected: false,
};

@Injectable()
export class WalletStore extends ComponentStore<WalletState> {
    private readonly _error = new Subject();
    private readonly _name = new LocalStorageService<WalletName | null>(
        this._config?.localStorageKey || 'walletName',
        null
    );
    readonly wallets$ = this.select((state) => state.wallets);
    readonly autoConnect$ = this.select((state) => state.autoConnect);
    readonly wallet$ = this.select((state) => state.wallet);
    readonly adapter$ = this.select((state) => state.adapter);
    readonly publicKey$ = this.select((state) => state.publicKey);
    readonly ready$ = this.select((state) => state.ready);
    readonly connecting$ = this.select((state) => state.connecting);
    readonly disconnecting$ = this.select((state) => state.disconnecting);
    readonly connected$ = this.select((state) => state.connected);
    readonly name$ = this._name.value$;
    readonly error$ = this._error.asObservable();
    readonly anchorWallet$ = this.select(
        this.publicKey$,
        this.adapter$,
        this.connected$,
        (publicKey, adapter, connected) => {
            const adapterSignTransaction =
                adapter && 'signTransaction' in adapter ? signTransaction(adapter, connected, this._error) : undefined;
            const adapterSignAllTransactions =
                adapter && 'signAllTransactions' in adapter
                    ? signAllTransactions(adapter, connected, this._error)
                    : undefined;

            return publicKey && adapterSignTransaction && adapterSignAllTransactions
                ? {
                      publicKey,
                      signTransaction: (transaction: Transaction) => adapterSignTransaction(transaction).toPromise(),
                      signAllTransactions: (transactions: Transaction[]) =>
                          adapterSignAllTransactions(transactions).toPromise(),
                  }
                : undefined;
        },
        { debounce: true }
    );

    // Map of wallet names to wallets
    private readonly _walletsByName$ = this.select(this.wallets$, (wallets) =>
        wallets.reduce((walletsByName, wallet) => {
            walletsByName[wallet.name] = wallet;
            return walletsByName;
        }, {} as { [name in WalletName]: Wallet })
    );

    constructor(
        @Optional()
        @Inject(WALLET_CONFIG)
        private _config: WalletConfig
    ) {
        super();

        this._config = {
            ...WALLET_DEFAULT_CONFIG,
            ...this._config,
        };

        this.setState({
            ...initialState,
            wallets: this._config?.wallets || [],
            connecting: false,
            disconnecting: false,
            autoConnect: this._config?.autoConnect || false,
        });
    }

    // When the selected wallet changes, initialize the state
    readonly onWalletChanged = this.effect(() =>
        combineLatest([this.name$, this._walletsByName$]).pipe(
            tap(([name, walletsByName]) => {
                const wallet = (name && walletsByName[name]) || null;
                const adapter = wallet && wallet.adapter();

                if (adapter) {
                    const { ready, publicKey, connected } = adapter;
                    this.patchState({
                        adapter,
                        wallet,
                        ready,
                        publicKey,
                        connected,
                    });
                } else {
                    this.patchState(initialState);
                }
            })
        )
    );

    // If autoConnect is enabled, try to connect when the adapter changes and is ready
    readonly autoConnect = this.effect(() => {
        return combineLatest([
            this.autoConnect$,
            this.adapter$.pipe(isNotNull),
            this.ready$,
            this.connecting$,
            this.connected$,
        ]).pipe(
            filter(
                ([autoConnect, , ready, connecting, connected]) => autoConnect && ready && !connecting && !connected
            ),
            concatMap(([, adapter]) => {
                this.patchState({ connecting: true });
                return from(defer(() => adapter.connect())).pipe(
                    catchError(() => {
                        // Clear the selected wallet
                        this._name.setItem(null);
                        // Don't throw error, but onError will still be called
                        return of(null);
                    }),
                    finalize(() => this.patchState({ connecting: false }))
                );
            })
        );
    });

    // Select a wallet by name
    readonly selectWallet = this.effect((newName$: Observable<WalletName | null>) => {
        return newName$.pipe(
            concatMap((action) => of(action).pipe(withLatestFrom(this.name$, this.adapter$))),
            filter(([newName, name]) => newName !== name),
            concatMap(([newName, , adapter]) => {
                if (!adapter) {
                    return of(newName);
                } else {
                    return from(defer(() => adapter.disconnect())).pipe(
                        map(() => newName),
                        catchError(() => EMPTY)
                    );
                }
            }),
            tap((newName) => this._name.setItem(newName))
        );
    });

    // Handle the adapter's ready event
    readonly onReady = this.effect(() => {
        return this.adapter$.pipe(
            isNotNull,
            switchMap((adapter) => fromAdapterEvent(adapter, 'ready').pipe(tap(() => this.patchState({ ready: true }))))
        );
    });

    // Handle the adapter's connect event
    readonly onConnect = this.effect(() => {
        return this.adapter$.pipe(
            isNotNull,
            switchMap((adapter) =>
                fromAdapterEvent(adapter, 'connect').pipe(
                    tap(() => {
                        const { connected, publicKey, ready } = adapter;

                        this.patchState({
                            connected,
                            publicKey,
                            ready,
                        });
                    })
                )
            )
        );
    });

    // Handle the adapter's disconnect event
    readonly onDisconnect = this.effect(() => {
        return this.adapter$.pipe(
            isNotNull,
            switchMap((adapter) => fromAdapterEvent(adapter, 'disconnect').pipe(tap(() => this._name.setItem(null))))
        );
    });

    // Handle the adapter's error event
    readonly onError = this.effect(() => {
        return this.adapter$.pipe(
            isNotNull,
            switchMap((adapter) => fromAdapterEvent(adapter, 'error').pipe(tap((error) => this._error.next(error))))
        );
    });

    // Connect the adapter to the wallet
    connect(): Observable<void> {
        return combineLatest([
            this.connecting$,
            this.disconnecting$,
            this.connected$,
            this.wallet$,
            this.adapter$,
            this.ready$,
        ]).pipe(
            first(),
            filter(([connecting, disconnecting, connected]) => !connected && !connecting && !disconnecting),
            concatMap(([, , , wallet, adapter, ready]) => {
                if (!wallet || !adapter) {
                    const error = new WalletNotSelectedError();
                    this._error.next(error);
                    return throwError(error);
                }

                if (!ready) {
                    this._name.setItem(null);

                    if (typeof window !== 'undefined') {
                        window.open(wallet.url, '_blank');
                    }

                    const error = new WalletNotReadyError();
                    this._error.next(error);
                    return throwError(error);
                }

                this.patchState({ connecting: true });

                return from(defer(() => adapter.connect())).pipe(
                    catchError((error) => {
                        this._name.setItem(null);
                        return throwError(error);
                    }),
                    finalize(() => this.patchState({ connecting: false }))
                );
            })
        );
    }

    // Disconnect the adapter from the wallet
    disconnect(): Observable<void> {
        return combineLatest([this.disconnecting$, this.adapter$]).pipe(
            first(),
            filter(([disconnecting]) => !disconnecting),
            concatMap(([, adapter]) => {
                if (!adapter) {
                    this._name.setItem(null);
                    return EMPTY;
                } else {
                    this.patchState({ disconnecting: true });
                    return from(defer(() => adapter.disconnect())).pipe(
                        finalize(() => {
                            this._name.setItem(null);
                            this.patchState({ disconnecting: false });
                        })
                    );
                }
            })
        );
    }

    // Send a transaction using the provided connection
    sendTransaction(
        transaction: Transaction,
        connection: Connection,
        options?: SendTransactionOptions
    ): Observable<string> {
        return combineLatest([this.adapter$, this.connected$]).pipe(
            first(),
            concatMap(([adapter, connected]) => {
                if (!adapter) {
                    const error = new WalletNotSelectedError();
                    this._error.next(error);
                    return throwError(error);
                }

                if (!connected) {
                    const error = new WalletNotConnectedError();
                    this._error.next(error);
                    return throwError(error);
                }

                return from(defer(() => adapter.sendTransaction(transaction, connection, options)));
            })
        );
    }

    // Sign a transaction if the wallet supports it
    signTransaction(transaction: Transaction): Observable<Transaction> | undefined {
        const { adapter, connected } = this.get();

        return adapter && 'signTransaction' in adapter
            ? signTransaction(adapter, connected, this._error)(transaction)
            : undefined;
    }

    // Sign multiple transactions if the wallet supports it
    signAllTransactions(transactions: Transaction[]): Observable<Transaction[]> | undefined {
        const { adapter, connected } = this.get();

        return adapter && 'signAllTransactions' in adapter
            ? signAllTransactions(adapter, connected, this._error)(transactions)
            : undefined;
    }

    // Sign an arbitrary message if the wallet supports it
    signMessage(message: Uint8Array): Observable<Uint8Array> | undefined {
        const { adapter, connected } = this.get();

        return adapter && 'signMessage' in adapter ? signMessage(adapter, connected, this._error)(message) : undefined;
    }
}
