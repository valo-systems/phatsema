export const WORK_PHONE_PATTERN = /^\+?[0-9 ()-]{7,32}$/;

export function validatePersonalProfile(input: {
  name: string;
  preferredName: string;
  workPhone: string;
  bio: string;
}): string[] {
  return [
    ...(!input.name.trim() ? ['Enter your full name.'] : []),
    ...(input.name.length > 120 ? ['Full name cannot exceed 120 characters.'] : []),
    ...(input.preferredName.length > 80 ? ['Preferred name cannot exceed 80 characters.'] : []),
    ...(input.workPhone && !WORK_PHONE_PATTERN.test(input.workPhone)
      ? ['Enter a valid work phone number using digits, spaces, brackets, plus, or hyphens.']
      : []),
    ...(input.bio.length > 500 ? ['Biography cannot exceed 500 characters.'] : []),
  ];
}

export function validatePasswordChange(input: {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}): string[] {
  return [
    ...(!input.currentPassword ? ['Enter your current password.'] : []),
    ...(input.newPassword.length < 12 ? ['New password must contain at least 12 characters.'] : []),
    ...(input.newPassword.length > 100 ? ['New password cannot exceed 100 characters.'] : []),
    ...(input.newPassword === input.currentPassword && input.newPassword
      ? ['New password must differ from your current password.']
      : []),
    ...(input.newPassword !== input.newPasswordConfirmation ? ['New password confirmation does not match.'] : []),
  ];
}
