export interface User {
  id: string;
  name: string;
  email: string;
}

export function getUser(id: string): User | null {
  // In a real application, you would fetch this from a database
  if (id === '1') {
    return {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    };
  }
  return null;
}
