import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AttendanceLog } from 'src/app/models/attendancelog';
import { Employee } from 'src/app/models/employee';
import { AttendanceLogService } from 'src/app/services/attendance-log.service';
import { AuthService } from 'src/app/services/auth.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { UserStoreService } from 'src/app/services/user-store.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.css']
})
export class AccountPageComponent implements OnInit {
  public employeeId: string = "";
  imageFile?:File;
  public employee: Employee = { };
  imageBaseUrl=environment.AttendaceManagementSystemAPIBaseUrl+'profilepictures/';
  startDate!: Date
  endDate!: Date
  missedTimeInCount: number = 0
  missedTimeOutCount: number = 0
  WithinWorkTimeCount = 0
  dateSubmitted: boolean = false
  public userLogs: AttendanceLog[] = [];
  public absencesEmployee: Employee = {}
  newPassword = ""
  samePassword = false
  constructor(private employeeService: EmployeeService, private authService: AuthService, private userStoreService: UserStoreService, private toastr: ToastrService,
    private attendanceLogService: AttendanceLogService, private router: Router) { }



  ngOnInit(): void {
    this.userStoreService.getEmployeeIdFromStore().subscribe(val=>{
      const employeeIdFromToken = this.authService.getEmployeeIdFromToken();
      this.employeeId = val || employeeIdFromToken
    })

    this.getEmployee()
  }

  set password(value: string){
    this.newPassword = value
  }

  checkPassword(value: string){
      this.samePassword = value === this.newPassword
  }

    public getEmployee(): void {
      this.employeeService.getEmployee(this.employeeId).subscribe({
        next:(data) =>{
          if(data.status){
            this.employee = data.value
          }else{
            this.employee = {
              firstName: "",
              middleName: "",
              lastName: "",
              emailAddress: "",
              code: "",
              employeeRoleName: ""
            }

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


    public onUpdateEmloyee(editForm: NgForm): void {
      let formData = new FormData();
      formData.append("id",editForm.value.id??"");
      formData.append("firstName",editForm.value.firstName??"");
      formData.append("middleName",editForm.value.middleName??"");
      formData.append("lastName",editForm.value.lastName??"");
      formData.append("emailAddress",editForm.value.emailAddress??"");
      this.employeeService.updateEmployee(formData).subscribe({
        next:(data) =>{
          if(data.status){
            this.getEmployee();

            this.toastr.success('SUCCESS!', data.message);
          }else{

            data.value.forEach((error: string) => {
              this.toastr.error('ERROR!', error);
            });
          }
        },
        error:(e)=>{
          this.toastr.error('ERROR!', "Something went wrong");
        }
      });

      editForm.reset();
    }

    public onCloseAbsences(){
      this.dateSubmitted = false
    }


    public onUpdatePassword(editPasswordForm: NgForm): void {
      this.employeeService.updatePassword(editPasswordForm.value).subscribe({
        next:(data) =>{
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
      editPasswordForm.reset();
    }



    onChange(event:any){
      this.imageFile=event.target.files[0];
     }

    public onDeleteEmloyee(employee: Employee): void {
      this.employeeService.deleteEmployee(employee.id!).subscribe({
        next:(data) =>{
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
    public getUserAbsencesCount(DateForm: NgForm): void {
      var startDate = new Date(DateForm.value.startDate)
      var endDate = new Date(DateForm.value.endDate)
      this.attendanceLogService.getAllForUser(this.employee.id!).subscribe({
        next:(data) =>{
          if(data.status){
            var AbsentTimeIn = data.value.filter((item: AttendanceLog) => {
              var d = new Date(item.timeLog!.split(" ")[0])
              return d.getTime() >= startDate.getTime() && d.getTime() <= endDate.getTime() && item.attendanceLogTypeName == "TimeIn" && item.attendanceLogStatusName == "Absent"
          });
          var AbsentTimeOut = data.value.filter((item: AttendanceLog) => {
            var d = new Date(item.timeLog!.split(" ")[0])
            return d.getTime() >= startDate.getTime() && d.getTime() <= endDate.getTime() && item.attendanceLogTypeName == "TimeOut" && item.attendanceLogStatusName == "Absent"
        });
        var WithinWorkTime = data.value.filter((item: AttendanceLog) => {
          var d = new Date(item.timeLog!.split(" ")[0])
          return d.getTime() >= startDate.getTime() && d.getTime() <= endDate.getTime() && item.attendanceLogStateName == "Within Work Time"
        });
        this.missedTimeInCount = AbsentTimeIn.length
        this.missedTimeOutCount = AbsentTimeOut.length
        this.WithinWorkTimeCount = WithinWorkTime.length
          }
          else{

            data.value.forEach((error: string) => {
              this.toastr.error('ERROR!', error);
            });
          }

          this.dateSubmitted = true
        },
        error:(e)=>{
          this.toastr.error('ERROR!', "Something went wrong");
        }
      });
      DateForm.reset()
    }

    logout(){
      this.authService.logout();
    }

}
