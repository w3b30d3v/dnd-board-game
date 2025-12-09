// D&D Class Color Themes
// Each class has a distinct color palette for visual identity

export interface ClassTheme {
  primary: string;      // Main accent color
  secondary: string;    // Secondary/highlight color
  gradient: string;     // Tailwind gradient classes
  bgGlow: string;       // Background glow color
  textColor: string;    // Text color for headings
  borderColor: string;  // Border accent
  icon: string;         // Icon color
}

export const CLASS_THEMES: Record<string, ClassTheme> = {
  barbarian: {
    primary: '#DC2626',     // Red
    secondary: '#F97316',   // Orange
    gradient: 'from-red-600/30 via-orange-500/20 to-red-700/30',
    bgGlow: 'rgba(220, 38, 38, 0.15)',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/50',
    icon: '#EF4444',
  },
  bard: {
    primary: '#EC4899',     // Pink
    secondary: '#A855F7',   // Purple
    gradient: 'from-pink-500/30 via-purple-500/20 to-pink-600/30',
    bgGlow: 'rgba(236, 72, 153, 0.15)',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/50',
    icon: '#EC4899',
  },
  cleric: {
    primary: '#FBBF24',     // Amber/Gold
    secondary: '#FFFFFF',   // White (divine light)
    gradient: 'from-amber-500/30 via-yellow-300/20 to-amber-600/30',
    bgGlow: 'rgba(251, 191, 36, 0.2)',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-400/50',
    icon: '#FBBF24',
  },
  druid: {
    primary: '#22C55E',     // Green
    secondary: '#84CC16',   // Lime
    gradient: 'from-green-600/30 via-emerald-500/20 to-green-700/30',
    bgGlow: 'rgba(34, 197, 94, 0.15)',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/50',
    icon: '#22C55E',
  },
  fighter: {
    primary: '#6B7280',     // Gray/Steel
    secondary: '#F59E0B',   // Gold trim
    gradient: 'from-gray-500/30 via-slate-400/20 to-gray-600/30',
    bgGlow: 'rgba(107, 114, 128, 0.15)',
    textColor: 'text-gray-300',
    borderColor: 'border-gray-400/50',
    icon: '#9CA3AF',
  },
  monk: {
    primary: '#14B8A6',     // Teal
    secondary: '#F59E0B',   // Gold (ki energy)
    gradient: 'from-teal-600/30 via-cyan-500/20 to-teal-700/30',
    bgGlow: 'rgba(20, 184, 166, 0.15)',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/50',
    icon: '#14B8A6',
  },
  paladin: {
    primary: '#3B82F6',     // Blue
    secondary: '#FBBF24',   // Gold
    gradient: 'from-blue-500/30 via-sky-400/20 to-blue-600/30',
    bgGlow: 'rgba(59, 130, 246, 0.15)',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/50',
    icon: '#60A5FA',
  },
  ranger: {
    primary: '#65A30D',     // Lime/Forest green
    secondary: '#854D0E',   // Brown
    gradient: 'from-lime-600/30 via-green-500/20 to-lime-700/30',
    bgGlow: 'rgba(101, 163, 13, 0.15)',
    textColor: 'text-lime-400',
    borderColor: 'border-lime-500/50',
    icon: '#84CC16',
  },
  rogue: {
    primary: '#1F2937',     // Dark gray
    secondary: '#A855F7',   // Purple
    gradient: 'from-gray-800/50 via-purple-900/30 to-gray-900/50',
    bgGlow: 'rgba(31, 41, 55, 0.3)',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/50',
    icon: '#A855F7',
  },
  sorcerer: {
    primary: '#F97316',     // Orange
    secondary: '#EF4444',   // Red
    gradient: 'from-orange-500/30 via-red-500/20 to-orange-600/30',
    bgGlow: 'rgba(249, 115, 22, 0.15)',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/50',
    icon: '#F97316',
  },
  warlock: {
    primary: '#7C3AED',     // Violet
    secondary: '#10B981',   // Emerald (eldritch)
    gradient: 'from-violet-600/30 via-purple-800/20 to-violet-700/30',
    bgGlow: 'rgba(124, 58, 237, 0.15)',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/50',
    icon: '#8B5CF6',
  },
  wizard: {
    primary: '#6366F1',     // Indigo
    secondary: '#8B5CF6',   // Purple
    gradient: 'from-indigo-600/30 via-blue-500/20 to-indigo-700/30',
    bgGlow: 'rgba(99, 102, 241, 0.15)',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/50',
    icon: '#818CF8',
  },
};

// Default theme for unknown classes
export const DEFAULT_THEME: ClassTheme = {
  primary: '#F59E0B',
  secondary: '#8B5CF6',
  gradient: 'from-amber-500/20 via-purple-500/10 to-amber-600/20',
  bgGlow: 'rgba(245, 158, 11, 0.1)',
  textColor: 'text-primary',
  borderColor: 'border-primary/50',
  icon: '#F59E0B',
};

export function getClassTheme(className: string): ClassTheme {
  return CLASS_THEMES[className.toLowerCase()] || DEFAULT_THEME;
}

// CSS variable injection helper
export function getClassThemeStyles(className: string) {
  const theme = getClassTheme(className);
  return {
    '--class-primary': theme.primary,
    '--class-secondary': theme.secondary,
    '--class-glow': theme.bgGlow,
  } as React.CSSProperties;
}
