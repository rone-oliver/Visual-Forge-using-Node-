import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe as NgDatePipe } from '@angular/common';

@Pipe({
  name: 'customDate'
})
export class DatePipe implements PipeTransform {
  transform(value: string | Date): string {
    if(!value) return 'Not provided';
    const datePipe = new NgDatePipe('en-US');
    return datePipe.transform(value, 'dd MMM yyyy')?.toUpperCase() || 'Not provided';
  }
}
