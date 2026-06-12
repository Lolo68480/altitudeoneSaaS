import { useState } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT, useLang } from '../contexts/LangContext';
import { PageHead, Pill, Money, StatTile } from '../components/Shared';
import { NewSupplierModal, NewTaskModal, NewDocumentModal } from '../components/Modals';
import { fmtEUR, PRIO } from '../lib/data';

function EditSupplierModal({ supplier, onClose, onSaved }) {
  const t = useT();
  const [f, setF] = useState({ name: supplier.name||'', category: supplier.category||'', location: supplier.location||'', email: supplier.email||'', rating: supplier.rating||'', spend: supplier.spend||'', status: supplier.status||'Active' });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await db.from('suppliers').update({ name: f.name, category: f.category||null, location: f.location||null, email: f.email||null, rating: parseFloat(f.rating)||null, spend: parseFloat(f.spend)||0, status: f.status }).eq('id', supplier.id);
    onSaved();
  };
  const L = ({ label, children }) => <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:11, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</label>{children}</div>;
  const R = ({ children }) => <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>{children}</div>;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} />
      <div className="card" style={{ position:'relative', width:500, maxWidth:'100%', boxShadow:'var(--shadow-lg)', animation:'fadeUp .22s var(--ease)' }}>
        <div className="card-head"><h3 style={{ fontSize:15 }}>Modifier le fournisseur</h3><div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16}/></button></div></div>
        <form onSubmit={submit}>
          <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:13 }}>
            <L label={t('f_company')}><input className="set-input" value={f.name} onChange={up('name')} required autoFocus /></L>
            <R><L label={t('f_category')}><input className="set-input" value={f.category} onChange={up('category')} /></L><L label={t('f_location')}><input className="set-input" value={f.location} onChange={up('location')} /></L></R>
            <R><L label={t('f_email')}><input className="set-input" type="email" value={f.email} onChange={up('email')} /></L>
              <L label={t('f_status')}><select className="set-input" value={f.status} onChange={up('status')}><option value="Preferred">{t('f_preferred')}</option><option value="Active">{t('f_active')}</option><option value="Trial">{t('f_trial')}</option><option value="Inactive">{t('f_inactive')}</option></select></L></R>
            <R><L label={t('f_rating')}><input className="set-input" type="number" min="0" max="5" step="0.1" value={f.rating} onChange={up('rating')} /></L><L label={t('f_spend')}><input className="set-input" type="number" value={f.spend} onChange={up('spend')} /></L></R>
            <div className="row gap8" style={{ marginTop:4 }}><span className="spacer" /><button type="button" className="btn" onClick={onClose}>{t('cancel')}</button><button type="submit" className="btn primary" disabled={saving}>{saving ? t('saving') : t('save')}</button></div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Suppliers() {
  const { suppliers: dbSuppliers = [], refetch } = useAppData();
  const t = useT();
  const [addOpen, setAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
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
                  <td className="row gap6">
                    <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setEditSupplier(s)}><I.edit size={13} /></button>
                    <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--tx-4)' }} onClick={() => deleteSupplier(s)}><I.trash size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {addOpen && <NewSupplierModal onClose={() => setAddOpen(false)} />}
      {editSupplier && <EditSupplierModal supplier={editSupplier} onClose={() => setEditSupplier(null)} onSaved={async () => { setEditSupplier(null); await refetch(); }} />}
    </div>
  );
}

function EditTaskModal({ task, onClose, onSaved }) {
  const t = useT();
  const [f, setF] = useState({ title: task.title||'', description: task.client||'', prio: task.prio||'Medium', due_group: task.due_group||'Today' });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await db.from('tasks').update({ title: f.title, client: f.description||null, prio: f.prio, due_group: f.due_group }).eq('id', task.id);
    onSaved();
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} />
      <div className="card" style={{ position:'relative', width:460, maxWidth:'100%', boxShadow:'var(--shadow-lg)', animation:'fadeUp .22s var(--ease)' }}>
        <div className="card-head"><h3 style={{ fontSize:15 }}>Modifier la tâche</h3><div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16}/></button></div></div>
        <form onSubmit={submit}>
          <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:13 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{t('f_title')} <span style={{ color:'var(--red)' }}>*</span></label>
              <input className="set-input" value={f.title} onChange={up('title')} required autoFocus />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>Description</label>
              <textarea className="set-input" value={f.description} onChange={up('description')} rows={2} style={{ resize:'vertical' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{t('f_prio')}</label>
                <select className="set-input" value={f.prio} onChange={up('prio')}>
                  <option value="High">{t('f_prio_high')}</option><option value="Medium">{t('f_prio_med')}</option><option value="Low">{t('f_prio_low')}</option>
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{t('f_due')}</label>
                <select className="set-input" value={f.due_group} onChange={up('due_group')}>
                  <option value="Today">{t('f_today')}</option><option value="Tomorrow">{t('f_tomorrow')}</option><option value="This week">{t('f_week')}</option>
                </select>
              </div>
            </div>
            <div className="row gap8" style={{ marginTop:4 }}><span className="spacer" /><button type="button" className="btn" onClick={onClose}>{t('cancel')}</button><button type="submit" className="btn primary" disabled={saving}>{saving ? t('saving') : t('save')}</button></div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Tasks() {
  const { tasks: dbTasks, refetch } = useAppData();
  const t = useT();
  const [localDone, setLocalDone] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
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
                    <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setEditTask(tk)}><I.edit size={13} /></button>
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
      {editTask && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} onSaved={async () => { setEditTask(null); await refetch(); }} />}
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

const DATA_SECTIONS = [
  { id: 'contacts',        label: 'Contacts',       desc: 'Réseau pro & perso + historique',  tables: ['contact_logs','contacts'] },
  { id: 'deals',           label: 'CRM / Leads',    desc: 'Pipeline commercial',              tables: ['deals'] },
  { id: 'prospects',       label: 'Prospection',    desc: 'Prospects & campagnes',            tables: ['prospects','campaigns'] },
  { id: 'projects',        label: 'Projets',         desc: 'Projets & kanban',                 tables: ['projects'] },
  { id: 'tasks',           label: 'Tâches',          desc: 'Toutes les tâches',                tables: ['tasks'] },
  { id: 'documents',       label: 'Documents',       desc: 'Documents & fichiers',             tables: ['documents'] },
  { id: 'finance',         label: 'Finance',         desc: 'Factures & dépenses',              tables: ['finance'] },
  { id: 'suppliers',       label: 'Fournisseurs',    desc: 'Carnet de fournisseurs',           tables: ['suppliers'] },
  { id: 'jobs',            label: 'Candidatures',    desc: "Suivi de recherche d'emploi",      tables: ['job_applications'] },
];

function DangerZone({ userId, refetch }) {
  const [selected, setSelected] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState([]);

  const toggle = (id) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const toggleAll = () => {
    const allChecked = DATA_SECTIONS.every(s => selected[s.id]);
    const next = {};
    DATA_SECTIONS.forEach(s => { next[s.id] = !allChecked; });
    setSelected(next);
  };

  const toDelete = DATA_SECTIONS.filter(s => selected[s.id]);
  const allChecked = DATA_SECTIONS.every(s => selected[s.id]);
  const someChecked = toDelete.length > 0;

  const handleDelete = async () => {
    if (!someChecked) return;
    const names = toDelete.map(s => s.label).join(', ');
    if (!confirm(`Supprimer les données de : ${names} ?\n\nCette action est irréversible.`)) return;
    setDeleting(true);
    const ops = [];
    toDelete.forEach(s => s.tables.forEach(t => ops.push(db.from(t).delete().eq('user_id', userId))));
    await Promise.all(ops);
    setDone(toDelete.map(s => s.id));
    setSelected({});
    await refetch();
    setDeleting(false);
    setTimeout(() => setDone([]), 3000);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Sélectionner tout */}
      <div className="row gap10" style={{ padding:'12px 16px', borderBottom:'1px solid var(--line)' }}>
        <input type="checkbox" id="sel-all" checked={allChecked} onChange={toggleAll}
          style={{ width:15, height:15, cursor:'pointer', accentColor:'var(--red)' }} />
        <label htmlFor="sel-all" style={{ fontSize:12.5, fontWeight:600, color:'var(--tx-3)', cursor:'pointer', userSelect:'none' }}>
          Tout sélectionner / désélectionner
        </label>
      </div>
      {/* Lignes par section */}
      {DATA_SECTIONS.map(s => (
        <div key={s.id} className="row gap12" onClick={() => toggle(s.id)}
          style={{ padding:'11px 16px', borderBottom:'1px solid var(--line)', cursor:'pointer',
            background: selected[s.id] ? 'rgba(251,113,133,.07)' : 'transparent',
            transition:'background .15s' }}>
          <input type="checkbox" checked={!!selected[s.id]} onChange={() => toggle(s.id)}
            onClick={e => e.stopPropagation()}
            style={{ width:15, height:15, cursor:'pointer', accentColor:'var(--red)', flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:13, color: selected[s.id] ? 'var(--red)' : 'var(--tx)' }}>{s.label}</div>
            <div className="muted" style={{ fontSize:11.5 }}>{s.desc}</div>
          </div>
          {done.includes(s.id) && <span style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>Supprimé ✓</span>}
        </div>
      ))}
      {/* Bouton supprimer */}
      <div style={{ padding:'14px 16px' }}>
        <button className="btn" disabled={!someChecked || deleting}
          onClick={handleDelete}
          style={{ borderColor:'var(--red)', color:'var(--red)', opacity: someChecked ? 1 : .4, width:'100%', justifyContent:'center' }}>
          <I.trash size={13} />
          {deleting ? 'Suppression…' : someChecked ? `Supprimer ${toDelete.length} section${toDelete.length > 1 ? 's' : ''}` : 'Sélectionne des sections à supprimer'}
        </button>
      </div>
    </div>
  );
}

function IntegModal({ integ, onClose }) {
  const lsKey = { tavily:'ao_search_key', n8n:'ao_n8n_url', stripe:'ao_stripe_key', slack:'ao_slack_url' }[integ.id];
  const [val, setVal] = useState(() => localStorage.getItem(lsKey) || '');
  const [saved, setSaved] = useState(false);
  const save = () => { localStorage.setItem(lsKey, val.trim()); setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 1200); };
  const disconnect = () => { localStorage.removeItem(lsKey); onClose(); };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.55)', backdropFilter:'blur(3px)' }} />
      <div className="card" style={{ position:'relative', width:480, maxWidth:'100%', boxShadow:'var(--shadow-lg)', animation:'fadeUp .22s var(--ease)' }}>
        <div className="card-head">
          <div className="kpi-ico" style={{ width:36, height:36, background:'var(--acc-soft)', color:'var(--acc-2)', fontWeight:700, fontSize:15 }}>{integ.letter}</div>
          <div><h3 style={{ fontSize:15 }}>{integ.name}</h3><div className="sub">{integ.desc}</div></div>
          <div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16} /></button></div>
        </div>
        <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:12.5, color:'var(--tx-3)', lineHeight:1.6, background:'var(--panel-2)', padding:'10px 12px', borderRadius:8 }}>
            {integ.help}
          </div>
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>{integ.label}</label>
            <input className="set-input" type={integ.secret ? 'password' : 'text'} value={val} onChange={e => setVal(e.target.value)}
              placeholder={integ.ph} autoFocus onKeyDown={e => { if (e.key==='Enter') save(); }}
              style={{ fontFamily: val && integ.secret ? 'monospace' : 'inherit' }} />
          </div>
          <div className="row gap8" style={{ justifyContent:'space-between' }}>
            {localStorage.getItem(lsKey) && <button className="btn sm" style={{ color:'var(--red)', borderColor:'var(--red)' }} onClick={disconnect}>Déconnecter</button>}
            <span className="spacer" />
            <button className="btn" onClick={onClose}>Annuler</button>
            <button className="btn primary" onClick={save} disabled={!val.trim()}>
              {saved ? <><I.check2 size={13} /> Enregistré</> : 'Connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const { user, refetch } = useAppData();
  const t = useT();
  const { lang, setLang } = useLang();
  const [aiKey, setAiKey] = useState(() => localStorage.getItem('ao_ai_key') || '');
  const [keySaved, setKeySaved] = useState(false);
  const [integModal, setIntegModal] = useState(null);
  const [, forceUpdate] = useState(0);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const workspaceName = user?.user_metadata?.workspace_name || 'My Workspace';

  const saveKey = () => {
    localStorage.setItem('ao_ai_key', aiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const INTEG_DEFS = {
    tavily: { id:'tavily', name:'Tavily (recherche web)', desc:"Recherche web temps réel pour l'IA", letter:'T', secret:true, label:'Clé API Tavily', ph:'tvly-…', help:'Crée un compte gratuit sur tavily.com (1000 recherches/mois gratuites). Copie ta clé API depuis le dashboard Tavily.' },
    n8n:    { id:'n8n', name:'n8n', desc:'Workflow automation', letter:'n', secret:false, label:'URL du webhook n8n', ph:'https://ton-instance.n8n.cloud/webhook/…', help:"Entre l'URL de ton webhook n8n. Les automatisations pourront être déclenchées depuis Altitude One." },
    stripe: { id:'stripe', name:'Stripe', desc:'Paiements & facturation', letter:'S', secret:true, label:'Clé publique Stripe (pk_…)', ph:'pk_live_…', help:"Entre ta clé publique Stripe (commence par pk_). Ne jamais entrer ta clé secrète sk_ ici." },
    slack:  { id:'slack', name:'Slack', desc:'Notifications', letter:'S', secret:false, label:'URL Incoming Webhook Slack', ph:'https://hooks.slack.com/services/…', help:"Dans Slack : Apps → Incoming Webhooks → Ajouter → Choisir un canal → Copier l'URL du webhook." },
  };

  const isConnected = (id) => !!localStorage.getItem({ tavily:'ao_search_key', n8n:'ao_n8n_url', stripe:'ao_stripe_key', slack:'ao_slack_url' }[id]);

  const integRows = [
    ['Supabase', 'Auth & database', true, null],
    ['Groq / Llama', 'AI assistant — llama-3.1-8b-instant', !!aiKey, null],
    ['Tavily', 'Recherche web pour l\'IA', isConnected('tavily'), 'tavily'],
    ['Gmail / IMAP', 'Synchronisation boîte mail', false, 'gmail'],
    ['n8n', 'Workflow automation', isConnected('n8n'), 'n8n'],
    ['Stripe', 'Paiements & facturation', isConnected('stripe'), 'stripe'],
    ['Slack', 'Notifications', isConnected('slack'), 'slack'],
  ];

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
          {integRows.map(([name, desc, connected, integId], i) => (
            <div key={i} className="row gap12" style={{ padding: '12px 2px', borderBottom: i < integRows.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div className="kpi-ico" style={{ width: 34, height: 34, background: 'var(--panel-3)', color: 'var(--tx-2)', fontWeight: 700, fontSize: 13 }}>{name[0]}</div>
              <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div><div className="muted" style={{ fontSize: 11.5 }}>{desc}</div></div>
              <span className="spacer" />
              {connected
                ? <span className="pill green" style={{ cursor: integId && integId !== 'gmail' ? 'pointer' : 'default' }}
                    onClick={() => integId && integId !== 'gmail' && setIntegModal(integId)}>
                    <span style={{ width: 6, height: 6, borderRadius: 50, background: 'var(--green)', display: 'inline-block', marginRight: 5 }} />
                    {t('set_connected')}
                  </span>
                : integId === 'gmail'
                  ? <button className="btn sm" onClick={() => alert('Configure ta boîte mail depuis la section Inbox → Ajouter une boîte')}>{t('set_connect')}</button>
                  : integId
                    ? <button className="btn sm" onClick={() => { setIntegModal(integId); forceUpdate(n=>n+1); }}>{t('set_connect')}</button>
                    : <button className="btn sm" disabled style={{ opacity:.4 }}>{t('set_connect')}</button>
              }
            </div>
          ))}
        </div>
      </div>

      <div className="card card-pad" style={{ fontSize: 12.5, color: 'var(--tx-3)', marginBottom: 16 }}>
        <I.bolt size={14} style={{ color: 'var(--acc-2)', verticalAlign: '-2px' }} /> {t('set_tip')} <strong style={{ color: 'var(--tx-2)' }}>{t('set_tweaks')}</strong> {t('set_tip2')}
      </div>

      <div className="card" style={{ marginBottom: 16, border: '1px solid rgba(251,113,133,.25)', overflow:'hidden' }}>
        <div className="card-head"><h3 style={{ color: 'var(--red)' }}>Zone dangereuse</h3><div className="sub">Coche les sections à supprimer puis confirme. Irréversible.</div></div>
        <DangerZone userId={user.id} refetch={refetch} />
      </div>

      {integModal && <IntegModal integ={INTEG_DEFS[integModal]} onClose={() => { setIntegModal(null); forceUpdate(n=>n+1); }} />}
    </div>
  );
}
