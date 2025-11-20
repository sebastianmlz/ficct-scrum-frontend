import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

/**
 * Reusable component for prompting users to connect GitHub
 * Used in metrics, diagrams, commits, and other GitHub-dependent features
 */
@Component({
  selector: 'app-github-connect-prompt',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'github-connect-prompt.component.html',
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class GitHubConnectPromptComponent {
  @Input() projectId?: string;
  @Input() title?: string;
  @Input() message?: string;
  @Input() buttonLabel?: string;
  @Input() showFeatures = true;
  @Input() showLearnMore = true;
}
