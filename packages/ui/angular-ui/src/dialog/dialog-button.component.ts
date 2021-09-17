import { ChangeDetectionStrategy, Component, ContentChild, ElementRef, Input, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'wallet-dialog-button',
    template: `
        <button mat-raised-button color="primary">
            <ng-content></ng-content>
            <ng-container *ngIf="!children">Select Wallet</ng-container>
        </button>
    `,
    styles: [
        `
            button {
                display: inline-block;
            }

            .button-content {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletDialogButtonComponent {
    @ContentChild('children') children: ElementRef | null = null;
}
