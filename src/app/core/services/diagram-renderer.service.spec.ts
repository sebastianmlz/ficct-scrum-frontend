import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {DiagramRendererService} from './diagram-renderer.service';

describe('DiagramRendererService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), DiagramRendererService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(DiagramRendererService);
    expect(service).toBeTruthy();
  });
});
