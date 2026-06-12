import { useState, useEffect } from 'react';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT, useLang } from '../contexts/LangContext';
import { PageHead } from '../components/Shared';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + ' min';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  if (diff < 604800) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const DEFAULTS = {
  gmail:   { smtp_host: 'smtp.gmail.com',     smtp_port: 587, imap_host: 'imap.gmail.com',        imap_port: 993 },
  outlook: { smtp_host: 'smtp.office365.com', smtp_port: 587, imap_host: 'outlook.office365.com', imap_port: 993 },
  imap:    { smtp_host: '',                   smtp_port: 587, imap_host: '',                       imap_port: 993 },
};

/* ─────────────────────────────────────────── ConnectModal */
function ConnectModal({ onClose, connProvider, setConnProvider, onAdd, t }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [custom, setCustom] = useState({ smtp_host:'', smtp_port:'', imap_host:'', imap_port:'' });

  const handleAdd = () => {
    if (!email.trim() || !pass.trim()) return;
    const d = DEFAULTS[connProvider] || DEFAULTS.imap;
    onAdd({
      id: Date.now().toString(), provider: connProvider, email: email.trim(), pass: pass.trim(),
      smtp_host: custom.smtp_host || d.smtp_host, smtp_port: parseInt(custom.smtp_port) || d.smtp_port,
      imap_host: custom.imap_host || d.imap_host, imap_port: parseInt(custom.imap_port) || d.imap_port,
    });
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} />
      <div className="card" style={{ position:'relative', width:520, maxWidth:'100%', boxShadow:'var(--shadow-lg)', animation:'fadeUp .25s var(--ease)' }}>
        <div className="card-head">
          <h3>{t('inbox_add_account')}</h3>
          <div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16} /></button></div>
        </div>
        <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[['gmail','Gmail','#ea4335','G'],['outlook','Outlook','#0078d4','O'],['imap','IMAP','var(--panel-3)','@']].map(([id,label,bg,letter]) => (
              <div key={id} onClick={() => setConnProvider(id)}
                style={{ cursor:'pointer', textAlign:'center', padding:'12px 8px', borderRadius:10, border:`2px solid ${connProvider===id ? 'var(--acc)' : 'var(--line-2)'}`, background: connProvider===id ? 'var(--acc-soft)' : 'var(--panel-2)', transition:'all .12s' }}>
                <div style={{ width:34, height:34, borderRadius:9, background:bg, display:'grid', placeItems:'center', margin:'0 auto 7px', color:'#fff', fontWeight:800, fontSize:16 }}>{letter}</div>
                <div style={{ fontSize:12.5, fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>

          {connProvider === 'gmail' && (
            <div style={{ fontSize:12.5, color:'var(--tx-3)', background:'var(--panel-2)', border:'1px solid var(--line)', borderRadius:8, padding:'10px 12px', lineHeight:1.6 }}>
              <strong style={{ color:'var(--tx-2)' }}>Gmail :</strong> utilise un <strong>Mot de passe d'application</strong> (pas ton mot de passe habituel).<br />
              <span style={{ fontSize:11.5 }}>myaccount.google.com → Sécurité → Validation en 2 étapes → Mots de passe des applications</span>
            </div>
          )}
          {connProvider === 'outlook' && (
            <div style={{ fontSize:12.5, color:'var(--tx-3)', background:'var(--panel-2)', border:'1px solid var(--line)', borderRadius:8, padding:'10px 12px', lineHeight:1.6 }}>
              <strong style={{ color:'var(--tx-2)' }}>Outlook :</strong> si tu as l'auth 2FA, génère un <strong>Mot de passe d'application</strong> dans ton compte Microsoft.
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Adresse e-mail</label>
              <input className="set-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" autoFocus />
            </div>
            <div>
              <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>
                {connProvider === 'gmail' ? "Mot de passe d'application" : 'Mot de passe'}
              </label>
              <input className="set-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••••••••••"
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} />
            </div>
          </div>

          {connProvider === 'imap' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:8 }}>
                <div><label style={{ fontSize:11, color:'var(--tx-4)', display:'block', marginBottom:4 }}>Serveur SMTP</label><input className="set-input" value={custom.smtp_host} onChange={e => setCustom(p => ({...p, smtp_host:e.target.value}))} placeholder="smtp.example.com" /></div>
                <div><label style={{ fontSize:11, color:'var(--tx-4)', display:'block', marginBottom:4 }}>Port</label><input className="set-input" value={custom.smtp_port} onChange={e => setCustom(p => ({...p, smtp_port:e.target.value}))} placeholder="587" /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:8 }}>
                <div><label style={{ fontSize:11, color:'var(--tx-4)', display:'block', marginBottom:4 }}>Serveur IMAP</label><input className="set-input" value={custom.imap_host} onChange={e => setCustom(p => ({...p, imap_host:e.target.value}))} placeholder="imap.example.com" /></div>
                <div><label style={{ fontSize:11, color:'var(--tx-4)', display:'block', marginBottom:4 }}>Port</label><input className="set-input" value={custom.imap_port} onChange={e => setCustom(p => ({...p, imap_port:e.target.value}))} placeholder="993" /></div>
              </div>
            </div>
          )}

          <div className="row gap8" style={{ justifyContent:'flex-end' }}>
            <button className="btn" onClick={onClose}>{t('cancel')}</button>
            <button className="btn primary" onClick={handleAdd} disabled={!email.trim() || !pass.trim()}>{t('inbox_connect_btn')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── ComposeModal */
function ComposeModal({ onClose, accounts, defaultFromId, replyTo, t }) {
  const [fromId, setFromId] = useState(defaultFromId || accounts[0]?.id || '');
  const [to, setTo] = useState(replyTo?.fromAddress || '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const fromAcc = accounts.find(a => a.id === fromId);

  const send = async () => {
    if (!to.trim() || !fromAcc) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(), subject: subject || '(sans objet)', body,
          from_email: fromAcc.email,
          smtp_host: fromAcc.smtp_host, smtp_port: fromAcc.smtp_port,
          smtp_user: fromAcc.email, smtp_pass: fromAcc.pass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi');
      setSent(true);
      setTimeout(onClose, 1800);
    } catch (e) {
      setError(e.message);
      setSending(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:'0 24px 24px', pointerEvents:'none' }}>
      <div style={{ pointerEvents:'auto', width:540, background:'var(--panel)', border:'1px solid var(--line-2)', borderRadius:14, boxShadow:'0 8px 40px rgba(0,0,0,.5)', display:'flex', flexDirection:'column', animation:'fadeUp .22s var(--ease)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--line)', background:'var(--panel-2)', borderRadius:'14px 14px 0 0' }}>
          <span style={{ fontWeight:650, fontSize:14 }}>{replyTo ? 'Répondre' : t('inbox_compose')}</span>
          <button className="icon-btn" onClick={onClose}><I.x size={15} /></button>
        </div>
        <div style={{ padding:'0 16px', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--line)', padding:'9px 0' }}>
            <span style={{ fontSize:12, color:'var(--tx-4)', width:52, flexShrink:0 }}>De</span>
            {accounts.length > 1
              ? <select value={fromId} onChange={e => setFromId(e.target.value)} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:'var(--tx)', fontFamily:'var(--font)', cursor:'pointer' }}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
                </select>
              : <span style={{ fontSize:13, color:'var(--tx-3)' }}>{fromAcc?.email}</span>
            }
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--line)', padding:'9px 0' }}>
            <span style={{ fontSize:12, color:'var(--tx-4)', width:52, flexShrink:0 }}>À</span>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="destinataire@email.com" autoFocus={!replyTo}
              style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:'var(--tx)', fontFamily:'var(--font)' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--line)', padding:'9px 0' }}>
            <span style={{ fontSize:12, color:'var(--tx-4)', width:52, flexShrink:0 }}>Objet</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Objet du message"
              style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:'var(--tx)', fontFamily:'var(--font)' }} />
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Votre message…" rows={7}
            style={{ marginTop:8, background:'none', border:'none', outline:'none', resize:'none', fontSize:13, color:'var(--tx)', fontFamily:'var(--font)', lineHeight:1.6 }} />
        </div>
        {error && <div style={{ margin:'0 16px 8px', fontSize:12.5, color:'var(--red)', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:7, padding:'8px 12px' }}>{error}</div>}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:'1px solid var(--line)' }}>
          {sent
            ? <span style={{ fontSize:13, color:'var(--green)' }}><I.check2 size={14} style={{ verticalAlign:'-2px', marginRight:5 }} />Mail envoyé !</span>
            : <button className="btn primary sm" onClick={send} disabled={sending || !to.trim() || !fromAcc}>
                {sending ? 'Envoi…' : <><I.send size={13} /> Envoyer</>}
              </button>
          }
          <button className="icon-btn" style={{ color:'var(--tx-4)' }} onClick={onClose}><I.trash size={14} /></button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── Inbox */
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
  const [composing, setComposing] = useState(false);
  const [connProvider, setConnProvider] = useState('gmail');
  const [folder, setFolder] = useState('INBOX');

  const [folderMap, setFolderMap] = useState({ inbox:'INBOX', sent:null, drafts:null, trash:null });
  const [emails, setEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState('');
  const [sel, setSel] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [emailLight, setEmailLight] = useState(true);

  useEffect(() => {
    localStorage.setItem('ao_inbox_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const activeAcc = accounts.find(a => a.id === activeId);

  const fetchFolders = async (acc) => {
    try {
      const res = await fetch('/api/list-folders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imap_host: acc.imap_host, imap_port: acc.imap_port, imap_user: acc.email, imap_pass: acc.pass }),
      });
      const data = await res.json();
      if (res.ok && data.mapped) setFolderMap(data.mapped);
    } catch {}
  };

  const fetchEmails = async (acc, f) => {
    const account = acc || activeAcc;
    const fld = f || folder;
    if (!account) return;
    setEmailsLoading(true); setEmailsError(''); setSel(null);
    try {
      const res = await fetch('/api/fetch-emails', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imap_host: account.imap_host, imap_port: account.imap_port, imap_user: account.email, imap_pass: account.pass, folder: fld, limit: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur IMAP');
      setEmails(data.emails || []);
    } catch (e) {
      setEmailsError(e.message); setEmails([]);
    } finally {
      setEmailsLoading(false);
    }
  };

  const viewEmail = async (uid) => {
    if (!activeAcc) return;
    const listMail = emails.find(e => e.uid === uid);
    setSel({ uid, subject: listMail?.subject || '', from: listMail?.from?.name || listMail?.from?.address || '', fromAddress: listMail?.from?.address || '', date: listMail?.date || '', loading: true });
    setEmailLoading(true);
    try {
      const res = await fetch('/api/get-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, imap_host: activeAcc.imap_host, imap_port: activeAcc.imap_port, imap_user: activeAcc.email, imap_pass: activeAcc.pass, folder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lecture');
      setSel(prev => ({ ...prev, ...data, fromAddress: data.from?.match(/<(.+)>/)?.[1] || data.from || '', loading: false }));
      setEmails(prev => prev.map(e => e.uid === uid ? { ...e, seen: true } : e));
    } catch (e) {
      setSel(prev => ({ ...prev, error: e.message, loading: false }));
    } finally {
      setEmailLoading(false);
    }
  };

  const deleteEmail = async (uid) => {
    if (!activeAcc || !confirm('Supprimer ce mail ?')) return;
    setDeleting(true);
    try {
      await fetch('/api/delete-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, imap_host: activeAcc.imap_host, imap_port: activeAcc.imap_port, imap_user: activeAcc.email, imap_pass: activeAcc.pass, folder, trash_folder: folderMap.trash }),
      });
      setEmails(prev => prev.filter(e => e.uid !== uid));
      if (sel?.uid === uid) setSel(null);
    } catch {}
    setDeleting(false);
  };

  const addAccount = (acc) => {
    setAccounts(a => [...a, acc]);
    setActiveId(acc.id);
    setConnecting(false);
    fetchFolders(acc).then(() => fetchEmails(acc, folder));
  };

  const removeAccount = (id) => {
    const next = accounts.filter(a => a.id !== id);
    setAccounts(next);
    if (activeId === id) { setActiveId(next[0]?.id || null); setEmails([]); }
  };

  const switchAccount = (id) => {
    setActiveId(id);
    const acc = accounts.find(a => a.id === id);
    if (acc) { fetchFolders(acc); fetchEmails(acc, folder); }
  };

  const switchFolder = (f) => {
    setFolder(f);
    if (activeAcc) fetchEmails(activeAcc, f);
  };

  useEffect(() => {
    if (activeAcc) {
      fetchFolders(activeAcc).then(() => fetchEmails(activeAcc, folder));
    }
  }, []);

  const providerColor = { gmail:'#ea4335', outlook:'#0078d4', imap:'var(--tx-3)' };
  const providerLetter = { gmail:'G', outlook:'O', imap:'@' };
  const FOLDERS = [
    { id: folderMap.inbox  || 'INBOX',              icon:'mail',  label: lang==='fr' ? 'Boîte de réception' : 'Inbox' },
    { id: folderMap.sent   || '[Gmail]/Sent Mail',   icon:'send',  label: lang==='fr' ? 'Envoyés' : 'Sent', disabled: !folderMap.sent },
    { id: folderMap.drafts || '[Gmail]/Drafts',      icon:'doc',   label: lang==='fr' ? 'Brouillons' : 'Drafts', disabled: !folderMap.drafts },
    { id: folderMap.trash  || '[Gmail]/Trash',       icon:'trash', label: lang==='fr' ? 'Corbeille' : 'Trash', disabled: !folderMap.trash },
  ];
  const unread = emails.filter(e => !e.seen).length;

  /* ── No accounts ── */
  if (accounts.length === 0 && !connecting) {
    return (
      <div className="view">
        <PageHead title={t('inbox_title')} sub={t('inbox_sub')}>
          <button className="btn primary sm" onClick={() => setConnecting(true)}><I.plus size={14} /> {t('inbox_add_account')}</button>
        </PageHead>
        <div style={{ display:'grid', placeItems:'center', padding:'48px 20px' }}>
          <div style={{ textAlign:'center', maxWidth:520 }}>
            <div className="kpi-ico" style={{ width:56, height:56, borderRadius:16, background:'var(--acc-soft)', color:'var(--acc-2)', margin:'0 auto 20px' }}><I.mail size={28} /></div>
            <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:680 }}>{t('inbox_connect')}</h2>
            <p className="muted" style={{ fontSize:14, marginBottom:32, lineHeight:1.6 }}>{t('inbox_connect_sub')}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[['gmail','Gmail','#ea4335','G','Google Workspace'],['outlook','Outlook','#0078d4','O','Microsoft 365'],['imap','IMAP / SMTP','var(--panel-3)','@','Autre provider']].map(([id,label,bg,letter,desc]) => (
                <div key={id} onClick={() => { setConnProvider(id); setConnecting(true); }}
                  style={{ cursor:'pointer', textAlign:'center', padding:'20px 14px', borderRadius:12, border:'1.5px solid var(--line-2)', background:'var(--panel)', transition:'all .12s' }}>
                  <div style={{ width:42, height:42, borderRadius:11, background:bg, display:'grid', placeItems:'center', margin:'0 auto 10px', color:'#fff', fontWeight:800, fontSize:19 }}>{letter}</div>
                  <div style={{ fontWeight:600, fontSize:13.5, marginBottom:3 }}>{label}</div>
                  <div className="muted" style={{ fontSize:11.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {connecting && <ConnectModal onClose={() => setConnecting(false)} connProvider={connProvider} setConnProvider={setConnProvider} onAdd={addAccount} t={t} />}
      </div>
    );
  }

  return (
    <div className="view" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <PageHead title={t('inbox_title')} sub={accounts.length === 1 ? '1 boîte connectée' : `${accounts.length} boîtes connectées`}>
        {unread > 0 && <span className="pill" style={{ background:'var(--acc)', color:'#fff', fontSize:11, fontWeight:700 }}>{unread} non lu{unread>1?'s':''}</span>}
        <button className="btn sm" onClick={() => fetchEmails()} disabled={emailsLoading}><I.refresh size={13} /> Actualiser</button>
        <button className="btn sm" onClick={() => setConnecting(true)}><I.plus size={14} /> Ajouter</button>
        <button className="btn primary sm" onClick={() => { setReplyTo(null); setComposing(true); }}><I.edit size={14} /> {t('inbox_compose')}</button>
      </PageHead>

      <div style={{ display:'grid', gridTemplateColumns: sel ? '180px 300px 1fr' : '180px 1fr', gap:0, flex:1, overflow:'hidden', border:'1px solid var(--line)', borderRadius:14, background:'var(--panel)' }}>

        {/* Sidebar */}
        <div style={{ borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--line)' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--tx-4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{t('inbox_accounts')}</div>
            {accounts.map(a => (
              <div key={a.id} onClick={() => switchAccount(a.id)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer', background: activeId===a.id ? 'var(--acc-soft)' : 'transparent', marginBottom:2 }}>
                <div style={{ width:24, height:24, borderRadius:7, background: providerColor[a.provider]||'var(--panel-3)', display:'grid', placeItems:'center', color:'#fff', fontWeight:700, fontSize:11, flex:'none' }}>{providerLetter[a.provider]||'@'}</div>
                <span style={{ fontSize:11.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontWeight: activeId===a.id ? 600 : 400, color: activeId===a.id ? 'var(--acc-2)' : 'var(--tx-2)' }}>{a.email}</span>
                <button style={{ background:'none', border:'none', color:'var(--tx-4)', cursor:'pointer', padding:'0 2px', fontSize:12, lineHeight:1 }} onClick={e => { e.stopPropagation(); removeAccount(a.id); }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 12px', flex:1 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--tx-4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Dossiers</div>
            {FOLDERS.map(f => {
              const Ic = I[f.icon];
              return (
                <div key={f.id} onClick={() => switchFolder(f.id)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer', background: folder===f.id ? 'var(--acc-soft)' : 'transparent', marginBottom:2 }}>
                  <Ic size={14} style={{ color: folder===f.id ? 'var(--acc-2)' : 'var(--tx-3)', flex:'none' }} />
                  <span style={{ fontSize:12.5, flex:1, fontWeight: folder===f.id ? 600 : 400, color: folder===f.id ? 'var(--acc-2)' : 'var(--tx-2)' }}>{f.label}</span>
                  {f.id==='INBOX' && unread > 0 && <span style={{ fontSize:11, fontWeight:700, color:'var(--acc-2)', background:'var(--acc-soft)', borderRadius:10, padding:'1px 6px' }}>{unread}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Email list */}
        <div style={{ borderRight: sel ? '1px solid var(--line)' : 'none', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {emailsLoading && (
            <div style={{ display:'grid', placeItems:'center', flex:1, padding:32 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'var(--acc-soft)', color:'var(--acc-2)', display:'grid', placeItems:'center', margin:'0 auto 12px', animation:'loader-pulse 1.4s ease-in-out infinite' }}><I.mail size={14} /></div>
                <div style={{ fontSize:13, color:'var(--tx-3)' }}>Chargement des mails…</div>
              </div>
            </div>
          )}
          {!emailsLoading && emailsError && (
            <div style={{ padding:20 }}>
              <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:16 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--red)', marginBottom:6 }}>Erreur de connexion</div>
                <div style={{ fontSize:12.5, color:'var(--tx-3)', lineHeight:1.5, marginBottom:10 }}>{emailsError}</div>
                {(emailsError.toLowerCase().includes('auth') || emailsError.toLowerCase().includes('login') || emailsError.toLowerCase().includes('credentials')) && (
                  <div style={{ fontSize:12, color:'var(--tx-4)', background:'var(--panel-2)', borderRadius:7, padding:'8px 10px', lineHeight:1.5, marginBottom:10 }}>
                    Gmail : utilise un <strong>Mot de passe d'application</strong> (pas ton mot de passe habituel). Active aussi l'accès IMAP dans les paramètres Gmail.
                  </div>
                )}
                <button className="btn sm" onClick={() => fetchEmails()}>Réessayer</button>
              </div>
            </div>
          )}
          {!emailsLoading && !emailsError && emails.length === 0 && (
            <div style={{ display:'grid', placeItems:'center', flex:1 }}>
              <div style={{ textAlign:'center', color:'var(--tx-4)', fontSize:13 }}>Aucun message dans ce dossier</div>
            </div>
          )}
          {!emailsLoading && !emailsError && emails.length > 0 && (
            <div style={{ overflowY:'auto', flex:1 }}>
              {emails.map(email => (
                <div key={email.uid}
                  style={{ padding:'11px 14px', borderBottom:'1px solid var(--line)', cursor:'pointer', background: sel?.uid===email.uid ? 'var(--acc-soft)' : 'transparent', transition:'background .1s', position:'relative' }}
                  className="email-row">
                  <div onClick={() => viewEmail(email.uid)}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                      {!email.seen && <span style={{ width:7, height:7, borderRadius:50, background:'var(--acc)', flex:'none' }} />}
                      <span style={{ fontSize:12.5, fontWeight: email.seen ? 400 : 700, color: email.seen ? 'var(--tx-2)' : 'var(--tx)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {email.from.name || email.from.address}
                      </span>
                      <span style={{ fontSize:11, color:'var(--tx-4)', flexShrink:0 }}>{fmtDate(email.date)}</span>
                    </div>
                    <div style={{ fontSize:12, fontWeight: email.seen ? 400 : 600, color: email.seen ? 'var(--tx-3)' : 'var(--tx-2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {email.subject}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteEmail(email.uid); }} disabled={deleting}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--tx-4)', cursor:'pointer', padding:'4px 6px', borderRadius:6, opacity:0, transition:'opacity .15s' }}
                    className="email-del-btn" title="Supprimer">
                    <I.trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email detail */}
        {sel && (
          <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'flex-start', gap:10 }}>
              <button className="icon-btn" style={{ marginTop:2 }} onClick={() => setSel(null)}><I.x size={15} /></button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:660, fontSize:14, lineHeight:1.4, marginBottom:4 }}>{sel.subject}</div>
                <div style={{ fontSize:12, color:'var(--tx-3)' }}>
                  De : <strong>{sel.from || '…'}</strong>
                  {sel.date && <> · {new Date(sel.date).toLocaleString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</>}
                </div>
              </div>
              <button className="btn sm" onClick={() => { setReplyTo(sel); setComposing(true); }} style={{ flexShrink:0 }}>
                <I.mail size={13} /> Répondre
              </button>
              <button className="icon-btn" title={emailLight ? 'Passer en sombre' : 'Passer en clair'}
                style={{ flexShrink:0, color: emailLight ? 'var(--tx-3)' : 'var(--acc-2)', background: emailLight ? 'transparent' : 'var(--acc-soft)', borderRadius:7 }}
                onClick={() => setEmailLight(v => !v)}>
                {emailLight ? <I.moon size={15} /> : <I.sun size={15} />}
              </button>
              <button className="icon-btn" style={{ color:'var(--red)', flexShrink:0 }} onClick={() => deleteEmail(sel.uid)} disabled={deleting} title="Supprimer">
                <I.trash size={15} />
              </button>
            </div>
            {sel.loading ? (
              <div style={{ display:'grid', placeItems:'center', flex:1 }}>
                <div style={{ fontSize:13, color:'var(--tx-4)' }}>Chargement du mail…</div>
              </div>
            ) : sel.error ? (
              <div style={{ padding:20, fontSize:13, color:'var(--red)' }}>{sel.error}</div>
            ) : (
              <div style={{ flex:1, overflow:'auto', background: emailLight ? '#fff' : 'var(--bg)' }}>
                {sel.html ? (
                  <iframe srcDoc={sel.html} sandbox="allow-same-origin" title="email"
                    style={{ width:'100%', height:'100%', minHeight:500, border:'none', borderRadius:'0 0 14px 0', filter: emailLight ? 'none' : 'invert(1) hue-rotate(180deg)' }} />
                ) : (
                  <pre style={{ padding:'16px 20px', fontSize:13, lineHeight:1.7, color: emailLight ? '#1a1a1a' : 'var(--tx-2)', whiteSpace:'pre-wrap', fontFamily:'var(--font)', margin:0, background: emailLight ? '#fff' : 'transparent' }}>
                    {sel.text || '(message vide)'}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {connecting && <ConnectModal onClose={() => setConnecting(false)} connProvider={connProvider} setConnProvider={setConnProvider} onAdd={addAccount} t={t} />}
      {composing && <ComposeModal onClose={() => { setComposing(false); setReplyTo(null); }} accounts={accounts} defaultFromId={activeId} replyTo={replyTo} t={t} />}
    </div>
  );
}
