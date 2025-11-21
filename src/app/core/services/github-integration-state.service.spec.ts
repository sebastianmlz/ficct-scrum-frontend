import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {GitHubIntegrationStateService}
  from './github-integration-state.service';

describe('GithubIntegrationStateService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), GitHubIntegrationStateService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(GitHubIntegrationStateService);
    expect(service).toBeTruthy();
  });
});
