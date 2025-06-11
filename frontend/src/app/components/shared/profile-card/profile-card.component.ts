import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PublicEditorProfile } from '../../../interfaces/user.interface';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
})
export class ProfileCardComponent {
  @Input() user!: PublicEditorProfile;
}
