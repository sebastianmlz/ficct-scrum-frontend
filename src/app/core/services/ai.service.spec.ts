import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {AiService} from './ai.service';

describe('AiService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), AiService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(AiService);
    expect(service).toBeTruthy();
  });
});
