import { useState } from 'react';
import { db } from '../lib/supabase';
import { I } from './Icons';
import { useT } from '../contexts/LangContext';
import { useAppData } from '../contexts/AppDataContext';

function Modal({ title, sub, onClose, onSubmit, submitting, children }) {
  const t = useT();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} />
      <div className="card" style={{ position: 'relative', width: 540, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp .25s var(--ease)' }}>
        <div className="card-head">
          <div><h3 style={{ fontSize: 15 }}>{title}</h3>{sub && <div className="sub">{sub}</div>}</div>
          <div className="right"><button className="icon-btn" onClick={onClose} type="button"><I.x size={16} /></button></div>
        </div>
        <form onSubmit={onSubmit}>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {children}
            <div className="row gap8" style={{ marginTop: 4 }}>
              <span className="spacer" />
              <button type="button" className="btn" onClick={onClose}>{t('cancel')}</button>
              <button type="submit" className="btn primary" disabled={submitting}>{submitting ? t('saving') : t('save')}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function MField({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function MRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

export function NewClientModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [f, setF] = useState({ company: '', contact: '', industry: '', website: '', email: '', phone: '', mrr: '', health: 'good', since: String(new Date().getFullYear()) });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true);
    await db.from('clients').insert({ user_id: user.id, company: f.company, contact: f.contact||null, industry: f.industry||null, website: f.website||null, email: f.email||null, phone: f.phone||null, mrr: parseFloat(f.mrr)||0, health: f.health, since: f.since, projects: 0, value: 0 });
    await refetch(); onClose();
  };
  return (
    <Modal title={t('m_new_client')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      <MField label={t('f_company')} required><input className="set-input" value={f.company} onChange={up('company')} required autoFocus /></MField>
      <MRow>
        <MField label={t('f_contact')}><input className="set-input" value={f.contact} onChange={up('contact')} /></MField>
        <MField label={t('f_industry')}><input className="set-input" value={f.industry} onChange={up('industry')} /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_email')}><input className="set-input" type="email" value={f.email} onChange={up('email')} /></MField>
        <MField label={t('f_phone')}><input className="set-input" type="tel" value={f.phone} onChange={up('phone')} /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_website')}><input className="set-input" value={f.website} onChange={up('website')} placeholder="example.com" /></MField>
        <MField label={t('f_mrr')}><input className="set-input" type="number" value={f.mrr} onChange={up('mrr')} placeholder="0" /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_health')}>
          <select className="set-input" value={f.health} onChange={up('health')}>
            <option value="good">{t('f_health_good')}</option><option value="watch">{t('f_health_watch')}</option><option value="risk">{t('f_health_risk')}</option>
          </select>
        </MField>
        <MField label={t('f_since')}><input className="set-input" value={f.since} onChange={up('since')} /></MField>
      </MRow>
    </Modal>
  );
}

export function NewDealModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [f, setF] = useState({ company: '', contact: '', email: '', phone: '', value: '', stage: 'New Lead', industry: '', owner: '' });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true);
    await db.from('deals').insert({ user_id: user.id, company: f.company, contact: f.contact||null, email: f.email||null, phone: f.phone||null, value: parseFloat(f.value)||0, stage: f.stage, industry: f.industry||null, owner: f.owner||null, last_touch: 0, prob: 10 });
    await refetch(); onClose();
  };
  return (
    <Modal title={t('m_new_deal')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      <MRow>
        <MField label={t('f_company')} required><input className="set-input" value={f.company} onChange={up('company')} required autoFocus /></MField>
        <MField label={t('f_contact')}><input className="set-input" value={f.contact} onChange={up('contact')} /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_email')}><input className="set-input" type="email" value={f.email} onChange={up('email')} /></MField>
        <MField label={t('f_phone')}><input className="set-input" type="tel" value={f.phone} onChange={up('phone')} /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_value')}><input className="set-input" type="number" value={f.value} onChange={up('value')} placeholder="0" /></MField>
        <MField label={t('f_stage')}>
          <select className="set-input" value={f.stage} onChange={up('stage')}>
            <option value="New Lead">{t('stage_new_lead')}</option>
            <option value="Qualified">{t('stage_qualified')}</option>
            <option value="Proposal Sent">{t('stage_proposal')}</option>
            <option value="Negotiation">{t('stage_negotiation')}</option>
            <option value="Won">{t('stage_won')}</option>
            <option value="Lost">{t('stage_lost')}</option>
          </select>
        </MField>
      </MRow>
      <MRow>
        <MField label={t('f_industry')}><input className="set-input" value={f.industry} onChange={up('industry')} /></MField>
        <MField label={t('f_owner')}><input className="set-input" value={f.owner} onChange={up('owner')} /></MField>
      </MRow>
    </Modal>
  );
}

export function NewTaskModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [f, setF] = useState({ title: '', client: '', prio: 'Medium', due_group: 'Today' });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true);
    await db.from('tasks').insert({ user_id: user.id, title: f.title, client: f.client||null, prio: f.prio, due_group: f.due_group, done: false });
    await refetch(); onClose();
  };
  return (
    <Modal title={t('m_new_task')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      <MField label={t('f_title')} required><input className="set-input" value={f.title} onChange={up('title')} required autoFocus /></MField>
      <MRow>
        <MField label={t('f_client')}><input className="set-input" value={f.client} onChange={up('client')} /></MField>
        <MField label={t('f_prio')}>
          <select className="set-input" value={f.prio} onChange={up('prio')}>
            <option value="High">{t('f_prio_high')}</option><option value="Medium">{t('f_prio_med')}</option><option value="Low">{t('f_prio_low')}</option>
          </select>
        </MField>
      </MRow>
      <MField label={t('f_due')}>
        <select className="set-input" value={f.due_group} onChange={up('due_group')}>
          <option value="Today">{t('f_today')}</option><option value="Tomorrow">{t('f_tomorrow')}</option><option value="This week">{t('f_week')}</option>
        </select>
      </MField>
    </Modal>
  );
}

export function NewProjectModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [f, setF] = useState({ title: '', client: '', prio: 'Medium', col: 'To Do', due: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true);
    const tags = f.tags ? f.tags.split(',').map(x => x.trim()).filter(Boolean) : [];
    await db.from('projects').insert({ user_id: user.id, title: f.title, client: f.client||null, prio: f.prio, col: f.col, due: f.due||null, tags, sub: [0,0] });
    await refetch(); onClose();
  };
  return (
    <Modal title={t('m_new_proj')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      <MField label={t('f_title')} required><input className="set-input" value={f.title} onChange={up('title')} required autoFocus /></MField>
      <MRow>
        <MField label={t('f_client')}><input className="set-input" value={f.client} onChange={up('client')} /></MField>
        <MField label={t('f_prio')}>
          <select className="set-input" value={f.prio} onChange={up('prio')}>
            <option value="High">{t('f_prio_high')}</option><option value="Medium">{t('f_prio_med')}</option><option value="Low">{t('f_prio_low')}</option>
          </select>
        </MField>
      </MRow>
      <MRow>
        <MField label={t('f_col')}>
          <select className="set-input" value={f.col} onChange={up('col')}>
            <option value="To Do">{t('f_todo')}</option><option value="In Progress">{t('f_inprog')}</option><option value="Waiting">{t('f_waiting')}</option><option value="Completed">{t('f_done')}</option>
          </select>
        </MField>
        <MField label={t('f_due_date')}><input className="set-input" value={f.due} onChange={up('due')} placeholder="Jun 30" /></MField>
      </MRow>
      <MField label={t('f_tags')}><input className="set-input" value={f.tags} onChange={up('tags')} placeholder="Design, Dev, SEO" /></MField>
    </Modal>
  );
}

export function NewProspectModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [f, setF] = useState({ company: '', website: '', email: '', linkedin: '', phone: '', city: '', industry: '', stage: 'Queued' });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true);
    await db.from('prospects').insert({ user_id: user.id, ...f });
    await refetch(); onClose();
  };
  return (
    <Modal title={t('m_new_prospect')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      <MRow>
        <MField label={t('f_company')} required><input className="set-input" value={f.company} onChange={up('company')} required autoFocus /></MField>
        <MField label={t('f_website')}><input className="set-input" value={f.website} onChange={up('website')} /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_email')}><input className="set-input" type="email" value={f.email} onChange={up('email')} /></MField>
        <MField label={t('f_phone')}><input className="set-input" type="tel" value={f.phone} onChange={up('phone')} /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_city')}><input className="set-input" value={f.city} onChange={up('city')} /></MField>
        <MField label={t('f_industry')}><input className="set-input" value={f.industry} onChange={up('industry')} /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_linkedin')}><input className="set-input" value={f.linkedin} onChange={up('linkedin')} /></MField>
        <MField label={t('f_stage')}>
          <select className="set-input" value={f.stage} onChange={up('stage')}>
            <option value="Queued">{t('stage_queued')}</option>
            <option value="Contacted">{t('stage_contacted')}</option>
            <option value="Replied">{t('stage_replied')}</option>
            <option value="Meeting">{t('stage_meeting')}</option>
            <option value="Converted">{t('stage_converted')}</option>
            <option value="Archived">{t('stage_archived')}</option>
          </select>
        </MField>
      </MRow>
    </Modal>
  );
}

export function NewCampaignModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true);
    await db.from('campaigns').insert({ user_id: user.id, name, active, sent: 0, opened: 0, replied: 0, meetings: 0 });
    await refetch(); onClose();
  };
  return (
    <Modal title={t('m_new_campaign')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      <MField label={t('f_campaign')} required><input className="set-input" value={name} onChange={e => setName(e.target.value)} required autoFocus /></MField>
      <div className="row gap10" style={{ alignItems: 'center', padding: '4px 0' }}>
        <input type="checkbox" id="camp-active" checked={active} onChange={e => setActive(e.target.checked)} />
        <label htmlFor="camp-active" style={{ fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>{t('f_active')}</label>
      </div>
    </Modal>
  );
}

export function NewFinanceModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [f, setF] = useState({ type: 'invoice', label: '', amount: '', client: '', status: 'Draft', date: '' });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true);
    await db.from('finance').insert({ user_id: user.id, type: f.type, label: f.label, amount: parseFloat(f.amount)||0, client: f.client||null, status: f.status, date: f.date||null });
    await refetch(); onClose();
  };
  return (
    <Modal title={t('m_new_finance')} sub={t('m_finance_sub')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      <MRow>
        <MField label={t('f_type')}>
          <select className="set-input" value={f.type} onChange={up('type')}>
            <option value="invoice">{t('f_inv')}</option><option value="expense">{t('f_exp')}</option>
          </select>
        </MField>
        <MField label={t('f_amount')} required><input className="set-input" type="number" min="0" step="0.01" value={f.amount} onChange={up('amount')} required /></MField>
      </MRow>
      <MField label={t('f_label')} required><input className="set-input" value={f.label} onChange={up('label')} required autoFocus /></MField>
      <MRow>
        <MField label={t('f_client')}><input className="set-input" value={f.client} onChange={up('client')} /></MField>
        <MField label={t('f_status')}>
          <select className="set-input" value={f.status} onChange={up('status')}>
            <option value="Draft">{t('f_draft2')}</option><option value="Sent">{t('f_sent')}</option><option value="Paid">{t('f_paid')}</option>
          </select>
        </MField>
      </MRow>
      <MField label={t('f_date')}><input className="set-input" value={f.date} onChange={up('date')} placeholder="Jun 12" /></MField>
    </Modal>
  );
}

export function NewSupplierModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [f, setF] = useState({ name: '', category: '', location: '', email: '', rating: '', spend: '', status: 'Active' });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true);
    await db.from('suppliers').insert({ user_id: user.id, name: f.name, category: f.category||null, location: f.location||null, email: f.email||null, rating: parseFloat(f.rating)||null, spend: parseFloat(f.spend)||0, status: f.status });
    await refetch(); onClose();
  };
  return (
    <Modal title={t('m_new_supplier')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      <MField label={t('f_company')} required><input className="set-input" value={f.name} onChange={up('name')} required autoFocus /></MField>
      <MRow>
        <MField label={t('f_category')}><input className="set-input" value={f.category} onChange={up('category')} /></MField>
        <MField label={t('f_location')}><input className="set-input" value={f.location} onChange={up('location')} /></MField>
      </MRow>
      <MRow>
        <MField label={t('f_email')}><input className="set-input" type="email" value={f.email} onChange={up('email')} /></MField>
        <MField label={t('f_status')}>
          <select className="set-input" value={f.status} onChange={up('status')}>
            <option value="Preferred">{t('f_preferred')}</option><option value="Active">{t('f_active')}</option><option value="Trial">{t('f_trial')}</option><option value="Inactive">{t('f_inactive')}</option>
          </select>
        </MField>
      </MRow>
      <MRow>
        <MField label={t('f_rating')}><input className="set-input" type="number" min="0" max="5" step="0.1" value={f.rating} onChange={up('rating')} placeholder="4.5" /></MField>
        <MField label={t('f_spend')}><input className="set-input" type="number" value={f.spend} onChange={up('spend')} placeholder="0" /></MField>
      </MRow>
    </Modal>
  );
}

export function NewDocumentModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const [f, setF] = useState({ name: '', folder: 'Contracts', size: '', manualUrl: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const onFileChange = (e) => {
    const sel = e.target.files[0];
    if (!sel) return;
    setFile(sel);
    setUploadErr('');
    const sizeFmt = sel.size < 1024*1024 ? Math.round(sel.size/1024)+' KB' : (sel.size/1024/1024).toFixed(1)+' MB';
    setF(p => ({ ...p, name: p.name || sel.name, size: sizeFmt }));
  };

  const onSubmit = async e => {
    e.preventDefault(); setSaving(true); setUploadErr('');
    let url = f.manualUrl.trim() || null;
    if (file) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await db.storage.from('documents').upload(path, file);
      if (!upErr) {
        const { data: urlData } = db.storage.from('documents').getPublicUrl(path);
        url = urlData?.publicUrl || null;
      } else {
        setUploadErr("Erreur d'upload. Le bucket Supabase Storage n'est peut-être pas configuré. Colle un lien externe à la place.");
        setSaving(false); return;
      }
    }
    const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
    await db.from('documents').insert({ user_id: user.id, name: f.name, folder: f.folder, size: f.size||null, modified: today, url });
    await refetch(); onClose();
  };

  const folderOpts = [['Contracts','doc_contracts'],['Quotes','doc_quotes'],['Invoices','doc_invoices'],['Certificates','doc_certificates'],['Legal','doc_legal'],['Brand assets','doc_brand']];
  return (
    <Modal title={t('m_new_doc')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      {uploadErr && <div style={{ background:'rgba(251,113,133,.12)', color:'var(--red)', border:'1px solid rgba(251,113,133,.4)', borderRadius:8, padding:'10px 14px', fontSize:12.5 }}>{uploadErr}</div>}
      <MField label={t('doc_file_label')}>
        <div style={{ position:'relative' }}>
          <input type="file" id="doc-file-input" onChange={onFileChange} style={{ display:'none' }} />
          <label htmlFor="doc-file-input" className="set-input" style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', color: file ? 'var(--tx)' : 'var(--tx-4)' }}>
            <I.paperclip size={14} style={{ flex:'none' }} />
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file ? file.name : t('doc_file_ph')}</span>
          </label>
        </div>
      </MField>
      <MField label="Lien externe (Google Drive, Dropbox…)">
        <input className="set-input" type="url" value={f.manualUrl} onChange={up('manualUrl')} placeholder="https://drive.google.com/…" />
        <div style={{ fontSize:11.5, color:'var(--tx-4)', marginTop:4 }}>Si pas de fichier joint, colle ici le lien du document pour pouvoir l'ouvrir.</div>
      </MField>
      <MField label={t('f_filename')} required><input className="set-input" value={f.name} onChange={up('name')} required placeholder="Contract.pdf" /></MField>
      <MRow>
        <MField label={t('f_folder')}>
          <select className="set-input" value={f.folder} onChange={up('folder')}>
            {folderOpts.map(([val, key]) => <option key={val} value={val}>{t(key)}</option>)}
          </select>
        </MField>
        <MField label={t('f_size')}><input className="set-input" value={f.size} onChange={up('size')} placeholder="2.4 MB" /></MField>
      </MRow>
    </Modal>
  );
}

export function NewJobModal({ onClose }) {
  const { user, refetch } = useAppData();
  const t = useT();
  const today = new Date().toISOString().split('T')[0];
  const [f, setF] = useState({ company:'', position:'', location:'', platform:'LinkedIn', date_applied:today, status:'Applied', salary_min:'', salary_max:'', url:'', contact:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const onSubmit = async e => {
    e.preventDefault(); setSaving(true); setErrMsg('');
    const { error } = await db.from('job_applications').insert({ user_id:user.id, company:f.company, position:f.position, location:f.location||null, platform:f.platform||null, date_applied:f.date_applied||null, status:f.status, salary_min:parseInt(f.salary_min)||null, salary_max:parseInt(f.salary_max)||null, url:f.url||null, contact:f.contact||null, notes:f.notes||null });
    if (error) {
      setErrMsg('Erreur Supabase : table "job_applications" introuvable. Lance le SQL dans Supabase Dashboard → SQL Editor.');
      setSaving(false); return;
    }
    await refetch(); onClose();
  };
  const statusLabel = (s) => ({ Applied:t('job_applied'), Interview:t('job_interview'), Test:t('job_test'), Offer:t('job_offer'), Rejected:t('job_rejected'), Withdrawn:t('job_withdrawn'), Accepted:t('job_accepted') })[s] || s;
  return (
    <Modal title={t('jobs_new')} onClose={onClose} onSubmit={onSubmit} submitting={saving}>
      {errMsg && <div style={{ background:'rgba(251,113,133,.12)', color:'var(--red)', border:'1px solid var(--red)', borderRadius:8, padding:'10px 14px', fontSize:12.5, lineHeight:1.5 }}>{errMsg}</div>}
      <MRow>
        <MField label={t('jobs_col_company')} required><input className="set-input" value={f.company} onChange={up('company')} required autoFocus /></MField>
        <MField label={t('jobs_col_position')} required><input className="set-input" value={f.position} onChange={up('position')} required /></MField>
      </MRow>
      <MRow>
        <MField label={t('jobs_col_location')}><input className="set-input" value={f.location} onChange={up('location')} placeholder="Paris, Remote…" /></MField>
        <MField label={t('jobs_col_platform')}>
          <select className="set-input" value={f.platform} onChange={up('platform')}>
            {['LinkedIn','Indeed','APEC','France Travail','HelloWork','Direct','Email','Référence','Autre'].map(p => <option key={p}>{p}</option>)}
          </select>
        </MField>
      </MRow>
      <MRow>
        <MField label={t('jobs_col_date')}><input className="set-input" type="date" value={f.date_applied} onChange={up('date_applied')} /></MField>
        <MField label={t('jobs_col_status')}>
          <select className="set-input" value={f.status} onChange={up('status')}>
            {['Applied','Interview','Test','Offer','Rejected','Withdrawn','Accepted'].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </MField>
      </MRow>
      <MRow>
        <MField label={t('jobs_salary_min')}><input className="set-input" type="number" value={f.salary_min} onChange={up('salary_min')} placeholder="35000" /></MField>
        <MField label={t('jobs_salary_max')}><input className="set-input" type="number" value={f.salary_max} onChange={up('salary_max')} placeholder="45000" /></MField>
      </MRow>
      <MRow>
        <MField label={t('jobs_url')}><input className="set-input" type="url" value={f.url} onChange={up('url')} placeholder="https://…" /></MField>
        <MField label={t('jobs_contact')}><input className="set-input" value={f.contact} onChange={up('contact')} placeholder="RH, recruteur…" /></MField>
      </MRow>
      <MField label={t('jobs_notes')}><textarea className="set-input" value={f.notes} onChange={up('notes')} rows={2} style={{ resize:'vertical' }} /></MField>
    </Modal>
  );
}
