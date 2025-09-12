import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'age'
})
export class AgePipe implements PipeTransform {
  transform(dateStr?: string | null): string {
    
    if (!dateStr) return '-'; // return '-' if null or empty

    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return '-'; // invalid date fallback

    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day); // month is 0-based

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? '0' : diffDays.toString();
  }
}
