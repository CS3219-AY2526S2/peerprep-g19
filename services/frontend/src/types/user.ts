export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  data: {
    accessToken: string;
  } & User;
}

export interface UserResponse {
  message: string;
  data: User;
}

export interface UsersResponse {
  message: string;
  data: User[];
}
