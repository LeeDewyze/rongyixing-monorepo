/** Generic API response wrapper for backend DTOs. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/** Pagination metadata shared across list endpoints. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

/** Credentials for login. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Authenticated user profile. */
export interface UserDto {
  id: string;
  username: string;
  displayName: string;
}

/** Login response payload. */
export interface LoginResponse {
  user: UserDto;
  accessToken: string;
}
