import { Directive, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { WalletDialogComponent } from './dialog.component';

@Directive({ selector: 'button[wallet-dialog-button]' })
export class WalletDialogButtonDirective {
    @HostListener('click') onClick(): void {
        this._matDialog.open(WalletDialogComponent);
    }

    constructor(private readonly _matDialog: MatDialog) {}
}
