import { useState } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead, Pill } from '../components/Shared';
import { fmtEUR, PRIO } from '../lib/data';

function KpiCard({ icon, iconColor, label, value, note }) {
  const Ic = I[icon];
  return (
    <div className="kpi">
      <div className="kpi-top">
        <div className="kpi-ico" style={{ background: `var(${iconColor}-soft, var(--acc-soft))`, color: `var(${iconColor}, var(--acc))` }}><Ic size={18} /></div>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-val num">{value}</div>
      <div className="kpi-foot"><span className="delta-note">{note}</span></div>
    </div>
  );
}

export default function Dashboard() {
  const { user, contacts = [], deals = [], tasks = [], finance = [], refetch } = useAppData();
  const t = useT();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dash_morning') : hour < 18 ? t('dash_afternoon') : t('dash_evening');
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const workspace = user?.user_metadata?.workspace_name || 'My Workspace';
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  const openDeals = deals.filter(d => !['Won', 'Lost'].includes(d.stage));
  const pipelineValue = openDeals.reduce((s, d) => s + (d.value || 0), 0);
  const pendingTasks = tasks.filter(t => !t.done);
  const todayTasks = tasks.filter(t => t.due_group === 'Today' && !t.done);
  const paidRevenue = finance.filter(f => f.type === 'invoice' && f.status === 'Paid').reduce((s, f) => s + (f.amount || 0), 0);
  const totalExpenses = finance.filter(f => f.type === 'expense').reduce((s, f) => s + (f.amount || 0), 0);
  const pendingValue = finance.filter(f => f.type === 'invoice' && f.status !== 'Paid').reduce((s, f) => s + (f.amount || 0), 0);
  const wonValue = deals.filter(d => d.stage === 'Won').reduce((s, d) => s + (d.value || 0), 0);
  const hasAnyData = contacts.length || deals.length || tasks.length || finance.length;
  const [localDone, setLocalDone] = useState({});
  const toggleTask = async (task) => {
    const newVal = !(localDone[task.id] !== undefined ? localDone[task.id] : task.done);
    setLocalDone(d => ({ ...d, [task.id]: newVal }));
    await db.from('tasks').update({ done: newVal }).eq('id', task.id);
    if (newVal) setTimeout(() => refetch(), 600);
  };

  return (
    <div className="view">
      <PageHead title={`${greeting}, ${firstName}`} sub={t('dash_sub', { ws: workspace }) + ` — ${monthName} ${now.getFullYear()}.`}>
        <button className="btn primary sm" onClick={() => { location.hash = 'crm'; }}><I.plus size={14} /> {t('dash_quick_add')}</button>
      </PageHead>

      {!hasAnyData ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="kpi-ico" style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--acc-soft)', color: 'var(--acc-2)', margin: '0 auto 16px' }}><I.grid size={26} /></div>
          <h3 style={{ margin: '0 0 8px', fontWeight: 660 }}>{t('dash_welcome_title')} {workspace}</h3>
          <p className="muted" style={{ fontSize: 13.5, maxWidth: 400, margin: '0 auto 24px' }}>{t('dash_welcome_sub')}</p>
          <div className="row gap10" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => { location.hash = 'clients'; }}><I.briefcase size={15} /> {t('dash_add_client')}</button>
            <button className="btn" onClick={() => { location.hash = 'crm'; }}><I.users size={15} /> {t('dash_create_deal')}</button>
            <button className="btn" onClick={() => { location.hash = 'tasks'; }}><I.check size={15} /> {t('dash_add_task')}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
            <KpiCard icon="dollar" iconColor="--green" label={t('dash_rev')} value={paidRevenue ? fmtEUR(paidRevenue, true) : '—'} note={t('dash_paid_inv', { n: finance.filter(f=>f.type==='invoice'&&f.status==='Paid').length })} />
            <KpiCard icon="target" iconColor="--acc" label={t('dash_pipeline')} value={openDeals.length ? fmtEUR(pipelineValue, true) : '—'} note={t('dash_open_d', { n: openDeals.length })} />
            <KpiCard icon="users" iconColor="--cyan" label="Contacts" value={contacts.length || '—'} note={`${contacts.length} dans le réseau`} />
            <KpiCard icon="check" iconColor="--violet" label={t('dash_tasks')} value={pendingTasks.length || '—'} note={t('dash_due_today', { n: todayTasks.length })} />
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: 16 }}>
            <div className="card">
              <div className="card-head"><h3>{t('dash_pipeline_stage')}</h3><span className="sub">{t('dash_open_deals', { n: openDeals.length })}</span></div>
              {openDeals.length === 0 ? (
                <div className="card-pad" style={{ textAlign: 'center', padding: '32px', color: 'var(--tx-4)', fontSize: 13 }}>{t('dash_no_open_deals')}</div>
              ) : (
                <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['New Lead','Qualified','Proposal Sent','Negotiation'].map(st => {
                    const ds = deals.filter(d => d.stage === st);
                    const v = ds.reduce((s, d) => s + (d.value || 0), 0);
                    const pct = pipelineValue ? Math.round((v / pipelineValue) * 100) : 0;
                    if (!ds.length) return null;
                    return (
                      <div key={st}>
                        <div className="row" style={{ fontSize: 12.5, marginBottom: 5 }}>
                          <span className="muted">{st}</span><span className="spacer" />
                          <span className="num" style={{ fontWeight: 600 }}>{fmtEUR(v, true)}</span>
                          <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>{ds.length}</span>
                        </div>
                        <div className="bar"><span style={{ width: pct + '%' }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-head"><h3>{t('dash_finance_snap')}</h3></div>
              <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  [t('dash_rev'), paidRevenue, '--green'],
                  [t('fin_expenses'), totalExpenses, '--red'],
                  [t('fin_pending_inv'), pendingValue, '--amber'],
                  [t('crm_deal_value') + ' Won', wonValue, '--acc'],
                ].map(([label, val, color]) => (
                  <div key={label} className="row" style={{ fontSize: 13 }}>
                    <span className="muted">{label}</span><span className="spacer" />
                    <span className="num" style={{ fontWeight: 660, color: `var(${color})` }}>{val ? fmtEUR(val, true) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>{t('dash_upcoming')}</h3><span className="sub">{pendingTasks.length}</span><div className="right"><button className="btn ghost sm" onClick={() => { location.hash = 'tasks'; }}>{t('view_all')}</button></div></div>
            {pendingTasks.length === 0 ? (
              <div className="card-pad" style={{ color: 'var(--tx-4)', fontSize: 13, textAlign: 'center', padding: 32 }}>{t('dash_all_caught')}</div>
            ) : (
              <div className="card-pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 4 }}>
                {pendingTasks.slice(0, 8).map(task => {
                  const isDone = localDone[task.id] !== undefined ? localDone[task.id] : task.done;
                  return (
                    <div key={task.id} className="row gap10" style={{ padding: '8px 4px' }}>
                      <span onClick={() => toggleTask(task)}
                        style={{ width: 18, height: 18, borderRadius: 5, flex: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
                          border: isDone ? 'none' : '1.6px solid var(--line-strong)',
                          background: isDone ? 'var(--acc)' : 'transparent', transition: 'all .15s' }}>
                        {isDone && <I.check2 size={12} style={{ color: '#fff' }} />}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--tx-4)' : 'var(--tx)', transition: 'all .15s' }}>
                          {task.title}
                        </div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{task.due_group}</div>
                      </div>
                      <Pill kind={PRIO[task.prio]} text={task.prio} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
