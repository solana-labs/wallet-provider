import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { WalletAdapterAngularUiDialogButtonDirective } from './dialog-button/dialog-button.directive';
import { WalletAdapterAngularUiDialogComponent } from './dialog/dialog.component';
import { SanitizeUrlPipe } from './pipes/sanitize-url.pipe';

@NgModule({
    imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatListModule],
    exports: [WalletAdapterAngularUiDialogButtonDirective],
    declarations: [WalletAdapterAngularUiDialogButtonDirective, WalletAdapterAngularUiDialogComponent, SanitizeUrlPipe],
})
export class WalletAdapterAngularUiModule {}
