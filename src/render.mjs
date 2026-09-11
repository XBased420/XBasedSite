import { services, projects, skills } from './content.mjs';

export const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

const cta = (label = 'Start a project', extraClass = '') => `<a class="terminal-button${extraClass ? ` ${extraClass}` : ''}" href="#booking">${label}</a>`;
const contact = (label = 'Email Xavier') => `<a class="email-link text-link" href="#email-fallback">${label}</a>`;
const field = (id, label, options = {}) => `<div class="field ${options.wide ? 'wide' : ''}"><label for="${id}">${label}${options.required ? ' <span aria-hidden="true">*</span>' : ' <span class="optional">Optional</span>'}</label>${options.textarea ? `<textarea id="${id}" name="${id}" rows="5" maxlength="4000"` : `<input id="${id}" name="${id}" type="${options.type || 'text'}" maxlength="${options.max || 200}" ${options.autocomplete ? `autocomplete="${options.autocomplete}"` : ''}`} ${options.required ? 'required' : ''} aria-describedby="${id}-error" ${options.type === 'tel' ? 'inputmode="tel"' : ''}>${options.textarea ? '</textarea>' : ''}<span class="field-error" id="${id}-error"></span></div>`;
const select = (id, label, choices, required = false) => `<div class="field"><label for="${id}">${label}${required ? ' <span aria-hidden="true">*</span>' : ' <span class="optional">Optional</span>'}</label><select id="${id}" name="${id}" ${required ? 'required' : ''} aria-describedby="${id}-error"><option value="">${required ? 'Pick what feels closest' : 'Choose if you like'}</option>${choices.map(choice => `<option>${escape(choice)}</option>`).join('')}</select><span class="field-error" id="${id}-error"></span></div>`;

export function renderPage({ settings, site, base = '/' }) {
  const asset = path => `${base}${path}`;
  const canonical = `${site}${base.startsWith('/') ? base : '/'}`;
  const ready = Boolean(settings.endpoint && settings.turnstileSiteKey);
  const config = JSON.stringify({ endpoint: settings.endpoint, turnstileSiteKey: settings.turnstileSiteKey, analyticsToken: settings.analyticsToken }).replace(/</g, '\\u003c');
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Person', '@id': `${canonical}#xavier`, name: 'Xavier', url: canonical, sameAs: ['https://github.com/XBased420'] },
    { '@type': 'LocalBusiness', '@id': `${canonical}#business`, name: settings.brand, url: canonical, founder: { '@id': `${canonical}#xavier` }, areaServed: ['Dallas', 'Carrollton', 'Dallas–Fort Worth'], description: 'Websites and booking systems for small businesses and creatives in DFW and remotely.' },
    ...services.map(([name]) => ({ '@type': 'Service', name, provider: { '@id': `${canonical}#business` }, areaServed: 'Dallas–Fort Worth' }))
  ] };
  const prices = [['One-page site', 'onePage'], ['Full site (up to 5 pages)', 'multiPage'], ['Booking system add-on', 'booking'], ['Maintenance', 'maintenance'], ['Deposit', 'deposit']];

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>XBased — Websites & booking systems | Xavier · DFW</title><meta name="description" content="Xavier builds websites and booking systems for small businesses, barbers, DJs, and artists in Dallas, Carrollton, and across DFW. Start a project.">
  ${!settings.launchReady ? '<meta name="robots" content="noindex, nofollow">' : ''}<link rel="canonical" href="${escape(canonical)}"><meta name="theme-color" content="#050905">
  <meta property="og:type" content="website"><meta property="og:title" content="XBased — Websites that pull their weight."><meta property="og:description" content="Websites and booking systems, built by Xavier. DFW + Remote."><meta property="og:url" content="${escape(canonical)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="XBased — Websites that pull their weight"><meta name="twitter:description" content="Websites and booking systems for DFW businesses and creatives.">
  <link rel="icon" type="image/svg+xml" href="${asset('favicon.svg')}"><link rel="preload" href="${asset('assets/fonts/space-grotesk-latin.woff2')}" as="font" type="font/woff2" crossorigin><link rel="preload" href="${asset('assets/fonts/manrope-latin.woff2')}" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${asset('styles.css')}"><script>document.documentElement.classList.add('js')</script><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script></head>
  <body class="terminal-locked">
    <div class="login-screen" id="login-screen" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div class="login-housing">
        <p class="hardware-stamp">XB–77 / CIVIC INFORMATION SYSTEM</p>
        <div class="login-glass crt">
          <div class="login-status"><span>XBASED NETWORK ACCESS</span><span>NODE: DFW–TX</span></div>
          <div class="login-copy">
            <p class="login-command">C:\\XBASED\\PUBLIC&gt; authenticate visitor</p>
            <h1 id="login-title">Welcome.</h1>
            <p>Click login to access.</p>
            <button class="terminal-button login-button" id="terminal-login" type="button" autofocus>Login</button>
            <p class="login-hint">PUBLIC ACCESS / PROJECT RECORDS / SERVICE REQUESTS</p>
          </div>
        </div>
        <div class="hardware-lights" aria-hidden="true"><span>POWER</span><i></i><span>DATA</span><i></i><b>PROPERTY OF XBASED FIELD SERVICES</b></div>
      </div>
    </div>

    <div class="terminal-app" id="terminal-app">
      <a class="skip-link" href="#main">Skip to terminal content</a>
      <div class="machine-shell">
        <p class="machine-stamp" data-boot>XB–77 / CIVIC INFORMATION SYSTEM</p>
        <div class="screen crt">
          <header class="system-bar" data-boot>
            <a class="wordmark" href="#home" aria-label="XBased home">x[based].</a>
            <span class="system-title">XBASED MUNICIPAL SERVICE TERMINAL</span>
            <span class="status"><i></i> AVAILABLE FOR NEW WORK</span>
            <button class="sound-toggle" id="sound-toggle" type="button" aria-pressed="true">SOUND: ON</button>
            <span class="clock" id="terminal-clock">00:00:00</span>
          </header>
          <div class="console-grid">
            <nav class="directory" aria-label="Main navigation" data-boot>
              <p>DIRECTORY</p>
              <a class="active" href="#home">HOME</a>
              <a href="#work">WORK RECORDS</a>
              <a href="#services">SERVICES + RATES</a>
              <a href="#process">BUILD PROCESS</a>
              <a href="#about">OPERATOR</a>
              <a class="contract-link float-signal" href="#booking">NEW CONTRACT</a>
              <div class="machine-readout">
                <span>LOCAL NODE</span><strong>DFW–TX</strong>
                <span>RESPONSE TIME</span><strong>&lt; 24 HOURS</strong>
                <span>SYSTEM STATE</span><strong>${ready ? 'ONLINE' : 'PREVIEW'}</strong>
              </div>
            </nav>

            <main id="main" class="console-content" tabindex="-1">
              <section id="home" class="hero terminal-view active" aria-labelledby="hero-title">
                <p class="boot-line" data-boot>PERSONAL TERMINAL ONLINE // OPERATOR: XAVIER</p>
                <h1 id="hero-title" data-boot>Websites that pull their weight.</h1>
                <p class="hero-copy" data-boot>I build sites, booking systems, and practical automations for small businesses and creatives in DFW and beyond.</p>
                <div class="prompt-line" aria-hidden="true" data-boot><span>&gt;</span><span>run start_project.exe</span><b></b></div>
                <div data-boot>${cta('Open project request', 'float-signal')}</div>
                <div class="hero-readout" data-boot><span>DALLAS–FORT WORTH, TEXAS</span><a href="#work">Read work records ↓</a></div>
              </section>

              <section id="work" class="terminal-section terminal-view" aria-labelledby="work-title">
                <div class="section-command" data-boot><span>C:\\XBASED&gt;</span><span>open work_records.dir</span></div>
                <header class="section-head" data-boot><div><p>RECENT RECORDS</p><h2 id="work-title">Work built around real problems.</h2></div><p>Client work, works in progress, and personal builds kept in the same public archive.</p></header>
                <div class="projects">
                  ${projects.map((project, index) => `<details class="project" data-boot><summary><span class="record-number">${String(index + 1).padStart(2, '0')}</span><div><span class="project-category">${escape(project.category)}</span><h3>${escape(project.name)}</h3><p>${escape(project.line)}</p></div><span class="badge ${project.status === 'LIVE' ? 'live' : ''}">${escape(project.status)}</span><span class="expand-icon" aria-hidden="true">+</span></summary><div class="case-content"><div class="case-columns"><div><h4>THE PROBLEM</h4><p>${escape(project.problem)}</p></div><div><h4>WHAT I BUILT</h4><p>${escape(project.built)}</p></div></div><h4>TOOLS</h4><div class="chips">${project.stack.map(tool => `<span>${escape(tool)}</span>`).join('')}</div>${project.stackPending ? `<p class="placeholder">${escape(project.stackPending)}</p>` : ''}${project.screenshot ? `<img src="${asset(project.screenshot)}" alt="${escape(project.name)} website screenshot" width="1600" height="1000" loading="lazy" decoding="async">` : `<div class="screenshot-slot"><span>PROJECT IMAGE PENDING</span><p>[[NEEDS XAVIER: screenshot — ${escape(project.name)}]]</p></div>`}${project.url ? `<a class="text-link" href="${escape(project.url)}" target="_blank" rel="noopener noreferrer">Visit live site ↗</a>` : ''}</div></details>`).join('')}
                </div>
              </section>

              <section id="services" class="terminal-section terminal-view" aria-labelledby="services-title">
                <div class="section-command" data-boot><span>C:\\XBASED&gt;</span><span>list services --with-rates</span></div>
                <header class="section-head" data-boot><div><p>SERVICE DIRECTORY</p><h2 id="services-title">A good site. Less busywork.</h2></div><p>Choose the closest entry. We’ll work out the exact scope together before anything starts.</p></header>
                <div class="services">
                  ${services.map(([name, description], index) => `<article class="service" data-boot><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${escape(name)}</h3><p>${escape(description)}</p></div></article>`).join('')}
                </div>
                <div class="pricing" data-boot><div><p>STARTING RATES</p><h3>Know where you stand.</h3><p>Scope and price are agreed before the build begins.</p></div><div class="price-list">${prices.map(([label, key]) => `<div><span>${label}</span><strong>${settings.pricesApproved && settings.prices[key] !== null ? (key === 'deposit' ? `${settings.prices[key]}%` : `$${settings.prices[key].toLocaleString('en-US')}${key === 'maintenance' ? '/mo' : ''}`) : '<span class="pending-price">TO BE CONFIRMED</span>'}</strong></div>`).join('')}${!settings.pricesApproved ? '<p class="placeholder">[[NEEDS XAVIER: approve final price card]]</p>' : ''}</div></div>
              </section>

              <section id="process" class="terminal-section terminal-view" aria-labelledby="process-title">
                <div class="section-command" data-boot><span>C:\\XBASED&gt;</span><span>run build_process.exe</span></div>
                <header class="section-head" data-boot><div><p>BUILD PROCESS</p><h2 id="process-title">One operator. Four clear steps.</h2></div><p>You talk directly with Xavier from the first message through launch.</p></header>
                <ol class="steps">
                  <li data-boot><span>01 / INPUT</span><h3>Tell me the idea.</h3><p>Fill out the request below. Rough ideas are fine.</p><b>AT YOUR PACE</b></li>
                  <li data-boot><span>02 / RESPONSE</span><h3>I’ll get back to you.</h3><p>I’ll email a few times to talk and a rough quote.</p><b>WITHIN 24 HOURS</b></li>
                  <li data-boot><span>03 / BUILD</span><h3>Agree. Then build.</h3><p>We settle the scope, cost, and schedule before I start.</p><b class="${!settings.processApproved ? 'placeholder' : ''}">${escape(settings.buildTiming)}</b></li>
                  <li data-boot><span>04 / LAUNCH</span><h3>Review it. Go live.</h3><p>You send feedback. I finish the agreed changes and publish.</p><b class="${!settings.processApproved ? 'placeholder' : ''}">${escape(settings.reviewTiming)}</b></li>
                </ol>
              </section>

              <section id="about" class="terminal-section terminal-view about" aria-labelledby="about-title">
                <div class="section-command" data-boot><span>C:\\XBASED&gt;</span><span>read operator_profile.txt</span></div>
                <div class="about-grid">
                  <div data-boot><p>OPERATOR PROFILE</p><h2 id="about-title">Xavier<br>DFW–TX</h2><span class="operator-status">SELF-TAUGHT BUILDER / ACTIVE</span></div>
                  <div class="about-copy"><p class="lead" data-boot>I’ve been in restaurants since I was 16. I know what it’s like to have work to do and tools that get in the way.</p><p data-boot>When I worked as a personal assistant to a college professor in Long Beach, California, I started learning AI skills early. I took what I learned and put it to work on my own projects and business ventures.</p><p data-boot>No degree, no big agency handoff. I like making useful things and figuring out how to make them better.</p><div class="skills" data-boot><p>WORKING TOOLSET</p><div class="chips">${skills.map(skill => `<span>${escape(skill)}</span>`).join('')}</div></div></div>
                </div>
              </section>

              <section id="booking" class="terminal-section terminal-view booking-section" aria-labelledby="booking-title">
                <div class="section-command" data-boot><span>C:\\XBASED&gt;</span><span>run new_contract.exe</span></div>
                <div class="booking-layout">
                  <div class="booking-intro" data-boot><p>NEW CONTRACT / INTAKE</p><h2 id="booking-title">What should we put online?</h2><p>Tell me about your business and what you need. You don’t need to know the technical terms.</p><p>I’ll reply within 24 hours with a few times to talk and a rough quote.</p>${contact('Rather send an email?')}<p class="email-fallback" id="email-fallback">Email: calipxj <span aria-label="at">[at]</span> gmail <span aria-label="dot">[dot]</span> com</p></div>
                  <div class="form-container" data-boot>${!ready ? '<div class="setup-notice" role="note">PREVIEW MODE // Requests are not connected yet. You can test the fields or email Xavier.</div>' : ''}<form id="booking-form" novalidate><p class="form-key">FIELDS MARKED * ARE REQUIRED.</p><div class="form-grid">${field('name', 'Your name', { required: true, autocomplete: 'name' })}${field('email', 'Email', { required: true, type: 'email', autocomplete: 'email' })}${field('phone', 'Phone', { required: true, type: 'tel', autocomplete: 'tel', max: 30 })}${field('business', 'Business name', { required: true, autocomplete: 'organization' })}${field('type', 'Type of business')}${select('hasSite', 'Do you have a site now?', ['Yes', 'No', 'Sort of'])}${field('needs', 'What do you need?', { required: true, textarea: true, wide: true })}${select('budget', 'What budget feels comfortable?', ['Something simple — $100–$500', '$500–$1,000', '$1,000–$2,500', '$2,500+', 'Not sure yet — tell me what it should cost'], true)}${select('timeline', 'When are you thinking?', ['ASAP', 'Few weeks', 'Few months', 'Just exploring'])}${field('socials', 'Your Instagram / socials')}${field('source', 'How’d you find me?')}</div><div class="honeypot" aria-hidden="true" inert><label for="website">Leave this empty</label><input id="website" name="website" type="text" tabindex="-1" autocomplete="off"></div><p class="small">Have photos or files? Email them after you submit.</p><p class="small">Your details are used only to respond to this request. Don’t include sensitive information.</p><div id="turnstile" class="turnstile-space" aria-label="Spam protection">${!ready ? '<span class="small">SPAM PROTECTION WILL APPEAR WHEN THE FORM IS CONNECTED.</span>' : ''}</div><div id="form-error" class="form-message" role="alert" hidden></div><button class="terminal-button submit" type="submit">Send project request</button><p class="small">A request starts a conversation. It doesn’t commit you to a project.</p><noscript><p>Please enable JavaScript to use the request form, or email Xavier.</p></noscript></form><section id="form-success" class="form-success" hidden tabindex="-1" aria-labelledby="success-title"><span>NEXT STEP: CHECK YOUR INBOX</span><h3 id="success-title">Your request is on its way.</h3><p>Look for a confirmation email. Once it arrives, I have your request and will reply within 24 hours.</p>${contact('Email Xavier')}<button class="text-button" id="send-another" type="button">Send another request</button></section></div>
                </div>
              </section>

              <footer class="footer" data-boot><a class="wordmark" href="#home">x[based].</a><p>BUILT BY XAVIER / DFW + REMOTE</p><div>${contact()}<a href="https://github.com/XBased420" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="#home">Back to top ↑</a></div></footer>
            </main>
          </div>
        </div>
        <div class="hardware-row" aria-hidden="true" data-boot><span>POWER</span><i></i><span>DATA</span><i></i><b>PROPERTY OF XBASED FIELD SERVICES</b></div>
      </div>
    </div>
    <script type="application/json" id="site-config">${config}</script><script defer src="${asset('site.js')}"></script>
  </body></html>`;
}
