import { ChangeDetectionStrategy, Component, ContentChild, ElementRef, Input } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { ButtonColor } from '../shared/types';

@Component({
    selector: 'wallet-connect-button',
    template: `
        <button
            *ngrxLet="wallet$; let wallet"
            mat-raised-button
            wallet-connect-button
            [color]="color"
            [disabled]="disabled || (connecting$ | ngrxPush) || !wallet || (connected$ | ngrxPush)"
        >
            <ng-content></ng-content>
            <div class="button-content" *ngIf="!children">
                <wallet-icon *ngIf="wallet" [wallet]="wallet"></wallet-icon>
                {{ innerText$ | ngrxPush }}
            </div>
        </button>
    `,
    styles: [
        `
            button {
                display: inline-block;
            }

            .button-content {
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
    @Input() color: ButtonColor = 'primary';
    @Input() disabled = false;
    readonly wallet$ = this._walletStore.wallet$;
    readonly connecting$ = this._walletStore.connecting$;
    readonly connected$ = this._walletStore.connected$;
    readonly innerText$ = combineLatest([this.connecting$, this.connected$, this.wallet$]).pipe(
        map(([connecting, connected, wallet]) => {
            if (connecting) return 'Connecting...';
            if (connected) return 'Connected';
            if (wallet) return 'Connect';
            return 'Connect Wallet';
        })
    );

    constructor(private readonly _walletStore: WalletStore) {}
}
