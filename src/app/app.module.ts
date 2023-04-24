import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule} from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FaceRecognitionPageComponent } from './components/face-recognition-page/face-recognition-page.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AccountPageComponent } from './components/account-page/account-page.component';
import { AttendancePageComponent } from './components/attendance-page/attendance-page.component';
import { EmployeePageComponent } from './components/employee-page/employee-page.component';
import { FaceCollectionPageComponent } from './components/face-collection-page/face-collection-page.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { ResetPasswordPageComponent } from './components/reset-password-page/reset-password-page.component';
import { UserAttendancePageComponent } from './components/user-attendance-page/user-attendance-page.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [
    AppComponent,
    FaceRecognitionPageComponent,
    SpinnerComponent,
    NavbarComponent,
    AccountPageComponent,
    AttendancePageComponent,
    EmployeePageComponent,
    FaceCollectionPageComponent,
    LoginPageComponent,
    ResetPasswordPageComponent,
    UserAttendancePageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      closeButton: true,
      progressBar: true
    }), // ToastrModule added
    BrowserAnimationsModule, // required animations module
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true
    },
    {
      provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
