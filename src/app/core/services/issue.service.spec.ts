import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {IssueService} from './issue.service';

describe('IssueService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), IssueService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(IssueService);
    expect(service).toBeTruthy();
  });
});
