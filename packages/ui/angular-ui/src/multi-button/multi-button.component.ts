import { Component } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { map } from 'rxjs/operators';

@Component({
    selector: 'wallet-multi-button',
    template: `
        <ng-container *ngrxLet="connected$; let connected">
            <ng-container *ngrxLet="wallet$; let wallet">
                <button *ngIf="wallet === null" mat-raised-button color="primary" wallet-dialog-button>
                    Select Wallet
                </button>

                <button *ngIf="wallet && !connected" mat-raised-button color="primary" wallet-connect-button>
                    <img [src]="wallet.icon | sanitizeUrl" alt="" />
                    Connect
                </button>

                <button *ngIf="connected" mat-raised-button color="primary">
                    {{ address$ | async | obscureAddress }}
                </button>
            </ng-container>
        </ng-container>
    `,
    styles: [
        `
            button img {
                width: 1.5rem;
                height: 1.5rem;
            }
        `,
    ],
})
export class WalletMultiButtonComponent {
    wallet$ = this._walletStore.wallet$;
    connected$ = this._walletStore.connected$;
    address$ = this._walletStore.publicKey$.pipe(map((publicKey) => publicKey && publicKey.toBase58()));

    constructor(private _walletStore: WalletStore) {}
}
