import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {SprintsService} from './sprints.service';

describe('SprintsService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), SprintsService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(SprintsService);
    expect(service).toBeTruthy();
  });
});
