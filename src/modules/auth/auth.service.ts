import { AuthResponse } from './auth.types';

// Service placeholder for auth flows.
export const authService = {
  loginWithMock: async (): Promise<AuthResponse> => {
    return { userId: 'mock-user-id', token: 'mock-token' };
  }
};
