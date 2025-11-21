import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {AuthService} from './auth.service';

describe('AuthService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), AuthService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(AuthService);
    expect(service).toBeTruthy();
  });
});
