export interface Employee{
  id?: number,
  firstName?: string,
  middleName?: string,
  lastName?: string,
  emailAddress?: string,
  code?: string,
  employeeRoleName?: string,
  profilePictureImageName?: string,
  password?: string,
  accessToken?: string,
  refreshToken?: string,
  refreshTokenExpiryTime?: Date,
  imageFile?:File,
  toDelete?: boolean
}

