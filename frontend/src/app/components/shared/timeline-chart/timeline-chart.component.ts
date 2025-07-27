import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TimelineEvent, TimelineEventEnums } from '../../../interfaces/quotation.interface';
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

    let positions = events.map(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const eventOffset = eventTime - startDate;
      const position = Math.max(0, Math.min(100, (eventOffset / totalDuration) * 100));
      return {
        ...event,
        position,
        isEndpoint: false,
        icon: this.getIconForEvent(event.event),
        verticalAlign: 'center',
      };
    });
    console.log('positions', positions);

    positions.push({
      _id: 'endpoint',
      message: this.isSatisfied() ? 'Work Completed' : 'In Progress (Today)',
      timestamp: new Date(endDate).toISOString(),
      position: 100,
      isEndpoint: true,
      icon: this.isSatisfied() ? 'check_circle' : 'hourglass_empty',
      verticalAlign: 'center',
    } as any);

    positions.sort((a, b) => a.position - b.position);
    const minGap = 3;

    for (let i = 1; i < positions.length; i++) {
      if (positions[i].position - positions[i - 1].position < minGap) {
        positions[i].verticalAlign = positions[i - 1].verticalAlign !== 'top' ? 'top' : 'bottom';
      }
    }

    return positions;
  });

  private getIconForEvent(event: TimelineEventEnums): string {
    switch (event) {
      case TimelineEventEnums.QUOTATION_CREATED:
        return 'post_add';
      case TimelineEventEnums.EDITOR_ASSIGNED:
        return 'assignment_ind';
      case TimelineEventEnums.WORK_STARTED:
        return 'play_arrow';
      case TimelineEventEnums.FIRST_DRAFT_SUBMITTED:
        return 'upload_file';
      case TimelineEventEnums.FEEDBACK_RECEIVED:
        return 'feedback';
      case TimelineEventEnums.WORK_REVISED:
        return 'autorenew';
      case TimelineEventEnums.USER_SATISFIED:
        return 'thumb_up';
      case TimelineEventEnums.PAYMENT_COMPLETED:
        return 'paid';
      default:
        return 'radio_button_unchecked';
    }
  }
}
