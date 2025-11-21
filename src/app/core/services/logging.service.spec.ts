import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {LoggingService} from './logging.service';

describe('LoggingService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), LoggingService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(LoggingService);
    expect(service).toBeTruthy();
  });
});
