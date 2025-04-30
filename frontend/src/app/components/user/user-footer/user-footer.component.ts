import { Component } from '@angular/core';
import { LucideAngularModule, Instagram, Linkedin, Facebook, Twitter } from 'lucide-angular';

@Component({
  selector: 'app-user-footer',
  imports: [LucideAngularModule],
  templateUrl: './user-footer.component.html',
  styleUrl: './user-footer.component.scss'
})
export class UserFooterComponent {
  icons = {
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
  }
}
