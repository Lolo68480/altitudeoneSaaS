import { useState } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead, Pill, StatTile } from '../components/Shared';
import { NewJobModal } from '../components/Modals';
import { fmtEUR } from '../lib/data';

const JOB_SQL = `-- Colle ce SQL dans Supabase Dashboard → SQL Editor → New query
create table if not exists job_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company text not null, position text not null,
  location text, platform text, date_applied date,
  status text default 'Applied', salary_min integer, salary_max integer,
  url text, contact text, notes text,
  created_at timestamptz default now()
);
alter table job_applications enable row level security;
create policy "Users see own jobs" on job_applications
  for all using (auth.uid() = user_id);
alter table documents add column if not exists url text;`;

function SqlSetupBanner() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(JOB_SQL); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.3)', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:12 }}>
      <I.cog size={16} style={{ color:'#f59e0b', marginTop:2, flex:'none' }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:13, color:'#f59e0b', marginBottom:3 }}>Configuration requise — table Supabase manquante</div>
        <div style={{ fontSize:12.5, color:'var(--tx-3)', lineHeight:1.5 }}>Pour sauvegarder tes candidatures, crée la table <strong>job_applications</strong> dans Supabase Dashboard → SQL Editor.</div>
        <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn sm" onClick={() => setShow(s => !s)}>{show ? 'Masquer le SQL' : 'Voir le SQL à lancer'}</button>
          {show && <button className="btn primary sm" onClick={copy}>{copied ? '✓ Copié !' : 'Copier le SQL'}</button>}
        </div>
        {show && (
          <pre style={{ marginTop:10, background:'var(--bg-2)', border:'1px solid var(--line)', borderRadius:8, padding:'12px 14px', fontSize:11.5, color:'var(--tx-3)', overflow:'auto', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{JOB_SQL}</pre>
        )}
      </div>
    </div>
  );
}

function JobDrawer({ job, onClose, onDelete, t, statusLabel, STATUS_COLOR, refetch }) {
  const [status, setStatus] = useState(job.status);
  const [notes, setNotes] = useState(job.notes || '');
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    await db.from('job_applications').update({ notes, status }).eq('id', job.id);
    await refetch();
    setSaving(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.5)', backdropFilter:'blur(2px)' }} />
      <div className="card" style={{ position:'absolute', top:0, right:0, bottom:0, width:440, borderRadius:0, display:'flex', flexDirection:'column', animation:'slideIn .28s var(--ease)' }}>
        <div className="card-head">
          <div className="kpi-ico" style={{ width:36, height:36, background:'var(--acc-soft)', color:'var(--acc-2)', fontWeight:700, fontSize:14 }}>{job.company[0]}</div>
          <div>
            <h3 style={{ fontSize:15 }}>{job.company}</h3>
            <div className="sub">{job.position}</div>
          </div>
          <div className="right">
            <button className="icon-btn" style={{ color:'var(--red)' }} onClick={() => { onClose(); onDelete(job); }}><I.trash size={15} /></button>
            <button className="icon-btn" onClick={onClose}><I.x size={16} /></button>
          </div>
        </div>
        <div className="scroll" style={{ padding:18, display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card card-pad" style={{ background:'var(--bg-2)' }}>
            <div className="muted" style={{ fontSize:11.5, marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{t('jobs_col_status')}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['Applied','Interview','Test','Offer','Rejected','Withdrawn','Accepted'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${status===s ? 'var(--acc)' : 'var(--line-2)'}`, background: status===s ? 'var(--acc-soft)' : 'transparent', color: status===s ? 'var(--acc-2)' : 'var(--tx-3)', fontSize:12.5, fontWeight: status===s ? 600 : 400, cursor:'pointer' }}>
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>
          {[
            [t('jobs_col_location'), job.location],
            [t('jobs_col_platform'), job.platform],
            [t('jobs_col_date'), job.date_applied],
            [t('jobs_col_salary'), job.salary_min ? (fmtEUR(job.salary_min, true) + (job.salary_max ? ' – '+fmtEUR(job.salary_max,true) : '')) : null],
            [t('jobs_contact'), job.contact],
          ].filter(([,v]) => v).map(([k, v]) => (
            <div key={k} className="row" style={{ padding:'9px 2px', borderBottom:'1px solid var(--line)', fontSize:13 }}>
              <span className="muted" style={{ width:120 }}>{k}</span>
              <span style={{ fontWeight:500 }}>{v}</span>
            </div>
          ))}
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener" className="btn sm" style={{ textDecoration:'none' }}>
              <I.globe size={13} /> {t('jobs_view_offer')}
            </a>
          )}
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>{t('jobs_notes')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              style={{ width:'100%', background:'var(--panel-2)', border:'1px solid var(--line-2)', borderRadius:8, padding:'10px 12px', color:'var(--tx)', fontSize:13, resize:'vertical', fontFamily:'var(--font)' }} />
          </div>
          <button className="btn primary" onClick={saveNotes} disabled={saving}>{saving ? t('saving') : t('save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function Jobs() {
  const { jobs = [], refetch } = useAppData();
  const t = useT();
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQ, setSearchQ] = useState('');
  const [sel, setSel] = useState(null);

  const STATUS_COLOR = { Applied:'blue', Interview:'violet', Test:'amber', Offer:'green', Rejected:'red', Withdrawn:'gray', Accepted:'green' };

  const statusLabel = (s) => ({
    Applied:t('job_applied'), Interview:t('job_interview'), Test:t('job_test'),
    Offer:t('job_offer'), Rejected:t('job_rejected'), Withdrawn:t('job_withdrawn'), Accepted:t('job_accepted'),
  })[s] || s;

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status==='Applied').length,
    interviews: jobs.filter(j => ['Interview','Test'].includes(j.status)).length,
    offers: jobs.filter(j => ['Offer','Accepted'].includes(j.status)).length,
    rate: jobs.length ? Math.round((jobs.filter(j => j.status!=='Applied').length / jobs.length)*100) : 0,
  };

  const filtered = jobs.filter(j => {
    const matchFilter = filter==='All' || j.status===filter;
    const matchSearch = !searchQ || j.company?.toLowerCase().includes(searchQ.toLowerCase()) || j.position?.toLowerCase().includes(searchQ.toLowerCase());
    return matchFilter && matchSearch;
  });

  const deleteJob = async (j) => {
    if (!confirm(t('delete_confirm') + ' "' + j.company + '" ?')) return;
    await db.from('job_applications').delete().eq('id', j.id);
    await refetch();
  };

  const exportCSV = () => {
    const rows = [['Company','Position','Location','Platform','Date','Status','Salary','URL','Contact','Notes']];
    jobs.forEach(j => rows.push([j.company,j.position,j.location||'',j.platform||'',j.date_applied||'',j.status,j.salary_min?(j.salary_min+'-'+j.salary_max+'€'):'',j.url||'',j.contact||'',j.notes||'']));
    const csv = rows.map(r => r.map(v => '"'+String(v||'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='candidatures.csv'; a.click();
  };

  const filterOpts = ['All','Applied','Interview','Test','Offer','Rejected','Accepted'];

  return (
    <div className="view">
      <PageHead title={t('nav_jobs')} sub={t('jobs_sub', { n: jobs.length })}>
        {jobs.length > 0 && <button className="btn sm" onClick={exportCSV}><I.download size={14} /> {t('export_csv')}</button>}
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('jobs_new')}</button>
      </PageHead>

      <SqlSetupBanner />

      <div className="grid" style={{ gridTemplateColumns:'repeat(5,1fr)', marginBottom:16 }}>
        <StatTile icon="send" color="--acc" label={t('jobs_total')} value={stats.total} note="" />
        <StatTile icon="clock" color="--amber" label={t('jobs_pending')} value={stats.pending} note={t('jobs_no_reply')} />
        <StatTile icon="users" color="--violet" label={t('jobs_interviews')} value={stats.interviews} note="" />
        <StatTile icon="check2" color="--green" label={t('jobs_offers')} value={stats.offers} note="" />
        <StatTile icon="trendUp" color="--cyan" label={t('jobs_rate')} value={stats.rate + '%'} note={t('jobs_response_rate')} />
      </div>

      <div className="card" style={{ marginBottom:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div className="seg">
          {filterOpts.map(f => (
            <button key={f} className={filter===f ? 'on' : ''} onClick={() => setFilter(f)}>
              {f==='All' ? t('all') : statusLabel(f)}
              {f!=='All' && <span style={{ marginLeft:5, fontSize:11, fontWeight:700, opacity:.7 }}>{jobs.filter(j=>j.status===f).length}</span>}
            </button>
          ))}
        </div>
        <span className="spacer" />
        <div className="search" style={{ height:32 }}>
          <I.search size={14} />
          <input placeholder={t('jobs_search')} value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card card-pad" style={{ textAlign:'center', padding:'48px 24px' }}>
          <div className="kpi-ico" style={{ width:44, height:44, borderRadius:12, background:'var(--acc-soft)', color:'var(--acc-2)', margin:'0 auto 14px' }}><I.briefcase size={22} /></div>
          <h3 style={{ margin:'0 0 6px' }}>{jobs.length===0 ? t('jobs_empty_title') : t('jobs_no_match')}</h3>
          <p className="muted" style={{ fontSize:13, marginBottom:20 }}>{jobs.length===0 ? t('jobs_empty_desc') : t('jobs_no_match_desc')}</p>
          {jobs.length===0 && <button className="btn primary" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('jobs_new')}</button>}
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('jobs_col_company')}</th><th>{t('jobs_col_position')}</th><th>{t('jobs_col_location')}</th>
                <th>{t('jobs_col_platform')}</th><th>{t('jobs_col_date')}</th><th>{t('jobs_col_salary')}</th>
                <th>{t('jobs_col_status')}</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id} onClick={() => setSel(j)} style={{ cursor:'pointer' }}>
                  <td>
                    <div style={{ fontWeight:600, fontSize:13.5 }}>{j.company}</div>
                    {j.contact && <div className="muted" style={{ fontSize:11.5 }}>{j.contact}</div>}
                  </td>
                  <td style={{ fontWeight:500 }}>{j.position}</td>
                  <td className="muted">{j.location || '—'}</td>
                  <td>{j.platform ? <span className="pill gray" style={{ fontSize:11 }}>{j.platform}</span> : <span className="muted">—</span>}</td>
                  <td className="muted" style={{ fontSize:12 }}>{j.date_applied || '—'}</td>
                  <td className="muted" style={{ fontSize:12 }}>{j.salary_min ? fmtEUR(j.salary_min, true) + (j.salary_max ? ' – '+fmtEUR(j.salary_max, true) : '') : '—'}</td>
                  <td><Pill kind={STATUS_COLOR[j.status]||'gray'} text={statusLabel(j.status)} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      {j.url && <a href={j.url} target="_blank" rel="noopener" className="icon-btn" style={{ width:28, height:28 }} title={t('jobs_view_offer')}><I.globe size={14} /></a>}
                      <button className="icon-btn" style={{ width:28, height:28, color:'var(--tx-4)' }} onClick={() => deleteJob(j)}><I.trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sel && <JobDrawer job={sel} onClose={() => setSel(null)} onDelete={deleteJob} t={t} statusLabel={statusLabel} STATUS_COLOR={STATUS_COLOR} refetch={refetch} />}
      {addOpen && <NewJobModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
