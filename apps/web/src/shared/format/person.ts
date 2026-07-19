export function displayName(person: { name: string; preferredName?: string | null }): string {
  return person.preferredName?.trim() || person.name;
}

export function initials(person: { name: string; preferredName?: string | null }): string {
  const parts = displayName(person).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts.at(-1)![0]}`.toUpperCase();
}
