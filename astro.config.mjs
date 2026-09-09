import { defineConfig } from 'astro/config';
import settings, { deployment } from './site.config.mjs';
const { site, base } = deployment(settings);
export default defineConfig({ site, base, output: 'static', trailingSlash: 'always' });
