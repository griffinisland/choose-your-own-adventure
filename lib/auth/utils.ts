import { isAdminUsername } from './adminUsers';

export function isAdmin(user: { username: string } | null): boolean {
  if (!user) return false;
  return isAdminUsername(user.username);
}

export function canEditProject(
  user: { username: string } | null,
  projectOwnerId: string
): boolean {
  if (!user) return false;
  // Admins can edit any project, or if user is the owner
  return isAdmin(user) || user.username === projectOwnerId;
}
