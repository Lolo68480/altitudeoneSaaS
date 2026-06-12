import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';

const CATS = ['Pro', 'Perso', 'Famille', 'Business', 'Associé', 'Autre'];
const CAT_COLOR = { Pro:'--acc', Perso:'--green', Famille:'--amber', Business:'--violet', Associé:'--cyan', Autre:'--tx-3' };
const LOG_TYPES = [
  { id:'note',    label:'Note',    icon:'edit',  color:'--acc' },
  { id:'call',    label:'Appel',   icon:'phone', color:'--green' },
  { id:'email',   label:'Email',   icon:'mail',  color:'--violet' },
  { id:'meeting', label:'Réunion', icon:'users', color:'--amber' },
];

function Avatar({ name, size = 42 }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const palette = ['linear-gradient(140deg,#2f6bff,#5b8bff)','linear-gradient(140deg,#a78bfa,#7c5cf0)',
    'linear-gradient(140deg,#34d399,#0ea371)','linear-gradient(140deg,#fbbf24,#f59e0b)',
    'linear-gradient(140deg,#38bdf8,#0ea5e9)','linear-gradient(140deg,#fb7185,#e11d48)'];
  const bg = palette[(name||'').charCodeAt(0) % palette.length];
  return <div style={{ width:size, height:size, borderRadius:size*0.27, background:bg, display:'grid', placeItems:'center', color:'#fff', fontWeight:700, fontSize:size*0.37, flex:'none' }}>{initials}</div>;
}

function Badge({ cat }) {
  const c = CAT_COLOR[cat] || '--tx-3';
  return <span style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', padding:'2px 8px', borderRadius:20, background:`color-mix(in srgb, var(${c}) 16%, transparent)`, color:`var(${c})` }}>{cat||'Autre'}</span>;
}

function CField({ label, req, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>
        {label}{req && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function CRow({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>{children}</div>;
}

function AddContactModal({ onClose, onSaved }) {
  const { user } = useAppData();
  const [f, setF] = useState({ first_name:'', last_name:'', profession:'', company:'', email:'', phone:'', linkedin:'', category:'Pro', notes:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    const { error } = await db.from('contacts').insert({
      user_id: user.id,
      first_name: f.first_name.trim(),
      last_name: f.last_name.trim() || null,
      profession: f.profession.trim() || null,
      company: f.company.trim() || null,
      email: f.email.trim() || null,
      phone: f.phone.trim() || null,
      linkedin: f.linkedin.trim() || null,
      category: f.category,
      notes: f.notes.trim() || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} />
      <div className="card" style={{ position:'relative', width:560, maxWidth:'100%', maxHeight:'90vh', overflow:'auto', boxShadow:'var(--shadow-lg)', animation:'fadeUp .22s var(--ease)' }}>
        <div className="card-head">
          <h3 style={{ fontSize:15 }}>Nouveau contact</h3>
          <div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16}/></button></div>
        </div>
        <form onSubmit={submit}>
          <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {err && <div style={{ background:'rgba(251,113,133,.12)', color:'var(--red)', border:'1px solid rgba(251,113,133,.4)', borderRadius:8, padding:'10px 14px', fontSize:12.5 }}>{err}</div>}
            <CRow>
              <CField label="Prénom" req><input className="set-input" value={f.first_name} onChange={up('first_name')} required autoFocus /></CField>
              <CField label="Nom"><input className="set-input" value={f.last_name} onChange={up('last_name')} /></CField>
            </CRow>
            <CRow>
              <CField label="Profession / Poste"><input className="set-input" value={f.profession} onChange={up('profession')} placeholder="Designer, Dev, Comptable…" /></CField>
              <CField label="Entreprise"><input className="set-input" value={f.company} onChange={up('company')} /></CField>
            </CRow>
            <CRow>
              <CField label="Email"><input className="set-input" type="email" value={f.email} onChange={up('email')} /></CField>
              <CField label="Téléphone"><input className="set-input" type="tel" value={f.phone} onChange={up('phone')} /></CField>
            </CRow>
            <CRow>
              <CField label="LinkedIn / Site web"><input className="set-input" value={f.linkedin} onChange={up('linkedin')} placeholder="linkedin.com/in/…" /></CField>
              <CField label="Catégorie">
                <select className="set-input" value={f.category} onChange={up('category')}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </CField>
            </CRow>
            <CField label="Notes rapides"><textarea className="set-input" value={f.notes} onChange={up('notes')} rows={2} style={{ resize:'vertical' }} placeholder="Comment vous vous êtes rencontrés, contexte, etc." /></CField>
            <div className="row gap8" style={{ marginTop:4 }}>
              <span className="spacer" />
              <button type="button" className="btn" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactDetail({ contact, user, onDelete, onRefresh }) {
  const [logs, setLogs] = useState([]);
  const [text, setText] = useState('');
  const [type, setType] = useState('note');
  const [saving, setSaving] = useState(false);
  const [compose, setCompose] = useState(false);
  const [composeSub, setComposeSub] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeDone, setComposeDone] = useState(false);
  const [composeErr, setComposeErr] = useState('');
  const accounts = JSON.parse(localStorage.getItem('ao_email_accounts') || '[]');

  const fetchLogs = useCallback(async () => {
    const { data } = await db.from('contact_logs').select('*').eq('contact_id', contact.id).order('created_at', { ascending: false });
    setLogs(data || []);
  }, [contact.id]);

  useEffect(() => { fetchLogs(); setCompose(false); setComposeDone(false); }, [contact.id]);

  const addLog = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    await db.from('contact_logs').insert({ user_id: user.id, contact_id: contact.id, type, content: text.trim() });
    setText('');
    await fetchLogs();
    setSaving(false);
  };

  const delLog = async (id) => {
    await db.from('contact_logs').delete().eq('id', id);
    setLogs(p => p.filter(l => l.id !== id));
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    if (!accounts[0]) return;
    setComposeSending(true); setComposeErr('');
    const acc = accounts[0];
    try {
      const r = await fetch('/api/send-email', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ to: contact.email, subject: composeSub, body: composeBody, from_email: acc.email, smtp_host: acc.smtp_host, smtp_port: acc.smtp_port, smtp_user: acc.email, smtp_pass: acc.password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur');
      setComposeDone(true);
      await db.from('contact_logs').insert({ user_id: user.id, contact_id: contact.id, type:'email', content: `Email envoyé : "${composeSub}"` });
      await fetchLogs();
    } catch (ex) { setComposeErr(ex.message); }
    setComposeSending(false);
  };

  const fmtDate = iso => new Date(iso).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  const webHref = contact.linkedin ? (contact.linkedin.startsWith('http') ? contact.linkedin : 'https://' + contact.linkedin) : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Carte contact */}
      <div className="card">
        <div className="card-pad" style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
          <Avatar name={fullName} size={60} />
          <div style={{ flex:1, minWidth:0 }}>
            <div className="row gap10" style={{ marginBottom:4, flexWrap:'wrap' }}>
              <h2 style={{ margin:0, fontSize:21, fontWeight:700, letterSpacing:'-0.02em' }}>{fullName}</h2>
              <Badge cat={contact.category} />
            </div>
            {contact.profession && <div style={{ fontSize:14, color:'var(--tx-2)', marginBottom:2 }}>{contact.profession}</div>}
            {contact.company && <div className="muted" style={{ fontSize:13, marginBottom:8 }}>{contact.company}</div>}
            {contact.notes && <div style={{ fontSize:13, color:'var(--tx-3)', fontStyle:'italic', marginBottom:10, lineHeight:1.5 }}>"{contact.notes}"</div>}
            <div className="row gap8" style={{ flexWrap:'wrap' }}>
              {contact.email
                ? accounts.length > 0
                  ? <button className="btn sm" onClick={() => { setCompose(true); setComposeDone(false); setComposeErr(''); }}><I.mail size={13}/> {contact.email}</button>
                  : <a href={'mailto:'+contact.email} className="btn sm" style={{ textDecoration:'none' }}><I.mail size={13}/> {contact.email}</a>
                : <button className="btn sm" disabled style={{ opacity:.4 }}><I.mail size={13}/> Pas d'email</button>
              }
              {contact.phone
                ? <a href={'tel:'+contact.phone} className="btn sm" style={{ textDecoration:'none' }}><I.phone size={13}/> {contact.phone}</a>
                : <button className="btn sm" disabled style={{ opacity:.4 }}><I.phone size={13}/> Pas de tél.</button>
              }
              {webHref && <a href={webHref} target="_blank" rel="noopener" className="btn sm" style={{ textDecoration:'none' }}><I.link size={13}/> LinkedIn</a>}
            </div>
          </div>
          <button className="icon-btn" style={{ color:'var(--tx-4)', width:30, height:30 }} onClick={onDelete}><I.trash size={15}/></button>
        </div>

        {/* Compose inline */}
        {compose && (
          <div style={{ borderTop:'1px solid var(--line)', padding:16 }}>
            {composeDone
              ? <div style={{ color:'var(--green)', fontWeight:600, fontSize:13.5 }}>Email envoyé à {contact.email} ✓ <button className="btn sm" style={{ marginLeft:8 }} onClick={() => setCompose(false)}>Fermer</button></div>
              : <form onSubmit={sendEmail} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {composeErr && <div style={{ color:'var(--red)', fontSize:12.5 }}>{composeErr}</div>}
                  <div style={{ fontSize:12, color:'var(--tx-3)' }}>De : {accounts[0]?.email}</div>
                  <input className="set-input" value={composeSub} onChange={e => setComposeSub(e.target.value)} placeholder="Objet" required />
                  <textarea className="set-input" value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={4} placeholder="Message…" style={{ resize:'vertical' }} required />
                  <div className="row gap8">
                    <button type="button" className="btn sm" onClick={() => setCompose(false)}>Annuler</button>
                    <button type="submit" className="btn primary sm" disabled={composeSending}><I.send size={12}/> {composeSending ? 'Envoi…' : 'Envoyer'}</button>
                  </div>
                </form>
            }
          </div>
        )}
      </div>

      {/* Suivi */}
      <div className="card">
        <div className="card-head"><h3>Historique &amp; notes</h3></div>
        <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <form onSubmit={addLog} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div className="row gap6" style={{ flexWrap:'wrap' }}>
              {LOG_TYPES.map(lt => {
                const Ic = I[lt.icon];
                return (
                  <button key={lt.id} type="button" onClick={() => setType(lt.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:600,
                      background: type===lt.id ? `var(${lt.color})` : 'var(--panel-2)',
                      color: type===lt.id ? '#fff' : 'var(--tx-3)' }}>
                    <Ic size={12}/> {lt.label}
                  </button>
                );
              })}
            </div>
            <div className="row gap8">
              <textarea className="set-input" value={text} onChange={e => setText(e.target.value)}
                placeholder="Résumer un appel, noter une info clé, suivre une action…"
                rows={2} style={{ flex:1, resize:'none' }} />
              <button type="submit" className="btn primary" disabled={saving || !text.trim()} style={{ alignSelf:'flex-end', height:36 }}>
                <I.plus size={13}/> Ajouter
              </button>
            </div>
          </form>

          {logs.length === 0
            ? <div style={{ textAlign:'center', padding:'12px 0', color:'var(--tx-4)', fontSize:13 }}>Aucune note pour ce contact.</div>
            : logs.map((l, i) => {
                const lt = LOG_TYPES.find(x => x.id === l.type) || LOG_TYPES[0];
                const Ic = I[lt.icon];
                return (
                  <div key={l.id} className="row gap10" style={{ paddingTop: i>0?12:0, borderTop: i>0?'1px solid var(--line)':'none', alignItems:'flex-start' }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`color-mix(in srgb, var(${lt.color}) 14%, transparent)`, color:`var(${lt.color})`, display:'grid', placeItems:'center', flex:'none' }}>
                      <Ic size={13}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="row gap8" style={{ marginBottom:3 }}>
                        <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', color:`var(${lt.color})` }}>{lt.label}</span>
                        <span className="muted" style={{ fontSize:11 }}>{fmtDate(l.created_at)}</span>
                      </div>
                      <div style={{ fontSize:13.5, lineHeight:1.55, whiteSpace:'pre-wrap' }}>{l.content}</div>
                    </div>
                    <button className="icon-btn" style={{ width:22, height:22, color:'var(--tx-4)' }} onClick={() => delLog(l.id)}><I.trash size={11}/></button>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

export default function Contacts() {
  const { contacts = [], user, refetch } = useAppData();
  const [sel, setSel] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Tous');

  useEffect(() => {
    if (!sel && contacts.length) setSel(contacts[0]);
    else if (sel) {
      const fresh = contacts.find(c => c.id === sel.id);
      if (!fresh) setSel(contacts[0] || null);
      else setSel(fresh);
    }
  }, [contacts]);

  const allCats = ['Tous', ...Array.from(new Set(contacts.map(c => c.category).filter(Boolean)))];

  const filtered = contacts.filter(c => {
    const matchCat = catFilter === 'Tous' || c.category === catFilter;
    const q = search.toLowerCase();
    const name = [c.first_name, c.last_name].join(' ').toLowerCase();
    const matchQ = !q || name.includes(q) || (c.profession||'').toLowerCase().includes(q) || (c.company||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const deleteContact = async (c) => {
    if (!confirm(`Supprimer ${c.first_name} ${c.last_name||''} ?`)) return;
    await db.from('contact_logs').delete().eq('contact_id', c.id);
    await db.from('contacts').delete().eq('id', c.id);
    await refetch();
    setSel(null);
  };

  const fullName = c => [c.first_name, c.last_name].filter(Boolean).join(' ');

  return (
    <div className="view">
      <div className="row gap12" style={{ marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, letterSpacing:'-0.02em' }}>Contacts</h1>
          <div className="muted" style={{ fontSize:13, marginTop:2 }}>{contacts.length} personne{contacts.length > 1 ? 's' : ''} dans ton réseau</div>
        </div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setAddOpen(true)}><I.plus size={14}/> Nouveau contact</button>
      </div>

      <div className="row gap10" style={{ marginBottom:16, flexWrap:'wrap' }}>
        <div className="row gap8" style={{ background:'var(--panel-2)', border:'1px solid var(--line)', borderRadius:8, padding:'0 12px', height:36, flex:1, minWidth:180 }}>
          <I.search size={14} style={{ color:'var(--tx-4)', flexShrink:0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ background:'none', border:'none', outline:'none', color:'var(--tx)', fontSize:13.5, flex:1 }} />
        </div>
        <div className="row gap6" style={{ flexWrap:'wrap' }}>
          {allCats.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:600,
                background: catFilter===cat ? 'var(--acc)' : 'var(--panel-2)',
                color: catFilter===cat ? '#fff' : 'var(--tx-3)' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="card card-pad" style={{ textAlign:'center', padding:'64px 24px' }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'var(--acc-soft)', display:'grid', placeItems:'center', margin:'0 auto 16px', color:'var(--acc-2)' }}><I.users size={26}/></div>
          <h3 style={{ margin:'0 0 8px' }}>Aucun contact</h3>
          <p className="muted" style={{ fontSize:13, marginBottom:20 }}>Commence à construire ton réseau, pro ou perso.</p>
          <button className="btn primary" onClick={() => setAddOpen(true)}><I.plus size={14}/> Ajouter un contact</button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns:'270px 1fr', alignItems:'start', gap:16 }}>
          <div className="card" style={{ overflow:'hidden' }}>
            {filtered.length === 0
              ? <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--tx-4)', fontSize:13 }}>Aucun résultat</div>
              : filtered.map(c => (
                  <div key={c.id} onClick={() => setSel(c)} className="row gap10"
                    style={{ padding:'11px 14px', borderBottom:'1px solid var(--line)', cursor:'pointer',
                      background: sel?.id===c.id ? 'var(--acc-soft)' : 'transparent',
                      borderLeft: sel?.id===c.id ? '2px solid var(--acc)' : '2px solid transparent' }}>
                    <Avatar name={fullName(c)} size={36}/>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fullName(c)}</div>
                      <div className="muted" style={{ fontSize:11.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.profession || c.company || c.email || '—'}</div>
                    </div>
                    {c.category && <Badge cat={c.category}/>}
                  </div>
                ))
            }
          </div>

          {sel
            ? <ContactDetail key={sel.id} contact={sel} user={user} onDelete={() => deleteContact(sel)} onRefresh={refetch} />
            : <div className="card card-pad" style={{ textAlign:'center', color:'var(--tx-4)', fontSize:13, padding:'48px 24px' }}>Sélectionne un contact</div>
          }
        </div>
      )}

      {addOpen && <AddContactModal onClose={() => setAddOpen(false)} onSaved={async () => { await refetch(); setAddOpen(false); }} />}
    </div>
  );
}
