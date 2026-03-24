// Shared UI constants used across multiple pages

export const AVATAR_COLORS = [
  '#4A82D4',
  '#4E9B6A',
  '#F07A55',
  '#C99A2E',
  '#E0655F',
  '#9B59B6',
]

export function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}
