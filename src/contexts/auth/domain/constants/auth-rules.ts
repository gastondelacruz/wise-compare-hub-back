/**
 * Domain constants for authentication rules
 */
export const AUTH_RULES = {
  MOCK_USERS: [
    {
      id: 'user-1',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    },
    {
      id: 'user-2',
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
    },
  ] as const,
} as const;
