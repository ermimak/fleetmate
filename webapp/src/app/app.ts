import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApprovalsListComponent } from './approvals/components/approvals-list/approvals-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ApprovalsListComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'FleetMate';
}
