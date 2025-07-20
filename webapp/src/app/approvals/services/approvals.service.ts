import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Approval {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
  approverId: string;
  requestId: string;
}

export interface CarRequest {
  id: string;
  destination: string;
  status: string;
  approvals: Approval[];
}

@Injectable({
  providedIn: 'root'
})
export class ApprovalsService {

  private apiUrl = '/api'; // Adjust if your API URL is different

  constructor(private http: HttpClient) { }

  getPendingApprovals(): Observable<CarRequest[]> {
    return this.http.get<CarRequest[]>(`${this.apiUrl}/requests/pending-approvals`);
  }

  approve(approvalId: string, comments?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/approvals/${approvalId}/approve`, { comments });
  }

  reject(approvalId: string, comments: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/approvals/${approvalId}/reject`, { comments });
  }
}
