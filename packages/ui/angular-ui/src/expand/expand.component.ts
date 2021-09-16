import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'wallet-adapter-angular-ui-expand',
    template: `
        <button (click)="toggleExpand.emit(!expanded)" class="expand-trigger">
            {{ expanded ? 'Less' : 'More' }} options

            <mat-icon> {{ expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
        </button>
    `,
    styles: [
        `
            .expand-trigger {
                display: flex;
                justify-content: space-between;
                align-items: center;

                width: 100%;
                height: 3rem;
                padding: 0 1rem;
                font-size: 1rem;
                background: transparent;
                color: var(--text-primary-color);
                border: none;
                border-top: solid 1px rgb(255 255 255 / 10%);
            }
        `,
    ],
})
export class WalletAdapterAngularUiExpandComponent {
    @Input() expanded: boolean | null = null;
    @Output() toggleExpand = new EventEmitter<boolean>();
}
