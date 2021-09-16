import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ReactiveComponentModule } from '@ngrx/component';

import { WalletConnectButtonDirective } from './connect-button/connect-button.directive';
import { WalletDialogButtonDirective } from './dialog-button/dialog-button.directive';
import { WalletDialogComponent } from './dialog/dialog.component';
import { WalletDisconnectButtonDirective } from './disconnect-button/disconnect-button.directive';
import { WalletExpandComponent } from './expand/expand.component';
import { WalletListItemComponent } from './list-item/list-item.component';
import { WalletMultiButtonComponent } from './multi-button/multi-button.component';
import { ObscureAddressPipe } from './pipes/obscure-address.pipe';
import { SanitizeUrlPipe } from './pipes/sanitize-url.pipe';

@NgModule({
    imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatListModule, ReactiveComponentModule],
    exports: [WalletDialogButtonDirective, WalletMultiButtonComponent, WalletDisconnectButtonDirective],
    declarations: [
        WalletConnectButtonDirective,
        WalletDisconnectButtonDirective,
        WalletMultiButtonComponent,
        WalletDialogButtonDirective,
        WalletDialogComponent,
        WalletListItemComponent,
        WalletExpandComponent,
        SanitizeUrlPipe,
        ObscureAddressPipe,
    ],
})
export class WalletModule {}
