(() => {
  'use strict';

  const config = JSON.parse(document.getElementById('site-config').textContent);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const app = document.getElementById('terminal-app');
  const login = document.getElementById('login-screen');
  const loginButton = document.getElementById('terminal-login');
  const main = document.getElementById('main');
  const soundToggle = document.getElementById('sound-toggle');
  const terminalViews = [...document.querySelectorAll('.terminal-view')];
  const directoryLinks = [...document.querySelectorAll('.directory a[href^="#"]')];
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioContext;
  let soundEnabled = true;
  let bootTimers = [];

  app.inert = true;
  app.setAttribute('aria-hidden', 'true');

  terminalViews.forEach(view => { view.hidden = view.id !== 'home'; });

  const ensureAudio = () => {
    if (!AudioContextClass) return false;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return true;
  };
  const tone = (startFrequency, endFrequency, duration, volume, delay = 0, type = 'sine', filterFrequency = 0, detune = 0) => {
    if (!soundEnabled || !ensureAudio()) return;
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.detune.setValueAtTime(detune, start);
    oscillator.frequency.setValueAtTime(startFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    if (filterFrequency) {
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFrequency, start);
      filter.Q.setValueAtTime(5.5, start);
      oscillator.connect(filter);
      filter.connect(gain);
    } else oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .01);
  };
  const noiseClick = (duration = .026, volume = .0045, delay = 0, frequency = 2800, filterType = 'highpass') => {
    if (!soundEnabled || !ensureAudio()) return;
    const sampleCount = Math.max(1, Math.floor(audioContext.sampleRate * duration));
    const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) channel[index] = Math.random() * 2 - 1;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + delay;
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, start);
    filter.Q.setValueAtTime(7, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    source.start(start);
  };
  const playBootChime = () => {
    tone(118, 56, .34, .012, 0, 'sawtooth', 720, -11);
    tone(121, 58, .34, .009, 0, 'sawtooth', 680, 13);
    noiseClick(.075, .007, .025, 920, 'bandpass');
    tone(1380, 510, .075, .0055, .09, 'square', 2100);
    tone(260, 1120, .19, .007, .18, 'triangle', 1600, -7);
    tone(272, 1170, .19, .005, .18, 'sawtooth', 1500, 9);
    noiseClick(.045, .0045, .32, 3400, 'highpass');
  };
  const playPageOpen = () => {
    tone(860, 310, .075, .0065, 0, 'square', 1500);
    noiseClick(.035, .004, .018, 1250, 'bandpass');
    tone(185, 690, .11, .0055, .075, 'sawtooth', 980, -9);
  };
  const playKeyTick = index => {
    const base = 720 + (index % 5) * 83;
    tone(base, base * .58, .025, .0038, 0, index % 2 ? 'square' : 'sawtooth', 1700, index % 2 ? -8 : 7);
    noiseClick(.013, .0022, 0, 1750 + (index % 4) * 260, 'bandpass');
    if (index % 4 === 0) tone(148, 96, .055, .0035, .012, 'triangle', 520);
  };

  if (!AudioContextClass) {
    soundEnabled = false;
    soundToggle.disabled = true;
    soundToggle.textContent = 'SOUND: UNAVAILABLE';
    soundToggle.setAttribute('aria-pressed', 'false');
  }
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = `SOUND: ${soundEnabled ? 'ON' : 'OFF'}`;
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    if (soundEnabled) {
      ensureAudio();
      tone(940, 410, .055, .006, 0, 'square', 1600);
      tone(190, 720, .085, .0045, .055, 'sawtooth', 1000);
    }
  });

  const clearBoot = () => {
    bootTimers.forEach(timer => clearTimeout(timer));
    bootTimers = [];
    document.querySelectorAll('.boot-sequence').forEach(scope => scope.classList.remove('boot-sequence'));
    document.querySelectorAll('[data-boot].is-live').forEach(item => item.classList.remove('is-live'));
  };
  const runBoot = (view, includeChrome = false) => {
    clearBoot();
    if (motion.matches) {
      app.classList.add('terminal-ready');
      view.tabIndex = -1;
      view.focus({ preventScroll: true });
      return;
    }
    const chromeItems = [
      document.querySelector('.machine-stamp'),
      document.querySelector('.system-bar'),
      document.querySelector('.directory'),
      document.querySelector('.footer'),
      document.querySelector('.hardware-row')
    ].filter(Boolean);
    const items = [...new Set([...(includeChrome ? chromeItems : []), ...view.querySelectorAll('[data-boot]')])];
    const scope = includeChrome ? app : view;
    scope.classList.add('boot-sequence');
    if (includeChrome) app.classList.add('booting');
    playPageOpen();
    void scope.offsetWidth;
    items.forEach((item, index) => {
      bootTimers.push(window.setTimeout(() => {
        item.classList.add('is-live');
        playKeyTick(index);
      }, 170 + index * 72));
    });
    bootTimers.push(window.setTimeout(() => {
      scope.classList.remove('boot-sequence');
      items.forEach(item => item.classList.remove('is-live'));
      app.classList.add('terminal-ready');
      app.classList.remove('booting');
      view.tabIndex = -1;
      view.focus({ preventScroll: true });
    }, 300 + items.length * 72));
  };

  const activateView = (id, { boot = true, historyMode = 'push', includeChrome = false } = {}) => {
    const target = terminalViews.find(view => view.id === id) || terminalViews[0];
    terminalViews.forEach(view => {
      const active = view === target;
      view.classList.toggle('active', active);
      view.hidden = !active;
      view.setAttribute('aria-hidden', String(!active));
    });
    directoryLinks.forEach(link => link.classList.toggle('active', link.hash === `#${target.id}`));
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (historyMode === 'push') history.pushState(null, '', `#${target.id}`);
    if (historyMode === 'replace') history.replaceState(null, '', `#${target.id}`);
    if (boot) runBoot(target, includeChrome);
    return target;
  };

  const finishLogin = () => {
    login.hidden = true;
    document.body.classList.remove('terminal-locked');
    app.style.visibility = 'visible';
    app.inert = false;
    app.removeAttribute('aria-hidden');
    activateView('home', { boot: true, historyMode: 'replace', includeChrome: true });
  };

  loginButton.addEventListener('click', () => {
    if (loginButton.disabled) return;
    loginButton.disabled = true;
    loginButton.classList.add('authenticating');
    loginButton.textContent = 'Authenticating…';
    ensureAudio();
    playBootChime();
    login.classList.add('login-exit');
    window.setTimeout(finishLogin, motion.matches ? 0 : 430);
  });

  const clock = document.getElementById('terminal-clock');
  const updateClock = () => { clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }); };
  updateClock();
  window.setInterval(updateClock, 1000);

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || document.body.classList.contains('terminal-locked')) return;
    const id = link.hash.slice(1);
    if (!terminalViews.some(view => view.id === id)) return;
    event.preventDefault();
    activateView(id);
  });
  window.addEventListener('popstate', () => {
    if (document.body.classList.contains('terminal-locked')) return;
    activateView(location.hash.slice(1) || 'home', { historyMode: 'none' });
  });

  const email = ['calipxj', ['gmail', 'com'].join('.')].join('@');
  document.querySelectorAll('.email-link').forEach(link => {
    link.href = `mailto:${email}`;
    link.setAttribute('aria-label', `Email Xavier at ${email}`);
  });

  const form = document.getElementById('booking-form');
  let formRenderedAt = performance.now();
  const error = document.getElementById('form-error');
  const success = document.getElementById('form-success');
  const submitButton = form.querySelector('button[type=submit]');
  const originalButton = submitButton.innerHTML;
  let token = '';
  let widgetId;
  let busy = false;
  const ready = Boolean(config.endpoint && config.turnstileSiteKey);
  const resetChallenge = () => {
    token = '';
    if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId);
  };
  const fail = message => {
    error.replaceChildren(document.createTextNode(`${message} `));
    const link = document.createElement('a');
    link.href = `mailto:${email}`;
    link.textContent = 'Email Xavier instead.';
    error.append(link);
    error.hidden = false;
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

  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const properties = Object.fromEntries(fields.map(field => [field.name, { type: 'string', maxLength: field.maxLength > 0 ? field.maxLength : 200 }]));
    try {
      Promise.resolve(document.modelContext.registerTool({
        name: 'stage_project_request',
        title: 'Prepare a project request',
        description: 'Fill the visible request form for the visitor to review. Does not send data; the visitor completes spam protection and presses Send.',
        inputSchema: { type: 'object', properties, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (busy || form.hidden) throw new Error('Finish the current request before preparing another.');
          if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Provide named form fields.');
          for (const [name, value] of Object.entries(input)) {
            const field = fields.find(item => item.name === name);
            if (!field || typeof value !== 'string' || value.length > properties[name].maxLength) throw new Error('Unknown field or text too long.');
            if (field.tagName === 'SELECT' && ![...field.options].some(option => option.value === value)) throw new Error('Choose one of the listed options.');
          }
          for (const [name, value] of Object.entries(input)) fields.find(field => field.name === name).value = value;
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
    let digits = phone.value.replace(/\D/g, '').slice(0, 11);
    let prefix = '';
    if (digits.startsWith('1') && digits.length > 10) {
      prefix = '+1 ';
      digits = digits.slice(1);
    }
    phone.value = prefix + (digits.length > 6 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : digits.length > 3 ? `(${digits.slice(0, 3)}) ${digits.slice(3)}` : digits);
  });

  if (ready) {
    let loading = false;
    const loadChallenge = () => {
      if (loading) return;
      loading = true;
      window.xbasedTurnstileReady = () => {
        widgetId = window.turnstile.render('#turnstile', {
          sitekey: config.turnstileSiteKey,
          action: 'booking',
          theme: 'dark',
          size: 'flexible',
          callback: value => { token = value; },
          'expired-callback': () => { token = ''; },
          'error-callback': () => { token = ''; fail('Spam protection couldn’t load. Please try again.'); },
          'timeout-callback': () => { token = ''; }
        });
      };
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=xbasedTurnstileReady&render=explicit';
      script.async = true;
      script.defer = true;
      script.onerror = () => fail('Spam protection couldn’t load.');
      document.head.append(script);
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadChallenge();
          observer.disconnect();
        }
      }, { rootMargin: '500px' });
      observer.observe(form);
    } else loadChallenge();
    form.addEventListener('focusin', loadChallenge, { once: true });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    error.hidden = true;
    const results = fields.map(validate);
    if (results.some(valid => !valid)) {
      fields[results.indexOf(false)].focus();
      return;
    }
    if (!ready) {
      fail('This preview isn’t connected to booking yet. Nothing was sent.');
      return;
    }
    if (!token) {
      fail('Please finish the spam check above, then send your request.');
      return;
    }
    busy = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending your request…';
    form.setAttribute('aria-busy', 'true');
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.turnstileToken = token;
    payload.elapsedSeconds = Math.max(0, (performance.now() - formRenderedAt) / 1000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      await fetch(config.endpoint, { method: 'POST', mode: 'no-cors', redirect: 'follow', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: controller.signal });
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      fail('I couldn’t confirm the send. Your details are still here. Check your inbox before trying again, or email me.');
    } finally {
      clearTimeout(timeout);
      busy = false;
      submitButton.disabled = false;
      submitButton.innerHTML = originalButton;
      form.removeAttribute('aria-busy');
      resetChallenge();
    }
  });

  document.getElementById('send-another').addEventListener('click', () => {
    form.reset();
    formRenderedAt = performance.now();
    fields.forEach(field => {
      field.removeAttribute('aria-invalid');
      document.getElementById(`${field.id}-error`).textContent = '';
    });
    error.hidden = true;
    success.hidden = true;
    form.hidden = false;
    resetChallenge();
    fields[0].focus();
  });

  if (config.analyticsToken) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.dataset.cfBeacon = JSON.stringify({ token: config.analyticsToken });
    document.head.append(script);
  }
})();
