import { ChangeDetectionStrategy, Component, ContentChild, ElementRef, Input } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { map } from 'rxjs/operators';

import { ButtonColor } from '../shared/types';

@Component({
    selector: 'wallet-multi-button',
    template: `
        <wallet-dialog-button *ngIf="(wallet$ | ngrxPush) === null" [color]="color"></wallet-dialog-button>
        <wallet-connect-button
            *ngIf="(connected$ | ngrxPush) === false && (wallet$ | ngrxPush)"
            [color]="color"
        ></wallet-connect-button>

        <ng-container *ngIf="connected$ | ngrxPush">
            <button mat-raised-button [color]="color" [matMenuTriggerFor]="walletMenu">
                <ng-content></ng-content>
                <div class="button-content" *ngIf="!children">
                    <wallet-icon [wallet]="wallet$ | ngrxPush"></wallet-icon>
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
    @ContentChild('children') children: ElementRef | null = null;
    @Input() color: ButtonColor = 'primary';
    readonly wallet$ = this._walletStore.wallet$;
    readonly connected$ = this._walletStore.connected$;
    readonly address$ = this._walletStore.publicKey$.pipe(map((publicKey) => publicKey && publicKey.toBase58()));

    constructor(private readonly _walletStore: WalletStore) {}
}
