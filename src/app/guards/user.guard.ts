import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService){}

  canActivate(): boolean {
    if(this.authService.isLoggedIn()){
      return true;
    }
    else {
      this.router.navigate(['login'])
      this.toastr.error('ERROR!', "Please Login First!");
      return false;
    }
  }

}
