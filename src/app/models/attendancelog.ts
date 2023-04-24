export interface AttendanceLog{
  id?: number,
  timeLog?: string,
  imageName?: string,
  base64String?: string,
  attendanceLogStateName?: string,
  attendanceLogTypeName?: string,
  attendanceLogStatusName?: string,
  employeeCode?: string,
  employeeFirstName?: string,
  employeeMiddleName?: string,
  employeeLastName?: string,
  toDelete?: boolean
}
