import { supabase } from './supabase';

/**
 * Retrieves a configuration value from the Supabase global_configs table.
 * Falls back to the process.env equivalent if not found or on database error.
 * 
 * @param {string} key - The configuration key (e.g., 'FACEBOOK_ACCESS_TOKEN')
 * @param {string} [defaultValue=''] - Optional fallback value if neither is set
 * @returns {Promise<string>} The configured value
 */
export async function getConfigValue(key, defaultValue = '') {
  try {
    const { data, error } = await supabase
      .from('global_configs')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (!error && data && data.value) {
      return data.value.trim();
    }
  } catch (e) {
    console.warn(`[Config] Error loading ${key} from database, falling back:`, e);
  }
  
  // Return env value fallback
  const envVal = process.env[key];
  if (envVal) {
    // Strip inline comments if any
    return envVal.split('#')[0].trim();
  }
  return defaultValue;
}
