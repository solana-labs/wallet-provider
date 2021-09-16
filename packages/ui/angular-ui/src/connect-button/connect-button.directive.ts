import { Directive, HostListener } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';

@Directive({ selector: 'button[wallet-connect-button]' })
export class WalletConnectButtonDirective {
    @HostListener('click') onClick(): void {
        this._walletStore.connect().subscribe();
    }

    constructor(private _walletStore: WalletStore) {}
}
