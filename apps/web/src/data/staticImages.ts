// Static images module - DEPRECATED
// Race, class, and background selection screens now use emoji icons instead of images
// Character portraits are generated via NanoBanana AI after character creation

// These exports are kept for backwards compatibility but are no longer used
export const RACE_IMAGES: Record<string, string> = {};
export const CLASS_IMAGES: Record<string, string> = {};
export const BACKGROUND_IMAGES: Record<string, string> = {};

export function getRaceImage(_raceId: string): string {
  return '';
}

export function getClassImage(_classId: string): string {
  return '';
}

export function getBackgroundImage(_backgroundId: string): string {
  return '';
}
