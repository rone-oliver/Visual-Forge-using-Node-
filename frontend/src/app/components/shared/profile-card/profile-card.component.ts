import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PublicEditorProfile } from '../../../interfaces/user.interface';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MediaProtectionDirective],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
})
export class ProfileCardComponent {
  @Input() user!: PublicEditorProfile;
}
