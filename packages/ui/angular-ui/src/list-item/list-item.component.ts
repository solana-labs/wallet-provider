import { Component, Input } from '@angular/core';
import { Wallet } from '@solana/wallet-adapter-wallets';

@Component({
    selector: 'wallet-adapter-angular-ui-list-item',
    template: `
        <ng-container *ngIf="wallet">
            <p>{{ wallet.name }}</p>

            <img [src]="wallet.icon | sanitizeUrl" [alt]="wallet.name + ' icon'" />
        </ng-container>
    `,
    styles: [
        `
            :host {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            p {
                margin: 0;
            }

            img {
                width: 1.5rem;
                height: 1.5rem;
            }
        `,
    ],
})
export class WalletAdapterAngularUiListItemComponent {
    @Input() wallet: Wallet | null = null;
}
