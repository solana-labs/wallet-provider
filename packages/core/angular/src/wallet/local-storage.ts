import { BehaviorSubject } from 'rxjs';

export class LocalStorageService<T> {
    private _value = new BehaviorSubject(this.getInitialValue());
    value$ = this._value.asObservable();

    constructor(private _key: string, private _defaultState: T) {}

    private getInitialValue(): T {
        if (typeof localStorage === 'undefined') {
            return this._defaultState;
        }

        const value = localStorage.getItem(this._key);

        return value ? (JSON.parse(value) as T) : this._defaultState;
    }

    setItem(newValue: T): void {
        const value = this._value.getValue();

        if (newValue === value) return;

        this._value.next(newValue);

        if (newValue === null) {
            localStorage.removeItem(this._key);
        } else {
            localStorage.setItem(this._key, JSON.stringify(newValue));
        }
    }
}
