import { Directive, HostListener } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';

@Directive({ selector: 'button[wallet-disconnect-button]' })
export class WalletDisconnectButtonDirective {
    @HostListener('click') onClick(): void {
        this._walletStore.disconnect().subscribe();
    }

    constructor(private _walletStore: WalletStore) {}
}
