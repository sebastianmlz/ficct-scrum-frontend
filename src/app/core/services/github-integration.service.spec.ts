import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {GitHubIntegrationService} from './github-integration.service';

describe('GithubIntegrationService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), GitHubIntegrationService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(GitHubIntegrationService);
    expect(service).toBeTruthy();
  });
});
