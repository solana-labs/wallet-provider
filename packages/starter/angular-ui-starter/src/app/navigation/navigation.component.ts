import { Component } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';

@Component({
    selector: 'app-navigation',
    template: `
        <header>
            <h1>Solana Starter App</h1>
            <button mat-raised-button color="primary" wallet-adapter-angular-ui-dialog-button>Select Wallet</button>
        </header>
    `,
    styles: [
        `
            header {
                display: flex;
                justify-content: space-between;
                align-items: center;

                padding: 0 1.5rem;
                min-height: 4rem;
            }

            header h1 {
                margin: 0;
            }
        `,
    ],
})
export class NavigationComponent {}
