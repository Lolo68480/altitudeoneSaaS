import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead, Pill, StatTile } from '../components/Shared';
import { NewProspectModal, NewCampaignModal } from '../components/Modals';
import { PROSPECT_STAGE_META } from '../lib/data';

function ProspectDrawer({ p, onClose, onGen, onDelete, t }) {
  const telHref = p.phone ? 'tel:' + p.phone : null;
  const emailHref = p.email ? 'mailto:' + p.email : null;
  const webHref = p.website ? (p.website.startsWith('http') ? p.website : 'https://' + p.website) : null;
  const linkedinHref = p.linkedin ? (p.linkedin.startsWith('http') ? p.linkedin : 'https://' + p.linkedin) : null;
  const rows = [[t('pros_website'), p.website, webHref],[t('pros_email'), p.email, emailHref],[t('pros_linkedin'), p.linkedin, linkedinHref],[t('pros_phone'), p.phone, telHref],[t('pros_city'), p.city, null],[t('pros_industry'), p.industry, null]];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)' }} />
      <div className="card" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 400, borderRadius: 0, display: 'flex', flexDirection: 'column', animation: 'slideIn .28s var(--ease)' }}>
        <div className="card-head">
          <div className="kpi-ico" style={{ width: 36, height: 36, background: 'var(--acc-soft)', color: 'var(--acc-2)', fontWeight: 700 }}>{p.company[0]}</div>
          <div><h3 style={{ fontSize: 15 }}>{p.company}</h3><div className="sub">{p.city} · {p.industry}</div></div>
          <div className="right">
            <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={() => { onClose(); onDelete(p); }}><I.trash size={15} /></button>
            <button className="icon-btn" onClick={onClose}><I.x size={16} /></button>
          </div>
        </div>
        <div className="scroll" style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 16 }}>
            {rows.map(([k, v, href]) => (
              <div key={k} className="row" style={{ padding: '10px 2px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <span className="muted" style={{ width: 90 }}>{k}</span>
                {href ? <a href={href} target={k===t('pros_phone')||k===t('pros_email') ? undefined : '_blank'} rel="noopener" style={{ fontWeight: 500, color: 'var(--acc-2)', textDecoration: 'none' }}>{v}</a>
                  : <span style={{ fontWeight: 500 }}>{v || '—'}</span>}
              </div>
            ))}
          </div>
          <button className="btn primary" style={{ width: '100%', marginBottom: 8 }} onClick={onGen}><I.spark size={14} /> {t('pros_ai')}</button>
          <div className="row gap8">
            {telHref ? <a href={telHref} className="btn" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}><I.phone size={14} /> {t('f_phone')}</a> : <button className="btn" style={{ flex: 1 }} disabled><I.phone size={14} /> {t('f_phone')}</button>}
            {emailHref ? <a href={emailHref} className="btn" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}><I.mail size={14} /> {t('f_email')}</a> : <button className="btn" style={{ flex: 1 }} disabled><I.mail size={14} /> {t('f_email')}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AiOutreach({ p, onClose, t }) {
  const [phase, setPhase] = useState('gen');
  const [text, setText] = useState('');
  const draft = `${p.company.split(' ')[0]},\n\nI came across ${p.company} — really impressed by what you're building.\n\nI'd love to explore how we could work together. Would a quick 15-min call next week work?\n\nBest,`;
  useEffect(() => {
    setPhase('gen'); setText('');
    let i = 0, timer;
    const timeout = setTimeout(() => {
      timer = setInterval(() => {
        i += 3; setText(draft.slice(0, i));
        if (i >= draft.length) { clearInterval(timer); setPhase('done'); }
      }, 12);
    }, 650);
    return () => { clearTimeout(timeout); clearInterval(timer); };
  }, [p.id]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)' }} />
      <div className="card" style={{ position: 'relative', width: 560, maxWidth: '100%', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp .3s var(--ease)' }}>
        <div className="card-head">
          <div className="kpi-ico" style={{ width: 34, height: 34, background: 'linear-gradient(140deg,var(--acc-2),var(--acc))', color: '#fff' }}><I.spark size={16} /></div>
          <div><h3>{t('pros_ai_draft')}</h3><div className="sub">{t('pros_for')} {p.company}</div></div>
          <div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16} /></button></div>
        </div>
        <div className="card-pad">
          <div className="card card-pad" style={{ background: 'var(--bg-2)', minHeight: 160, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6 }}>
            {text}{phase === 'gen' && <span style={{ borderLeft: '2px solid var(--acc-2)', marginLeft: 1, animation: 'blink 1s steps(1) infinite' }} />}
          </div>
          <div className="row gap8" style={{ marginTop: 14 }}>
            <span className="spacer" />
            <button className="btn sm" disabled={phase === 'gen'}><I.refresh size={13} /> {t('ai_regen')}</button>
            <button className="btn primary sm" disabled={phase === 'gen'}><I.send size={13} /> {t('ai_send_email')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Prospecting() {
  const { prospects: ctxProspects, campaigns: ctxCampaigns, refetch } = useAppData();
  const t = useT();
  const prospects = ctxProspects || [];
  const campaigns = ctxCampaigns || [];
  const [sel, setSel] = useState(null);
  const [gen, setGen] = useState(null);
  const [addProspect, setAddProspect] = useState(false);
  const [addCampaign, setAddCampaign] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const totals = campaigns.reduce((a, c) => ({
    sent: a.sent + (c.sent || 0), opened: a.opened + (c.opened || 0),
    replied: a.replied + (c.replied || 0), meetings: a.meetings + (c.meetings || 0),
  }), { sent: 0, opened: 0, replied: 0, meetings: 0 });
  const openRate = totals.sent ? Math.round((totals.opened / totals.sent) * 100) : 0;
  const replyRate = totals.sent ? Math.round((totals.replied / totals.sent) * 100) : 0;

  const stageLabel = (s) => ({ 'Queued':t('stage_queued'), 'Contacted':t('stage_contacted'), 'Replied':t('stage_replied'), 'Meeting':t('stage_meeting'), 'Converted':t('stage_converted'), 'Archived':t('stage_archived') })[s] || s;

  const filteredProspects = searchQ
    ? prospects.filter(p => p.company?.toLowerCase().includes(searchQ.toLowerCase()) || p.city?.toLowerCase().includes(searchQ.toLowerCase()) || p.industry?.toLowerCase().includes(searchQ.toLowerCase()))
    : prospects;

  const deleteProspect = async (p) => {
    if (!confirm(t('delete_confirm') + ' "' + p.company + '" ?')) return;
    await db.from('prospects').delete().eq('id', p.id);
    await refetch();
  };
  const deleteCampaign = async (c) => {
    if (!confirm(t('delete_confirm') + ' "' + c.name + '" ?')) return;
    await db.from('campaigns').delete().eq('id', c.id);
    await refetch();
  };

  return (
    <div className="view">
      <PageHead title={t('nav_leads')} sub={t('pros_sub')}>
        <button className="btn sm" onClick={() => setAddCampaign(true)}><I.plus size={14} /> {t('pros_new_camp')}</button>
        <button className="btn primary sm" onClick={() => setAddProspect(true)}><I.plus size={14} /> {t('pros_new')}</button>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        <StatTile icon="send" color="--acc" label={t('pros_emails')} value={totals.sent} note={t('pros_across', { n: campaigns.length })} />
        <StatTile icon="mail" color="--cyan" label={t('pros_open')} value={openRate + '%'} note={t('pros_opened', { n: totals.opened })} />
        <StatTile icon="msg" color="--green" label={t('pros_reply')} value={replyRate + '%'} note={t('pros_replies', { n: totals.replied })} />
        <StatTile icon="calendar" color="--violet" label={t('pros_meetings')} value={totals.meetings} note={t('pros_this_month')} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.7fr' }}>
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-head"><h3>{t('pros_campaigns')}</h3></div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--tx-4)', fontSize: 13 }}>{t('pros_no_camp')}</div>}
            {campaigns.map(c => {
              const fEl = (n, d) => d ? Math.round((n / d) * 100) : 0;
              return (
                <div key={c.id} className="card card-pad" style={{ background: 'var(--bg-2)' }}>
                  <div className="row" style={{ marginBottom: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</span>
                    <span className="spacer" />
                    <Pill kind={c.active ? 'green' : 'gray'} text={c.active ? t('pros_active') : t('pros_paused')} />
                    <button className="icon-btn" style={{ width: 24, height: 24, color: 'var(--tx-4)', marginLeft: 4 }} onClick={() => deleteCampaign(c)}><I.trash size={12} /></button>
                  </div>
                  <div style={{ display: 'flex', height: 6, borderRadius: 5, overflow: 'hidden', background: 'var(--panel-3)', marginBottom: 8 }}>
                    <div style={{ width: fEl(c.opened, c.sent) + '%', background: 'var(--cyan)' }} />
                    <div style={{ width: fEl(c.replied, c.sent) + '%', background: 'var(--green)' }} />
                  </div>
                  <div className="row" style={{ fontSize: 11.5, color: 'var(--tx-3)' }}>
                    <span className="num">{c.sent} {t('pros_sent')}</span><span className="spacer" />
                    <span className="num">{fEl(c.opened, c.sent)}% · {fEl(c.replied, c.sent)}% · {c.meetings} mtgs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>{t('pros_prospects')}</h3><span className="sub">{filteredProspects.length}</span>
            <div className="right">
              <div className="search" style={{ minWidth: 160, height: 30 }}>
                <I.search size={14} />
                <input placeholder={t('search_ph').split(',')[0] + '…'} value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              </div>
            </div>
          </div>
          {filteredProspects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--tx-4)', fontSize: 13 }}>{t('pros_no_pros')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr><th>{t('crm_company')}</th><th>{t('pros_city')}</th><th>{t('crm_industry')}</th><th>{t('pros_stage')}</th><th>{t('pros_last')}</th><th style={{ textAlign: 'right' }}>{t('pros_actions')}</th></tr></thead>
                <tbody>
                  {filteredProspects.map(p => (
                    <tr key={p.id} onClick={() => setSel(p)}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.company}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{p.website}</div>
                      </td>
                      <td className="muted">{p.city}</td>
                      <td>{p.industry ? <span className="pill gray">{p.industry}</span> : <span className="muted">—</span>}</td>
                      <td><Pill kind={PROSPECT_STAGE_META[p.stage]} text={stageLabel(p.stage)} /></td>
                      <td className="muted" style={{ fontSize: 12 }}>{p.last || '—'}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="row gap8" style={{ justifyContent: 'flex-end' }}>
                          {p.email && <a href={'mailto:' + p.email} className="icon-btn" style={{ width: 28, height: 28 }} title={t('f_email')}><I.mail size={14} /></a>}
                          {p.phone && <a href={'tel:' + p.phone} className="icon-btn" style={{ width: 28, height: 28 }} title={t('f_phone')}><I.phone size={14} /></a>}
                          <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--acc-2)' }} title={t('pros_ai')} onClick={() => setGen(p)}><I.spark size={14} /></button>
                          <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--tx-4)' }} onClick={() => deleteProspect(p)}><I.trash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {sel && !gen && <ProspectDrawer p={sel} onClose={() => setSel(null)} onGen={() => setGen(sel)} onDelete={deleteProspect} t={t} />}
      {gen && <AiOutreach p={gen} onClose={() => setGen(null)} t={t} />}
      {addProspect && <NewProspectModal onClose={() => setAddProspect(false)} />}
      {addCampaign && <NewCampaignModal onClose={() => setAddCampaign(false)} />}
    </div>
  );
}
