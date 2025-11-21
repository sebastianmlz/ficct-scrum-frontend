import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {MermaidGeneratorService} from './mermaid-generator.service';

describe('MermaidGeneratorService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), MermaidGeneratorService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(MermaidGeneratorService);
    expect(service).toBeTruthy();
  });
});
