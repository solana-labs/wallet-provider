import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveComponentModule } from '@ngrx/component';
import { WalletModule } from '@solana/wallet-adapter-angular-ui';

import { NavigationComponent } from './navigation.component';

@NgModule({
    declarations: [NavigationComponent],
    imports: [CommonModule, MatIconModule, MatButtonModule, ReactiveComponentModule, WalletModule],
    providers: [],
    exports: [NavigationComponent],
})
export class NavigationModule {}
