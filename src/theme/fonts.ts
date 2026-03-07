/**
 * APEX Design System -- Font Tokens
 *
 * To add a custom font for the APEX wordmark:
 * 1. Drop the .ttf file into assets/fonts/
 * 2. Update APEX_FONT_FAMILY to match the font's PostScript name
 * 3. Add the file to CUSTOM_FONTS map below
 */

/** Font family for the APEX wordmark. 'System' = platform default. */
export const APEX_FONT_FAMILY = 'System';

/**
 * Custom fonts to load via expo-font.
 * Key = font name used in styles, Value = require() path.
 * Leave empty until a custom font is added.
 */
export const CUSTOM_FONTS: Record<string, any> = {};
