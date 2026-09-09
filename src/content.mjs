export const services = [
  ['One-page site', 'Your business, your work, and a clear way to get in touch.'],
  ['Multi-page site', 'Room for your services, your story, and the details people ask for.'],
  ['Booking system', 'Turn “are you available?” into an organized request.'],
  ['Redesign of an existing site', 'Make the site you already have easier to use.'],
  ['Ongoing updates & maintenance', 'Keep your hours, services, and content current.'],
  ['Domain + hosting setup', 'Get your address connected and your site online.'],
  ['Custom AI tools & automations', 'Practical tools for the repetitive parts of your work.'],
  ['Google Business Profile setup', 'Help local customers find your business details.']
];
export const projects = [
  {
    id: 'loya', name: 'Elizabeth Loya', category: 'Booking site', status: 'IN PROGRESS',
    line: 'A booking home for a Dallas audio engineer, DJ, and radio producer.',
    problem: 'Booking through DMs means details end up scattered across conversations. This project brings service information and booking requests into one place.',
    built: 'I’m building a personal site that also works as a booking platform. It brings together services, an availability calendar, and a request flow. A Google Sheet holds the booking data. The public availability feed carries no client details.',
    stack: ['Astro', 'Static hosting', 'Google Sheets'], screenshot: '', url: ''
  },
  {
    id: 'payday', name: 'Payday AJ', category: 'Artist brand site', status: 'LIVE',
    line: 'A digital home for a Dallas rap artist and actor.',
    problem: 'An artist’s online presence needs to give people a feel for the person and the work. I built this site to pitch Payday AJ on what that presence could be.',
    built: 'I built a single-scroll brand site for Payday AJ, @ajpaydaynosleep. The page uses real photos and real content. It puts the artist’s identity at the center of the experience. The site is live on GitHub Pages.',
    stack: ['GitHub Pages'], stackPending: '[[NEEDS XAVIER: confirmed stack — Payday AJ]]', screenshot: '', url: 'https://xbased420.github.io/PaydayAj/'
  },
  {
    id: 'scheduling', name: 'Business Scheduling App', category: 'Scheduling tool', status: 'IN PROGRESS',
    line: 'Built from the problems I watched on a restaurant floor.',
    problem: 'Shift coverage, availability, and the manager’s whiteboard are problems I’ve seen firsthand. I wanted to build a tool around that real working environment.',
    built: 'I’m building a scheduling app around those restaurant-floor problems. The interface uses React and Tailwind. Shift coverage and availability are the focus of the project. It is still in progress, so there are no rollout results to report.',
    stack: ['React', 'Tailwind'], screenshot: '', url: ''
  },
  {
    id: 'events', name: 'Friends & Family Event Planner', category: 'Event planning app', status: 'PERSONAL BUILD',
    line: 'A small app for making plans with my people.',
    problem: 'I wanted a way to organize events with friends and family. This project started with people I actually know and plans we actually make.',
    built: 'I built an event-planning app for that group. It is a personal project, built for fun. I kept it because it works for what I use it for. It is presented here as a personal build, with no client or business-results claim.',
    stack: [], stackPending: '[[NEEDS XAVIER: confirmed stack — Friends & Family Event Planner]]', screenshot: '', url: ''
  }
];
export const skills = ['HTML/CSS', 'JavaScript', 'Astro', 'Stripe', 'MCP servers', 'Python (basics)', 'Claude Code / AI-assisted development', 'Prompt engineering'];
