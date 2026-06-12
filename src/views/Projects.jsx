import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead, Pill } from '../components/Shared';
import { NewProjectModal } from '../components/Modals';
import { KANBAN_COLS, PRIO } from '../lib/data';

function EditProjectModal({ project, onClose, onSaved }) {
  const t = useT();
  const [f, setF] = useState({ title: project.title||'', client: project.client||'', prio: project.prio||'Medium', col: project.col||'To Do', due: project.due||'', tags: (project.tags||[]).join(', ') });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    const tags = f.tags ? f.tags.split(',').map(x => x.trim()).filter(Boolean) : [];
    await db.from('projects').update({ title: f.title, client: f.client||null, prio: f.prio, col: f.col, due: f.due||null, tags }).eq('id', project.id);
    onSaved();
  };
  const L = ({ label, req, children }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}{req && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}</label>
      {children}
    </div>
  );
  const R = ({ children }) => <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>{children}</div>;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} />
      <div className="card" style={{ position:'relative', width:500, maxWidth:'100%', boxShadow:'var(--shadow-lg)', animation:'fadeUp .22s var(--ease)' }}>
        <div className="card-head"><h3 style={{ fontSize:15 }}>Modifier le projet</h3><div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16}/></button></div></div>
        <form onSubmit={submit}>
          <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:13 }}>
            <L label={t('f_title')} req><input className="set-input" value={f.title} onChange={up('title')} required autoFocus /></L>
            <R>
              <L label={t('f_client')}><input className="set-input" value={f.client} onChange={up('client')} /></L>
              <L label={t('f_prio')}>
                <select className="set-input" value={f.prio} onChange={up('prio')}>
                  <option value="High">{t('f_prio_high')}</option><option value="Medium">{t('f_prio_med')}</option><option value="Low">{t('f_prio_low')}</option>
                </select>
              </L>
            </R>
            <R>
              <L label={t('f_col')}>
                <select className="set-input" value={f.col} onChange={up('col')}>
                  <option value="To Do">{t('f_todo')}</option><option value="In Progress">{t('f_inprog')}</option><option value="Waiting">{t('f_waiting')}</option><option value="Completed">{t('f_done')}</option>
                </select>
              </L>
              <L label={t('f_due_date')}><input className="set-input" value={f.due} onChange={up('due')} placeholder="Jun 30" /></L>
            </R>
            <L label={t('f_tags')}><input className="set-input" value={f.tags} onChange={up('tags')} placeholder="Design, Dev, SEO" /></L>
            <div className="row gap8" style={{ marginTop:4 }}><span className="spacer" /><button type="button" className="btn" onClick={onClose}>{t('cancel')}</button><button type="submit" className="btn primary" disabled={saving}>{saving ? t('saving') : t('save')}</button></div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { projects: ctxProjects, clients: ctxClients, refetch } = useAppData();
  const t = useT();
  const [tasks, setTasks] = useState(ctxProjects || []);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const colMeta = { 'To Do': '--tx-3', 'In Progress': '--acc', 'Waiting': '--amber', 'Completed': '--green' };
  const colLabel = (col) => col === 'To Do' ? t('f_todo') : col === 'In Progress' ? t('f_inprog') : col === 'Waiting' ? t('f_waiting') : t('f_done');

  useEffect(() => { if (ctxProjects?.length) setTasks(ctxProjects); }, [ctxProjects]);
  useEffect(() => { if (!ctxProjects?.length) setTasks([]); }, [ctxProjects]);

  const drop = async (col) => {
    if (drag) {
      setTasks(ts => ts.map(tk => tk.id === drag ? { ...tk, col } : tk));
      await db.from('projects').update({ col }).eq('id', drag);
    }
    setDrag(null); setOver(null);
  };

  const deleteTask = async (tk) => {
    await db.from('projects').delete().eq('id', tk.id);
    setTasks(ts => ts.filter(x => x.id !== tk.id));
    await refetch();
  };

  return (
    <div className="view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHead title={t('nav_projects')} sub={t('proj_sub', { n: tasks.length, c: ctxClients?.length || 0 })}>
        <button className="btn sm"><I.filter size={14} /> {t('proj_filter')}</button>
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('proj_new')}</button>
      </PageHead>

      <div className="kb-cols" style={{ flex: 1 }}>
        {KANBAN_COLS.map(col => {
          const items = tasks.filter(tk => tk.col === col);
          return (
            <div key={col} className={'kb-col' + (over === col ? ' drop' : '')}
              onDragOver={e => { e.preventDefault(); setOver(col); }}
              onDragLeave={() => setOver(o => o === col ? null : o)}
              onDrop={() => drop(col)}>
              <div className="kb-col-head">
                <span style={{ width: 8, height: 8, borderRadius: 50, background: `var(${colMeta[col]})` }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{colLabel(col)}</span>
                <span className="num" style={{ color: 'var(--tx-3)', fontSize: 12 }}>{items.length}</span>
                <span className="spacer" />
                <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => setAddOpen(true)}><I.plus size={14} /></button>
              </div>
              <div className="kb-col-body">
                {items.map(tk => (
                  <div key={tk.id} className={'kb-card' + (drag === tk.id ? ' dragging' : '')} draggable
                    onDragStart={() => setDrag(tk.id)} onDragEnd={() => { setDrag(null); setOver(null); }}>
                    <div className="row gap8" style={{ marginBottom: 9, flexWrap: 'wrap' }}>
                      {(tk.tags || []).map(tag => <span key={tag} className="pill gray" style={{ fontSize: 10 }}>{tag}</span>)}
                      <span className="spacer" />
                      <Pill kind={PRIO[tk.prio]} text={tk.prio} />
                      <button className="icon-btn" style={{ width: 20, height: 20 }}
                        onClick={e => { e.stopPropagation(); setEditing(tk); }}>
                        <I.edit size={11} />
                      </button>
                      <button className="icon-btn" style={{ width: 20, height: 20, color: 'var(--tx-4)' }}
                        onClick={e => { e.stopPropagation(); deleteTask(tk); }}>
                        <I.trash size={11} />
                      </button>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 550, lineHeight: 1.35, marginBottom: 4 }}>{tk.title}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginBottom: 11 }}>{tk.client}</div>
                    {tk.sub && tk.sub[1] > 0 && tk.col !== 'Completed' && (
                      <div style={{ marginBottom: 11 }}>
                        <div className="bar" style={{ height: 4 }}><span style={{ width: `${(tk.sub[0]/tk.sub[1])*100}%` }} /></div>
                        <div className="muted" style={{ fontSize: 10.5, marginTop: 4 }}>{t('proj_subtasks', { a: tk.sub[0], b: tk.sub[1] })}</div>
                      </div>
                    )}
                    <div className="row gap8">
                      <span className="row gap8" style={{ fontSize: 11.5, color: tk.col === 'Completed' ? 'var(--green)' : 'var(--tx-3)' }}>
                        {tk.col === 'Completed' ? <I.check2 size={12} /> : <I.clock size={12} />} {tk.due}
                      </span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div style={{ textAlign: 'center', color: 'var(--tx-4)', fontSize: 12, padding: '24px 0', border: '1.5px dashed var(--line-2)', borderRadius: 10 }}>{t('proj_drop')}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {addOpen && <NewProjectModal onClose={() => setAddOpen(false)} />}
      {editing && <EditProjectModal project={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await refetch(); }} />}
    </div>
  );
}
