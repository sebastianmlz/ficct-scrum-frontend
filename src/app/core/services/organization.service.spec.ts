import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {OrganizationService} from './organization.service';

describe('OrganizationService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), OrganizationService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(OrganizationService);
    expect(service).toBeTruthy();
  });
});
