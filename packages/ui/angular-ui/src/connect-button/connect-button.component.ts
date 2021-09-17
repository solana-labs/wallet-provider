import { ChangeDetectionStrategy, Component, ContentChild, ElementRef } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'wallet-connect-button',
    template: `
        <button
            *ngrxLet="wallet$; let wallet"
            mat-raised-button
            color="primary"
            wallet-connect-button
            [disabled]="connecting$ | ngrxPush"
        >
            <div class="button-wrapper">
                <ng-content></ng-content>

                <ng-container *ngIf="!children">
                    <wallet-icon *ngIf="wallet" [wallet]="wallet"></wallet-icon>
                    {{ innerText$ | ngrxPush }}
                </ng-container>
            </div>
        </button>
    `,
    styles: [
        `
            button {
                display: inline-block;
            }

            .button-wrapper {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletConnectButtonComponent {
    @ContentChild('children') children: ElementRef | null = null;
    readonly innerText$ = combineLatest([
        this._walletStore.connecting$,
        this._walletStore.connected$,
        this._walletStore.wallet$,
    ]).pipe(
        map(([connecting, connected, wallet]) => {
            if (connecting) return 'Connecting...';
            if (connected) return 'Connected';
            if (wallet) return 'Connect';
            return 'Connect Wallet';
        })
    );
    readonly wallet$ = this._walletStore.wallet$;
    readonly connecting$ = this._walletStore.connecting$;

    constructor(private readonly _walletStore: WalletStore) {}
}
