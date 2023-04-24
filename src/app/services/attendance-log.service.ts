import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ResponseApi } from '../models/response-api';
import { Observable } from 'rxjs';
import { AttendanceLog } from '../models/attendancelog';
import { DeleteRange } from '../models/deleteRange';

@Injectable({
  providedIn: 'root'
})
export class AttendanceLogService {
  private baseUrl: string = environment.AttendaceManagementSystemAPIBaseUrl + 'api/AttendanceLog';

  constructor(private http:HttpClient) { }

  public getAll(): Observable<ResponseApi>{
    return this.http.get<ResponseApi>(this.baseUrl);
  }

  public getAllForUser(employeeId: number): Observable<ResponseApi>{
    const url = `${this.baseUrl}/${employeeId}`;
    return this.http.get<ResponseApi>(url);
  }

  public add(request: AttendanceLog): Observable<ResponseApi>{
    return this.http.post<ResponseApi>(this.baseUrl, request);
  }

  public update(request: AttendanceLog): Observable<ResponseApi>{
    return this.http.put<ResponseApi>(this.baseUrl, request);
  }

  public delete(id: number): Observable<ResponseApi>{
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<ResponseApi>(url);
  }

  public deleteLogs(request: DeleteRange): Observable<ResponseApi>{
    const url = `${this.baseUrl}/delete-logs`;
    return this.http.put<ResponseApi>(url, request);
  }
}

