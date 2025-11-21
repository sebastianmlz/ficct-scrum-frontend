import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {BoardService} from './board.service';

describe('BoardService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), BoardService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(BoardService);
    expect(service).toBeTruthy();
  });
});
