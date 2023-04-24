import {HttpClient, HttpHeaders} from '@angular/common/http'
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FaceToRecognize } from '../models/facetorecognize';
import { Person } from '../models/person';
import { ResponseApi } from '../models/response-api';

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private baseUrl = environment.AttendaceManagementSystemAPIBaseUrl + 'api/FaceRecognition';

  constructor(private http:HttpClient) { }

  trainModel(): Observable<ResponseApi>{
    const url = `${this.baseUrl}/train-model`;
    return this.http.get<ResponseApi>(url);
  }
}
