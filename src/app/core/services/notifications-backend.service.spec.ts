import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {NotificationsBackendService} from './notifications-backend.service';

describe('NotificationsBackendService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), NotificationsBackendService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(NotificationsBackendService);
    expect(service).toBeTruthy();
  });
});
