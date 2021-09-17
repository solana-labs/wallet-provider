import { ChangeDetectionStrategy, Component, ViewContainerRef } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { map } from 'rxjs/operators';

import { isNotNull } from '../shared/operators';

@Component({
    selector: 'wallet-multi-button',
    template: `
        <ng-container *ngrxLet="wallet$; let wallet">
            <ng-container *ngrxLet="connected$; let connected">
                <wallet-dialog-button
                    *ngIf="wallet === null"
                    [viewContainerRef]="viewContainerRef"
                ></wallet-dialog-button>
                <wallet-connect-button *ngIf="!connected && wallet"></wallet-connect-button>

                <ng-container *ngIf="connected">
                    <button mat-raised-button color="primary" [matMenuTriggerFor]="walletMenu">
                        <div class="button-content">
                            <wallet-icon [wallet]="wallet"></wallet-icon>
                            {{ address$ | ngrxPush | obscureAddress }}
                        </div>
                    </button>
                    <mat-menu #walletMenu="matMenu">
                        <button *ngIf="address$ | ngrxPush as address" mat-menu-item [cdkCopyToClipboard]="address">
                            <mat-icon>content_copy</mat-icon>
                            Copy address
                        </button>
                        <button mat-menu-item [wallet-dialog-button]="viewContainerRef">
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
            .button-content {
                display: flex;
                gap: 0.5rem;
                align-items: center;
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

    constructor(public viewContainerRef: ViewContainerRef, private readonly _walletStore: WalletStore) {}
}
