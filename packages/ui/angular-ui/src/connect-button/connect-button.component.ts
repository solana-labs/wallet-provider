import { Component } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';

@Component({
    selector: 'wallet-connect-button',
    template: `
        <ng-container *ngrxLet="wallet$; let wallet">
            <button *ngIf="wallet !== null" mat-raised-button color="primary" (click)="onConnect()">
                <div class="button-wrapper">
                    <wallet-icon [wallet]="wallet"></wallet-icon>
                    <ng-content></ng-content>
                </div>
            </button>
        </ng-container>
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

    onConnect(): void {
        this._walletStore.connect().subscribe();
    }
}
