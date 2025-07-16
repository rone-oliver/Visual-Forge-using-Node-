import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TimelineEvent } from '../../../interfaces/quotation.interface';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-timeline-chart',
  imports: [
    DatePipe, MatIconModule, MatTooltipModule,
  ],
  templateUrl: './timeline-chart.component.html',
  styleUrl: './timeline-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineChartComponent {
  timelineEvents = input<TimelineEvent[]>([]);
  creationDate = input.required<Date | string>();
  isSatisfied = input<boolean>(false);

  protected eventPositions = computed(() => {
    const events = this.timelineEvents();
    const startDate = new Date(this.creationDate()).getTime();

    const satisfiedEvent = events.find(e => e.message.includes('Satisfied'));
    const endDate = this.isSatisfied() && satisfiedEvent 
      ? new Date(satisfiedEvent.timestamp).getTime() 
      : new Date().getTime();

    const totalDuration = Math.max(1, endDate - startDate);

    const positions = events.map(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const eventOffset = eventTime - startDate;
      const position = Math.max(0, Math.min(100, (eventOffset / totalDuration) * 100));
      return { ...event, position, isEndpoint: false };
    });

    positions.push({
      _id: 'endpoint',
      message: this.isSatisfied() ? 'Work Completed' : 'In Progress (Today)',
      timestamp: new Date(endDate).toISOString(),
      position: 100,
      isEndpoint: true,
    } as any);

    return positions;
  });
}
