// Public settings only. Turnstile SECRET belongs in Apps Script Properties.
export default {
  brand: 'XBased',
  customDomain: '',
  repository: 'xbased-site',
  owner: 'XBased420',
  endpoint: '',
  turnstileSiteKey: '',
  analyticsToken: '',
  pricesApproved: true,
  prices: { onePage: 100, multiPage: 500, booking: 200, maintenance: 100, deposit: 50 },
  processApproved: false,
  buildTiming: '[[NEEDS XAVIER: typical build time after content and deposit]]',
  reviewTiming: '[[NEEDS XAVIER: review and launch time]]',
  launchReady: false
};

export function deployment(config, repository = process.env.GITHUB_REPOSITORY) {
  const repo = repository?.split('/')[1] || config.repository;
  if (config.customDomain) return { site: `https://${config.customDomain}`, base: '/' };
  return { site: `https://${config.owner.toLowerCase()}.github.io`, base: repo.toLowerCase() === `${config.owner.toLowerCase()}.github.io` ? '/' : `/${repo}/` };
}
