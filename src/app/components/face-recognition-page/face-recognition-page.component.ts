import { Component, OnInit } from '@angular/core';
import * as faceapi from 'face-api.js';
import { ToastrService } from 'ngx-toastr';
import { AttendanceLog } from 'src/app/models/attendancelog';
import { FaceToRecognize } from 'src/app/models/facetorecognize';
import { Person } from 'src/app/models/person';
import { AttendanceLogService } from 'src/app/services/attendance-log.service';
import { AuthService } from 'src/app/services/auth.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { FaceToRecognizeService } from 'src/app/services/face-to-recognize.service';
@Component({
  selector: 'app-face-recognition-page',
  templateUrl: './face-recognition-page.component.html',
  styleUrls: ['./face-recognition-page.component.css']
})
export class FaceRecognitionPageComponent implements OnInit {

  constructor(private faceToRecognizeService: FaceToRecognizeService,
    private attendanceLogService: AttendanceLogService, private authService: AuthService, private toastr: ToastrService, private employeeService: EmployeeService) { }

  video: any;
  canvas: any;
  ctx: any;

  faceCanvas: any;
  faceCtx: any;
  roi: any;
  cameraMessage: string = "";
  greetingMessage: string = "";
    cameraWarning: string = "";
    countDownMessage: string = "";
  predictedPerson: Person ={};
  faceToRecognize: FaceToRecognize = {
    loggedTime: ""
  };
  snapshotFaceBase64String: string = ""
  snapshotFaceDataUrl: string =""
  previousText: string = ''
  isPaused: boolean = false;
  faceDetected: boolean = false;
  isAttendanceDisplayed: boolean = false;
  utterance = new SpeechSynthesisUtterance()

 async ngOnInit() {
    this.video = document.getElementById("video");
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.faceCanvas = document.getElementById("faceCanvas");

    this.faceCtx = this.faceCanvas.getContext("2d");

    const main = async () => {
      if(!this.isPaused) {
        const prediction = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 })).withFaceLandmarks()
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        if(prediction.length > 1){
            this.cameraWarning = "Please only 1 person face the camera"
            this.playText("Please only 1 person face the camera")
            this.cameraMessage = ''
            this.drawBoxForDetectedFaces(prediction)
        }
        else if(prediction.length == 1){

          this.cameraWarning = ''
            this.drawBoxForDetectedFaces(prediction)
            this.drawBoxForFacePlacement(prediction)
        }
        else{
          this.cameraMessage = ''
          this.cameraWarning = ''
            this.faceDetected = false;
        }
      }
    }

    this.countDown();
    this.setupCamera();
    await Promise.all([
      await faceapi.nets.tinyFaceDetector.loadFromUri('../../assets/models'),
      await faceapi.nets.faceLandmark68Net.loadFromUri('../../assets/models')
    ]).then(
      this.video.addEventListener("loadeddata", async () => {
        setInterval(main, 100);
      })
    )
  }

  playText(text: any) {
    if ((text == this.previousText && this.previousText != "You already logged two times today") || speechSynthesis.speaking) return
    this.previousText = text
    this.utterance.text = text
    this.utterance.rate = 1
    speechSynthesis.speak(this.utterance)
  }

  setupCamera(){
    navigator.mediaDevices.getUserMedia({
        video: {width: this.canvas.width, height: this.canvas.height},
        audio: false,
    })
    .then((stream) => {
      this.video.srcObject = stream;
    })
  }

  saveFace(faceToRecognize: FaceToRecognize){
    this.faceToRecognizeService.add(faceToRecognize).subscribe({
      next:(data) =>{
        if(data.status){
          this.predictedPerson = data.value
          this.getEmployee(data.value.pairId);

        }else{
          this.faceToRecognize = {
            loggedTime: ""
          }
          data.value.forEach((error: string) => {
              this.toastr.error('ERROR!', error);
            });
        }
      },
      error:(e)=>{
        this.toastr.error('ERROR!', "Something went wrong");
        this.cameraWarning = "Please try again"
        this.playText("Please try again")
        this.isPaused = false;
      }
    })
  }

  public getEmployee(id: number): void {
    this.employeeService.getEmployeeById(id).subscribe({
      next:(data) =>{
        if(data.status){
          const attendancelog : AttendanceLog = {
            timeLog: this.formatDate(new Date()),
            base64String: this.snapshotFaceBase64String,
            employeeCode: data.value.code
          }
          this.onAddLog(attendancelog)
        }else{
          this.faceToRecognize = {
            loggedTime: ""
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


  async countDown () {
    let seconds = 1
    let counter = seconds
    setInterval(() =>{
      if(this.faceDetected && !speechSynthesis.speaking  && !this.isPaused ){
        this.countDownMessage = "Please stay still";
        counter--;
        if (counter < 0) {
          counter = seconds;
          this.countDownMessage = "";
            this.isPaused = true;
            this.extractFaceFromBox(this.video, this.roi)
        }
      }
      else{
        this.countDownMessage = ''
          counter = seconds;
      }
    }, 1000);
  }

  public onAddLog(attendancelog: AttendanceLog): void {
    this.attendanceLogService.add(attendancelog).subscribe({
      next:(data) =>{
        if(data.status){
          if(data.value.attendanceLogTypeName == "TimeOut"){
            this.playText("Good evening " + this.predictedPerson.firstName)
            this.greetingMessage = "Good evening"
          }
          else if(data.value.attendanceLogTypeName == "TimeIn"){
          this.playText("Good morning" + this.predictedPerson.firstName)
          this.greetingMessage = "Good morning"
          }
          this.isAttendanceDisplayed = true;
        }
        else{
          data.value.forEach((error: string) => {
              this.toastr.error('ERROR!', error);
            });
        this.isAttendanceDisplayed = false;
        }
        this.isPaused = false;
      },
      error:(e)=>{
        this.toastr.error('ERROR!', "Something went wrong");
        this.cameraWarning = "Please try again"
        this.playText("Please try again")
        this.isPaused = false;
      }
    });
  }

  async extractFaceFromBox (inputImage: any, box: any) {
    const regionsToExtract = [
        new faceapi.Rect( box.x, box.y , box.width , box.height)
    ]

    let faceImages = await faceapi.extractFaces(inputImage, regionsToExtract)

    if(faceImages.length == 0){
      this.cameraWarning = 'Face not found'
      this.playText('Face not found')
    }
    else
    {

      faceImages.forEach(cnv =>{
        this.snapshotFaceDataUrl = cnv.toDataURL();
      })
      this.faceCtx.drawImage(inputImage, 0, 0, this.faceCanvas.width, this.faceCanvas.width)

      this.snapshotFaceBase64String = this.faceCanvas.toDataURL().replace('data:', '').replace(/^.+,/, '')
      const faceToRecognize = {
        base64String:  this.snapshotFaceBase64String,
        loggedTime: this.formatDate(new Date())
      }

    this.saveFace(faceToRecognize)
    }
  }

padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}
formatDate(date: Date) {
  return (
    [
      date.getFullYear(),
      this.padTo2Digits(date.getMonth() + 1),
      this.padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
      this.padTo2Digits(date.getHours()),
      this.padTo2Digits(date.getMinutes()),
      this.padTo2Digits(date.getSeconds()),
    ].join(':')
  );
}

  drawBox(lineWidth:  any, color:  any, x:  any, y:  any, width:  any, height:  any){
    this.ctx.beginPath();
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.rect(x, y, width, height);
    this.ctx.stroke();
  }

  drawBoxForDetectedFaces(prediction: any){
    prediction.forEach((pred: any) => {
      this.drawBox("4", "blue", pred.detection.box.x, pred.detection.box.y, pred.detection.box.width, pred.detection.box.height)
    })
  }

  drawBoxForFacePlacement (prediction: any){
    prediction.forEach((pred: any) => {
      const widthSpace = 300;
      const heightSpace = 100;

      if(pred.detection.box.x > widthSpace && pred.detection.box.y > heightSpace && pred.detection.box.width + pred.detection.box.x < this.canvas.width - widthSpace &&
        pred.detection.box.height + pred.detection.box.y < this.canvas.height - heightSpace){
          if(pred.landmarks.positions[44].x - pred.landmarks.positions[37].x < 120){
            this.cameraMessage = 'Please move closer to the camera'
            this.playText('Please move closer to the camera')
            this.drawBox("4", "orange", widthSpace, heightSpace, this.canvas.width - (widthSpace * 2), this.canvas.height - (heightSpace * 2));
            this.faceDetected = false;
          }
          else{
            this.roi = pred.detection.box;
            this.cameraMessage = ''
            this.drawBox("4", "green", widthSpace, heightSpace, this.canvas.width - (widthSpace * 2), this.canvas.height - (heightSpace * 2));
            this.faceDetected = true;
          }
      }
      else{
        this.cameraMessage = 'Please put your face inside the box'
          this.playText('Please put your face inside the box')
          this.drawBox("4", "red", widthSpace, 100, this.canvas.width - (widthSpace * 2), this.canvas.height - (100 * 2));
          this.faceDetected = false;
      }
    })
  }
}
