import { Component, Input } from '@angular/core';
import { Wallet } from '@solana/wallet-adapter-wallets';

@Component({
    selector: 'wallet-icon',
    template: `
        <ng-container *ngIf="wallet">
            <img [src]="wallet.icon | sanitizeUrl" alt="" />
        </ng-container>
    `,
    styles: [
        `
            :host {
                width: 1.5rem;
                height: 1.5rem;
            }

            img {
                width: inherit;
                height: inherit;
            }
        `,
    ],
})
export class WalletIconComponent {
    @Input() wallet: Wallet | null = null;
}
