import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {OrganizationsService} from './organizations.service';

describe('OrganizationsService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), OrganizationsService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(OrganizationsService);
    expect(service).toBeTruthy();
  });
});
