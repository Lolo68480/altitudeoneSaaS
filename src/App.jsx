import { useState, useEffect } from 'react';
import { db } from './lib/supabase';
import { I } from './components/Icons';
import { LangCtx, useT, useLang } from './contexts/LangContext';
import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import AuthScreen from './auth/AuthScreen';
import Dashboard from './views/Dashboard';
import CRM from './views/CRM';
import Clients from './views/Clients';
import Prospecting from './views/Prospecting';
import Projects from './views/Projects';
import Finance from './views/Finance';
import { AiAssistant, Automation } from './views/AiAssistant';
import { Suppliers, Tasks, Documents, Settings } from './views/Scaffold';
import Inbox from './views/Inbox';
import Jobs from './views/Jobs';

const NAV_DEF = [
  { group: 'grp_workspace', items: [{ id: 'dashboard', icon: 'grid' }, { id: 'inbox', icon: 'mail' }] },
  { group: 'grp_sales', items: [
    { id: 'crm', icon: 'users' },
    { id: 'prospecting', icon: 'target' },
    { id: 'clients', icon: 'briefcase' },
  ]},
  { group: 'grp_delivery', items: [
    { id: 'projects', icon: 'kanban' },
    { id: 'tasks', icon: 'check' },
    { id: 'suppliers', icon: 'truck' },
  ]},
  { group: 'grp_ops', items: [
    { id: 'finance', icon: 'chart' },
    { id: 'documents', icon: 'doc' },
    { id: 'jobs', icon: 'briefcase' },
  ]},
  { group: 'grp_intel', items: [
    { id: 'ai', icon: 'spark' },
    { id: 'automation', icon: 'flow' },
  ]},
];

const VIEWS = {
  dashboard: Dashboard, inbox: Inbox, crm: CRM, prospecting: Prospecting, clients: Clients,
  projects: Projects, tasks: Tasks, suppliers: Suppliers, finance: Finance, documents: Documents,
  jobs: Jobs, ai: AiAssistant, automation: Automation, settings: Settings,
};

const TWEAK_DEFAULTS = { sidebar: 'expanded', accent: 'blue' };

function NavItem({ id, icon, badge, active, onClick, collapsed, label }) {
  const Ic = I[icon];
  return (
    <div className={'nav-item' + (active ? ' active' : '')} onClick={onClick} title={collapsed ? label : undefined}>
      <Ic className="ico" size={18} />
      <span className="label">{label}</span>
      {badge != null && <span className="nav-badge num">{badge}</span>}
    </div>
  );
}

function SearchDropdown({ query, clients, deals, prospects, tasks, onNavigate, t }) {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const results = [
    ...clients.filter(c => c.company?.toLowerCase().includes(q)).slice(0, 3).map(c => ({ type: 'client', label: c.company, sub: c.industry || '', view: 'clients', color: '--cyan', icon: 'briefcase' })),
    ...deals.filter(d => d.company?.toLowerCase().includes(q)).slice(0, 3).map(d => ({ type: 'deal', label: d.company, sub: d.stage || '', view: 'crm', color: '--acc', icon: 'users' })),
    ...prospects.filter(p => p.company?.toLowerCase().includes(q)).slice(0, 3).map(p => ({ type: 'prospect', label: p.company, sub: p.city || '', view: 'prospecting', color: '--violet', icon: 'target' })),
    ...tasks.filter(t => t.title?.toLowerCase().includes(q)).slice(0, 3).map(t => ({ type: 'task', label: t.title, sub: t.client || '', view: 'tasks', color: '--green', icon: 'check' })),
  ];
  if (!results.length) return (
    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 400, background: 'var(--panel)', border: '1px solid var(--line-2)', borderRadius: 10, padding: '12px 16px', boxShadow: 'var(--shadow-lg)', fontSize: 13, color: 'var(--tx-4)' }}>
      Aucun résultat pour "{query}"
    </div>
  );
  return (
    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 400, background: 'var(--panel)', border: '1px solid var(--line-2)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
      {results.map((r, i) => {
        const Ic = I[r.icon];
        return (
          <div key={i} className="row gap12" style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--line)' : 'none' }}
            onMouseDown={() => onNavigate(r.view)}>
            <div className="kpi-ico" style={{ width: 28, height: 28, background: `var(${r.color}-soft)`, color: `var(${r.color})`, flex: 'none' }}><Ic size={14} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
              <div className="muted" style={{ fontSize: 11 }}>{r.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function App({ user, onLogout }) {
  const { deals = [], prospects = [], clients = [], tasks = [] } = useAppData();
  const t = useT();
  const [tweaks, setTweaks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ao_tweaks') || 'null') || TWEAK_DEFAULTS; } catch { return TWEAK_DEFAULTS; }
  });
  const setTweak = (k, v) => setTweaks(prev => { const next = { ...prev, [k]: v }; localStorage.setItem('ao_tweaks', JSON.stringify(next)); return next; });

  const [route, setRoute] = useState(() => location.hash.slice(1) || 'dashboard');
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const collapsed = tweaks.sidebar === 'collapsed';

  useEffect(() => {
    const onHash = () => setRoute(location.hash.slice(1) || 'dashboard');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const accent = tweaks.accent || 'blue';
    document.documentElement.setAttribute('data-accent', accent);
  }, [tweaks.accent]);

  const go = (id) => { location.hash = id; setRoute(id); setSearch(''); };
  const View = VIEWS[route] || Dashboard;

  const navLabel = (id) => t('nav_' + id);
  const pageTitle = navLabel(route);
  const pageGroup = (() => {
    for (const g of NAV_DEF) {
      if (g.items.find(i => i.id === route)) return t(g.group);
    }
    return '';
  })();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const workspaceName = user?.user_metadata?.workspace_name || 'My Workspace';

  const nav = NAV_DEF.map(g => ({
    ...g,
    items: g.items.map(it => {
      if (it.id === 'crm') return { ...it, badge: deals.filter(d => !['Won', 'Lost'].includes(d.stage)).length || undefined };
      if (it.id === 'prospecting') return { ...it, badge: prospects.length || undefined };
      if (it.id === 'clients') return { ...it, badge: clients.length || undefined };
      return it;
    })
  }));

  return (
    <div className={'app' + (collapsed ? ' collapsed' : '')}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><I.plane size={16} style={{ color: '#fff' }} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="brand-name">Altitude<span className="dim"> One</span></div>
            <div className="brand-sub">{workspaceName}</div>
          </div>
        </div>
        <nav className="nav">
          {nav.map(g => (
            <div key={g.group}>
              <div className="nav-group-label">{t(g.group)}</div>
              {g.items.map(it => (
                <NavItem key={it.id} id={it.id} icon={it.icon} badge={it.badge}
                  label={navLabel(it.id)} active={route === it.id}
                  onClick={() => go(it.id)} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <NavItem id="settings" icon="cog" label={t('nav_settings')} active={route === 'settings'} onClick={() => go('settings')} collapsed={collapsed} />
          <div className="user-chip" style={{ marginTop: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(140deg,var(--acc-2),var(--acc))', display: 'grid', placeItems: 'center', flex: 'none', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {userName[0]?.toUpperCase()}
            </div>
            <div className="meta" style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div className="muted" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
            <span className="spacer" />
            <button className="icon-btn" style={{ width: 26, height: 26, flexShrink: 0 }} title={t('sign_out')} onClick={onLogout}>
              <I.logout size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setTweak('sidebar', collapsed ? 'expanded' : 'collapsed')} title="Toggle sidebar">
            <I.panel size={18} />
          </button>
          <div>
            <div className="page-title">{pageTitle}</div>
            <div className="page-crumb">{pageGroup} {pageGroup && '·'} {workspaceName}</div>
          </div>
          <span className="spacer" />
          <div className="search" style={{ position: 'relative' }}>
            <I.search size={15} />
            <input placeholder={t('search_ph')} value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 150)} />
            {!search && <span className="kbd">⌘K</span>}
            {searchFocus && search && (
              <SearchDropdown query={search} clients={clients} deals={deals} prospects={prospects} tasks={tasks} t={t}
                onNavigate={(v) => { go(v); setSearchFocus(false); }} />
            )}
          </div>
          <button className="icon-btn" title="Notifications"><I.bell size={18} /></button>
          <button className="btn primary sm" onClick={() => go('ai')}><I.spark size={14} /> {t('ai_title')}</button>
        </header>
        <div className="scroll" key={route}>
          <div className={'page' + (['projects', 'crm'].includes(route) ? ' page-wide' : '')}
            style={['projects', 'ai', 'inbox'].includes(route) ? { height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' } : undefined}>
            <View />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Root() {
  const [user, setUser] = useState(undefined);
  const [lang, setLang] = useState(() => localStorage.getItem('ao_lang') || 'fr');

  const setLanguage = (l) => { setLang(l); localStorage.setItem('ao_lang', l); };

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = db.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await db.auth.signOut(); };

  if (user === undefined) return (
    <LangCtx.Provider value={{ lang, setLang: setLanguage }}>
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(140deg,var(--acc-2),var(--acc))', display: 'grid', placeItems: 'center', animation: 'loader-pulse 1.4s ease-in-out infinite' }}>
          <I.plane size={20} style={{ color: '#fff' }} />
        </div>
      </div>
    </LangCtx.Provider>
  );

  if (!user) return (
    <LangCtx.Provider value={{ lang, setLang: setLanguage }}>
      <AuthScreen onAuth={setUser} />
    </LangCtx.Provider>
  );

  return (
    <LangCtx.Provider value={{ lang, setLang: setLanguage }}>
      <AppDataProvider user={user}>
        <App user={user} onLogout={logout} />
      </AppDataProvider>
    </LangCtx.Provider>
  );
}
