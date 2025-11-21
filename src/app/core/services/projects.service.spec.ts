import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {ProjectsService} from './projects.service';

describe('ProjectsService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), ProjectsService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(ProjectsService);
    expect(service).toBeTruthy();
  });
});
