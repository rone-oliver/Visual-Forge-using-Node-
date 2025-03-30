import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin/admin-header/admin-header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [AdminHeaderComponent, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {

}
