export interface AuthenticatedUser {
  address: string;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
}
