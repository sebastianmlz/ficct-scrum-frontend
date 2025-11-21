import {WebSocketService} from './websocket.service';
import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';

describe('WebSocketService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), WebSocketService],
    }).compileComponents();
  });

  it('should create the service', () => {
    const service = TestBed.inject(WebSocketService);
    expect(service).toBeTruthy();
  });
});
