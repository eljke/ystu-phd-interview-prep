import { validateRuntimeConfig } from '../src/shared/config/runtimeConfig';

const errors = validateRuntimeConfig(process.env);
if (errors.length) {
  console.error(`Production configuration is invalid:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Production Supabase configuration is valid.');
}
