(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('site-config').textContent);
  const email = ['calipxj', ['gmail', 'com'].join('.')].join('@');
  const wireEmail = () => document.querySelectorAll('.email-link').forEach(a => { a.href = `mailto:${email}`; a.setAttribute('aria-label', `Email Xavier at ${email}`); });
  wireEmail();
  const form = document.getElementById('booking-form');
  const error = document.getElementById('form-error');
  const success = document.getElementById('form-success');
  const button = form.querySelector('button[type=submit]');
  const originalButton = button.innerHTML;
  let token = '', widgetId, busy = false;
  const ready = Boolean(config.endpoint && config.turnstileSiteKey);
  const resetChallenge = () => { token = ''; if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId); };
  const fail = message => {
    error.replaceChildren(document.createTextNode(`${message} `));
    const a = document.createElement('a'); a.href = `mailto:${email}`; a.textContent = 'Email Xavier instead.'; error.append(a); error.hidden = false;
  };
  function validate(field) {
    let message = '';
    const value = field.value.trim();
    if (field.required && !value) message = { name: 'Tell me your name.', email: 'Add an email I can reply to.', phone: 'Add a phone number where I can reach you.', business: 'Add your business or project name.', needs: 'Tell me a little about what you need.', budget: 'Choose a range, or “Not sure yet”.' }[field.name] || 'Please fill this in.';
    else if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Use a complete email, like you@example.com.';
    else if (field.name === 'phone' && value) {
      const digits = value.replace(/\D/g, '');
      if (!/^\+/.test(value) && !(digits.length === 10 || (digits.length === 11 && digits[0] === '1'))) message = 'Add a 10-digit US number, or start an international number with +.';
      else if (/^\+/.test(value) && (digits.length < 8 || digits.length > 15)) message = 'Use a country code and 8–15 digits.';
    }
    field.setAttribute('aria-invalid', String(Boolean(message)));
    document.getElementById(`${field.id}-error`).textContent = message;
    return !message;
  }
  const fields = [...form.querySelectorAll('.field input, .field textarea, .field select')];
  fields.forEach(field => field.addEventListener('blur', () => validate(field)));
  // Optional browser agent interface: stage a request for human review; never submit it.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const properties = Object.fromEntries(fields.map(field => [field.name, { type: 'string', maxLength: field.maxLength > 0 ? field.maxLength : 200 }]));
    try {
      Promise.resolve(document.modelContext.registerTool({
        name: 'stage_project_request', title: 'Prepare a project request',
        description: 'Fill the visible request form for the visitor to review. Does not send data; the visitor completes spam protection and presses Send.',
        inputSchema: { type: 'object', properties, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (busy || form.hidden) throw new Error('Finish the current request before preparing another.');
          if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Provide named form fields.');
          for (const [name, value] of Object.entries(input)) {
            const field = fields.find(f => f.name === name);
            if (!field || typeof value !== 'string' || value.length > properties[name].maxLength) throw new Error('Unknown field or text too long.');
            if (field.tagName === 'SELECT' && ![...field.options].some(option => option.value === value)) throw new Error('Choose one of the listed options.');
          }
          for (const [name, value] of Object.entries(input)) fields.find(f => f.name === name).value = value;
          document.getElementById('booking').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' });
          const allValid = fields.map(validate).every(Boolean);
          return { staged: true, sent: false, fieldsValid: allValid, nextStep: 'Review the form, complete spam protection, and press Send.' };
        }
      }, { signal: lifecycle.signal })).catch(() => {});
    } catch { /* The optional interface must not affect the normal form. */ }
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
  const phone = document.getElementById('phone');
  phone.addEventListener('input', () => {
    if (phone.value.startsWith('+') || phone.selectionStart !== phone.value.length) return;
    let digits = phone.value.replace(/\D/g, '').slice(0, 11), prefix = '';
    if (digits.startsWith('1') && digits.length > 10) { prefix = '+1 '; digits = digits.slice(1); }
    phone.value = prefix + (digits.length > 6 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : digits.length > 3 ? `(${digits.slice(0, 3)}) ${digits.slice(3)}` : digits);
  });
  if (ready) {
    let loading = false;
    const loadChallenge = () => {
      if (loading) return; loading = true;
      window.xbasedTurnstileReady = () => {
        widgetId = window.turnstile.render('#turnstile', { sitekey: config.turnstileSiteKey, action: 'booking', theme: 'light', size: 'flexible', callback: value => { token = value; }, 'expired-callback': () => { token = ''; }, 'error-callback': () => { token = ''; fail('Spam protection couldn’t load. Please try again.'); }, 'timeout-callback': () => { token = ''; } });
      };
      const script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=xbasedTurnstileReady&render=explicit'; script.async = true; script.defer = true; script.onerror = () => fail('Spam protection couldn’t load.'); document.head.append(script);
    };
    if ('IntersectionObserver' in window) { const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { loadChallenge(); observer.disconnect(); } }, { rootMargin: '500px' }); observer.observe(form); } else loadChallenge();
    form.addEventListener('focusin', loadChallenge, { once: true });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    error.hidden = true;
    const results = fields.map(validate);
    if (results.some(valid => !valid)) { fields[results.indexOf(false)].focus(); return; }
    if (!ready) { fail('This preview isn’t connected to booking yet. Nothing was sent.'); return; }
    if (!token) { fail('Please finish the spam check above, then send your request.'); return; }
    busy = true; button.disabled = true; button.textContent = 'Sending your request…'; form.setAttribute('aria-busy', 'true');
    const payload = Object.fromEntries(new FormData(form).entries()); payload.turnstileToken = token;
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      await fetch(config.endpoint, { method: 'POST', mode: 'no-cors', redirect: 'follow', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: controller.signal });
      // Opaque response: delivery is unconfirmed until the auto-reply arrives.
      form.hidden = true; success.hidden = false; success.focus();
    } catch { fail('I couldn’t confirm the send. Your details are still here. Check your inbox before trying again, or email me.'); }
    finally { clearTimeout(timeout); busy = false; button.disabled = false; button.innerHTML = originalButton; form.removeAttribute('aria-busy'); resetChallenge(); }
  });
  document.getElementById('send-another').addEventListener('click', () => { form.reset(); fields.forEach(f => { f.removeAttribute('aria-invalid'); document.getElementById(`${f.id}-error`).textContent = ''; }); error.hidden = true; success.hidden = true; form.hidden = false; resetChallenge(); fields[0].focus(); });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mark = document.querySelector('.type-mark');
  const hero = document.querySelector('.hero');
  let frame = 0;
  hero.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType !== 'mouse' || frame) return;
    frame = requestAnimationFrame(() => { const r = hero.getBoundingClientRect(); const x = (event.clientX - r.left) / r.width - .5; const y = (event.clientY - r.top) / r.height - .5; mark.style.transform = `perspective(800px) rotateX(${-y * 18}deg) rotateY(${x * 22}deg) rotate(-9deg)`; frame = 0; });
  });
  hero.addEventListener('pointerleave', () => { mark.style.transform = ''; });
  motion.addEventListener('change', () => { if (motion.matches) mark.style.transform = ''; });
  if (config.analyticsToken) { const script = document.createElement('script'); script.defer = true; script.src = 'https://static.cloudflareinsights.com/beacon.min.js'; script.dataset.cfBeacon = JSON.stringify({ token: config.analyticsToken }); document.head.append(script); }
})();
