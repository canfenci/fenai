/// <reference types="@cloudflare/workers-types" />

interface Env {
  PLATFORM_GEMINI_KEY: string;
  PLATFORM_ENABLED: string;
  PLATFORM_DAILY_LIMIT: string;
  PLATFORM_PER_USER_DAILY: string;
}
