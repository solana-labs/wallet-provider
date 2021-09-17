import { Directive, HostListener, Input, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { WalletDialogComponent } from '../dialog/dialog.component';

@Directive({ selector: 'button[wallet-dialog-button]' })
export class WalletDialogButtonDirective {
    @Input('wallet-dialog-button') _viewContainerRef?: ViewContainerRef;
    @HostListener('click') onClick(): void {
        this._matDialog.open(WalletDialogComponent, {
            viewContainerRef: this._viewContainerRef,
        });
    }

    constructor(private readonly _matDialog: MatDialog) {}
}
