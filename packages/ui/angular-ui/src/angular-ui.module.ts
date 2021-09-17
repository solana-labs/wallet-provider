import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { ReactiveComponentModule } from '@ngrx/component';

import { WalletConnectButtonComponent, WalletConnectButtonDirective } from './connect-button';
import {
    WalletDialogButtonComponent,
    WalletDialogButtonDirective,
    WalletDialogComponent,
    WalletExpandComponent,
    WalletListItemComponent,
} from './dialog';

import { WalletDisconnectButtonComponent, WalletDisconnectButtonDirective } from './disconnect-button';
import { WalletMultiButtonComponent } from './multi-button';
import { ObscureAddressPipe, SanitizeUrlPipe, WalletIconComponent } from './shared';

@NgModule({
    imports: [
        CommonModule,
        ClipboardModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        ReactiveComponentModule,
    ],
    exports: [WalletMultiButtonComponent, WalletConnectButtonComponent, WalletDisconnectButtonComponent],
    declarations: [
        WalletConnectButtonComponent,
        WalletConnectButtonDirective,
        WalletDisconnectButtonComponent,
        WalletDisconnectButtonDirective,
        WalletMultiButtonComponent,
        WalletDialogButtonComponent,
        WalletDialogButtonDirective,
        WalletDialogComponent,
        WalletListItemComponent,
        WalletExpandComponent,
        WalletIconComponent,
        SanitizeUrlPipe,
        ObscureAddressPipe,
    ],
})
export class WalletModule {}
