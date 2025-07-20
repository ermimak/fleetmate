import { Observable } from 'rxjs';
export declare class WebSocketService {
    private socket$;
    constructor();
    receiveMessages(): Observable<any>;
    sendMessage(message: any): void;
}
