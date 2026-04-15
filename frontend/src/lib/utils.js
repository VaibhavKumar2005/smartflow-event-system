import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui cn() helper — merges Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
