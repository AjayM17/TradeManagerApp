import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'age'
})
export class AgePipe implements PipeTransform {
  transform(dateStr: string): number {
    const today = new Date();
    const date = new Date(dateStr);
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000*60*60*24));
    return diffDays < 0 ? 0 : diffDays;
  }
}
