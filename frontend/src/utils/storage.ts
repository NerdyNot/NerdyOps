// utils/storage.ts
export const loadUser = () => {
  try {
    const serializedUser = localStorage.getItem('user');
    if (!serializedUser) {
      return undefined;
    }
    return JSON.parse(serializedUser);
  } catch (err) {
    console.error('Could not load user', err);
    return undefined;
  }
};

export const saveUser = (user: { name: string; email: string; role: string }) => {
  try {
    if (!user || typeof user !== 'object') {
      throw new Error('Invalid user object');
    }
    const serializedUser = JSON.stringify(user);
    localStorage.setItem('user', serializedUser);
  } catch (err) {
    console.error('Could not save user', err);
  }
};

export const clearUser = () => {
  try {
    localStorage.removeItem('user');
  } catch (err) {
    console.error('Could not clear user', err);
  }
};
