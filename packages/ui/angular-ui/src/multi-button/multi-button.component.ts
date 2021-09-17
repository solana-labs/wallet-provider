import { Component } from '@angular/core';
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

                <button *ngIf="wallet && !connected" mat-raised-button color="primary" wallet-connect-button>
                    <div class="button-wrapper">
                        <wallet-icon [wallet]="wallet"></wallet-icon>
                        Connect
                    </div>
                </button>

                <ng-container *ngIf="connected">
                    <button mat-raised-button color="primary" [matMenuTriggerFor]="walletMenu">
                        <div class="button-wrapper">
                            <wallet-icon [wallet]="wallet"></wallet-icon>
                            {{ address$ | async | obscureAddress }}
                        </div>
                    </button>
                    <mat-menu #walletMenu="matMenu">
                        <button *ngIf="address$ | async as address" mat-menu-item [cdkCopyToClipboard]="address">
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
})
export class WalletMultiButtonComponent {
    wallet$ = this._walletStore.wallet$;
    connected$ = this._walletStore.connected$;
    address$ = this._walletStore.publicKey$.pipe(
        isNotNull,
        map((publicKey) => publicKey.toBase58())
    );

    constructor(private _walletStore: WalletStore) {}
}
