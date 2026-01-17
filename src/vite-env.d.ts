/// <reference types="vite/client" />

/**
 * Sigma AI Career Advisor - Vite Environment Types
 * @version 1.0.0
 * @updated January 2025
 * 
 * Type definitions for Vite environment variables and imports
 */

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
