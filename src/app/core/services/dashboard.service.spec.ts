import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {DashboardService} from './dashboard.service';

describe('DashboardService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), DashboardService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(DashboardService);
    expect(service).toBeTruthy();
  });
});
