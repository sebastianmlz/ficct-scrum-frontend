import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {DiagramService} from './diagram.service';

describe('DiagramService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), DiagramService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(DiagramService);
    expect(service).toBeTruthy();
  });
});
