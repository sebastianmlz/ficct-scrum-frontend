import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {MlService} from './ml.service';

describe('MlService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), MlService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(MlService);
    expect(service).toBeTruthy();
  });
});
