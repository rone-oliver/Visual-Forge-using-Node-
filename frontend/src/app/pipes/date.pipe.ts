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

@Pipe({
  name: 'localDate',
})
export class LocalDatePipe implements PipeTransform{
  transform(value: string | Date | null, format: string = 'short'): string {
    if (!value) return '';
    
    const date = typeof value === 'string' ? new Date(value) : value;
    
    switch (format) {
      case 'short':
        // DD/MM/YYYY
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      case 'medium':
        // DD/MM/YYYY HH:MM
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      case 'long':
        // DD Month YYYY, HH:MM
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      default:
        return date.toLocaleString();
    }
  }
}
