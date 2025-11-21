import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {ActivityLogService} from './activity-log.service';

describe('ActivityLogService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), ActivityLogService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(ActivityLogService);
    expect(service).toBeTruthy();
  });
});
