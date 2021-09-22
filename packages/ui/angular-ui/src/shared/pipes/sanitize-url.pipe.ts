import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
    name: 'sanitizeUrl',
    pure: true,
})
export class SanitizeUrlPipe implements PipeTransform {
    constructor(private readonly _domSanitizer: DomSanitizer) {}

    transform(value: string): SafeResourceUrl {
        return this._domSanitizer.bypassSecurityTrustResourceUrl(value);
    }
}
