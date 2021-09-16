import { Component } from '@angular/core';
import { ConnectionStore, WALLET_CONFIG, WalletStore } from '@solana/wallet-adapter-angular';
import {
    getBloctoWallet,
    getLedgerWallet,
    getPhantomWallet,
    getSlopeWallet,
    getSolflareWallet,
    getSolletExtensionWallet,
    getSolletWallet,
    getTorusWallet,
} from '@solana/wallet-adapter-wallets';

@Component({
    selector: 'app-root',
    template: ` <app-navigation></app-navigation> `,
    styles: [],
    providers: [
        {
            provide: WALLET_CONFIG,
            useValue: {
                wallets: [
                    getPhantomWallet(),
                    getSolflareWallet(),
                    getSlopeWallet(),
                    getTorusWallet({
                        options: { clientId: 'Get a client ID @ https://developer.tor.us' },
                    }),
                    getLedgerWallet(),
                    getBloctoWallet(),
                    getSolletWallet(),
                    getSolletExtensionWallet(),
                ],
            },
        },
        WalletStore,
        ConnectionStore,
    ],
})
export class AppComponent {}
