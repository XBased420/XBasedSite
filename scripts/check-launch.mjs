import settings from '../site.config.mjs';
import { projects } from '../src/content.mjs';
import { existsSync } from 'node:fs';
const missing = [];
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(settings.endpoint)) missing.push('Apps Script /exec URL');
if (!settings.bookingEnabled) missing.push('booking enabled after publishing the current Apps Script version');
if (!settings.analyticsToken) missing.push('Cloudflare Web Analytics token');
if (!settings.pricesApproved || Object.values(settings.prices).some(p => typeof p !== 'number' || !Number.isFinite(p) || p < 0) || settings.prices.deposit > 100) missing.push('approved valid price card');
if (!settings.processApproved || [settings.buildTiming, settings.reviewTiming].some(s => !s || s.includes('[[NEEDS'))) missing.push('approved process timings');
for (const project of projects) {
  if (!project.screenshot || !existsSync(new URL('../public/' + project.screenshot, import.meta.url))) missing.push(`screenshot — ${project.name}`);
  if (project.stackPending || !project.stack.length) missing.push(`confirmed stack — ${project.name}`);
}
if (settings.customDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(settings.customDomain)) missing.push('valid custom domain hostname');
if (missing.length) {
  console.log('FILL THESE IN\n' + missing.map(item => `- [[NEEDS XAVIER: ${item}]]`).join('\n'));
  if (settings.launchReady || process.argv.includes('--strict')) process.exitCode = 1;
  else console.log('Draft mode: the site may publish, but booking stays visibly preview-only until production configuration is complete.');
} else console.log(settings.launchReady ? 'Launch configuration complete.' : 'Ready for final review; set launchReady to true to deploy.');
