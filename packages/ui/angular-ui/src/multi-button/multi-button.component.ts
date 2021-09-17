import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { map } from 'rxjs/operators';

import { isNotNull } from '../utils';

@Component({
    selector: 'wallet-multi-button',
    template: `
        <ng-container *ngrxLet="connected$; let connected">
            <ng-container *ngrxLet="wallet$; let wallet">
                <button *ngIf="wallet === null" mat-raised-button color="primary" wallet-dialog-button>
                    Select Wallet
                </button>

                <wallet-connect-button *ngIf="!connected && wallet"></wallet-connect-button>

                <ng-container *ngIf="connected">
                    <button mat-raised-button color="primary" [matMenuTriggerFor]="walletMenu">
                        <div class="button-wrapper">
                            <wallet-icon [wallet]="wallet"></wallet-icon>
                            {{ address$ | ngrxPush | obscureAddress }}
                        </div>
                    </button>
                    <mat-menu #walletMenu="matMenu">
                        <button *ngIf="address$ | ngrxPush as address" mat-menu-item [cdkCopyToClipboard]="address">
                            <mat-icon>content_copy</mat-icon>
                            Copy address
                        </button>
                        <button mat-menu-item wallet-dialog-button>
                            <mat-icon>sync_alt</mat-icon>
                            Connect a different wallet
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item wallet-disconnect-button>
                            <mat-icon>logout</mat-icon>
                            Disconnect
                        </button>
                    </mat-menu>
                </ng-container>
            </ng-container>
        </ng-container>
    `,
    styles: [
        `
            .button-wrapper {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }

            .button-wrapper .icon {
                margin: 0;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletMultiButtonComponent {
    readonly wallet$ = this._walletStore.wallet$;
    readonly connected$ = this._walletStore.connected$;
    readonly address$ = this._walletStore.publicKey$.pipe(
        isNotNull,
        map((publicKey) => publicKey.toBase58())
    );

    constructor(private readonly _walletStore: WalletStore) {}
}
