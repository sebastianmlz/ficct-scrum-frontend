import { Injectable } from '@angular/core';
import { Observable, Subject, timer, EMPTY, Subscription } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retryWhen, tap, delayWhen, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private messagesSubject$ = new Subject<any>();
  private socketSubscription: Subscription | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  public messages$ = this.messagesSubject$.asObservable();

  /**
   * Conectar al WebSocket
   * @param url URL del WebSocket
   * @param protocols Protocolos opcionales
   */
  connect(url: string, protocols?: string | string[]): void {
    if (this.socket$) {
      return; // Ya conectado
    }

    console.log('[WS] Connecting to:', url);

    this.socket$ = webSocket({
      url,
      protocol: protocols,
      openObserver: {
        next: () => {
          console.log('[WS] Connection opened successfully');
          this.reconnectAttempts = 0;
        }
      },
      closeObserver: {
        next: () => {
          console.log('[WS] Connection closed');
          this.socket$ = null;
        }
      }
    });

    this.socketSubscription = this.socket$
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            tap(error => {
              console.error('[WS] WebSocket error:', error);
              this.reconnectAttempts++;
            }),
            delayWhen(() => {
              if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[WS] Max reconnection attempts reached');
                return EMPTY;
              }
              const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
              console.log(`[WS] Reconnecting in ${delay}ms...`);
              return timer(delay);
            })
          )
        ),
        catchError(error => {
          console.error('[WS] Fatal error:', error);
          return EMPTY;
        })
      )
      .subscribe({
        next: (message) => {
          console.log('[WS] Raw message received:', message);
          this.messagesSubject$.next(message);
        },
        error: (error) => console.error('[WS] Subscription error:', error)
      });
  }

  /**
   * Enviar mensaje al servidor
   * @param message Mensaje a enviar
   */
  send(message: any): void {
    if (this.socket$) {
      this.socket$.next(message);
    } else {
      console.error('WebSocket not connected');
    }
  }

  /**
   * Desconectar WebSocket
   */
  disconnect(): void {
    console.log('[WS] Disconnecting...');
    
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
      this.socketSubscription = null;
    }
    
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket$ !== null;
  }
}
