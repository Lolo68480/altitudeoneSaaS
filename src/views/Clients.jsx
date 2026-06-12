import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { NewClientModal } from '../components/Modals';

const CAT_COLORS = {
  Pro: '--acc', Perso: '--green', Famille: '--amber',
  Business: '--violet', Associé: '--cyan', Autre: '--tx-3'
};

const NOTE_TYPES = [
  { id: 'note',    label: 'Note',    icon: 'edit',  color: '--acc' },
  { id: 'call',    label: 'Appel',   icon: 'phone', color: '--green' },
  { id: 'email',   label: 'Email',   icon: 'mail',  color: '--violet' },
  { id: 'meeting', label: 'Réunion', icon: 'users', color: '--amber' },
];

function Avatar({ name, size = 44 }) {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  const colors = ['linear-gradient(140deg,#2f6bff,#5b8bff)', 'linear-gradient(140deg,#a78bfa,#7c5cf0)',
    'linear-gradient(140deg,#34d399,#0ea371)', 'linear-gradient(140deg,#fbbf24,#f59e0b)',
    'linear-gradient(140deg,#38bdf8,#0ea5e9)', 'linear-gradient(140deg,#fb7185,#e11d48)'];
  const bg = colors[(name || '').charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: bg, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.38, flex: 'none', letterSpacing: '-0.01em' }}>
      {initials}
    </div>
  );
}

function CatBadge({ cat }) {
  const color = CAT_COLORS[cat] || '--tx-3';
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '2px 7px', borderRadius: 20, background: `color-mix(in srgb, var(${color}) 16%, transparent)`, color: `var(${color})` }}>
      {cat || 'Autre'}
    </span>
  );
}

function QuickCompose({ to, onClose }) {
  const accounts = JSON.parse(localStorage.getItem('ao_email_accounts') || '[]');
  const [fromIdx, setFromIdx] = useState(0);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const send = async (e) => {
    e.preventDefault();
    if (!accounts[fromIdx]) { setErr('Aucun compte email configuré. Va dans Boite mail pour en ajouter un.'); return; }
    setSending(true); setErr('');
    const acc = accounts[fromIdx];
    try {
      const r = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, from_email: acc.email, smtp_host: acc.smtp_host, smtp_port: acc.smtp_port, smtp_user: acc.email, smtp_pass: acc.password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur envoi');
      setDone(true);
    } catch (ex) { setErr(ex.message); }
    setSending(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} />
      <div className="card" style={{ position:'relative', width:520, maxWidth:'100%', boxShadow:'var(--shadow-lg)', animation:'fadeUp .2s var(--ease)' }}>
        <div className="card-head">
          <h3 style={{ fontSize:15 }}>Nouveau message à {to}</h3>
          <div className="right"><button className="icon-btn" onClick={onClose}><I.x size={16} /></button></div>
        </div>
        {done ? (
          <div className="card-pad" style={{ textAlign:'center', padding:'28px' }}>
            <div style={{ color:'var(--green)', fontSize:15, fontWeight:600, marginBottom:12 }}>Email envoyé ✓</div>
            <button className="btn primary" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <form onSubmit={send}>
            <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {err && <div style={{ background:'rgba(251,113,133,.12)', color:'var(--red)', border:'1px solid rgba(251,113,133,.4)', borderRadius:8, padding:'10px 14px', fontSize:12.5 }}>{err}</div>}
              {accounts.length > 1 && (
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>De</label>
                  <select className="set-input" value={fromIdx} onChange={e => setFromIdx(+e.target.value)}>
                    {accounts.map((a, i) => <option key={i} value={i}>{a.email}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>Objet</label>
                <input className="set-input" value={subject} onChange={e => setSubject(e.target.value)} autoFocus required />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>Message</label>
                <textarea className="set-input" value={body} onChange={e => setBody(e.target.value)} rows={5} style={{ resize:'vertical' }} required />
              </div>
              <div className="row gap8" style={{ marginTop:4 }}>
                <span className="spacer" />
                <button type="button" className="btn" onClick={onClose}>Annuler</button>
                <button type="submit" className="btn primary" disabled={sending}><I.send size={13} /> {sending ? 'Envoi…' : 'Envoyer'}</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ContactDetail({ contact, user, onEdit, onDelete }) {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('note');
  const [savingNote, setSavingNote] = useState(false);
  const [compose, setCompose] = useState(null);

  const accounts = JSON.parse(localStorage.getItem('ao_email_accounts') || '[]');

  const fetchNotes = useCallback(async () => {
    const { data } = await db.from('contact_notes').select('*').eq('client_id', contact.id).order('created_at', { ascending: false });
    setNotes(data || []);
  }, [contact.id]);

  useEffect(() => { fetchNotes(); }, [contact.id]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    await db.from('contact_notes').insert({ user_id: user.id, client_id: contact.id, type: noteType, content: noteText.trim() });
    setNoteText('');
    await fetchNotes();
    setSavingNote(false);
  };

  const deleteNote = async (id) => {
    await db.from('contact_notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const webHref = contact.website
    ? (contact.website.startsWith('http') ? contact.website : 'https://' + contact.website)
    : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Fiche contact */}
      <div className="card">
        <div className="card-pad" style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Avatar name={contact.company} size={58} />
          <div style={{ flex:1, minWidth:0 }}>
            <div className="row gap10" style={{ marginBottom:4 }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:'-0.02em' }}>{contact.company}</h2>
              <CatBadge cat={contact.industry} />
            </div>
            {contact.contact && <div className="muted" style={{ fontSize:13.5, marginBottom:8 }}>{contact.contact}</div>}
            <div className="row gap8" style={{ flexWrap:'wrap' }}>
              {contact.email ? (
                accounts.length > 0
                  ? <button className="btn sm" onClick={() => setCompose(contact.email)}><I.mail size={13} /> {contact.email}</button>
                  : <a href={'mailto:'+contact.email} className="btn sm" style={{ textDecoration:'none' }}><I.mail size={13} /> {contact.email}</a>
              ) : <button className="btn sm" disabled style={{ opacity:.4 }}><I.mail size={13} /> Pas d'email</button>}

              {contact.phone
                ? <a href={'tel:'+contact.phone} className="btn sm" style={{ textDecoration:'none' }}><I.phone size={13} /> {contact.phone}</a>
                : <button className="btn sm" disabled style={{ opacity:.4 }}><I.phone size={13} /> Pas de tél.</button>}

              {webHref && <a href={webHref} target="_blank" rel="noopener" className="btn sm" style={{ textDecoration:'none' }}><I.link size={13} /> LinkedIn / Site</a>}
            </div>
          </div>
          <button className="icon-btn" style={{ color:'var(--red)', width:30, height:30, flexShrink:0 }} title="Supprimer" onClick={onDelete}>
            <I.trash size={15} />
          </button>
        </div>
      </div>

      {/* Suivi */}
      <div className="card">
        <div className="card-head"><h3>Suivi &amp; notes</h3></div>
        <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Formulaire */}
          <form onSubmit={addNote} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div className="row gap6" style={{ flexWrap:'wrap' }}>
              {NOTE_TYPES.map(nt => {
                const Ic = I[nt.icon];
                return (
                  <button key={nt.id} type="button" onClick={() => setNoteType(nt.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:600,
                      background: noteType === nt.id ? `var(${nt.color})` : 'var(--panel-2)',
                      color: noteType === nt.id ? '#fff' : 'var(--tx-3)' }}>
                    <Ic size={12} /> {nt.label}
                  </button>
                );
              })}
            </div>
            <div className="row gap8">
              <textarea className="set-input" value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Résumer un appel, noter une info importante, suivre un email…"
                rows={2} style={{ flex:1, resize:'none' }} />
              <button type="submit" className="btn primary" disabled={savingNote || !noteText.trim()} style={{ alignSelf:'flex-end', height:36, whiteSpace:'nowrap' }}>
                <I.plus size={13} /> Ajouter
              </button>
            </div>
          </form>

          {/* Notes */}
          {notes.length === 0
            ? <div style={{ textAlign:'center', padding:'16px 0', color:'var(--tx-4)', fontSize:13 }}>Aucune note pour ce contact.</div>
            : notes.map((n, i) => {
                const nt = NOTE_TYPES.find(x => x.id === n.type) || NOTE_TYPES[0];
                const Ic = I[nt.icon];
                return (
                  <div key={n.id} className="row gap10" style={{ paddingTop: i > 0 ? 12 : 0, borderTop: i > 0 ? '1px solid var(--line)' : 'none', alignItems:'flex-start' }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`color-mix(in srgb, var(${nt.color}) 14%, transparent)`, color:`var(${nt.color})`, display:'grid', placeItems:'center', flex:'none' }}>
                      <Ic size={13} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="row gap8" style={{ marginBottom:3 }}>
                        <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', color:`var(${nt.color})` }}>{nt.label}</span>
                        <span className="muted" style={{ fontSize:11 }}>{fmtDate(n.created_at)}</span>
                      </div>
                      <div style={{ fontSize:13.5, lineHeight:1.55, whiteSpace:'pre-wrap' }}>{n.content}</div>
                    </div>
                    <button className="icon-btn" style={{ width:22, height:22, color:'var(--tx-4)', flexShrink:0 }} onClick={() => deleteNote(n.id)}>
                      <I.trash size={11} />
                    </button>
                  </div>
                );
              })
          }
        </div>
      </div>

      {compose && <QuickCompose to={compose} onClose={() => setCompose(null)} />}
    </div>
  );
}

export default function Clients() {
  const { clients: ctxClients, user } = useAppData();
  const list = ctxClients || [];
  const [sel, setSel] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Tous');
  const { refetch } = useAppData();

  useEffect(() => {
    if (!sel && list.length) setSel(list[0]);
    else if (sel) {
      const fresh = list.find(c => c.id === sel.id);
      if (!fresh && list.length) setSel(list[0]);
      else if (fresh) setSel(fresh);
    }
  }, [ctxClients]);

  const allCats = ['Tous', ...Array.from(new Set(list.map(c => c.industry).filter(Boolean)))];

  const filtered = list.filter(c => {
    const matchCat = catFilter === 'Tous' || c.industry === catFilter;
    const q = search.toLowerCase();
    const matchQ = !q || (c.company || '').toLowerCase().includes(q) || (c.contact || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const deleteContact = async (c) => {
    if (!confirm('Supprimer "' + c.company + '" ?')) return;
    await db.from('contact_notes').delete().eq('client_id', c.id);
    await db.from('clients').delete().eq('id', c.id);
    await refetch();
    setSel(null);
  };

  return (
    <div className="view">
      {/* Header */}
      <div className="row gap12" style={{ marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, letterSpacing:'-0.02em' }}>Réseaux</h1>
          <div className="muted" style={{ fontSize:13, marginTop:2 }}>{list.length} contact{list.length > 1 ? 's' : ''}</div>
        </div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setAddOpen(true)}><I.plus size={14} /> Ajouter un contact</button>
      </div>

      {/* Search + filtres */}
      <div className="row gap10" style={{ marginBottom:16, flexWrap:'wrap' }}>
        <div className="row gap8" style={{ background:'var(--panel-2)', border:'1px solid var(--line)', borderRadius:8, padding:'0 12px', height:36, flex:1, minWidth:200 }}>
          <I.search size={14} style={{ color:'var(--tx-4)', flexShrink:0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un contact…"
            style={{ background:'none', border:'none', outline:'none', color:'var(--tx)', fontSize:13.5, flex:1 }} />
        </div>
        <div className="row gap6" style={{ flexWrap:'wrap' }}>
          {allCats.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:600,
                background: catFilter === cat ? 'var(--acc)' : 'var(--panel-2)',
                color: catFilter === cat ? '#fff' : 'var(--tx-3)' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card card-pad" style={{ textAlign:'center', padding:'64px 24px' }}>
          <Avatar name="?" size={56} />
          <h3 style={{ margin:'16px 0 6px' }}>Aucun contact</h3>
          <p className="muted" style={{ fontSize:13, marginBottom:20 }}>Commence à construire ton réseau pro et perso.</p>
          <button className="btn primary" onClick={() => setAddOpen(true)}><I.plus size={14} /> Ajouter un contact</button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns:'280px 1fr', alignItems:'start', gap:16 }}>
          {/* Liste */}
          <div className="card" style={{ overflow:'hidden' }}>
            {filtered.length === 0
              ? <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--tx-4)', fontSize:13 }}>Aucun résultat</div>
              : filtered.map(c => (
                  <div key={c.id} onClick={() => setSel(c)} className="row gap10"
                    style={{ padding:'11px 14px', borderBottom:'1px solid var(--line)', cursor:'pointer',
                      background: sel?.id === c.id ? 'var(--acc-soft)' : 'transparent',
                      borderLeft: sel?.id === c.id ? '2px solid var(--acc)' : '2px solid transparent' }}>
                    <Avatar name={c.company} size={36} />
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.company}</div>
                      <div className="muted" style={{ fontSize:11.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.contact || c.email || '—'}</div>
                    </div>
                    {c.industry && <CatBadge cat={c.industry} />}
                  </div>
                ))
            }
          </div>

          {/* Détail */}
          {sel
            ? <ContactDetail key={sel.id} contact={sel} user={user} onDelete={() => deleteContact(sel)} />
            : <div className="card card-pad" style={{ textAlign:'center', color:'var(--tx-4)', fontSize:13, padding:'48px 24px' }}>Sélectionne un contact</div>
          }
        </div>
      )}

      {addOpen && <NewClientModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
