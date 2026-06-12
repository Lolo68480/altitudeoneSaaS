import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead, Pill, Money } from '../components/Shared';
import { NewDealModal } from '../components/Modals';
import { fmtEUR, STATUS_META, PIPELINE_STAGES } from '../lib/data';

function EditDealModal({ deal, onClose, onSaved, t }) {
  const [f, setF] = useState({ company: deal.company||'', contact: deal.contact||'', email: deal.email||'', phone: deal.phone||'', value: deal.value||'', stage: deal.stage||'New Lead', industry: deal.industry||'', prob: deal.prob||10 });
  const [saving, setSaving] = useState(false);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await db.from('deals').update({ company: f.company, contact: f.contact||null, email: f.email||null, phone: f.phone||null, value: parseFloat(f.value)||0, stage: f.stage, industry: f.industry||null, prob: parseInt(f.prob)||0 }).eq('id', deal.id);
    onSaved();
  };
  const L = ({ label, children }) => <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:11, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</label>{children}</div>;
  const R = ({ children }) => <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>{children}</div>;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} />
      <div className="card" style={{ position:'relative', width:500, maxWidth:'100%', boxShadow:'var(--shadow-lg)', animation:'fadeUp .22s var(--ease)' }}>
        <div className="card-head"><h3 style={{ fontSize:15 }}>Modifier le deal</h3><div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16}/></button></div></div>
        <form onSubmit={submit}>
          <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:13 }}>
            <R><L label={t('crm_company')}><input className="set-input" value={f.company} onChange={up('company')} required autoFocus /></L><L label={t('crm_contact')}><input className="set-input" value={f.contact} onChange={up('contact')} /></L></R>
            <R><L label={t('f_email')}><input className="set-input" type="email" value={f.email} onChange={up('email')} /></L><L label={t('f_phone')}><input className="set-input" type="tel" value={f.phone} onChange={up('phone')} /></L></R>
            <R><L label={t('crm_deal_value')}><input className="set-input" type="number" value={f.value} onChange={up('value')} /></L>
              <L label={t('crm_stage')}><select className="set-input" value={f.stage} onChange={up('stage')}>{['New Lead','Qualified','Proposal Sent','Negotiation','Won','Lost'].map(s => <option key={s} value={s}>{s}</option>)}</select></L></R>
            <R><L label={t('crm_industry')}><input className="set-input" value={f.industry} onChange={up('industry')} /></L><L label={t('crm_win_prob') + ' %'}><input className="set-input" type="number" min="0" max="100" value={f.prob} onChange={up('prob')} /></L></R>
            <div className="row gap8" style={{ marginTop:4 }}><span className="spacer" /><button type="button" className="btn" onClick={onClose}>{t('cancel')}</button><button type="submit" className="btn primary" disabled={saving}>{saving ? t('saving') : t('save')}</button></div>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealDrawer({ deal, onClose, onDelete, onEdit, t }) {
  const emailHref = deal.email ? 'mailto:' + deal.email : null;
  const telHref = deal.phone ? 'tel:' + deal.phone : null;
  const rows = [
    [t('crm_contact'), deal.contact],
    [t('f_email'), deal.email],
    [t('f_phone'), deal.phone],
    [t('crm_industry'), deal.industry],
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)' }} />
      <div className="card" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 420, borderRadius: 0, borderRight: 'none', borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column', animation: 'slideIn .28s var(--ease)' }}>
        <div className="card-head">
          <div className="kpi-ico" style={{ width: 36, height: 36, background: 'var(--acc-soft)', color: 'var(--acc-2)', fontWeight: 700, fontSize: 14 }}>{deal.company[0]}</div>
          <div><h3 style={{ fontSize: 15 }}>{deal.company}</h3><div className="sub">{deal.industry || t('crm_stage')}</div></div>
          <div className="right">
            <button className="icon-btn" onClick={() => onEdit(deal)}><I.edit size={16} /></button>
            <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={() => onDelete(deal)} title={t('delete_confirm')}><I.trash size={16} /></button>
            <button className="icon-btn" onClick={onClose}><I.x size={16} /></button>
          </div>
        </div>
        <div className="scroll" style={{ padding: 18 }}>
          <div className="card card-pad" style={{ background: 'var(--bg-2)', marginBottom: 16 }}>
            <div className="muted" style={{ fontSize: 12 }}>{t('crm_deal_value')}</div>
            <div className="kpi-val num" style={{ fontSize: 30, marginTop: 6 }}>{fmtEUR(deal.value)}</div>
            <div className="row gap8" style={{ marginTop: 12 }}><Pill status={deal.stage} /><span className="muted" style={{ fontSize: 12 }}>· {deal.prob}% {t('crm_win_prob').toLowerCase()}</span></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 18 }}>
            {rows.map(([k, v]) => (
              <div key={k} className="row" style={{ padding: '11px 2px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <span className="muted" style={{ width: 110 }}>{k}</span><span style={{ fontWeight: 500 }}>{v || '—'}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {emailHref
              ? <a href={emailHref} className="btn primary" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}><I.mail size={15} /> {t('f_email')}</a>
              : <button className="btn primary" style={{ flex: 1 }} disabled><I.mail size={15} /> {t('f_email')}</button>}
            {telHref
              ? <a href={telHref} className="btn" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}><I.phone size={15} /> {t('f_phone')}</a>
              : <button className="btn" style={{ flex: 1 }} disabled><I.phone size={15} /> {t('f_phone')}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const { deals: ctxDeals, refetch } = useAppData();
  const t = useT();
  const [deals, setDeals] = useState(ctxDeals || []);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const [view, setView] = useState('Pipeline');
  const [sel, setSel] = useState(null);
  const [editDeal, setEditDeal] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => { if (ctxDeals?.length) setDeals(ctxDeals); }, [ctxDeals]);
  useEffect(() => { if (!ctxDeals?.length) setDeals([]); }, [ctxDeals]);

  const stageLabel = (s) => ({ 'New Lead':t('stage_new_lead'), 'Qualified':t('stage_qualified'), 'Proposal Sent':t('stage_proposal'), 'Negotiation':t('stage_negotiation'), 'Won':t('stage_won'), 'Lost':t('stage_lost') })[s] || s;

  const openPipeline = deals.filter(d => !['Won','Lost'].includes(d.stage));
  const pipelineValue = openPipeline.reduce((s, d) => s + (d.value || 0), 0);
  const visibleDeals = stageFilter === 'All' ? deals : deals.filter(d => d.stage === stageFilter);
  const stageTotal = (st) => deals.filter(d => d.stage === st).reduce((s, d) => s + d.value, 0);

  const drop = async (st) => {
    if (drag) {
      setDeals(ds => ds.map(d => d.id === drag ? { ...d, stage: st } : d));
      await db.from('deals').update({ stage: st }).eq('id', drag);
    }
    setDrag(null); setOver(null);
  };

  const deleteDeal = async (deal) => {
    if (!confirm(t('delete_confirm') + ' "' + deal.company + '" ?')) return;
    await db.from('deals').delete().eq('id', deal.id);
    setSel(null);
    await refetch();
  };

  const exportCSV = () => {
    const rows = [[t('crm_company'), t('crm_contact'), t('f_email'), t('f_phone'), t('crm_value'), t('crm_stage'), t('crm_industry')]];
    deals.forEach(d => rows.push([d.company, d.contact||'', d.email||'', d.phone||'', d.value, d.stage, d.industry||'']));
    const csv = rows.map(r => r.map(v => '"' + String(v||'').replace(/"/g,'""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'deals.csv'; a.click();
  };

  return (
    <div className="view">
      <PageHead title={t('nav_crm')} sub={t('crm_sub', { n: deals.length, v: fmtEUR(pipelineValue, true) })}>
        <div className="seg" style={{ marginRight: 4 }}>
          {[[t('crm_pipeline'), 'Pipeline'], [t('crm_table'), 'Table']].map(([label, val]) => (
            <button key={val} className={view === val ? 'on' : ''} onClick={() => setView(val)}>{label}</button>
          ))}
        </div>
        {deals.length > 0 && <button className="btn sm" onClick={exportCSV}><I.download size={14} /> {t('export_csv')}</button>}
        <div style={{ position: 'relative' }}>
          <button className="btn sm" onClick={() => setShowFilter(f => !f)}><I.filter size={14} /> {stageFilter !== 'All' ? stageFilter : t('filter')}</button>
          {showFilter && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200, background: 'var(--panel)', border: '1px solid var(--line-2)', borderRadius: 10, padding: 6, minWidth: 160, boxShadow: 'var(--shadow-lg)' }}>
              {['All', ...PIPELINE_STAGES].map(s => (
                <div key={s} onClick={() => { setStageFilter(s); setShowFilter(false); }}
                  style={{ padding: '8px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: stageFilter === s ? 600 : 400, background: stageFilter === s ? 'var(--acc-soft)' : 'transparent', color: stageFilter === s ? 'var(--acc-2)' : 'var(--tx)' }}>
                  {s === 'All' ? t('all') : stageLabel(s)}
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('crm_new')}</button>
      </PageHead>

      {view === 'Pipeline' ? (
        <div className="pipe">
          {PIPELINE_STAGES.map(st => {
            const ds = visibleDeals.filter(d => d.stage === st);
            const meta = STATUS_META[st];
            return (
              <div key={st} className={'pipe-col' + (over === st ? ' drop' : '')}
                onDragOver={e => { e.preventDefault(); setOver(st); }}
                onDragLeave={() => setOver(o => o === st ? null : o)}
                onDrop={() => drop(st)}>
                <div className="pipe-head">
                  <span style={{ width: 7, height: 7, borderRadius: 50, background: meta.dot }} />
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>{stageLabel(st)}</span>
                  <span className="ct num">{ds.length}</span>
                </div>
                <div className="amt num" style={{ paddingLeft: 2, marginTop: -4, marginBottom: 2, fontSize: 11, color: 'var(--tx-3)' }}>{fmtEUR(stageTotal(st), true)}</div>
                <div className="pipe-body">
                  {ds.map(d => (
                    <div key={d.id} className={'deal' + (drag === d.id ? ' dragging' : '')} draggable
                      onDragStart={() => setDrag(d.id)} onDragEnd={() => { setDrag(null); setOver(null); }}
                      onClick={() => setSel(d)}>
                      <div className="row" style={{ marginBottom: 7 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{d.company}</span>
                        <span className="spacer" /><Money v={d.value} short cls="" />
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 9 }}>{d.contact}</div>
                      <div className="row gap8">
                        {d.industry && <span className="pill gray" style={{ fontSize: 10.5 }}>{d.industry}</span>}
                        <span className="spacer" />
                      </div>
                      {!['Won','Lost'].includes(d.stage) && (
                        <div style={{ marginTop: 9 }}>
                          <div className="row" style={{ fontSize: 10.5, color: 'var(--tx-4)', marginBottom: 4 }}>
                            <span>{t('crm_win_prob')}</span><span className="spacer" /><span>{d.prob}%</span>
                          </div>
                          <div className="bar" style={{ height: 4 }}><span style={{ width: d.prob + '%' }} /></div>
                        </div>
                      )}
                    </div>
                  ))}
                  {ds.length === 0 && <div style={{ textAlign: 'center', color: 'var(--tx-4)', fontSize: 12, padding: '18px 0' }}>{t('crm_drop')}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead><tr><th>{t('crm_company')}</th><th>{t('crm_contact')}</th><th>{t('crm_industry')}</th><th>{t('crm_stage')}</th><th style={{ textAlign: 'right' }}>{t('crm_value')}</th><th style={{ textAlign: 'right' }}>{t('crm_prob')}</th></tr></thead>
            <tbody>
              {visibleDeals.map(d => (
                <tr key={d.id} onClick={() => setSel(d)}>
                  <td style={{ fontWeight: 600 }}>{d.company}</td>
                  <td className="muted">{d.contact}</td>
                  <td>{d.industry ? <span className="pill gray">{d.industry}</span> : <span className="muted">—</span>}</td>
                  <td><Pill status={d.stage} /></td>
                  <td style={{ textAlign: 'right' }}><Money v={d.value} /></td>
                  <td style={{ textAlign: 'right' }} className="num muted">{d.prob}%</td>
                </tr>
              ))}
              {visibleDeals.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--tx-4)' }}>{t('crm_no_deals')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {sel && <DealDrawer deal={sel} onClose={() => setSel(null)} onDelete={deleteDeal} onEdit={(d) => { setSel(null); setEditDeal(d); }} t={t} />}
      {editDeal && <EditDealModal deal={editDeal} onClose={() => setEditDeal(null)} onSaved={async () => { setEditDeal(null); await refetch(); }} t={t} />}
      {addOpen && <NewDealModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
