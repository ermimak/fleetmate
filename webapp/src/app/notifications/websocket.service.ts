import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$: WebSocketSubject<any>;

  constructor() {
    // Adjust the URL to your WebSocket server
    this.socket$ = webSocket('ws://localhost:3000/notifications'); 
  }

  public receiveMessages(): Observable<any> {
    return this.socket$.asObservable();
  }

  public sendMessage(message: any): void {
    this.socket$.next(message);
  }
}
