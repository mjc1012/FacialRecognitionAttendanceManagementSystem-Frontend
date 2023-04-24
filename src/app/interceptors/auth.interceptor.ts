import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ResponseApi } from '../models/response-api';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private toastr: ToastrService, private router: Router) {}

  handleUnauthorizedTokenAttendanceApi(req: HttpRequest<any>, next: HttpHandler){
    const token = {
      accessToken:  this.authService.getAccessToken()!,
      refreshToken: this.authService.getRefreshToken()!
    }
    return this.authService.renewToken(token).pipe(
      switchMap((data: ResponseApi)=>{
        this.authService.storeRefreshToken(data.value.refreshToken)
        this.authService.storeAccessToken(data.value.accessToken)
        req = req.clone({
          setHeaders: {Authorization:`Bearer ${this.authService.getAccessToken()}`}
        })
        return next.handle(req);
      }),
      catchError((err)=>{
        return throwError(()=>{
          this.toastr.error('ERROR!', "Token is expired, Please Login again");
            this.router.navigate(['login'])
            this.authService.logout();
        })
      })
    )
  }



  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const myToken = this.authService.getAccessToken();
    if(myToken){
      request = request.clone({
        setHeaders: {Authorization:`Bearer ${myToken}`}
      })
    }


    return next.handle(request).pipe(

      catchError((error: any) => {
        if(error instanceof HttpErrorResponse){
          if(error.status === 401){
            const errorUrl = error.url!.split("api")[0]
            if(errorUrl == environment.AttendaceManagementSystemAPIBaseUrl) return this.handleUnauthorizedTokenAttendanceApi(request, next);
          }
        }
        return throwError(() => new Error("Some other error occured"));
      })

    );
  }
}
