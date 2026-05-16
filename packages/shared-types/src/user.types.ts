export interface IUser {
  _id: string;
  username: string;
  email: string;
  avatarColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  _id: string;
  username: string;
  avatarColor: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}
