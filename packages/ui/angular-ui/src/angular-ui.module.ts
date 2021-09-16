import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ReactiveComponentModule } from '@ngrx/component';

import { WalletAdapterAngularUiDialogButtonDirective } from './dialog-button/dialog-button.directive';
import { WalletAdapterAngularUiDialogComponent } from './dialog/dialog.component';
import { SanitizeUrlPipe } from './pipes/sanitize-url.pipe';
import { WalletAdapterAngularUiListItemComponent } from './list-item/list-item.component';
import { WalletAdapterAngularUiExpandComponent } from './expand/expand.component';

@NgModule({
    imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatListModule, ReactiveComponentModule],
    exports: [WalletAdapterAngularUiDialogButtonDirective],
    declarations: [
        WalletAdapterAngularUiDialogButtonDirective,
        WalletAdapterAngularUiDialogComponent,
        WalletAdapterAngularUiListItemComponent,
        WalletAdapterAngularUiExpandComponent,
        SanitizeUrlPipe,
    ],
})
export class WalletAdapterAngularUiModule {}
