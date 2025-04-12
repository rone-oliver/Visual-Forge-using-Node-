import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../interfaces/user.interface';
import { UserService } from '../../../services/user/user.service';
import { Observable } from 'rxjs';
import { DatePipe } from '../../../pipes/date.pipe';

@Component({
  selector: 'app-profile',
  imports: [MatIconModule,CommonModule,DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{
  user$!:Observable<User>;

  constructor(
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.user$ = this.userService.getUserProfile();
  }

  requestEditorStatus(): void {
    // Implement editor request logic
    console.log('Editor status requested');
    // Here you would typically call a service to submit the request
  }
}
