/* Altitude One OS — sample data + utilities */

export const fmtEUR = (v, short) => {
  if (short) {
    if (v >= 1000) return '€' + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k';
    return '€' + Math.round(v);
  }
  return '€' + Math.round(v).toLocaleString('en-US');
};

export const initials = (name) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export const TEAM = [
  { id: 't1', name: 'Elise Moreau', role: 'Founder / Creative Dir.', color: 'linear-gradient(140deg,#2f6bff,#5b8bff)' },
  { id: 't2', name: 'Tom Bauer', role: 'Lead Engineer', color: 'linear-gradient(140deg,#a78bfa,#7c5cf0)' },
  { id: 't3', name: 'Nadia Haddad', role: 'Account Manager', color: 'linear-gradient(140deg,#34d399,#0ea371)' },
  { id: 't4', name: 'Luca Romano', role: 'Designer', color: 'linear-gradient(140deg,#fbbf24,#f59e0b)' },
  { id: 't5', name: 'Priya Nair', role: 'Growth & SEO', color: 'linear-gradient(140deg,#38bdf8,#0ea5e9)' },
];

export const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const KPIS = {
  revMonth: 48250, revMonthDelta: 12.4,
  revYear: 412800, revYearDelta: 23.1,
  leads: 64, leadsDelta: 8.0,
  clients: 27, clientsDelta: 3,
  conversion: 28.4, conversionDelta: 4.2,
  activeProjects: 9, activeProjectsDelta: 0,
  pipelineValue: 186500,
  avgDeal: 14600, avgDealDelta: -2.1,
};

export const STATUS_META = {
  'New Lead':      { color: 'cyan',   dot: '#38bdf8' },
  'Contacted':     { color: 'blue',   dot: '#2f6bff' },
  'Qualified':     { color: 'violet', dot: '#a78bfa' },
  'Proposal Sent': { color: 'amber',  dot: '#fbbf24' },
  'Negotiation':   { color: 'amber',  dot: '#f59e0b' },
  'Won':           { color: 'green',  dot: '#34d399' },
  'Lost':          { color: 'red',    dot: '#fb7185' },
};

export const PIPELINE_STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
export const INDUSTRIES = ['SaaS', 'E-commerce', 'Fintech', 'Healthcare', 'Real Estate', 'Hospitality', 'Manufacturing', 'Media'];
export const KANBAN_COLS = ['To Do', 'In Progress', 'Waiting', 'Completed'];
export const PRIO = { High: 'red', Medium: 'amber', Low: 'gray' };

export const PROSPECT_STAGE_META = {
  Queued: 'gray', Sent: 'blue', Opened: 'cyan', Replied: 'green', Bounced: 'red',
};

let _id = 0;
const uid = () => 'd' + (++_id);
const deal = (company, contact, value, stage, industry, owner, days, prob) =>
  ({ id: uid(), company, contact, value, stage, industry, owner, lastTouch: days, prob,
     email: contact.split(' ')[0].toLowerCase() + '@' + company.toLowerCase().replace(/[^a-z]/g, '') + '.com',
     phone: '+33 6 ' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(1000 + Math.random() * 8999) });

export const DEALS = [
  deal('Lumio', 'Sarah Klein', 18000, 'New Lead', 'SaaS', 't3', 1, 10),
  deal('Verde Foods', 'Marc Dubois', 9500, 'New Lead', 'E-commerce', 't1', 2, 10),
  deal('Aria Health', 'Dr. Lena Voss', 32000, 'New Lead', 'Healthcare', 't3', 0, 10),
  deal('Pixel & Co', 'Jonah Reed', 7200, 'Contacted', 'Media', 't5', 3, 25),
  deal('Northpoint Capital', 'Adèle Faure', 41000, 'Contacted', 'Fintech', 't1', 4, 25),
  deal('Casa Lumen', 'Theo Marchetti', 15500, 'Contacted', 'Real Estate', 't3', 2, 25),
  deal('Brightwave', 'Olivia Tan', 22000, 'Qualified', 'SaaS', 't1', 1, 45),
  deal('Maison Roux', 'Camille Roux', 12800, 'Qualified', 'Hospitality', 't4', 5, 45),
  deal('Forge Robotics', 'Niko Petrov', 54000, 'Qualified', 'Manufacturing', 't1', 2, 45),
  deal('Atlas Mobility', "Ryan O'Neil", 28500, 'Proposal Sent', 'SaaS', 't3', 3, 60),
  deal('Saveurs', 'Inès Lambert', 16400, 'Proposal Sent', 'E-commerce', 't5', 6, 60),
  deal('Crest Realty', 'Greg Holt', 19800, 'Negotiation', 'Real Estate', 't1', 1, 80),
  deal('Helio Bank', 'Yuki Tanaka', 47500, 'Negotiation', 'Fintech', 't3', 2, 80),
  deal('Vela Studio', 'Mara Costa', 11200, 'Won', 'Media', 't4', 8, 100),
  deal('Orbit Labs', 'Sam Whitfield', 26000, 'Won', 'SaaS', 't1', 12, 100),
  deal('Drift Co', 'Pete Nash', 6400, 'Lost', 'E-commerce', 't5', 20, 0),
];

export const CLIENTS = [
  { id: 'c1', company: 'Orbit Labs', contact: 'Sam Whitfield', industry: 'SaaS', since: 'Mar 2024', mrr: 4200, status: 'Active', health: 'good', projects: 2, owner: 't1', value: 84000, website: 'orbitlabs.io' },
  { id: 'c2', company: 'Vela Studio', contact: 'Mara Costa', industry: 'Media', since: 'Jan 2025', mrr: 1800, status: 'Active', health: 'good', projects: 1, owner: 't4', value: 22600, website: 'vela.studio' },
  { id: 'c3', company: 'Helio Bank', contact: 'Yuki Tanaka', industry: 'Fintech', since: 'Sep 2023', mrr: 6500, status: 'Active', health: 'watch', projects: 3, owner: 't3', value: 142000, website: 'heliobank.com' },
  { id: 'c4', company: 'Maison Roux', contact: 'Camille Roux', industry: 'Hospitality', since: 'Nov 2024', mrr: 2400, status: 'Active', health: 'good', projects: 1, owner: 't4', value: 31200, website: 'maisonroux.fr' },
  { id: 'c5', company: 'Brightwave', contact: 'Olivia Tan', industry: 'SaaS', since: 'Jun 2024', mrr: 3100, status: 'Active', health: 'risk', projects: 1, owner: 't1', value: 48000, website: 'brightwave.co' },
  { id: 'c6', company: 'Crest Realty', contact: 'Greg Holt', industry: 'Real Estate', since: 'Feb 2025', mrr: 2900, status: 'Active', health: 'good', projects: 2, owner: 't5', value: 38600, website: 'crestrealty.com' },
];

const task = (title, col, client, prio, due, owner, tags, sub) =>
  ({ id: uid(), title, col, client, prio, due, owner, tags: tags || [], sub: sub || [0, 0] });

export const PROJECTS = [
  task('Design system & component library', 'In Progress', 'Orbit Labs', 'High', 'Jun 18', 't4', ['Design', 'Web'], [8, 12]),
  task('Marketing site rebuild', 'In Progress', 'Helio Bank', 'High', 'Jun 24', 't2', ['Web', 'Dev'], [14, 20]),
  task('Brand refresh & guidelines', 'In Progress', 'Maison Roux', 'Medium', 'Jul 02', 't4', ['Branding'], [4, 9]),
  task('SEO audit & content plan', 'To Do', 'Crest Realty', 'Medium', 'Jul 08', 't5', ['Growth'], [0, 6]),
  task('Mobile app onboarding flow', 'To Do', 'Brightwave', 'High', 'Jun 30', 't2', ['Product'], [0, 7]),
  task('Q3 campaign creative', 'To Do', 'Vela Studio', 'Low', 'Jul 15', 't4', ['Branding', 'Growth'], [0, 5]),
  task('Client approval — homepage', 'Waiting', 'Helio Bank', 'High', 'Jun 16', 't3', ['Web'], [3, 3]),
  task('Legal review of contract', 'Waiting', 'Forge Robotics', 'Medium', 'Jun 20', 't1', ['Ops'], [1, 2]),
  task('E-commerce checkout build', 'Completed', 'Saveurs', 'High', 'Jun 09', 't2', ['Dev'], [11, 11]),
  task('Logo & visual identity', 'Completed', 'Vela Studio', 'Medium', 'May 28', 't4', ['Branding'], [6, 6]),
  task('Analytics dashboard setup', 'Completed', 'Orbit Labs', 'Low', 'Jun 04', 't5', ['Growth'], [4, 4]),
];

export const PROSPECTS = [
  { id: 'p1', company: 'Nimbus Cloud', website: 'nimbus.io', email: 'hello@nimbus.io', linkedin: '/company/nimbus', phone: '+44 20 7946 0102', city: 'London', industry: 'SaaS', stage: 'Replied', last: '2h ago' },
  { id: 'p2', company: 'Terra Botanics', website: 'terrabotanics.com', email: 'team@terrabotanics.com', linkedin: '/company/terra', phone: '+33 1 42 86 01 88', city: 'Paris', industry: 'E-commerce', stage: 'Opened', last: '5h ago' },
  { id: 'p3', company: 'Kairos Fintech', website: 'kairos.finance', email: 'contact@kairos.finance', linkedin: '/company/kairos', phone: '+49 30 901820', city: 'Berlin', industry: 'Fintech', stage: 'Sent', last: '1d ago' },
  { id: 'p4', company: 'Wander Hotels', website: 'wanderhotels.com', email: 'gm@wanderhotels.com', linkedin: '/company/wander', phone: '+34 91 123 4567', city: 'Madrid', industry: 'Hospitality', stage: 'Bounced', last: '1d ago' },
  { id: 'p5', company: 'Volt Mobility', website: 'voltmobility.eu', email: 'sales@voltmobility.eu', linkedin: '/company/volt', phone: '+31 20 794 0123', city: 'Amsterdam', industry: 'SaaS', stage: 'Replied', last: '2d ago' },
  { id: 'p6', company: 'Cedar Homes', website: 'cedarhomes.co', email: 'build@cedarhomes.co', linkedin: '/company/cedar', phone: '+353 1 437 0192', city: 'Dublin', industry: 'Real Estate', stage: 'Queued', last: '—' },
  { id: 'p7', company: 'Pulse Health', website: 'pulsehealth.io', email: 'partners@pulsehealth.io', linkedin: '/company/pulse', phone: '+39 02 8088 1', city: 'Milan', industry: 'Healthcare', stage: 'Opened', last: '3d ago' },
  { id: 'p8', company: 'Forge Robotics', website: 'forgerobotics.de', email: 'niko@forgerobotics.de', linkedin: '/company/forge', phone: '+49 89 12345', city: 'Munich', industry: 'Manufacturing', stage: 'Replied', last: '3d ago' },
];

export const CAMPAIGNS = [
  { id: 'cp1', name: 'SaaS founders — Q2', sent: 240, opened: 142, replied: 38, meetings: 9, active: true },
  { id: 'cp2', name: 'Fintech decision-makers', sent: 180, opened: 96, replied: 21, meetings: 5, active: true },
  { id: 'cp3', name: 'Hospitality rebrand push', sent: 120, opened: 58, replied: 11, meetings: 3, active: false },
];

export const CLIENT_TIMELINE = [
  { icon: 'dollar', color: '--green', title: 'Invoice #1042 paid', desc: '€6,500 — June retainer', time: '2 days ago' },
  { icon: 'kanban', color: '--acc', title: 'Project milestone reached', desc: 'Marketing site — design phase complete', time: '4 days ago' },
  { icon: 'msg', color: '--cyan', title: 'Call with Yuki Tanaka', desc: '30 min — discussed Q3 roadmap & scope', time: '1 week ago' },
  { icon: 'doc', color: '--violet', title: 'Contract renewed', desc: '12-month retainer extension signed', time: '2 weeks ago' },
  { icon: 'mail', color: '--amber', title: 'Proposal sent', desc: 'Mobile app phase 2 — €34,000', time: '3 weeks ago' },
];

export async function dbFetchAll(db, userId) {
  const [cl, de, pr, ca, pj, ta, do_, fi, su, ja] = await Promise.all([
    db.from('clients').select('*').eq('user_id', userId).order('created_at'),
    db.from('deals').select('*').eq('user_id', userId).order('created_at'),
    db.from('prospects').select('*').eq('user_id', userId).order('created_at'),
    db.from('campaigns').select('*').eq('user_id', userId).order('created_at'),
    db.from('projects').select('*').eq('user_id', userId).order('created_at'),
    db.from('tasks').select('*').eq('user_id', userId).order('created_at'),
    db.from('documents').select('*').eq('user_id', userId).order('created_at'),
    db.from('finance').select('*').eq('user_id', userId).order('created_at'),
    db.from('suppliers').select('*').eq('user_id', userId).order('created_at'),
    db.from('job_applications').select('*').eq('user_id', userId).order('created_at'),
  ]);
  const mapDeal = d => ({ ...d, lastTouch: d.last_touch });
  const mapProject = p => ({ ...p, col: p.col || 'To Do', tags: p.tags || [], sub: p.sub || [0, 0] });
  return {
    clients: cl.data || [],
    deals: (de.data || []).map(mapDeal),
    prospects: pr.data || [],
    campaigns: ca.data || [],
    projects: (pj.data || []).map(mapProject),
    tasks: ta.data || [],
    documents: do_.data || [],
    finance: fi.data || [],
    suppliers: su.data || [],
    jobs: ja.data || [],
  };
}

export async function seedSampleData(db, userId) {
  const { data: existing } = await db.from('clients').select('id').eq('user_id', userId).limit(1);
  if (existing && existing.length > 0) return;
  const strip = (arr) => arr.map(({ id, ...rest }) => ({ ...rest, user_id: userId }));
  await Promise.all([
    db.from('clients').insert(strip(CLIENTS)),
    db.from('deals').insert(strip(DEALS).map(d => ({ ...d, last_touch: d.lastTouch }))),
    db.from('prospects').insert(strip(PROSPECTS)),
    db.from('campaigns').insert(strip(CAMPAIGNS)),
    db.from('projects').insert(strip(PROJECTS)),
    db.from('tasks').insert([
      { user_id: userId, title: 'Client approval — Helio homepage', client: 'Helio Bank', prio: 'High', done: false, due_group: 'Today' },
      { user_id: userId, title: 'Follow-up call — Crest Realty', client: 'Crest Realty', prio: 'High', done: false, due_group: 'Today' },
      { user_id: userId, title: 'Review designs — Maison Roux', client: 'Maison Roux', prio: 'Medium', done: false, due_group: 'Today' },
      { user_id: userId, title: 'Send proposal — Forge Robotics', client: 'Forge Robotics', prio: 'Medium', done: false, due_group: 'Tomorrow' },
      { user_id: userId, title: 'Invoice run — June retainers', client: 'Internal', prio: 'Low', done: false, due_group: 'Tomorrow' },
      { user_id: userId, title: 'Quarterly check-in — Orbit Labs', client: 'Orbit Labs', prio: 'Low', done: false, due_group: 'This week' },
      { user_id: userId, title: 'SEO audit kickoff — Crest', client: 'Crest Realty', prio: 'Medium', done: false, due_group: 'This week' },
    ]),
    db.from('documents').insert([
      { user_id: userId, name: 'Master service agreement — Helio.pdf', folder: 'Contracts', size: '2.4 MB', modified: '2 days ago' },
      { user_id: userId, name: 'Invoice #1042.pdf', folder: 'Invoices', size: '180 KB', modified: '2 days ago' },
      { user_id: userId, name: 'SOW — Crest Q3.pdf', folder: 'Quotes', size: '420 KB', modified: '4 days ago' },
      { user_id: userId, name: 'Brand guidelines v2.pdf', folder: 'Brand assets', size: '8.1 MB', modified: '1 week ago' },
      { user_id: userId, name: 'NDA — Forge Robotics.pdf', folder: 'Legal', size: '210 KB', modified: '1 week ago' },
    ]),
    db.from('finance').insert([
      { user_id: userId, type: 'invoice', label: 'Helio Bank — June retainer', amount: 6500, status: 'Paid', client: 'Helio Bank', date: 'Jun 1' },
      { user_id: userId, type: 'invoice', label: 'Orbit Labs — May retainer', amount: 4200, status: 'Paid', client: 'Orbit Labs', date: 'May 31' },
      { user_id: userId, type: 'invoice', label: 'Crest Realty — SEO sprint', amount: 3800, status: 'Sent', client: 'Crest Realty', date: 'Jun 8' },
      { user_id: userId, type: 'invoice', label: 'Maison Roux — Brand refresh', amount: 12800, status: 'Draft', client: 'Maison Roux', date: 'Jun 12' },
      { user_id: userId, type: 'expense', label: 'Figma — annual', amount: 900, status: 'Paid', client: '', date: 'Jun 1' },
      { user_id: userId, type: 'expense', label: 'NodeHost — servers', amount: 240, status: 'Paid', client: '', date: 'Jun 1' },
    ]),
  ]);
}
