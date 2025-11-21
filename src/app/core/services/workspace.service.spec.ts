import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {WorkspaceService} from './workspace.service';

describe('WorkspaceService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), WorkspaceService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(WorkspaceService);
    expect(service).toBeTruthy();
  });
});
