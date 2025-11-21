import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {AiCacheService} from './ai-cache.service';

describe('AiCacheService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), AiCacheService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(AiCacheService);
    expect(service).toBeTruthy();
  });
});
