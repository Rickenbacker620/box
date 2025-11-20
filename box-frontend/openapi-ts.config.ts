import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  // Use the localhost URL directly - Hey API will fetch from it
  input: 'http://localhost:8787/openapi/json',
  output: 'src/client',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    '@tanstack/react-query',
  ],
});