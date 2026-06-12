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
  const { user, clients = [], deals = [], tasks = [], finance = [] } = useAppData();
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
  const hasAnyData = clients.length || deals.length || tasks.length || finance.length;

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
            <KpiCard icon="users" iconColor="--cyan" label={t('dash_clients')} value={clients.length || '—'} note={t('dash_clients_count', { n: clients.length })} />
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

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <div className="card-head"><h3>{t('dash_recent_clients')}</h3><div className="right"><button className="btn ghost sm" onClick={() => { location.hash = 'clients'; }}>{t('view_all')}</button></div></div>
              {clients.length === 0 ? (
                <div className="card-pad" style={{ color: 'var(--tx-4)', fontSize: 13, textAlign: 'center', padding: 32 }}>{t('cli_no_clients')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {clients.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="row gap12" style={{ padding: '12px 16px', borderBottom: i < Math.min(clients.length, 5) - 1 ? '1px solid var(--line)' : 'none' }}>
                      <div className="kpi-ico" style={{ width: 32, height: 32, background: 'var(--panel-3)', color: 'var(--tx)', fontWeight: 700, fontSize: 12, flex: 'none' }}>{c.company[0]}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.company}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{c.industry || t('no_industry')} · {fmtEUR(c.mrr, true)}/mo</div>
                      </div>
                      <span style={{ width: 8, height: 8, borderRadius: 50, flex: 'none', background: c.health === 'good' ? 'var(--green)' : c.health === 'watch' ? 'var(--amber)' : 'var(--red)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-head"><h3>{t('dash_upcoming')}</h3><span className="sub">{pendingTasks.length}</span><div className="right"><button className="btn ghost sm" onClick={() => { location.hash = 'tasks'; }}>{t('view_all')}</button></div></div>
              {pendingTasks.length === 0 ? (
                <div className="card-pad" style={{ color: 'var(--tx-4)', fontSize: 13, textAlign: 'center', padding: 32 }}>{t('dash_all_caught')}</div>
              ) : (
                <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pendingTasks.slice(0, 6).map(task => (
                    <div key={task.id} className="row gap10" style={{ padding: '8px 4px' }}>
                      <span style={{ width: 16, height: 16, borderRadius: 5, border: '1.6px solid var(--line-strong)', flex: 'none' }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{task.client || t('no_client')} · {task.due_group}</div>
                      </div>
                      <Pill kind={PRIO[task.prio]} text={task.prio} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
