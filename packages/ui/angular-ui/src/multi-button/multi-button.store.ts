import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { map } from 'rxjs/operators';

interface ViewModel {
    isOpen: boolean;
}

@Injectable()
export class WalletMultiButtonStore extends ComponentStore<ViewModel> {
    readonly vm$ = this.select(
        this._walletStore.wallet$,
        this._walletStore.connected$,
        this._walletStore.publicKey$.pipe(map((publicKey) => publicKey && publicKey.toBase58())),
        (wallet, connected, address) => ({ wallet, connected, address }),
        { debounce: true }
    );

    constructor(private _walletStore: WalletStore) {
        super({ isOpen: false });
    }
}
