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
  const [selectedId, setSelectedId] = useState(1);
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

  const mockFr = [
    { id:1, from:'thomas.martin@acme.fr', name:'Thomas Martin', subject:'Proposition commerciale – Suite', preview:"J'ai bien reçu votre devis et j'aurais quelques questions avant de valider…", date:"Aujourd'hui", read:false, folder:'inbox', body:"Bonjour,\n\nJ'ai bien reçu votre proposition commerciale.\n\nNous aurions quelques questions :\n1. Les délais de livraison sont-ils fermes ?\n2. Y a-t-il une possibilité de paiement échelonné ?\n\nCordialement,\nThomas Martin" },
    { id:2, from:'sophie@innovtech.io', name:'Sophie Blanc', subject:'RDV de suivi – Projet Alpha', preview:'Confirmons-nous le meeting de jeudi prochain à 14h ?', date:'Hier', read:true, folder:'inbox', body:"Bonjour,\n\nPouvons-nous confirmer le RDV de jeudi 19 juin à 14h ?\n\nBonne journée,\nSophie" },
    { id:3, from:'noreply@stripe.com', name:'Stripe', subject:'Paiement reçu : 3 450,00 €', preview:'Vous avez reçu un paiement de 3 450,00 €.', date:'Lun', read:true, folder:'inbox', body:"Bonjour,\n\nVous avez reçu un paiement de 3 450,00 € de la part de Innovtech SAS.\n\nRéférence : pi_3QxYZABCDEF" },
    { id:4, from:'lucas.remy@btp-conseil.com', name:'Lucas Rémy', subject:'Devis travaux – Révision lot 2', preview:'Pouvez-vous revoir le chiffrage pour le lot 2 ?', date:'Ven', read:true, folder:'inbox', body:"Bonjour,\n\nNous souhaiterions revoir le chiffrage du lot 2 (maçonnerie).\nBudget max souhaité : 12 000 €.\n\nMerci,\nLucas Rémy" },
    { id:5, from:'contact@freelance-union.fr', name:'Freelance Union', subject:'🎯 Nouvelle mission disponible', preview:'Une mission en communication digitale correspond à votre profil.', date:'Jeu', read:true, folder:'inbox', body:"Bonjour,\n\nUne nouvelle mission correspond à votre profil :\n• Mission : Refonte identité visuelle\n• Budget : 4 500 € TTC\n• Durée : 3 semaines" },
  ];
  const mockEn = [
    { id:1, from:'thomas.martin@acme.com', name:'Thomas Martin', subject:'Commercial Proposal – Follow up', preview:"I received your quote and have a few questions before signing…", date:'Today', read:false, folder:'inbox', body:"Hi,\n\nI received your proposal and have a few questions:\n1. Are the delivery timelines firm?\n2. Is installment payment possible?\n\nBest,\nThomas Martin" },
    { id:2, from:'sophie@innovtech.io', name:'Sophie Blanc', subject:'Follow-up meeting – Project Alpha', preview:'Are we confirming next Thursday at 2pm?', date:'Yesterday', read:true, folder:'inbox', body:"Hi,\n\nShall we confirm Thursday June 19 at 2pm?\n\nBest, Sophie" },
    { id:3, from:'noreply@stripe.com', name:'Stripe', subject:'Payment received: €3,450.00', preview:'You received a payment of €3,450.00.', date:'Mon', read:true, folder:'inbox', body:"Hello,\n\nYou received a payment of €3,450.00 from Innovtech Ltd.\n\nReference: pi_3QxYZABCDEF" },
    { id:4, from:'lucas.remy@construction.co', name:'Lucas Remy', subject:'Quote revision – Lot 2', preview:'Can you review the pricing for lot 2?', date:'Fri', read:true, folder:'inbox', body:"Hi,\n\nWe'd like to revise the pricing for lot 2 (masonry).\nMax budget: €12,000.\n\nThanks, Lucas" },
    { id:5, from:'hello@freelancers.io', name:'Freelance Network', subject:'🎯 New mission available', preview:'A digital communication mission matches your profile.', date:'Thu', read:true, folder:'inbox', body:"Hello,\n\nA new mission matching your profile:\n• Mission: Visual identity redesign\n• Budget: €4,500\n• Duration: 3 weeks" },
  ];

  const emails = lang === 'fr' ? mockFr : mockEn;
  const activeAccount = accounts.find(a => a.id === activeId);
  const selected = emails.find(e => e.id === selectedId) || emails[0];
  const unread = emails.filter(e => !e.read && e.folder === 'inbox').length;
  const providerColor = { gmail:'#ea4335', outlook:'#0078d4', imap:'var(--tx-3)' };
  const providerLetter = { gmail:'G', outlook:'O', imap:'@' };

  const folderCfg = [
    { id:'inbox',  icon:'mail',  label:t('inbox_folder_inbox'),  count:unread },
    { id:'sent',   icon:'send',  label:t('inbox_folder_sent'),   count:0 },
    { id:'drafts', icon:'doc',   label:t('inbox_folder_drafts'), count:2 },
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
          <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.25)', fontSize:12.5, color:'var(--tx-3)' }}>
            <I.bolt size={13} style={{ color:'#f59e0b', verticalAlign:'-2px', marginRight:5 }} />
            {t('inbox_sync_coming')} — {t('inbox_sync_desc')}
          </div>
          <div className="row gap8" style={{ justifyContent:'flex-end' }}>
            <button className="btn" onClick={() => setConnecting(false)}>{t('cancel')}</button>
            <button className="btn primary" onClick={addAccount}>{t('inbox_connect_btn')}</button>
          </div>
        </div>
      </div>
    </div>
  );

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
            <div className="card card-pad" style={{ background:'var(--panel-2)', textAlign:'left' }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:5 }}><I.bolt size={13} style={{ color:'var(--acc-2)', verticalAlign:'-2px', marginRight:5 }} />{t('inbox_privacy_title')}</div>
              <div className="muted" style={{ fontSize:12.5 }}>{t('inbox_privacy_desc')}</div>
            </div>
          </div>
        </div>
        {connecting && <ConnectModal />}
      </div>
    );
  }

  return (
    <div className="view" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <PageHead title={t('inbox_title')} sub={t('inbox_sub')}>
        <button className="btn sm" onClick={() => setConnecting(true)}><I.plus size={14} /> {t('inbox_add_account')}</button>
        <button className="btn primary sm"><I.edit size={14} /> {t('inbox_compose')}</button>
      </PageHead>

      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr 1.6fr', gap:0, flex:1, overflow:'hidden', border:'1px solid var(--line)', borderRadius:14, background:'var(--panel)' }}>
        {/* Accounts + folders */}
        <div style={{ borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--line)' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--tx-4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{t('inbox_accounts')}</div>
            {accounts.map(a => (
              <div key={a.id} onClick={() => setActiveId(a.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer', background: activeId===a.id ? 'var(--acc-soft)' : 'transparent', marginBottom:2 }}>
                <div style={{ width:24, height:24, borderRadius:7, background:providerColor[a.provider]||'var(--panel-3)', display:'grid', placeItems:'center', color:'#fff', fontWeight:700, fontSize:11, flex:'none' }}>{providerLetter[a.provider]||'@'}</div>
                <span style={{ fontSize:11.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontWeight: activeId===a.id ? 600 : 400, color: activeId===a.id ? 'var(--acc-2)' : 'var(--tx-2)' }}>{a.email}</span>
                <button style={{ background:'none', border:'none', color:'var(--tx-4)', cursor:'pointer', padding:'0 2px', fontSize:12, lineHeight:1, display:'flex', alignItems:'center' }} onClick={e => { e.stopPropagation(); removeAccount(a.id); }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 12px', flex:1 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--tx-4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Folders</div>
            {folderCfg.map(f => {
              const Ic = I[f.icon];
              return (
                <div key={f.id} onClick={() => setFolder(f.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer', background: folder===f.id ? 'var(--acc-soft)' : 'transparent', marginBottom:2 }}>
                  <Ic size={14} style={{ color: folder===f.id ? 'var(--acc-2)' : 'var(--tx-3)', flex:'none' }} />
                  <span style={{ fontSize:12.5, flex:1, fontWeight: folder===f.id ? 600 : 400, color: folder===f.id ? 'var(--acc-2)' : 'var(--tx-2)' }}>{f.label}</span>
                  {f.count > 0 && <span style={{ fontSize:10.5, fontWeight:700, background:'var(--acc)', color:'#fff', borderRadius:20, padding:'1px 6px' }}>{f.count}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Email list */}
        <div style={{ borderRight:'1px solid var(--line)', overflow:'auto' }}>
          {emails.filter(e => e.folder === folder).length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 16px', color:'var(--tx-4)', fontSize:13 }}>{t('inbox_empty')}</div>
          ) : (
            emails.filter(e => e.folder === folder).map(e => (
              <div key={e.id} onClick={() => setSelectedId(e.id)} style={{ padding:'13px 14px', borderBottom:'1px solid var(--line)', cursor:'pointer', background: selectedId===e.id ? 'var(--acc-soft)' : 'transparent', transition:'background .1s' }}>
                <div className="row" style={{ marginBottom:4 }}>
                  <span style={{ fontWeight: e.read ? 500 : 700, fontSize:13, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: selectedId===e.id ? 'var(--acc-2)' : 'var(--tx)' }}>{e.name}</span>
                  <span style={{ fontSize:11, color:'var(--tx-4)', flex:'none' }}>{e.date}</span>
                </div>
                <div style={{ fontWeight: e.read ? 400 : 600, fontSize:12.5, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: selectedId===e.id ? 'var(--tx)' : 'var(--tx-2)' }}>{e.subject}</div>
                <div style={{ fontSize:12, color:'var(--tx-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.preview}</div>
                {!e.read && <span style={{ width:7, height:7, background:'var(--acc)', borderRadius:50, display:'inline-block', marginTop:5 }} />}
              </div>
            ))
          )}
        </div>

        {/* Email detail */}
        <div style={{ overflow:'auto', padding:20 }}>
          {selected ? (
            <>
              <div style={{ marginBottom:18 }}>
                <h2 style={{ margin:'0 0 10px', fontSize:17, fontWeight:660, letterSpacing:'-0.02em' }}>{selected.subject}</h2>
                <div className="row gap12">
                  <div style={{ width:36, height:36, borderRadius:10, background:'var(--panel-3)', display:'grid', placeItems:'center', fontWeight:700, fontSize:15, flex:'none', color:'var(--tx)' }}>{selected.name[0]}</div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13.5 }}>{selected.name}</div>
                    <div className="muted" style={{ fontSize:12 }}>{t('inbox_from')} {selected.from}</div>
                  </div>
                  <span className="spacer" />
                  <span className="muted" style={{ fontSize:12 }}>{selected.date}</span>
                </div>
              </div>
              <div className="card card-pad" style={{ background:'var(--bg-2)', whiteSpace:'pre-wrap', fontSize:13.5, lineHeight:1.7, marginBottom:16 }}>
                {selected.body}
              </div>
              <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(251,191,36,.06)', border:'1px solid rgba(251,191,36,.2)', fontSize:12, color:'var(--tx-3)' }}>
                <I.bolt size={12} style={{ color:'#f59e0b', verticalAlign:'-1px', marginRight:4 }} />
                {t('inbox_sync_coming')}
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 0', color:'var(--tx-4)', fontSize:13 }}>{t('inbox_no_selection')}</div>
          )}
        </div>
      </div>
      {connecting && <ConnectModal />}
    </div>
  );
}
