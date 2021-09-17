import { Directive, HostListener, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { WalletDialogComponent } from '../dialog/dialog.component';

@Directive({ selector: 'button[wallet-dialog-button]' })
export class WalletDialogButtonDirective {
    @HostListener('click') onClick(): void {
        this._matDialog.open(WalletDialogComponent, {
            viewContainerRef: this._viewContainerRef,
        });
    }

    constructor(private readonly _matDialog: MatDialog, private readonly _viewContainerRef: ViewContainerRef) {}
}
