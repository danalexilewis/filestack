import { getUser } from './user';

describe('getUser', () => {
  it('should return a user for a valid id', () => {
    const user = getUser('test');
    expect(user).not.toBeNull();
    expect(user?.name).toBe('Test User');
  });

  it('should return null for an invalid id', () => {
    const user = getUser('2');
    expect(user).toBeNull();
  });
});
