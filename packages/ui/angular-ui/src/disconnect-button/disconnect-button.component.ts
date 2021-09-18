import { Component, ContentChild, ElementRef, Input } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { ButtonColor } from '../shared/types';

@Component({
    selector: 'wallet-disconnect-button',
    template: `
        <button
            mat-raised-button
            wallet-disconnect-button
            [color]="color"
            [disabled]="disabled || (disconnecting$ | ngrxPush) || (wallet$ | ngrxPush) === null"
        >
            <ng-content></ng-content>
            <div class="button-content" *ngIf="!children">
                <mat-icon>logout</mat-icon>
                {{ innerText$ | ngrxPush }}
            </div>
        </button>
    `,
    styles: [
        `
            .button-content {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
        `,
    ],
})
export class WalletDisconnectButtonComponent {
    @ContentChild('children') children: ElementRef | null = null;
    @Input() color: ButtonColor = 'primary';
    @Input() disabled = false;
    readonly innerText$ = combineLatest([this._walletStore.disconnecting$, this._walletStore.wallet$]).pipe(
        map(([disconnecting, wallet]) => {
            if (disconnecting) return 'Disconnecting ...';
            if (wallet) return 'Disconnect';
            return 'Disconnect Wallet';
        })
    );
    readonly wallet$ = this._walletStore.wallet$;
    readonly disconnecting$ = this._walletStore.disconnecting$;

    constructor(private readonly _walletStore: WalletStore) {}
}
