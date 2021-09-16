import { Component, HostBinding, ViewEncapsulation } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';

@Component({
    selector: 'wallet-adapter-angular-ui-dialog',
    template: `
        <h2 mat-dialog-title class="mat-primary">
            <span>Select Wallet</span>
            <button mat-icon-button mat-dialog-close aria-label="Close wallet adapter selection">
                <mat-icon>close</mat-icon>
            </button>
        </h2>
        <mat-selection-list [multiple]="false">
            <mat-list-option *ngFor="let wallet of wallets$ | async" [value]="wallet">
                <div class="wrapper">
                    <p>{{ wallet.name }}</p>

                    <img [src]="wallet.icon | sanitizeUrl" [alt]="wallet.name + ' icon'" />
                </div>
            </mat-list-option>
        </mat-selection-list>
    `,
    encapsulation: ViewEncapsulation.None,
    styles: [
        `
            .host {
                display: block;
                width: 280px;
            }

            .mat-dialog-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 0 !important;
                padding: 1rem 1.5rem;
                background-color: var(--primary-color);
                color: var(--text-primary-color);
            }

            .mat-dialog-title button {
                line-height: 1;
            }

            .mat-dialog-container {
                padding: 0;
            }

            .mat-list-option {
                border-bottom: solid 1px rgb(255 255 255 / 10%);
            }

            .mat-list-option:last-child {
                border-bottom: none;
            }

            .mat-list-option .wrapper {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .mat-list-base {
                padding: 0 !important;
            }

            .mat-list-text {
                padding: 0 !important;
            }

            .mat-list-item-content {
                padding: 0;
            }

            .mat-list-option p {
                margin: 0;
            }

            .mat-list-option img {
                width: 1.5rem;
                height: 1.5rem;
            }
        `,
    ],
})
export class WalletAdapterAngularUiDialogComponent {
    @HostBinding('class') class = 'host';
    wallets$ = this.walletStore.wallets$;

    constructor(private walletStore: WalletStore) {}
}
