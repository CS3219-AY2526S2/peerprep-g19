export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface UserResponse {
  message: string;
  data: User;
}

export interface UsersResponse {
  message: string;
  data: User[];
}
