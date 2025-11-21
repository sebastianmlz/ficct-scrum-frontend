import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {GitHubDiagramService} from './github-diagram.service';

describe('GithubDiagramService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), GitHubDiagramService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(GitHubDiagramService);
    expect(service).toBeTruthy();
  });
});
