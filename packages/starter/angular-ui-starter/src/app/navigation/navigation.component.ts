import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WalletStore } from '@solana/wallet-adapter-angular';

@Component({
    selector: 'app-navigation',
    template: `
        <header>
            <h1>Solana Starter App</h1>
            <div class="actions">
                <wallet-multi-button></wallet-multi-button>
                <wallet-disconnect-button *ngIf="wallet$ | ngrxPush"> Disconnect </wallet-disconnect-button>
            </div>
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

            .actions {
                display: flex;
                gap: 1rem;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
    readonly wallet$ = this._walletStore.wallet$;

    constructor(private readonly _walletStore: WalletStore) {}
}
