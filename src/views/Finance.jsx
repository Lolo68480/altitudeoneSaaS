import { useState } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead, Pill, Money, StatTile } from '../components/Shared';
import { NewFinanceModal } from '../components/Modals';
import { fmtEUR } from '../lib/data';

export default function Finance() {
  const { finance: dbFinance = [], refetch } = useAppData();
  const t = useT();
  const [tab, setTab] = useState('overview');
  const [addOpen, setAddOpen] = useState(false);

  const invoices = dbFinance.filter(e => e.type === 'invoice');
  const expenses = dbFinance.filter(e => e.type === 'expense');
  const totalInvoiced = invoices.reduce((s, e) => s + (e.amount || 0), 0);
  const paidRevenue = invoices.filter(e => e.status === 'Paid').reduce((s, e) => s + (e.amount || 0), 0);
  const pendingRevenue = invoices.filter(e => e.status !== 'Paid').reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = paidRevenue - totalExpenses;

  const stMap = { Paid: t('fin_paid'), Sent: t('fin_sent'), Draft: t('fin_draft'), Overdue: t('fin_overdue') };
  const stColor = { Paid: 'green', Sent: 'blue', Draft: 'gray', Overdue: 'red' };

  const deleteEntry = async (entry) => {
    if (!confirm(t('delete_confirm') + ' "' + entry.label + '" ?')) return;
    await db.from('finance').delete().eq('id', entry.id);
    await refetch();
  };

  const exportCSV = () => {
    const rows = [[t('fin_type'), t('fin_label'), t('fin_client'), t('fin_amount'), t('fin_status'), t('fin_date')]];
    dbFinance.forEach(e => rows.push([e.type, e.label, e.client||'', e.amount, e.status, e.date||'']));
    const csv = rows.map(r => r.map(v => '"' + String(v||'').replace(/"/g,'""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'finance.csv'; a.click();
  };

  return (
    <div className="view">
      <PageHead title={t('nav_finance')} sub={t('fin_sub')}>
        <div className="seg" style={{ marginRight: 4 }}>
          {[['overview', t('fin_overview')], ['entries', t('fin_entries')]].map(([k, label]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        {dbFinance.length > 0 && <button className="btn sm" onClick={exportCSV}><I.download size={14} /> {t('export_csv')}</button>}
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('fin_new')}</button>
      </PageHead>

      {tab === 'overview' ? (
        dbFinance.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="kpi-ico" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--green-soft)', color: 'var(--green)', margin: '0 auto 14px' }}><I.dollar size={22} /></div>
            <h3 style={{ margin: '0 0 6px' }}>{t('fin_no_data')}</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>{t('fin_no_sub')}</p>
            <button className="btn primary" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('fin_add_first')}</button>
          </div>
        ) : (
          <>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
              <StatTile icon="dollar" color="--green" label={t('fin_rev')} value={fmtEUR(paidRevenue, true)} note={t('fin_invoices', { n: invoices.filter(e=>e.status==='Paid').length })} />
              <StatTile icon="arrowDn" color="--red" label={t('fin_exp')} value={fmtEUR(totalExpenses, true)} note={t('fin_entries_n', { n: expenses.length })} />
              <StatTile icon="trendUp" color="--acc" label={t('fin_net')} value={fmtEUR(netProfit, true)} note={netProfit >= 0 ? t('fin_positive') : t('fin_negative')} />
              <StatTile icon="clock" color="--amber" label={t('fin_pending_inv')} value={fmtEUR(pendingRevenue, true)} note={t('fin_entries_n', { n: invoices.filter(e=>e.status!=='Paid').length })} />
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
              <div className="card">
                <div className="card-head"><h3>{t('fin_rev_break')}</h3></div>
                <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[['Paid','--green'],['Sent','--blue'],['Overdue','--red'],['Draft','--tx-4']].map(([status, color]) => {
                    const items = invoices.filter(e => e.status === status);
                    const v = items.reduce((s, e) => s + (e.amount || 0), 0);
                    if (!items.length) return null;
                    return (
                      <div key={status}>
                        <div className="row" style={{ fontSize: 12.5, marginBottom: 5 }}>
                          <span className="muted">{stMap[status] || status}</span><span className="spacer" />
                          <span className="num" style={{ fontWeight: 660, color: `var(${color})` }}>{fmtEUR(v, true)}</span>
                          <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>{items.length}</span>
                        </div>
                        <div className="bar"><span style={{ width: totalInvoiced ? (v/totalInvoiced*100)+'%' : '0%' }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="card">
                <div className="card-head"><h3>{t('fin_summary')}</h3></div>
                <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[[t('fin_total_inv'), totalInvoiced, '--acc'],[t('fin_collected'), paidRevenue, '--green'],[t('fin_still_pending'), pendingRevenue, '--amber'],[t('fin_expenses'), totalExpenses, '--red'],[t('fin_net_profit'), netProfit, netProfit>=0?'--green':'--red']].map(([label, val, color], idx) => (
                    <div key={label} className="row" style={{ fontSize: 13, borderBottom: idx === 3 ? '1px solid var(--line)' : 'none', paddingBottom: idx === 3 ? 14 : 0 }}>
                      <span className={idx === 4 ? '' : 'muted'}>{label}</span><span className="spacer" />
                      <span className="num" style={{ fontWeight: idx === 4 ? 700 : 600, color: `var(${color})`, fontSize: idx === 4 ? 16 : 13 }}>{fmtEUR(val, true)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>{t('fin_recent')}</h3></div>
              <table className="tbl">
                <thead><tr><th>{t('fin_label')}</th><th>{t('fin_type')}</th><th>{t('fin_client')}</th><th>{t('fin_date')}</th><th>{t('fin_status')}</th><th style={{ textAlign: 'right' }}>{t('fin_amount')}</th></tr></thead>
                <tbody>
                  {dbFinance.slice(0, 5).map((e, i) => (
                    <tr key={e.id || i}>
                      <td style={{ fontWeight: 600 }}>{e.label}</td>
                      <td><span className={'pill ' + (e.type === 'invoice' ? 'blue' : 'gray')}>{e.type === 'invoice' ? t('fin_invoice') : t('fin_expense')}</span></td>
                      <td className="muted">{e.client || '—'}</td><td className="muted">{e.date || '—'}</td>
                      <td><Pill kind={stColor[e.status] || 'gray'} text={stMap[e.status] || e.status} /></td>
                      <td style={{ textAlign: 'right' }}><Money v={e.amount} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : (
        <div className="card">
          <div className="card-head"><h3>{t('fin_entries')}</h3><span className="sub">{dbFinance.length}</span></div>
          {dbFinance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--tx-4)', fontSize: 13 }}>{t('fin_no_entries')}</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>{t('fin_label')}</th><th>{t('fin_type')}</th><th>{t('fin_client')}</th><th>{t('fin_date')}</th><th>{t('fin_status')}</th><th style={{ textAlign: 'right' }}>{t('fin_amount')}</th><th></th></tr></thead>
              <tbody>
                {dbFinance.map((e, i) => (
                  <tr key={e.id || i}>
                    <td style={{ fontWeight: 600 }}>{e.label}</td>
                    <td><span className={'pill ' + (e.type === 'invoice' ? 'blue' : 'gray')}>{e.type === 'invoice' ? t('fin_invoice') : t('fin_expense')}</span></td>
                    <td className="muted">{e.client || '—'}</td><td className="muted">{e.date || '—'}</td>
                    <td><Pill kind={stColor[e.status] || 'gray'} text={stMap[e.status] || e.status} /></td>
                    <td style={{ textAlign: 'right' }}><Money v={e.amount} /></td>
                    <td><button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--tx-4)' }} onClick={() => deleteEntry(e)}><I.trash size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {addOpen && <NewFinanceModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
