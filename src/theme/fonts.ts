/**
 * APEX Design System -- Font Tokens
 *
 * To swap the APEX wordmark font, change APEX_FONT_FAMILY below.
 * Available options: 'Orbitron-ExtraBold', 'Anton-Regular', 'Oswald-Bold', 'BarlowCondensed-ExtraBold', 'System'
 */

/** Font family for the APEX wordmark. 'System' = platform default. */
export const APEX_FONT_FAMILY: string = 'Orbitron-ExtraBold';

/**
 * Custom fonts to load via expo-font.
 * Key = font name used in styles, Value = require() path.
 */
export const CUSTOM_FONTS: Record<string, any> = {
  'Orbitron-ExtraBold': require('../../assets/fonts/Orbitron-ExtraBold.ttf'),
};
