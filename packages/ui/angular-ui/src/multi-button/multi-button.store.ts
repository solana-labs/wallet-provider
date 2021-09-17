import { Injectable, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { Observable } from 'rxjs';
import { exhaustMap, map } from 'rxjs/operators';

import { WalletDialogComponent } from '../dialog';

interface ViewModel {
    isOpen: boolean;
}

@Injectable()
export class WalletMultiButtonStore extends ComponentStore<ViewModel> {
    readonly vm$ = this.select(
        this._walletStore.wallet$,
        this._walletStore.connected$,
        this._walletStore.publicKey$.pipe(map((publicKey) => publicKey && publicKey.toBase58())),
        (wallet, connected, address) => ({ wallet, connected, address }),
        { debounce: true }
    );

    constructor(
        private _walletStore: WalletStore,
        private _matDialog: MatDialog,
        private _viewContainerRef: ViewContainerRef
    ) {
        super({ isOpen: false });
    }

    openDialog = this.effect((action$: Observable<void>) =>
        action$.pipe(
            exhaustMap(() => {
                const dialogRef = this._matDialog.open(WalletDialogComponent, {
                    viewContainerRef: this._viewContainerRef,
                });

                this.patchState({ isOpen: true });

                return dialogRef.afterClosed().pipe(
                    tapResponse(
                        () => this.patchState({ isOpen: false }),
                        (error) => console.error(error)
                    )
                );
            })
        )
    );
}
