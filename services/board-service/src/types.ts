export interface AuthTokenPayload {
  userId:   string;
  email:    string;
  username: string;
  iat?:     number;
  exp?:     number;
}
