import { Component, OnInit } from '@angular/core';
import { ConnectionStore, WalletStore } from '@solana/wallet-adapter-angular';

import { AppStore } from './app.store';

@Component({
    selector: 'app-root',
    template: ` <app-navigation></app-navigation> `,
    styles: [],
    viewProviders: [WalletStore, ConnectionStore, AppStore],
})
export class AppComponent implements OnInit {
    constructor(private readonly _appStore: AppStore) {}

    ngOnInit(): void {
        this._appStore.notifyError();
    }
}
