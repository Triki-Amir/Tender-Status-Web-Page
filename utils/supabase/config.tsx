// Configuration for Supabase and API endpoints
import { projectId } from './info.tsx';

// API Configuration
// The path segment should match your Supabase Edge Function deployment
export const API_PATH_SEGMENT = 'make-server-d54e322d';

// Build API base URL from project configuration
export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/server/${API_PATH_SEGMENT}`;

// Supabase URL
export const SUPABASE_URL = `https://${projectId}.supabase.co`;
