import { useState, useEffect } from 'react';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT, useLang } from '../contexts/LangContext';
import { PageHead } from '../components/Shared';

export default function Inbox() {
  const t = useT();
  const { lang } = useLang();
  const { user } = useAppData();

  const [accounts, setAccounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ao_inbox_accounts') || '[]'); } catch { return []; }
  });
  const [activeId, setActiveId] = useState(() => {
    try { const a = JSON.parse(localStorage.getItem('ao_inbox_accounts') || '[]'); return a[0]?.id || null; } catch { return null; }
  });
  const [connecting, setConnecting] = useState(false);
  const [connProvider, setConnProvider] = useState('gmail');
  const [connEmail, setConnEmail] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [folder, setFolder] = useState('inbox');

  useEffect(() => {
    localStorage.setItem('ao_inbox_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const addAccount = () => {
    const email = connEmail.trim() || user?.email || connProvider + '@mail.com';
    const acc = { id: Date.now().toString(), provider: connProvider, email };
    setAccounts(a => [...a, acc]);
    setActiveId(acc.id);
    setConnecting(false);
    setConnEmail('');
  };

  const removeAccount = (id) => {
    const next = accounts.filter(a => a.id !== id);
    setAccounts(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
  };

  const providerColor = { gmail:'#ea4335', outlook:'#0078d4', imap:'var(--tx-3)' };
  const providerLetter = { gmail:'G', outlook:'O', imap:'@' };

  const folderCfg = [
    { id:'inbox',  icon:'mail',  label:t('inbox_folder_inbox'),  count:0 },
    { id:'sent',   icon:'send',  label:t('inbox_folder_sent'),   count:0 },
    { id:'drafts', icon:'doc',   label:t('inbox_folder_drafts'), count:0 },
    { id:'trash',  icon:'trash', label:t('inbox_folder_trash'),  count:0 },
  ];

  const ConnectModal = () => (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={() => setConnecting(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} />
      <div className="card" style={{ position:'relative', width:500, maxWidth:'100%', boxShadow:'var(--shadow-lg)', animation:'fadeUp .25s var(--ease)' }}>
        <div className="card-head">
          <h3>{t('inbox_add_account')}</h3>
          <div className="right"><button className="icon-btn" onClick={() => setConnecting(false)} type="button"><I.x size={16} /></button></div>
        </div>
        <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:8 }}>Provider</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[['gmail','Gmail','#ea4335','G'],['outlook','Outlook','#0078d4','O'],['imap','IMAP','var(--panel-3)','@']].map(([id,label,bg,letter]) => (
                <div key={id} onClick={() => setConnProvider(id)}
                  style={{ cursor:'pointer', textAlign:'center', padding:'14px 10px', borderRadius:10, border:`2px solid ${connProvider===id ? 'var(--acc)' : 'var(--line-2)'}`, background: connProvider===id ? 'var(--acc-soft)' : 'var(--panel-2)', transition:'all .12s' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:bg, display:'grid', placeItems:'center', margin:'0 auto 8px', color:'#fff', fontWeight:800, fontSize:17 }}>{letter}</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>{t('inbox_connect_email_label')}</label>
            <input className="set-input" type="email" value={connEmail} onChange={e => setConnEmail(e.target.value)} placeholder={t('inbox_connect_email_ph')} autoFocus onKeyDown={e => { if (e.key==='Enter') addAccount(); }} />
          </div>
          <div className="row gap8" style={{ justifyContent:'flex-end' }}>
            <button className="btn" onClick={() => setConnecting(false)}>{t('cancel')}</button>
            <button className="btn primary" onClick={addAccount}>{t('inbox_connect_btn')}</button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Aucun compte connecté ── */
  if (accounts.length === 0 && !connecting) {
    return (
      <div className="view">
        <PageHead title={t('inbox_title')} sub={t('inbox_sub')}>
          <button className="btn primary sm" onClick={() => setConnecting(true)}><I.plus size={14} /> {t('inbox_add_account')}</button>
        </PageHead>
        <div style={{ display:'grid', placeItems:'center', padding:'48px 20px' }}>
          <div style={{ textAlign:'center', maxWidth:520, width:'100%' }}>
            <div className="kpi-ico" style={{ width:56, height:56, borderRadius:16, background:'var(--acc-soft)', color:'var(--acc-2)', margin:'0 auto 20px' }}><I.mail size={28} /></div>
            <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:680 }}>{t('inbox_connect')}</h2>
            <p className="muted" style={{ fontSize:14, marginBottom:32, lineHeight:1.6 }}>{t('inbox_connect_sub')}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
              {[['gmail','Gmail','#ea4335','G','Google Workspace'],['outlook','Outlook','#0078d4','O','Microsoft 365'],['imap','IMAP / SMTP','var(--panel-3)','@',t('inbox_imap_desc')]].map(([id,label,bg,letter,desc]) => (
                <div key={id} onClick={() => { setConnProvider(id); setConnecting(true); }} style={{ cursor:'pointer', textAlign:'center', padding:'20px 14px', borderRadius:12, border:'1.5px solid var(--line-2)', background:'var(--panel)', transition:'all .12s' }}>
                  <div style={{ width:42, height:42, borderRadius:11, background:bg, display:'grid', placeItems:'center', margin:'0 auto 10px', color:'#fff', fontWeight:800, fontSize:19 }}>{letter}</div>
                  <div style={{ fontWeight:600, fontSize:13.5, marginBottom:3 }}>{label}</div>
                  <div className="muted" style={{ fontSize:11.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ConnectModal />
      </div>
    );
  }

  /* ── Compte connecté : inbox vide (sync à venir) ── */
  return (
    <div className="view" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <PageHead title={t('inbox_title')} sub={accounts.length === 1 ? '1 boîte connectée' : `${accounts.length} boîtes connectées`}>
        <button className="btn sm" onClick={() => setConnecting(true)}><I.plus size={14} /> {t('inbox_add_account')}</button>
        <button className="btn primary sm"><I.edit size={14} /> {t('inbox_compose')}</button>
      </PageHead>

      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:0, flex:1, overflow:'hidden', border:'1px solid var(--line)', borderRadius:14, background:'var(--panel)' }}>
        {/* Sidebar : comptes + dossiers */}
        <div style={{ borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--line)' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--tx-4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{t('inbox_accounts')}</div>
            {accounts.map(a => (
              <div key={a.id} onClick={() => setActiveId(a.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer', background: activeId===a.id ? 'var(--acc-soft)' : 'transparent', marginBottom:2 }}>
                <div style={{ width:24, height:24, borderRadius:7, background:providerColor[a.provider]||'var(--panel-3)', display:'grid', placeItems:'center', color:'#fff', fontWeight:700, fontSize:11, flex:'none' }}>{providerLetter[a.provider]||'@'}</div>
                <span style={{ fontSize:11.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontWeight: activeId===a.id ? 600 : 400, color: activeId===a.id ? 'var(--acc-2)' : 'var(--tx-2)' }}>{a.email}</span>
                <button style={{ background:'none', border:'none', color:'var(--tx-4)', cursor:'pointer', padding:'0 2px', fontSize:12, lineHeight:1 }} onClick={e => { e.stopPropagation(); removeAccount(a.id); }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 12px', flex:1 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--tx-4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Dossiers</div>
            {folderCfg.map(f => {
              const Ic = I[f.icon];
              return (
                <div key={f.id} onClick={() => setFolder(f.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer', background: folder===f.id ? 'var(--acc-soft)' : 'transparent', marginBottom:2 }}>
                  <Ic size={14} style={{ color: folder===f.id ? 'var(--acc-2)' : 'var(--tx-3)', flex:'none' }} />
                  <span style={{ fontSize:12.5, flex:1, fontWeight: folder===f.id ? 600 : 400, color: folder===f.id ? 'var(--acc-2)' : 'var(--tx-2)' }}>{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone principale : état vide + message sync à venir */}
        <div style={{ display:'grid', placeItems:'center', padding:40 }}>
          <div style={{ textAlign:'center', maxWidth:400 }}>
            <div className="kpi-ico" style={{ width:52, height:52, borderRadius:14, background:'var(--acc-soft)', color:'var(--acc-2)', margin:'0 auto 16px' }}><I.mail size={26} /></div>
            <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:660 }}>
              {lang === 'fr' ? 'Synchronisation en cours de développement' : 'Sync coming soon'}
            </h3>
            <p className="muted" style={{ fontSize:13.5, lineHeight:1.6, margin:'0 0 20px' }}>
              {lang === 'fr'
                ? 'La connexion OAuth avec Gmail et Outlook sera disponible dans la prochaine mise à jour. Votre boîte mail apparaîtra ici automatiquement.'
                : 'OAuth connection with Gmail and Outlook will be available in the next update. Your inbox will appear here automatically.'}
            </p>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:20, background:'var(--acc-soft)', color:'var(--acc-2)', fontSize:12.5, fontWeight:600 }}>
              <I.check2 size={14} />
              {lang === 'fr' ? `Compte connecté : ${accounts.find(a=>a.id===activeId)?.email || ''}` : `Connected: ${accounts.find(a=>a.id===activeId)?.email || ''}`}
            </div>
          </div>
        </div>
      </div>
      {connecting && <ConnectModal />}
    </div>
  );
}
