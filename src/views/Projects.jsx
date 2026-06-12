import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead, Pill } from '../components/Shared';
import { NewProjectModal } from '../components/Modals';
import { KANBAN_COLS, PRIO } from '../lib/data';

export default function Projects() {
  const { projects: ctxProjects, clients: ctxClients, refetch } = useAppData();
  const t = useT();
  const [tasks, setTasks] = useState(ctxProjects || []);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
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
    </div>
  );
}
