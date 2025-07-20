import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { ApprovalsService, CarRequest, Approval } from '../../services/approvals.service';
import { AuthService, UserRole } from '../../../auth/auth.service';
import { WebSocketService } from '../../../notifications/websocket.service';

@Component({
  selector: 'app-approvals-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approvals-list.html',
  styleUrls: ['./approvals-list.scss'],
})
export class ApprovalsListComponent implements OnInit, OnDestroy {
  pendingApprovals$!: Observable<CarRequest[]>;
  canPerformActions = false;
  private refresh$ = new Subject<void>();
  private wsSubscription!: Subscription;
  private userSubscription!: Subscription;

  constructor(
    private approvalsService: ApprovalsService,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.canPerformActions = this.authService.hasRole([
        UserRole.ADMIN,
        UserRole.AUTHORITY,
        UserRole.APPROVER,
      ]);
    });

    this.pendingApprovals$ = this.refresh$.pipe(
      switchMap(() => this.approvalsService.getPendingApprovals())
    );
    this.refreshData();

    this.wsSubscription = this.webSocketService.receiveMessages().pipe(
      tap(message => console.log('Received WS message:', message)), // For debugging
    ).subscribe(message => {
      // Assuming the backend sends a specific event name for updates
      if (message.event === 'approval_updated' || message.event === 'new_request') {
        this.refreshData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  refreshData(): void {
    this.refresh$.next();
  }

  approve(request: CarRequest): void {
    const pendingApproval = this.findPendingApproval(request);
    if (!pendingApproval) {
      alert('No pending approval found for this request.');
      return;
    }

    this.approvalsService.approve(pendingApproval.id).subscribe(() => {
      alert('Request approved successfully!');
      this.refreshData();
    });
  }

  reject(request: CarRequest): void {
    const pendingApproval = this.findPendingApproval(request);
    if (!pendingApproval) {
      alert('No pending approval found for this request.');
      return;
    }

    const comments = prompt('Please provide a reason for rejection:');
    if (comments) {
      this.approvalsService.reject(pendingApproval.id, comments).subscribe(() => {
        alert('Request rejected successfully!');
        this.refreshData();
      });
    }
  }

  private findPendingApproval(request: CarRequest): Approval | undefined {
    // The status from the backend is an enum, so we should check against 'PENDING'
    return request.approvals.find(a => (a.status as any) === 'PENDING');
  }
}
