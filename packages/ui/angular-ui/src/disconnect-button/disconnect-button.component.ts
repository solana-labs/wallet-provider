import { Component, ContentChild, ElementRef } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'wallet-disconnect-button',
    template: `
        <button mat-raised-button color="warn" wallet-disconnect-button [disabled]="disconnecting$ | ngrxPush">
            <div class="button-wrapper">
                <ng-content></ng-content>

                <ng-container *ngIf="!children">
                    <mat-icon>logout</mat-icon>
                    {{ innerText$ | ngrxPush }}
                </ng-container>
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
export class WalletDisconnectButtonComponent {
    @ContentChild('children') children: ElementRef | null = null;
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
