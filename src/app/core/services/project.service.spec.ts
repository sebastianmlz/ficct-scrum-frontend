import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {ProjectService} from './project.service';

describe('ProjectService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), ProjectService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(ProjectService);
    expect(service).toBeTruthy();
  });
});
