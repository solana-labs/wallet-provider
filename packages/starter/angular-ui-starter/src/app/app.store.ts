import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ComponentStore } from '@ngrx/component-store';
import { WalletStore } from '@solana/wallet-adapter-angular';
import { WalletError } from '@solana/wallet-adapter-base';
import { filter, tap } from 'rxjs/operators';

export interface ViewModel {
    notifications: string[];
}

@Injectable()
export class AppStore extends ComponentStore<ViewModel> {
    constructor(private _walletStore: WalletStore, private _matSnackBar: MatSnackBar) {
        super({
            notifications: [],
        });
    }

    notifyError = this.effect(() =>
        this._walletStore.error$.pipe(
            filter((error): error is WalletError => error instanceof WalletError),
            tap((error) => this._matSnackBar.open(error.name, 'close', { horizontalPosition: 'start', duration: 5000 }))
        )
    );
}
