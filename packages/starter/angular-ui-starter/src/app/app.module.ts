import { NgModule } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConnectionStore, WalletStore, WALLET_CONFIG } from '@solana/wallet-adapter-angular';
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

import { AppComponent } from './app.component';
import { NavigationModule } from './navigation/navigation.module';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, BrowserAnimationsModule, MatSnackBarModule, NavigationModule],
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
                autoConnect: true,
            },
        },
        WalletStore,
        ConnectionStore,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
