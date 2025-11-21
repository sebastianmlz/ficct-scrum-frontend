import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {WorkspacesService} from './workspaces.service';

describe('WorkspaceService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), WorkspacesService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(WorkspacesService);
    expect(service).toBeTruthy();
  });
});
