(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('.concept-tab')];
  const panels = [...document.querySelectorAll('.concept')];
  function selectConcept(id, focus = false) {
    tabs.forEach(tab => {
      const active = tab.dataset.concept === id;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach(panel => { panel.hidden = panel.id !== `concept-${id}`; });
    history.replaceState(null, '', `#concept-${id}`);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectConcept(tab.dataset.concept));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectConcept(tabs[next].dataset.concept, true);
    });
  });
  const initial = location.hash.match(/^#concept-([abc])$/)?.[1] || 'a';
  selectConcept(initial);

  const clock = document.querySelector('[data-clock]');
  const tick = () => { if (clock) clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }); };
  tick(); setInterval(tick, 1000);

  const typeTarget = document.querySelector('[data-type]');
  if (typeTarget) {
    const copy = typeTarget.dataset.type;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) typeTarget.textContent = copy;
    else {
      let index = 0;
      const timer = setInterval(() => {
        typeTarget.textContent = copy.slice(0, ++index);
        if (index >= copy.length) clearInterval(timer);
      }, 24);
    }
  }

  document.querySelectorAll('[data-demo-form]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const message = form.querySelector('.demo-message');
    message.textContent = form.checkValidity() ? 'PROTOTYPE ONLY // Full request form would open next.' : 'COMPLETE THE ACTIVE FIELD TO CONTINUE.';
    if (!form.checkValidity()) form.reportValidity();
  }));

  const dossierData = [
    ['IN PROGRESS', 'Elizabeth Loya', 'Booking site / Dallas', 'Booking details were scattered across conversations.', 'Services, availability, and a request flow tied to a private data source.', 'Astro / Google Sheets / static hosting'],
    ['LIVE', 'Payday AJ', 'Artist brand site / Dallas', 'The artist needed a home that felt like the person, not a link directory.', 'A single-scroll identity site using real photography and content.', 'GitHub Pages'],
    ['IN PROGRESS', 'Scheduling App', 'Operations tool', 'Shift coverage and availability lived on the manager’s whiteboard.', 'A focused scheduling interface based on restaurant-floor experience.', 'React / Tailwind'],
    ['PERSONAL BUILD', 'Friends & Family', 'Event planning app', 'Group plans disappeared into the chat.', 'A small tool that keeps the date, people, and decisions together.', 'Personal prototype']
  ];
  const dossier = document.querySelector('.dossier');
  document.querySelectorAll('[data-dossier]').forEach(button => button.addEventListener('click', () => {
    const data = dossierData[Number(button.dataset.dossier)];
    dossier.querySelector('.stamp').textContent = data[0];
    dossier.querySelector('h2').textContent = data[1];
    dossier.querySelector('h3').textContent = data[2];
    const values = dossier.querySelectorAll('dd');
    values.forEach((value, index) => { value.textContent = data[index + 3]; });
    document.querySelectorAll('[data-dossier]').forEach(item => item.classList.toggle('selected', item === button));
  }));

  const info = {
    work: '<h2>Selected work</h2><p>Elizabeth Loya — booking site, in progress</p><p>Payday AJ — artist site, live</p><p>Business Scheduling App — in progress</p>',
    rates: '<h2>Starting rates</h2><ul><li>One-page site: $450</li><li>Full site: $1,200</li><li>Booking add-on: $600</li><li>Maintenance: $125/month</li></ul>',
    about: '<h2>About Xavier</h2><p>Self-taught builder based in DFW. Restaurant-floor experience shaped the focus: useful tools, clear communication, no agency handoff.</p>'
  };
  const drawer = document.querySelector('.info-drawer');
  document.querySelectorAll('[data-uplink-info]').forEach(button => button.addEventListener('click', () => {
    drawer.querySelector('div').innerHTML = info[button.dataset.uplinkInfo];
    drawer.hidden = false;
    drawer.querySelector('button').focus();
  }));
  drawer.querySelector('button').addEventListener('click', () => { drawer.hidden = true; });

  const uplink = document.getElementById('uplink-form');
  const steps = [...uplink.querySelectorAll('.uplink-step')];
  const trace = [...document.querySelectorAll('.uplink-screen aside li')];
  const back = uplink.querySelector('.uplink-back');
  const next = uplink.querySelector('.uplink-next');
  let step = 0;
  function showStep(value) {
    step = value;
    steps.forEach((item, index) => item.classList.toggle('active', index === step));
    trace.forEach((item, index) => item.classList.toggle('active', index === step));
    back.hidden = step === 0;
    next.textContent = step === steps.length - 1 ? 'Review request' : 'Continue';
    uplink.querySelector('.uplink-counter b').textContent = String(step + 1).padStart(2, '0');
    steps[step].querySelector('input, textarea, select').focus();
  }
  uplink.addEventListener('submit', event => {
    event.preventDefault();
    const field = steps[step].querySelector('input, textarea, select');
    if (!field.checkValidity()) { field.reportValidity(); return; }
    if (step < steps.length - 1) showStep(step + 1);
    else uplink.querySelector('.demo-message').textContent = 'PROTOTYPE COMPLETE // Nothing was sent.';
  });
  back.addEventListener('click', () => showStep(Math.max(0, step - 1)));
})();
