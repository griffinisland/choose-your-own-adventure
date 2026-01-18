// Admin user credentials
// In production, these should be stored securely (environment variables, database with hashed passwords)
export const ADMIN_USERS = [
  {
    username: 'Griffin',
    password: 'L@B0mbay',
  },
  {
    username: 'Ysa',
    password: 'jilly10',
  },
];

export function validateAdminCredentials(
  username: string,
  password: string
): boolean {
  return ADMIN_USERS.some(
    (user) => user.username === username && user.password === password
  );
}

export function isAdminUsername(username: string): boolean {
  return ADMIN_USERS.some((user) => user.username === username);
}
