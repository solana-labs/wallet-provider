import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WalletAdapterAngularUiModule } from '@solana/wallet-adapter-angular-ui';

import { NavigationComponent } from './navigation.component';

@NgModule({
    declarations: [NavigationComponent],
    imports: [MatIconModule, MatButtonModule, WalletAdapterAngularUiModule],
    providers: [],
    exports: [NavigationComponent],
})
export class NavigationModule {}
