import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { ResetPasswordService } from 'src/app/services/reset-password.service';
import { UserStoreService } from 'src/app/services/user-store.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {
  resetPasswordEmail!: string;
  isValidEmail = false;

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService, private userStoreService: UserStoreService, private resetPasswordService: ResetPasswordService) { }

  ngOnInit(): void {
  }

  onLogin(loginForm: NgForm){
    this.authService.login(loginForm.value).subscribe({
      next:(data) =>{
        if(data.status){
          this.authService.storeAccessToken(data.value.accessToken);
          this.authService.storeRefreshToken(data.value.refreshToken);
          const tokenPayload = this.authService.decodedToken();
          this.userStoreService.setEmployeeIdForStore(tokenPayload.name);
          this.userStoreService.setRoleForStore(tokenPayload.role);
          this.onNavigate(tokenPayload.role);
        }
        else{
          data.value.forEach((error: string) => {
              this.toastr.error('ERROR!', error);
            });
        }
      },
      error:(e)=>{
        this.toastr.error('ERROR!', "Something went wrong");
      }
    });
    loginForm.reset();
  }

  onNavigate(role: string){
    if(role === 'Admin'){
      this.router.navigate(['employee-list'])
    }
    else if(role === 'User'){
      this.router.navigate(['account'])
    }
  }

  checkValidEmail(event: string): boolean{
    const value = event;
    const pattern = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,3})+$/;
    this.isValidEmail = pattern.test(value);
    return this.isValidEmail;
  }

  onForgotPassword(){
    this.resetPasswordService.sendResetPasswordLink(this.resetPasswordEmail).subscribe({
      next:(data) =>{
        this.resetPasswordEmail = ""
        if(data.status){

          this.toastr.success('SUCCESS!', data.message);
        }
        else{
          data.value.forEach((error: string) => {
              this.toastr.error('ERROR!', error);
            });
        }
      },
      error:(e)=>{
        this.toastr.error('ERROR!', "Something went wrong");
      }
    });
  }

}
