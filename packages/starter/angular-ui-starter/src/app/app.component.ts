import { Component, OnInit } from '@angular/core';

import { AppStore } from './app.store';

@Component({
    selector: 'app-root',
    template: ` <app-navigation></app-navigation> `,
    styles: [],
    viewProviders: [AppStore],
})
export class AppComponent implements OnInit {
    constructor(private readonly _appStore: AppStore) {}

    ngOnInit(): void {
        this._appStore.notifyError();
    }
}
