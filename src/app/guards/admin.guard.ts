import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserStoreService } from '../services/user-store.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private userStoreService: UserStoreService, private router: Router, private toastr: ToastrService){}

  canActivate(): boolean {
    if(this.authService.isLoggedIn()){
      let role;
      this.userStoreService.getRoleFromStore().subscribe(val=>{
        const roleFromToken = this.authService.getRoleFromToken();
        role = val || roleFromToken
      });
      if(role === 'Admin'){
        return true;
      }
      else{
        this.router.navigate(['account'])
        this.toastr.error('ERROR!', "Only Admins are Allowed!");
        return false;
      }
    }
    else {
      this.router.navigate(['login'])
      this.toastr.error('ERROR!', "Please Login First!");
      return false;
    }
  }

}
