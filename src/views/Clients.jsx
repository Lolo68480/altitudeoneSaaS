import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT } from '../contexts/LangContext';
import { PageHead } from '../components/Shared';
import { NewClientModal } from '../components/Modals';
import { fmtEUR } from '../lib/data';

const NOTE_TYPES = [
  { id: 'note',    label: 'Note',     icon: 'edit',     color: '--acc' },
  { id: 'call',    label: 'Appel',    icon: 'phone',    color: '--green' },
  { id: 'email',   label: 'Email',    icon: 'mail',     color: '--violet' },
  { id: 'meeting', label: 'Réunion',  icon: 'users',    color: '--amber' },
];

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          <h3 style={{ fontSize:15 }}>Nouveau message</h3>
          <div className="right"><button className="icon-btn" onClick={onClose} type="button"><I.x size={16} /></button></div>
        </div>
        {done ? (
          <div className="card-pad" style={{ textAlign:'center', padding:'32px 24px' }}>
            <div style={{ color:'var(--green)', fontSize:15, fontWeight:600, marginBottom:8 }}>Email envoyé ✓</div>
            <button className="btn primary" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <form onSubmit={send}>
            <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {err && <div style={{ background:'rgba(251,113,133,.12)', color:'var(--red)', border:'1px solid rgba(251,113,133,.4)', borderRadius:8, padding:'10px 14px', fontSize:12.5 }}>{err}</div>}
              {accounts.length > 1 && (
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>De</label>
                  <select className="set-input" value={fromIdx} onChange={e => setFromIdx(+e.target.value)}>
                    {accounts.map((a, i) => <option key={i} value={i}>{a.email}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>À</label>
                <input className="set-input" value={to} readOnly style={{ opacity:.7 }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>Objet</label>
                <input className="set-input" value={subject} onChange={e => setSubject(e.target.value)} autoFocus required />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--tx-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>Message</label>
                <textarea className="set-input" value={body} onChange={e => setBody(e.target.value)} rows={6} style={{ resize:'vertical' }} required />
              </div>
              <div className="row gap8" style={{ marginTop:4 }}>
                <span className="spacer" />
                <button type="button" className="btn" onClick={onClose}>Annuler</button>
                <button type="submit" className="btn primary" disabled={sending}><I.send size={14} /> {sending ? 'Envoi…' : 'Envoyer'}</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Clients() {
  const { clients: ctxClients, user, refetch } = useAppData();
  const t = useT();
  const list = ctxClients || [];
  const [sel, setSel] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('note');
  const [savingNote, setSavingNote] = useState(false);
  const [compose, setCompose] = useState(null);

  useEffect(() => {
    if (!sel && list.length) setSel(list[0]);
    else if (sel) {
      const fresh = list.find(c => c.id === sel.id);
      if (!fresh) setSel(list[0] || null);
      else setSel(fresh);
    }
  }, [ctxClients]);

  const fetchNotes = useCallback(async (clientId) => {
    if (!clientId) return;
    const { data } = await db.from('contact_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    setNotes(data || []);
  }, []);

  useEffect(() => {
    if (sel?.id) fetchNotes(sel.id);
    else setNotes([]);
  }, [sel?.id]);

  const selectClient = (c) => { setSel(c); setNotes([]); };

  const deleteClient = async (c) => {
    if (!confirm(t('delete_confirm') + ' "' + c.company + '" ?')) return;
    await db.from('clients').delete().eq('id', c.id);
    await refetch();
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !sel) return;
    setSavingNote(true);
    await db.from('contact_notes').insert({ user_id: user.id, client_id: sel.id, type: noteType, content: noteText.trim() });
    setNoteText('');
    await fetchNotes(sel.id);
    setSavingNote(false);
  };

  const deleteNote = async (noteId) => {
    await db.from('contact_notes').delete().eq('id', noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const accounts = JSON.parse(localStorage.getItem('ao_email_accounts') || '[]');
  const totalMrr = list.reduce((s, c) => s + (c.mrr || 0), 0);
  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (!list.length) return (
    <div className="view">
      <PageHead title={t('nav_clients')} sub="0 contact · —">
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('cli_new')}</button>
      </PageHead>
      <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--tx-4)', fontSize:13 }}>Aucun contact pour l'instant.</div>
      {addOpen && <NewClientModal onClose={() => setAddOpen(false)} />}
    </div>
  );

  if (!sel) return null;

  const webHref = sel.website ? (sel.website.startsWith('http') ? sel.website : 'https://' + sel.website) : null;

  return (
    <div className="view">
      <PageHead title={t('nav_clients')} sub={`${list.length} contact${list.length > 1 ? 's' : ''} · ${fmtEUR(totalMrr)}/mo MRR`}>
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><I.plus size={14} /> {t('cli_new')}</button>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start', gap: 16 }}>

        {/* Liste */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div className="card-head"><h3>Contacts ({list.length})</h3></div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {list.map(c => (
              <div key={c.id} onClick={() => selectClient(c)} className="row gap10"
                style={{ padding:'12px 14px', borderBottom:'1px solid var(--line)', cursor:'pointer', background: sel.id === c.id ? 'var(--acc-soft)' : 'transparent', borderLeft: sel.id === c.id ? '2px solid var(--acc)' : '2px solid transparent' }}>
                <div className="kpi-ico" style={{ width:34, height:34, borderRadius:10, background:'var(--panel-3)', color:'var(--tx)', fontWeight:700, fontSize:13, flex:'none' }}>{c.company[0]}</div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{c.company}</div>
                  <div className="muted" style={{ fontSize:11.5 }}>{c.contact || '—'}</div>
                </div>
                <button className="icon-btn contact-del-btn"
                  style={{ width:24, height:24, color:'var(--tx-4)', flexShrink:0 }}
                  onClick={e => { e.stopPropagation(); deleteClient(c); }}>
                  <I.trash size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Détail */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Header contact */}
          <div className="card">
            <div className="card-pad" style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <div className="kpi-ico" style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(140deg,var(--acc-2),var(--acc))', color:'#fff', fontWeight:700, fontSize:22, flex:'none' }}>{sel.company[0]}</div>
              <div style={{ flex:1 }}>
                <h2 style={{ margin:'0 0 2px', fontSize:19, fontWeight:680, letterSpacing:'-0.02em' }}>{sel.company}</h2>
                <div className="muted" style={{ fontSize:13 }}>{sel.contact && `${sel.contact} · `}{sel.industry && `${sel.industry} · `}Client depuis {sel.since || '—'}</div>
                <div className="row gap8" style={{ marginTop:12, flexWrap:'wrap' }}>
                  {sel.email ? (
                    accounts.length > 0
                      ? <button className="btn sm" onClick={() => setCompose(sel.email)}><I.mail size={14} /> {sel.email}</button>
                      : <a href={'mailto:' + sel.email} className="btn sm" style={{ textDecoration:'none' }}><I.mail size={14} /> {sel.email}</a>
                  ) : (
                    <button className="btn sm" disabled style={{ opacity:.4 }}><I.mail size={14} /> Pas d'email</button>
                  )}
                  {sel.phone ? (
                    <a href={'tel:' + sel.phone} className="btn sm" style={{ textDecoration:'none' }}><I.phone size={14} /> {sel.phone}</a>
                  ) : (
                    <button className="btn sm" disabled style={{ opacity:.4 }}><I.phone size={14} /> Pas de tél.</button>
                  )}
                  {webHref && <a href={webHref} target="_blank" rel="noopener" className="btn sm" style={{ textDecoration:'none' }}><I.globe size={14} /> Site web</a>}
                </div>
              </div>
            </div>
            {/* Stats */}
            <div className="row" style={{ borderTop:'1px solid var(--line)' }}>
              {[
                ['MRR', fmtEUR(sel.mrr || 0), '--green'],
                ['Valeur totale', fmtEUR(sel.value || 0, true), '--acc'],
                ['Projets actifs', sel.projects || 0, '--violet'],
              ].map(([k, v, c], i) => (
                <div key={i} style={{ flex:1, padding:'14px 18px', borderRight: i < 2 ? '1px solid var(--line)' : 'none' }}>
                  <div className="muted" style={{ fontSize:11.5 }}>{k}</div>
                  <div className="num" style={{ fontSize:19, fontWeight:680, marginTop:3, color:`var(${c})` }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes / Suivi */}
          <div className="card">
            <div className="card-head"><h3>Suivi de communication</h3></div>
            <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Formulaire ajout note */}
              <form onSubmit={addNote} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div className="row gap8">
                  {NOTE_TYPES.map(nt => {
                    const Ic = I[nt.icon];
                    return (
                      <button key={nt.id} type="button" onClick={() => setNoteType(nt.id)}
                        className="btn sm"
                        style={{ background: noteType === nt.id ? `var(${nt.color})` : 'var(--panel-2)', color: noteType === nt.id ? '#fff' : 'var(--tx-3)', border: 'none', gap:5 }}>
                        <Ic size={12} /> {nt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="row gap8">
                  <textarea className="set-input" value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Ajouter une note, résumer un appel, un email…"
                    rows={2} style={{ flex:1, resize:'none' }} required />
                  <button type="submit" className="btn primary" disabled={savingNote || !noteText.trim()} style={{ alignSelf:'flex-end', height:36 }}>
                    {savingNote ? '…' : <><I.plus size={14} /> Ajouter</>}
                  </button>
                </div>
              </form>

              {/* Liste des notes */}
              {notes.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--tx-4)', fontSize:13 }}>Aucune note pour ce contact.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {notes.map((n, i) => {
                    const nt = NOTE_TYPES.find(x => x.id === n.type) || NOTE_TYPES[0];
                    const Ic = I[nt.icon];
                    return (
                      <div key={n.id} className="row gap12"
                        style={{ padding:'12px 0', borderBottom: i < notes.length - 1 ? '1px solid var(--line)' : 'none', alignItems:'flex-start' }}>
                        <div style={{ width:30, height:30, borderRadius:8, background:`color-mix(in srgb, var(${nt.color}) 15%, transparent)`, color:`var(${nt.color})`, display:'grid', placeItems:'center', flex:'none' }}>
                          <Ic size={13} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="row gap8" style={{ marginBottom:3 }}>
                            <span style={{ fontSize:11.5, fontWeight:600, color:`var(${nt.color})`, textTransform:'uppercase', letterSpacing:'.04em' }}>{nt.label}</span>
                            <span className="muted" style={{ fontSize:11 }}>{fmtDate(n.created_at)}</span>
                          </div>
                          <div style={{ fontSize:13.5, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{n.content}</div>
                        </div>
                        <button className="icon-btn" style={{ width:24, height:24, color:'var(--tx-4)', flexShrink:0 }}
                          onClick={() => deleteNote(n.id)}>
                          <I.trash size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {addOpen && <NewClientModal onClose={() => setAddOpen(false)} />}
      {compose && <QuickCompose to={compose} onClose={() => setCompose(null)} />}
    </div>
  );
}
