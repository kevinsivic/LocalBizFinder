// This file exposes environment variables to the client
// Values are injected at build time via server/vite.ts

// Define default values (for development)
let swetrixProjectId: string | undefined = import.meta.env.VITE_SWETRIX_PROJECT_ID as string;

// If not available in Vite environment, try to load from global window object
// The server can inject these values via a script tag
if (!swetrixProjectId && typeof window !== 'undefined') {
  const envVars = (window as any).__ENV_VARS__;
  if (envVars && envVars.SWETRIX_PROJECT_ID) {
    swetrixProjectId = envVars.SWETRIX_PROJECT_ID;
  }
}

// Debug output in development
if (import.meta.env.DEV) {
  console.debug('[ENV] Environment variables:', { 
    SWETRIX_PROJECT_ID: swetrixProjectId || '(not set)'
  });
}

export const ENV = {
  SWETRIX_PROJECT_ID: swetrixProjectId,
  IS_PRODUCTION: import.meta.env.PROD === true,
  IS_DEVELOPMENT: import.meta.env.DEV === true,
};