import { Directive, HostListener, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { WalletAdapterAngularUiDialogComponent } from '../dialog/dialog.component';

@Directive({ selector: 'button[wallet-adapter-angular-ui-dialog-button]' })
export class WalletAdapterAngularUiDialogButtonDirective {
    @HostListener('click') onClick(): void {
        this._matDialog.open(WalletAdapterAngularUiDialogComponent, {
            viewContainerRef: this._viewContainerRef,
        });
    }

    constructor(private _matDialog: MatDialog, private _viewContainerRef: ViewContainerRef) {}
}
