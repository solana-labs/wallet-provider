import { ChangeDetectionStrategy, Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'wallet-dialog',
    template: `
        <h2 mat-dialog-title class="mat-primary">
            <span>Select Wallet</span>
            <button mat-icon-button mat-dialog-close aria-label="Close wallet adapter selection">
                <mat-icon>close</mat-icon>
            </button>
        </h2>
        <ng-container *ngrxLet="more$; let moreWallets">
            <ng-container *ngrxLet="expanded$; let expanded">
                <mat-selection-list [multiple]="false" (selectionChange)="onSelectionChange($event)">
                    <mat-list-option
                        *ngFor="let wallet of featured$ | async; last as isLast"
                        [value]="wallet"
                        [ngClass]="{
                            'bottom-separator': expanded || !isLast
                        }"
                    >
                        <wallet-list-item [wallet]="wallet"> </wallet-list-item>
                    </mat-list-option>
                    <ng-container *ngIf="moreWallets.length > 0 && expanded">
                        <mat-list-option
                            *ngFor="let wallet of moreWallets; last as isLast"
                            [value]="wallet"
                            [ngClass]="{
                                'bottom-separator': !isLast
                            }"
                        >
                            <wallet-list-item [wallet]="wallet"> </wallet-list-item>
                        </mat-list-option>
                    </ng-container>
                </mat-selection-list>

                <wallet-expand *ngIf="moreWallets.length > 0" (toggleExpand)="onToggleExpand($event)"> </wallet-expand>
            </ng-container>
        </ng-container>
    `,
    encapsulation: ViewEncapsulation.None,
    styles: [
        `
            .host {
                display: block;
                width: 280px;
            }

            .mat-dialog-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 0 !important;
                padding: 1rem 1.5rem;
                background-color: var(--primary-color);
                color: var(--text-primary-color);
            }

            .mat-dialog-title button {
                line-height: 1;
            }

            .mat-dialog-container {
                padding: 0;
            }

            .bottom-separator {
                border-bottom: solid 1px rgb(255 255 255 / 10%);
            }

            .mat-list-option:last-child {
                border-bottom: none;
            }

            .mat-list-base {
                padding: 0 !important;
            }

            .mat-list-text {
                padding: 0 !important;
            }

            .mat-list-item-content {
                padding: 0;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletDialogComponent {
    @HostBinding('class') class = 'host';
    private readonly _expanded = new BehaviorSubject(false);
    readonly expanded$ = this._expanded.asObservable();
    private readonly _featuredWallets = new BehaviorSubject(3);
    @Input() set featuredWallets(value: number) {
        this._featuredWallets.next(value);
    }
    readonly featuredWallets$ = this._featuredWallets.asObservable();
    readonly wallets$ = this._walletStore.wallets$;
    readonly featured$ = combineLatest([this._walletStore.wallets$, this.featuredWallets$]).pipe(
        map(([wallets, featuredWallets]) => wallets.slice(0, featuredWallets))
    );
    readonly more$ = combineLatest([this._walletStore.wallets$, this.featuredWallets$]).pipe(
        map(([wallets, featuredWallets]) => wallets.slice(featuredWallets))
    );

    constructor(
        private readonly _walletStore: WalletStore,
        private readonly _matDialogRef: MatDialogRef<WalletDialogComponent>
    ) {}

    onToggleExpand(expanded: boolean): void {
        this._expanded.next(expanded);
    }

    onSelectionChange({ options }: MatSelectionListChange): void {
        const [option] = options;
        this._walletStore.selectWallet(option.value.name || null);
        this._matDialogRef.close();
    }
}
