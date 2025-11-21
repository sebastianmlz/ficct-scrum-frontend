import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {NotificationService} from './notification.service';

describe('NotificationService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), NotificationService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(NotificationService);
    expect(service).toBeTruthy();
  });
});
