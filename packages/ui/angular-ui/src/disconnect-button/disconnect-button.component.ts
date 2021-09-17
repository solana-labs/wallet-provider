import { Component } from '@angular/core';

@Component({
    selector: 'wallet-disconnect-button',
    template: `
        <button mat-raised-button color="warn" wallet-disconnect-button>
            <div class="button-wrapper">
                <mat-icon>logout</mat-icon>
                Disconnect
            </div>
        </button>
    `,
    styles: [
        `
            .button-wrapper {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
        `,
    ],
})
export class WalletDisconnectButtonComponent {}
