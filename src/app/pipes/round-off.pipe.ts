import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roundOff'
})
export class RoundOffPipe implements PipeTransform {
  transform(value: number, digits: number = 2): number {
    return +value.toFixed(digits);
  }
}
