// Public settings only. Turnstile SECRET belongs in Apps Script Properties.
export default {
  brand: 'x[based].',
  customDomain: '',
  repository: 'XBasedSite',
  owner: 'XBased420',
  endpoint: 'https://script.google.com/macros/s/AKfycbyAwfOfFmh3bZZ609TDgqd3yoiFWtreA59uA7iNb5Im2lvYqObRvtE52qDUnCDrt49i/exec',
  turnstileSiteKey: '',
  analyticsToken: '',
  pricesApproved: true,
  prices: { onePage: 450, multiPage: 1200, booking: 600, maintenance: 125, deposit: 50 },
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
