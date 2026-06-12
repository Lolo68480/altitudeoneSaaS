import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead, Health } from '../components/Shared';
import { NewClientModal } from '../components/Modals';
import { fmtEUR, CLIENT_TIMELINE } from '../lib/data';

export default function Clients() {
  const { clients: ctxClients, refetch } = useAppData();
  const t = useT();
  const list = ctxClients || [];
  const [sel, setSel] = useState(list[0] || null);
  const [addOpen, setAddOpen] = useState(false);
  const totalMrr = list.reduce((s, c) => s + (c.mrr || 0), 0);

  useEffect(() => {
    if (!sel && list.length) setSel(list[0]);
    if (sel && !list.find(c => c.id === sel.id)) setSel(list[0] || null);
  }, [ctxClients]);

  const deleteClient = async (c) => {
    if (!confirm(t('delete_confirm') + ' "' + c.company + '" ?')) return;
    await db.from('clients').delete().eq('id', c.id);
    await refetch();
  };

  if (!list.length) return (
    <div className="view">
      <PageHead title={t('nav_clients')} sub={t('cli_sub', { n: 0, mrr: '—' })}>
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('cli_new')}</button>
      </PageHead>
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--tx-4)', fontSize: 13 }}>{t('cli_no_clients')}</div>
      {addOpen && <NewClientModal onClose={() => setAddOpen(false)} />}
    </div>
  );

  if (!sel) return null;

  const emailHref = sel.email ? 'mailto:' + sel.email : null;
  const telHref = sel.phone ? 'tel:' + sel.phone : null;
  const webHref = sel.website ? (sel.website.startsWith('http') ? sel.website : 'https://' + sel.website) : null;
  const healthLabel = sel.health === 'good' ? t('f_health_good') : sel.health === 'watch' ? t('f_health_watch') : t('f_health_risk');
  const healthColor = sel.health === 'good' ? '--green' : sel.health === 'watch' ? '--amber' : '--red';

  return (
    <div className="view">
      <PageHead title={t('nav_clients')} sub={t('cli_sub', { n: list.length, mrr: fmtEUR(totalMrr) })}>
        <button className="btn sm"><I.filter size={14} /> {t('filter')}</button>
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('cli_new')}</button>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: '340px 1fr', alignItems: 'start' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head"><h3>{t('cli_all')}</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {list.map(c => (
              <div key={c.id} onClick={() => setSel(c)} className="row gap12"
                style={{ padding: '13px 16px', borderBottom: '1px solid var(--line)', cursor: 'pointer', background: sel.id === c.id ? 'var(--acc-soft)' : 'transparent', borderLeft: sel.id === c.id ? '2px solid var(--acc)' : '2px solid transparent' }}>
                <div className="kpi-ico" style={{ width: 34, height: 34, background: 'var(--panel-3)', color: 'var(--tx)', fontWeight: 700, fontSize: 13, flex: 'none' }}>{c.company[0]}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.company}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{c.industry || t('no_industry')} · {fmtEUR(c.mrr, true)}/mo</div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: 50, flex: 'none', background: c.health === 'good' ? 'var(--green)' : c.health === 'watch' ? 'var(--amber)' : 'var(--red)' }} />
                <button className="icon-btn" style={{ width: 26, height: 26, color: 'var(--tx-4)', flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); deleteClient(c); }}>
                  <I.trash size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-pad" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div className="kpi-ico" style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(140deg,var(--acc-2),var(--acc))', color: '#fff', fontWeight: 700, fontSize: 22, flex: 'none' }}>{sel.company[0]}</div>
              <div style={{ flex: 1 }}>
                <div className="row gap10">
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 680, letterSpacing: '-0.02em' }}>{sel.company}</h2>
                  <Health h={sel.health} />
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{sel.contact} · {sel.industry} · {t('cli_since')} {sel.since}</div>
                <div className="row gap8" style={{ marginTop: 12 }}>
                  {emailHref
                    ? <a href={emailHref} className="btn sm" style={{ textDecoration: 'none' }}><I.mail size={14} /> {t('cli_email')}</a>
                    : <button className="btn sm" disabled><I.mail size={14} /> {t('cli_email')}</button>}
                  {telHref
                    ? <a href={telHref} className="btn sm" style={{ textDecoration: 'none' }}><I.phone size={14} /> {sel.phone}</a>
                    : <button className="btn sm" disabled><I.phone size={14} /> {t('cli_call')}</button>}
                  {webHref && <a href={webHref} target="_blank" rel="noopener" className="btn sm" style={{ textDecoration: 'none' }}><I.globe size={14} /> {sel.website}</a>}
                </div>
              </div>
            </div>
            <div className="row" style={{ borderTop: '1px solid var(--line)' }}>
              {[[t('cli_mrr'), fmtEUR(sel.mrr), '--green'], [t('cli_lifetime'), fmtEUR(sel.value, true), '--acc'], [t('cli_active_proj'), sel.projects, '--violet'], [t('cli_health'), healthLabel, healthColor]].map(([k, v, c], i) => (
                <div key={i} style={{ flex: 1, padding: '14px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <div className="muted" style={{ fontSize: 11.5 }}>{k}</div>
                  <div className="num" style={{ fontSize: 19, fontWeight: 680, marginTop: 3, color: `var(${c})` }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>{t('cli_comm')}</h3></div>
            <div className="card-pad">
              <div className="tl">
                {CLIENT_TIMELINE.map((e, i) => {
                  const Ic = I[e.icon];
                  return (
                    <div key={i} className="tl-item">
                      <div className="tl-dot" style={{ borderColor: `var(${e.color})`, color: `var(${e.color})` }}><Ic size={14} /></div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</div>
                      <div className="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{e.desc}</div>
                      <div style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 3 }}>{e.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {addOpen && <NewClientModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
