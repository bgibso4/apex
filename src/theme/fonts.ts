/**
 * APEX Design System -- Font Tokens
 *
 * To swap the APEX wordmark font, change APEX_FONT_FAMILY below.
 * Available: 'Exo2-ExtraBold', 'Orbitron-ExtraBold', 'System'
 */

/** Font family for the APEX wordmark. 'System' = platform default. */
export const APEX_FONT_FAMILY: string = 'Exo2-ExtraBold';

/**
 * Custom fonts to load via expo-font.
 * Key = font name used in styles, Value = require() path.
 */
export const CUSTOM_FONTS: Record<string, any> = {
  'Exo2-ExtraBold': require('../../assets/fonts/Exo2-ExtraBold.ttf'),
  'Orbitron-ExtraBold': require('../../assets/fonts/Orbitron-ExtraBold.ttf'),
};
