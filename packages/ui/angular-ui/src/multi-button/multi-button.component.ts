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
                    <div class="button-wrapper">
                        <wallet-icon [wallet]="wallet"></wallet-icon>
                        Connect
                    </div>
                </button>

                <button *ngIf="connected" mat-raised-button color="primary">
                    <div class="button-wrapper">
                        <wallet-icon [wallet]="wallet"></wallet-icon>
                        {{ address$ | async | obscureAddress }}
                    </div>
                </button>
            </ng-container>
        </ng-container>
    `,
    styles: [
        `
            .button-wrapper {
                display: flex;
                justify-content: center;
                gap: 0.5rem;
                align-items: center;
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
