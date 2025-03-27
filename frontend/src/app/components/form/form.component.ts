import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form',
  imports: [FormsModule, CommonModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent {
  username:string='';
  password:string='';
  constructor(private authService: AuthService){};
  Login(){
    this.authService.adminLogin(this.username, this.password).subscribe((res:any)=>{
      console.log(res);
    });
  }
  Register(){
    this.authService.adminRegister({username:this.username, password:this.password}).subscribe((res:any)=>{
      console.log(res);
    });
  }
}
