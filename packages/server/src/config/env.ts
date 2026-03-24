import dotenv from 'dotenv';
dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  CLIENT_URL: string;
  ASI1_API_KEY: string;
  ASI1_BASE_URL: string;
  ASI1_MODEL: string;
  GITHUB_TOKEN: string;
  REDIS_URL: string;
  LOG_LEVEL: string;
}

function required(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const config: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ASI1_API_KEY: required('ASI1_API_KEY'),
  ASI1_BASE_URL: process.env.ASI1_BASE_URL || 'https://api.asi1.ai/v1',
  ASI1_MODEL: process.env.ASI1_MODEL || 'asi1-mini',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};
