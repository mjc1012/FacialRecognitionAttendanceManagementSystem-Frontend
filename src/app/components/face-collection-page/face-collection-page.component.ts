import { Component, OnInit } from '@angular/core';
import * as faceapi from 'face-api.js';
import { FaceExpression } from 'src/app/models/faceexpression';
import { FaceToTrainService } from 'src/app/services/face-to-train.service';
import { FaceToTrain } from 'src/app/models/facetotrain';
import { environment } from 'src/environments/environment';
import { Employee } from 'src/app/models/employee';
import { UserStoreService } from 'src/app/services/user-store.service';
import { AuthService } from 'src/app/services/auth.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { PersonService } from 'src/app/services/person.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-face-collection-page',
  templateUrl: './face-collection-page.component.html',
  styleUrls: ['./face-collection-page.component.css']
})
export class FaceCollectionPageComponent implements OnInit {

    constructor(private faceToTrainService: FaceToTrainService,
      private toastr: ToastrService, private authService: AuthService, private userStoreService: UserStoreService, private employeeService: EmployeeService, private personService: PersonService ) { }

    video: any;
    canvas: any;
    faceCanvas: any;
    faceCtx: any;
    ctx: any;
    roi: any;
    expressionMessage: string = "";
    cameraMessage: string = "";
    cameraWarning: string = "";
    countDownMessage: string = "";
    dataUrl: any;
    faceExpressionImageFile: string = ""
    numOfSavedFaces: number = 0
    previousText: string = ''
    isPaused: boolean = false;
    faceDetected: boolean = false;
    isQuestionFormDisplayed: boolean = false;
    isExpressionDisplayed: boolean = false;
    missingExpressionsId!: number[];
    savedFacesOfemployeeNum!: number;
    currentExpression!: FaceExpression;
    faceToTrain!: FaceToTrain;
    facesToTrain: FaceToTrain[] = [];
    utterance = new SpeechSynthesisUtterance()
    faceExpressionImageBaseUrl: string =environment.FaceRecognitionAPIBaseUrl+'FaceExpression/';
    faceToTrainImageBaseUrl: string =environment.FaceRecognitionAPIBaseUrl+'FaceDataset/';
    currentEmployee: Employee = {};
    deleteFace!: FaceToTrain;
    public employeeId: string = ""
    isFacesComplete: boolean = false
    currentPersonId:number = 0

    async ngOnInit() {

      this.userStoreService.getEmployeeIdFromStore().subscribe(val=>{
        const employeeIdFromToken = this.authService.getEmployeeIdFromToken()
        this.employeeId = val || employeeIdFromToken;
      })

      this.getEmployee()



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
              this.cameraWarning = "Please only 1 employee face the camera"
              this.playText("Please only 1 employee face the camera")
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


    public getEmployee(): void {
      this.employeeService.getEmployee(this.employeeId).subscribe({
        next:(data) =>{
          if(data.status){
            this.currentEmployee = data.value
            this.getMissingExpression();
          }else{
            this.currentEmployee = {
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

    getMissingExpression(){
      this.faceToTrainService.getMissingExpression(this.currentEmployee).subscribe({
        next:(data) =>{
          if(data.status && data.value){
            this.isExpressionDisplayed = true
            this.currentExpression = data.value
            this.faceExpressionImageFile = this.currentExpression.imageFile;
            this.expressionMessage = "Please follow this expression: " + this.currentExpression.name;
          }else{
            this.isExpressionDisplayed = false
            this.expressionMessage = "Face Collection Complete"
            this.isFacesComplete = true;
          }

          this.getFacesToTrain();
        },
        error:(e)=>{
          this.toastr.error('ERROR!', "Something went wrong");
        }
      })
    }

    getFacesToTrain(){
      this.faceToTrainService.getFacesByEmployeeId(this.currentEmployee).subscribe({
        next:(data) =>{
          if(data.status){
            this.facesToTrain = data.value
            this.numOfSavedFaces = data.value.length
          }else{
            this.facesToTrain = []
            this.numOfSavedFaces = 0
          }
          this.isQuestionFormDisplayed = false
          this.isPaused = false
        },
        error:(e)=>{
          this.toastr.error('ERROR!', "Something went wrong");
        }
      })
    }




    getFaceToDelete(face: FaceToTrain){
      this.deleteFace = face
    }

    onDeleteFace(id: number){
      this.isPaused = true;
      this.faceToTrainService.delete(id).subscribe({
        next:(data) =>{
          if(data.status){
            this.getMissingExpression();
            this.isPaused = false;
            this.isFacesComplete = false
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
      })
    }

    playText(text: any) {
      if (text == this.previousText || speechSynthesis.speaking) return
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

    saveFace(){
      this.faceToTrainService.add(this.faceToTrain).subscribe({
        next:(data) =>{
          if(data.status){
            this.getMissingExpression();
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
      })
    }

    startVideoAgain(){
        this.isQuestionFormDisplayed = false
        this.isPaused = false
        this.cameraWarning = "Please try again"
        this.playText("Please try again")
    }


    async countDown () {
      let seconds = 2
      let counter = seconds
      setInterval(() =>{
        if(this.faceDetected  &&   !this.isPaused && !this.isFacesComplete){
          this.playText("Please stay still")
          if(this.previousText == "Please stay still" && !speechSynthesis.speaking){
            this.countDownMessage = "Please stay still for "+counter+" seconds";
            counter--;
            if (counter < 0) {
              counter = seconds;
              this.countDownMessage = "";
                this.extractFaceFromBox(this.video, this.roi)
                this.isPaused = true;
                this.isQuestionFormDisplayed = true;
            }
          }
        }
        else if(this.isQuestionFormDisplayed && !speechSynthesis.speaking &&  this.isPaused && this.previousText != ""){
          this.playText("Are you satisfied with this picture?")
          if(this.previousText == "Are you satisfied with this picture?" && !speechSynthesis.speaking){
              this.countDownMessage = "Form will be gone in  "+counter+" seconds";
              counter--;
              if (counter < 0) {
                counter = seconds;
                this.countDownMessage = "";
                this.saveFace();
                this.previousText = ""
              }

          }
        }
        else if(this.faceDetected &&   !this.isPaused  &&  this.isFacesComplete){
          this.playText("You already completed the necessary faces")
        }
        else{
            this.countDownMessage = ''
            counter = seconds;
        }
      }, 1000);
    }

    async extractFaceFromBox (inputImage: any, box: any) {
      const regionsToExtract = [
          new faceapi.Rect( box.x, box.y , box.width , box.height)
      ]

      let faceImages = await faceapi.extractFaces(inputImage, regionsToExtract)

      if(faceImages.length == 0){
        this.toastr.error('ERROR!', "Face not Found");
      }
      else
      {
          faceImages.forEach(cnv =>{
            this.dataUrl = cnv.toDataURL();
          })

          this.faceCtx.drawImage(inputImage, 0, 0, this.faceCanvas.width, this.faceCanvas.width)
          this.faceToTrain = {
            base64String:  this.faceCanvas.toDataURL().replace('data:', '').replace(/^.+,/, ''),
            faceExpressionId: this.currentExpression.id!,
            pairId: this.currentEmployee.id!
          }
      }
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
        const spaceBetweenBoxAndVideo = 150;

        if(pred.detection.box.x > spaceBetweenBoxAndVideo && pred.detection.box.y > spaceBetweenBoxAndVideo && pred.detection.box.width + pred.detection.box.x < this.canvas.width - spaceBetweenBoxAndVideo &&
          pred.detection.box.height + pred.detection.box.y < this.canvas.height - spaceBetweenBoxAndVideo){
            if(pred.landmarks.positions[44].x - pred.landmarks.positions[37].x < 120){
              this.cameraMessage = 'Please move closer to the camera'
              this.playText('Please move closer to the camera')
              this.drawBox("4", "orange", spaceBetweenBoxAndVideo, spaceBetweenBoxAndVideo, this.canvas.width - (spaceBetweenBoxAndVideo * 2), this.canvas.height - (spaceBetweenBoxAndVideo * 2));
              this.faceDetected = false;
            }
            else{
                this.roi = pred.detection.box;
                this.cameraMessage = ''
                this.drawBox("4", "green", spaceBetweenBoxAndVideo, spaceBetweenBoxAndVideo, this.canvas.width - (spaceBetweenBoxAndVideo * 2), this.canvas.height - (spaceBetweenBoxAndVideo * 2));
                this.faceDetected = true;
            }
        }
        else{
          this.cameraMessage = 'Please put your face inside the box'
            this.playText('Please put your face inside the box')
            this.drawBox("4", "red", spaceBetweenBoxAndVideo, spaceBetweenBoxAndVideo, this.canvas.width - (spaceBetweenBoxAndVideo * 2), this.canvas.height - (spaceBetweenBoxAndVideo * 2));
            this.faceDetected = false;
        }
      })
    }


}
