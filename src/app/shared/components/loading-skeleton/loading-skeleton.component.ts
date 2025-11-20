import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: 'loading-skeleton.component.html',
  styleUrl: 'loading-skeleton.component.css',
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'project' | 'activity' | 'stat' | 'lines' = 'lines';
  @Input() lines = 3;

  getLines(): number[] {
    const widths = [100, 80, 60, 90, 70];
    return Array.from({length: this.lines}
        , (_, i) => widths[i % widths.length]);
  }
}
