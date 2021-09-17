import { ChangeDetectionStrategy, Component, ViewContainerRef } from '@angular/core';

import { WalletMultiButtonStore } from './multi-button.store';

@Component({
    selector: 'wallet-multi-button',
    template: `
        <ng-container *ngrxLet="vm$; let vm">
            <wallet-dialog-button *ngIf="vm.wallet === null" (click)="onOpenDialog()"></wallet-dialog-button>
            <wallet-connect-button *ngIf="!vm.connected && vm.wallet"></wallet-connect-button>

            <ng-container *ngIf="vm.connected">
                <button mat-raised-button color="primary" [matMenuTriggerFor]="walletMenu">
                    <div class="button-content">
                        <wallet-icon [wallet]="vm.wallet"></wallet-icon>
                        {{ vm.address | obscureAddress }}
                    </div>
                </button>
                <mat-menu #walletMenu="matMenu">
                    <button mat-menu-item [cdkCopyToClipboard]="vm.address!">
                        <mat-icon>content_copy</mat-icon>
                        Copy address
                    </button>
                    <button mat-menu-item (click)="onOpenDialog()">
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
    providers: [WalletMultiButtonStore],
})
export class WalletMultiButtonComponent {
    readonly vm$ = this._multiButtonStore.vm$;

    constructor(
        public readonly viewContainerRef: ViewContainerRef,
        private readonly _multiButtonStore: WalletMultiButtonStore
    ) {}

    onOpenDialog(): void {
        this._multiButtonStore.openDialog();
    }
}
