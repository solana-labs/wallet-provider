import { Component } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';

@Component({
    selector: 'wallet-connect-button',
    template: `
        <button *ngrxLet="wallet$; let wallet" mat-raised-button color="primary" wallet-connect-button>
            <div class="button-wrapper">
                <wallet-icon [wallet]="wallet"></wallet-icon>
                <ng-content></ng-content>
            </div>
        </button>
    `,
    styles: [
        `
            .button-wrapper {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
        `,
    ],
})
export class WalletConnectButtonComponent {
    wallet$ = this._walletStore.wallet$;

    constructor(private readonly _walletStore: WalletStore) {}
}
