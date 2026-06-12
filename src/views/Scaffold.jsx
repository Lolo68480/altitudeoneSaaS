import { useState } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT, useLang } from '../contexts/LangContext';
import { PageHead, Pill, Money, StatTile } from '../components/Shared';
import { NewSupplierModal, NewTaskModal, NewDocumentModal } from '../components/Modals';
import { fmtEUR, PRIO } from '../lib/data';

export function Suppliers() {
  const { suppliers: dbSuppliers = [], refetch } = useAppData();
  const t = useT();
  const [addOpen, setAddOpen] = useState(false);
  const stColors = { Preferred: 'green', Active: 'blue', Trial: 'amber', Inactive: 'gray' };
  const total = dbSuppliers.reduce((s, x) => s + (x.spend || 0), 0);
  const avgRating = dbSuppliers.length ? (dbSuppliers.reduce((s, x) => s + (x.rating || 0), 0) / dbSuppliers.length).toFixed(1) : '—';

  const deleteSupplier = async (s) => {
    if (!confirm(t('delete_confirm') + ' "' + s.name + '" ?')) return;
    await db.from('suppliers').delete().eq('id', s.id);
    await refetch();
  };

  return (
    <div className="view">
      <PageHead title={t('nav_suppliers')} sub={t('sup_sub', { n: dbSuppliers.length, v: fmtEUR(total, true) })}>
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('sup_new')}</button>
      </PageHead>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
        <StatTile icon="truck" color="--acc" label={t('sup_total')} value={dbSuppliers.length || '—'} note={`${dbSuppliers.filter(s=>s.status==='Preferred').length} ${t('sup_preferred')}`} />
        <StatTile icon="dollar" color="--green" label={t('sup_total_spend')} value={total ? fmtEUR(total, true) : '—'} note="" />
        <StatTile icon="star" color="--amber" label={t('sup_avg_rating')} value={avgRating} note={t('sup_of5')} />
      </div>
      {dbSuppliers.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="kpi-ico" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--acc-soft)', color: 'var(--acc-2)', margin: '0 auto 14px' }}><I.truck size={22} /></div>
          <h3 style={{ margin: '0 0 6px' }}>{t('sup_no_sup')}</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>{t('sup_no_sub')}</p>
          <button className="btn primary" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('sup_add_first')}</button>
        </div>
      ) : (
        <div className="card">
          <div className="card-head"><h3>{t('sup_all')}</h3></div>
          <table className="tbl">
            <thead><tr><th>Supplier</th><th>{t('sup_cat')}</th><th>{t('sup_loc')}</th><th>{t('sup_rating')}</th><th>{t('sup_status')}</th><th style={{ textAlign: 'right' }}>{t('sup_spend')}</th><th></th></tr></thead>
            <tbody>
              {dbSuppliers.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="av-row">
                      <div className="kpi-ico" style={{ width: 32, height: 32, background: 'var(--panel-3)', color: 'var(--tx)', fontWeight: 700, fontSize: 12 }}>{s.name[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        {s.email && <a href={'mailto:' + s.email} style={{ fontSize: 11, color: 'var(--tx-3)', textDecoration: 'none' }}>{s.email}</a>}
                      </div>
                    </div>
                  </td>
                  <td className="muted">{s.category || '—'}</td>
                  <td className="muted">{s.location || '—'}</td>
                  <td><span className="row gap6"><I.star size={12} style={{ color: 'var(--amber)' }} /><span className="num">{s.rating || '—'}</span></span></td>
                  <td><Pill kind={stColors[s.status] || 'blue'} text={s.status || 'Active'} /></td>
                  <td style={{ textAlign: 'right' }}>{s.spend ? <Money v={s.spend} /> : <span className="muted">—</span>}</td>
                  <td><button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--tx-4)' }} onClick={() => deleteSupplier(s)}><I.trash size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {addOpen && <NewSupplierModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

export function Tasks() {
  const { tasks: dbTasks, refetch } = useAppData();
  const t = useT();
  const [localDone, setLocalDone] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState('Pending');
  const [showFilter, setShowFilter] = useState(false);

  const allTasks = dbTasks || [];
  const taskList = filter === t('tasks_all') || filter === 'All' ? allTasks
    : filter === t('tasks_pending') || filter === 'Pending' ? allTasks.filter(t => !t.done)
    : filter === t('tasks_done') || filter === 'Done' ? allTasks.filter(t => t.done)
    : filter === t('f_prio_high') || filter === 'High' ? allTasks.filter(t => t.prio === 'High')
    : filter === t('f_prio_med') || filter === 'Medium' ? allTasks.filter(t => t.prio === 'Medium')
    : filter === t('f_prio_low') || filter === 'Low' ? allTasks.filter(t => t.prio === 'Low')
    : allTasks.filter(x => !x.done);

  const filterOpts = [t('tasks_all'), t('tasks_pending'), t('tasks_done'), t('f_prio_high'), t('f_prio_med'), t('f_prio_low')];
  const groupOrder = ['Today', 'Tomorrow', 'This week'];
  const byGroup = {};
  taskList.forEach(tk => {
    if (!byGroup[tk.due_group]) byGroup[tk.due_group] = [];
    byGroup[tk.due_group].push(tk);
  });
  const groups = groupOrder.filter(g => byGroup[g]).map(g => [g, byGroup[g]]);
  const groupLabel = (g) => g === 'Today' ? t('tasks_today') : g === 'Tomorrow' ? t('tasks_tomorrow') : t('tasks_week');

  const toggle = async (task) => {
    const newVal = !(localDone[task.id] !== undefined ? localDone[task.id] : task.done);
    setLocalDone(d => ({ ...d, [task.id]: newVal }));
    await db.from('tasks').update({ done: newVal }).eq('id', task.id);
  };

  const deleteTask = async (task) => {
    await db.from('tasks').delete().eq('id', task.id);
    await refetch();
  };

  return (
    <div className="view" style={{ maxWidth: 820, margin: '0 auto' }}>
      <PageHead title={t('nav_tasks')} sub={t('tasks_sub', { n: allTasks.length, p: allTasks.filter(x=>!x.done).length })}>
        <div style={{ position: 'relative' }}>
          <button className="btn sm" onClick={() => setShowFilter(f => !f)}><I.filter size={14} /> {filter}</button>
          {showFilter && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200, background: 'var(--panel)', border: '1px solid var(--line-2)', borderRadius: 10, padding: 6, minWidth: 140, boxShadow: 'var(--shadow-lg)' }}>
              {filterOpts.map(f => (
                <div key={f} onClick={() => { setFilter(f); setShowFilter(false); }}
                  style={{ padding: '8px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 600 : 400, background: filter === f ? 'var(--acc-soft)' : 'transparent', color: filter === f ? 'var(--acc-2)' : 'var(--tx)' }}>{f}</div>
              ))}
            </div>
          )}
        </div>
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('tasks_new')}</button>
      </PageHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {groups.map(([label, items]) => (
          <div key={label}>
            <div className="row gap8" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx-2)' }}>{groupLabel(label)}</span>
              <span className="num muted" style={{ fontSize: 12 }}>{items.length}</span>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {items.map((tk, i) => {
                const isDone = localDone[tk.id] !== undefined ? localDone[tk.id] : tk.done;
                return (
                  <div key={tk.id} className="row gap12" style={{ padding: '13px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <span onClick={() => toggle(tk)} style={{ width: 19, height: 19, borderRadius: 6, flex: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', border: isDone ? 'none' : '1.6px solid var(--line-strong)', background: isDone ? 'var(--acc)' : 'transparent' }}>
                      {isDone && <I.check2 size={13} style={{ color: '#fff' }} />}
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--tx-4)' : 'var(--tx)' }}>{tk.title}</span>
                    {tk.client && <span className="pill gray" style={{ fontSize: 11 }}>{tk.client}</span>}
                    <Pill kind={PRIO[tk.prio]} text={tk.prio} />
                    <button className="icon-btn" style={{ width: 24, height: 24, color: 'var(--tx-4)' }} onClick={() => deleteTask(tk)}><I.trash size={13} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--tx-4)', fontSize: 13 }}>{t('tasks_no_tasks')}</div>}
      </div>
      {addOpen && <NewTaskModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

export function Documents() {
  const { documents: dbDocs = [], refetch } = useAppData();
  const t = useT();
  const [addOpen, setAddOpen] = useState(false);

  const folderKeys = ['doc_contracts','doc_quotes','doc_invoices','doc_certificates','doc_legal','doc_brand'];
  const folderEn = ['Contracts','Quotes','Invoices','Certificates','Legal','Brand assets'];
  const folderColors = ['--acc','--violet','--green','--amber','--cyan','--red'];
  const folders = folderKeys.map((k, i) => [t(k), dbDocs.filter(d => d.folder === folderEn[i] || d.folder === t(k)).length, folderColors[i]]);

  const deleteDoc = async (doc) => {
    if (!confirm(t('delete_confirm') + ' "' + doc.name + '" ?')) return;
    await db.from('documents').delete().eq('id', doc.id);
    await refetch();
  };

  const s = dbDocs.length !== 1 ? 's' : '';
  return (
    <div className="view">
      <PageHead title={t('nav_documents')} sub={t('doc_sub', { n: dbDocs.length, s })}>
        <div className="search" style={{ height: 34 }}><I.search size={14} /><input placeholder={t('doc_search')} /></div>
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('doc_new')}</button>
      </PageHead>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(6,1fr)', marginBottom: 20 }}>
        {folders.map(([name, count, color]) => (
          <div key={name} className="card card-pad" style={{ cursor: 'pointer' }}>
            <div className="kpi-ico" style={{ width: 36, height: 36, background: `var(${color}-soft)`, color: `var(${color})`, marginBottom: 10 }}><I.layers size={17} /></div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
            <div className="muted num" style={{ fontSize: 11 }}>{count}</div>
          </div>
        ))}
      </div>
      {dbDocs.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <p className="muted" style={{ fontSize: 13 }}>{t('doc_no_docs')}</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-head"><h3>{t('doc_all')}</h3><span className="sub">{dbDocs.length}</span></div>
          <table className="tbl">
            <thead><tr><th>{t('doc_name')}</th><th>{t('doc_folder')}</th><th>{t('doc_size')}</th><th>{t('doc_modified')}</th><th></th></tr></thead>
            <tbody>
              {dbDocs.map((r, i) => (
                <tr key={r.id || i} onClick={() => r.url && window.open(r.url, '_blank')} style={{ cursor: r.url ? 'pointer' : 'default' }}>
                  <td>
                    <div className="av-row">
                      <div className="kpi-ico" style={{ width: 28, height: 28, background: 'var(--panel-2)', color: 'var(--tx-2)' }}><I.doc size={14} /></div>
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      {!r.url && <span style={{ fontSize: 11, color: 'var(--tx-4)', marginLeft: 6 }}>pas de lien</span>}
                    </div>
                  </td>
                  <td className="muted">{r.folder || '—'}</td><td className="muted num">{r.size || '—'}</td><td className="muted">{r.modified || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      {r.url && <a href={r.url} target="_blank" rel="noopener" className="icon-btn" style={{ width:28, height:28, color:'var(--acc-2)' }} title="Ouvrir" onClick={e => e.stopPropagation()}><I.globe size={14} /></a>}
                      <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--tx-4)' }} onClick={e => { e.stopPropagation(); deleteDoc(r); }}><I.trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {addOpen && <NewDocumentModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function SetRow({ label, desc, children }) {
  return <div className="row gap16"><div style={{ flex: 1 }}><div style={{ fontWeight: 550, fontSize: 13.5 }}>{label}</div>{desc && <div className="muted" style={{ fontSize: 12 }}>{desc}</div>}</div>{children}</div>;
}

export function Settings() {
  const { user } = useAppData();
  const t = useT();
  const { lang, setLang } = useLang();
  const [aiKey, setAiKey] = useState(() => localStorage.getItem('ao_ai_key') || '');
  const [keySaved, setKeySaved] = useState(false);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const workspaceName = user?.user_metadata?.workspace_name || 'My Workspace';

  const saveKey = () => {
    localStorage.setItem('ao_ai_key', aiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  return (
    <div className="view" style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title={t('nav_settings')} sub={t('set_sub')} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>{t('set_workspace')}</h3></div>
        <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SetRow label={t('set_ws_name')} desc={t('set_ws_shown')}><input className="set-input" defaultValue={workspaceName} style={{ width: 240 }} /></SetRow>
          <SetRow label={t('set_account')} desc={user?.email || ''}><span className="pill gray">{userName}</span></SetRow>
          <SetRow label={t('set_plan')} desc=""><span className="pill green">{t('set_free')}</span></SetRow>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>{t('set_language')}</h3></div>
        <div className="card-pad">
          <SetRow label={t('set_language')} desc={t('set_lang_sub')}>
            <div className="row gap8">
              {[['en', t('set_lang_en')], ['fr', t('set_lang_fr')]].map(([code, label]) => (
                <button key={code} onClick={() => setLang(code)}
                  style={{ padding: '7px 18px', borderRadius: 8, border: `1.5px solid ${lang === code ? 'var(--acc)' : 'var(--line-2)'}`, background: lang === code ? 'var(--acc-soft)' : 'var(--panel-2)', color: lang === code ? 'var(--acc-2)' : 'var(--tx)', fontWeight: lang === code ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all .14s' }}>
                  {label}
                </button>
              ))}
            </div>
          </SetRow>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>{t('set_ai')}</h3></div>
        <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SetRow label={t('set_ai_key')} desc={t('set_ai_key_desc')}>
            <div className="row gap8">
              <input className="set-input" type="password" value={aiKey} onChange={e => setAiKey(e.target.value)}
                placeholder={t('set_ai_key_ph')} style={{ width: 240, fontFamily: aiKey ? 'monospace' : 'inherit' }} />
              <button className="btn sm" onClick={saveKey} style={{ minWidth: 70 }}>
                {keySaved ? <><I.check2 size={13} /> OK</> : t('save')}
              </button>
            </div>
          </SetRow>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--panel-2)', border: '1px solid var(--line)', fontSize: 12.5, color: 'var(--tx-3)', lineHeight: 1.6 }}>
            <I.bolt size={13} style={{ color: 'var(--acc-2)', verticalAlign: '-2px', marginRight: 5 }} />
            {t('set_ai_key_note')}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>{t('set_integrations')}</h3></div>
        <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[['Supabase', 'Auth & database', true], ['Groq / Llama', 'AI assistant — free', !!aiKey], ['Gmail / IMAP', 'Email inbox sync', false], ['n8n', 'Workflow automation', false], ['Stripe', 'Payments & invoicing', false], ['Slack', 'Notifications', false]].map((g, i) => (
            <div key={i} className="row gap12" style={{ padding: '12px 2px', borderBottom: i < 5 ? '1px solid var(--line)' : 'none' }}>
              <div className="kpi-ico" style={{ width: 34, height: 34, background: 'var(--panel-3)', color: 'var(--tx-2)', fontWeight: 700, fontSize: 13 }}>{g[0][0]}</div>
              <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{g[0]}</div><div className="muted" style={{ fontSize: 11.5 }}>{g[1]}</div></div>
              <span className="spacer" />
              {g[2] ? <span className="pill green"><span style={{ width: 6, height: 6, borderRadius: 50, background: 'var(--green)', display: 'inline-block', marginRight: 5 }} />{t('set_connected')}</span> : <button className="btn sm">{t('set_connect')}</button>}
            </div>
          ))}
        </div>
      </div>

      <div className="card card-pad" style={{ fontSize: 12.5, color: 'var(--tx-3)' }}>
        <I.bolt size={14} style={{ color: 'var(--acc-2)', verticalAlign: '-2px' }} /> {t('set_tip')} <strong style={{ color: 'var(--tx-2)' }}>{t('set_tweaks')}</strong> {t('set_tip2')}
      </div>
    </div>
  );
}
