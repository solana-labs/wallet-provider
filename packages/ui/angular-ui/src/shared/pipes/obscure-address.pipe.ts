import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'obscureAddress',
})
export class ObscureAddressPipe implements PipeTransform {
    transform(value: string | null): string {
        if (value === null) {
            return '';
        }

        return value
            .split('')
            .reduce((state: string, curr: string, index: number) => state + (index <= 3 || index >= 39 ? curr : '*'))
            .split('*')
            .filter((segment) => segment)
            .join('***');
    }
}
