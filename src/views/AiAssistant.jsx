import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useAppData } from '../contexts/AppDataContext';
import { useT, useLang } from '../contexts/LangContext';
import { PageHead } from '../components/Shared';

export function AiAssistant() {
  const t = useT();
  const { lang } = useLang();
  const { user, refetch, clients = [], deals = [], tasks = [], prospects = [] } = useAppData();
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem('ao_ai_key') || '');
  const [keyInput, setKeyInput] = useState('');
  const saveKey = () => { const k = keyInput.trim(); if (!k) return; localStorage.setItem('ao_ai_key', k); setApiKeyState(k); };
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const apiHistoryRef = useRef([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, loading]);

  const TOOLS = [
    { type:'function', function: { name:'add_client', description:'Add a new client to the business database',
      parameters: { type:'object', properties: {
        company:  { type:'string' }, contact: { type:'string' }, email: { type:'string' },
        phone:    { type:'string' }, industry: { type:'string' }, mrr: { type:'number' },
      }, required:['company'] }
    }},
    { type:'function', function: { name:'add_deal', description:'Create a new deal in the CRM pipeline',
      parameters: { type:'object', properties: {
        company: { type:'string' }, contact: { type:'string' }, email: { type:'string' },
        phone: { type:'string' }, value: { type:'number' },
        stage: { type:'string', enum:['New Lead','Qualified','Proposal Sent','Negotiation','Won','Lost'] },
        industry: { type:'string' },
      }, required:['company'] }
    }},
    { type:'function', function: { name:'add_task', description:'Create a new task',
      parameters: { type:'object', properties: {
        title: { type:'string' }, client: { type:'string' },
        prio: { type:'string', enum:['High','Medium','Low'] },
        due_group: { type:'string', enum:['Today','Tomorrow','This week'] },
      }, required:['title'] }
    }},
    { type:'function', function: { name:'add_prospect', description:'Add a new prospect',
      parameters: { type:'object', properties: {
        company: { type:'string' }, website: { type:'string' }, email: { type:'string' },
        phone: { type:'string' }, city: { type:'string' }, industry: { type:'string' }, linkedin: { type:'string' },
      }, required:['company'] }
    }},
    { type:'function', function: { name:'search_web', description:'Search the web for company info, phone numbers, contacts',
      parameters: { type:'object', properties: { query: { type:'string' } }, required:['query'] }
    }},
    { type:'function', function: { name:'get_data', description:'Get current business data',
      parameters: { type:'object', properties: { type: { type:'string', enum:['clients','deals','tasks','prospects','all'] } }, required:['type'] }
    }},
  ];

  const executeTool = async (name, inp) => {
    if (name === 'add_client') {
      const { error } = await db.from('clients').insert({ user_id:user.id, company:inp.company, contact:inp.contact||null, email:inp.email||null, phone:inp.phone||null, industry:inp.industry||null, mrr:inp.mrr||0, health:'good', since:String(new Date().getFullYear()), projects:0, value:0 });
      if (!error) await refetch();
      return error ? `Error: ${error.message}` : `✅ Client "${inp.company}" added.`;
    }
    if (name === 'add_deal') {
      const { error } = await db.from('deals').insert({ user_id:user.id, company:inp.company, contact:inp.contact||null, email:inp.email||null, phone:inp.phone||null, value:inp.value||0, stage:inp.stage||'New Lead', industry:inp.industry||null, last_touch:0, prob:10 });
      if (!error) await refetch();
      return error ? `Error: ${error.message}` : `✅ Deal for "${inp.company}" (€${inp.value||0}) created.`;
    }
    if (name === 'add_task') {
      const { error } = await db.from('tasks').insert({ user_id:user.id, title:inp.title, client:inp.client||null, prio:inp.prio||'Medium', due_group:inp.due_group||'Today', done:false });
      if (!error) await refetch();
      return error ? `Error: ${error.message}` : `✅ Task "${inp.title}" created.`;
    }
    if (name === 'add_prospect') {
      const { error } = await db.from('prospects').insert({ user_id:user.id, company:inp.company, website:inp.website||null, email:inp.email||null, phone:inp.phone||null, city:inp.city||null, industry:inp.industry||null, linkedin:inp.linkedin||null, stage:'Queued' });
      if (!error) await refetch();
      return error ? `Error: ${error.message}` : `✅ Prospect "${inp.company}" added.`;
    }
    if (name === 'search_web') {
      const searchKey = localStorage.getItem('ao_search_key') || '';
      if (!searchKey) return 'Recherche web non configurée. Ajoute une clé Tavily dans Paramètres → Intégrations.';
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method:'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ api_key: searchKey, query: inp.query, search_depth:'basic', max_results:5 })
        });
        const data = await res.json();
        if (!res.ok) return `Erreur Tavily: ${data.message || res.status}`;
        const results = data.results || [];
        if (!results.length) return 'Aucun résultat trouvé.';
        return results.map(r => `**${r.title}**\n${r.content?.slice(0,300)}\nSource: ${r.url}`).join('\n\n---\n\n');
      } catch(e) {
        return `Erreur recherche: ${e.message}`;
      }
    }
    if (name === 'get_data') {
      if (inp.type==='clients') return JSON.stringify({ count:clients.length, data:clients.slice(0,20) });
      if (inp.type==='deals') return JSON.stringify({ count:deals.length, data:deals.slice(0,20) });
      if (inp.type==='tasks') return JSON.stringify({ count:tasks.length, data:tasks.slice(0,20) });
      if (inp.type==='prospects') return JSON.stringify({ count:prospects.length, data:prospects.slice(0,20) });
      return JSON.stringify({ clients:clients.length, deals:deals.length, tasks:tasks.length, prospects:prospects.length });
    }
    return `Unknown tool: ${name}`;
  };

  const groqCall = async (systemPrompt) => {
    const searchKey = localStorage.getItem('ao_search_key') || '';
    const activeTOOLS = searchKey ? TOOLS : TOOLS.filter(t => t.function.name !== 'search_web');
    for (let attempt = 0; attempt < 3; attempt++) {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model:'llama-3.1-8b-instant', max_tokens:1024, messages:[{ role:'system', content:systemPrompt }, ...apiHistoryRef.current], tools:activeTOOLS, tool_choice:'auto' })
      });
      if (resp.status === 429) {
        const retryAfter = parseInt(resp.headers.get('retry-after') || '8', 10);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error?.message || `API error ${resp.status}`); }
      return resp.json();
    }
    throw new Error('Rate limit reached. Attends quelques secondes et réessaie.');
  };

  const send = async (text) => {
    const tx = (text || input).trim();
    if (!tx || loading) return;
    setInput('');
    if (!apiKey) {
      setMsgs(m => [...m, { role:'user', text:tx }, { role:'ai', text: t('ai_no_key'), isError:true }]);
      return;
    }
    setMsgs(m => [...m, { role:'user', text:tx }]);
    apiHistoryRef.current.push({ role:'user', content:tx });
    setLoading(true);
    const systemPrompt = `You are a business assistant for Altitude One OS. User: ${user?.user_metadata?.full_name || user?.email}. Data: ${clients.length} clients, ${deals.length} deals, ${tasks.length} tasks. Use tools to add data or search. Be concise. Respond in ${lang === 'fr' ? 'French' : 'English'}.`;
    try {
      let loop = true;
      while (loop) {
        const data = await groqCall(systemPrompt);
        const choice = data.choices[0];
        const msg = choice.message;
        if (choice.finish_reason === 'tool_calls' && msg.tool_calls?.length) {
          apiHistoryRef.current.push({ role:'assistant', content: msg.content || null, tool_calls: msg.tool_calls });
          if (msg.content) setMsgs(m => [...m, { role:'ai', text: msg.content, isThinking:true }]);
          for (const tc of msg.tool_calls) {
            const toolName = tc.function.name;
            const toolInput = JSON.parse(tc.function.arguments);
            setMsgs(m => [...m, { role:'tool', isTool:true, text:toolName, toolId:tc.id, status:'running' }]);
            const result = await executeTool(toolName, toolInput);
            setMsgs(m => m.map(x => x.toolId===tc.id ? { ...x, status:'done', toolResult:result } : x));
            apiHistoryRef.current.push({ role:'tool', tool_call_id: tc.id, content: result });
          }
        } else {
          const finalText = msg.content || '';
          apiHistoryRef.current.push({ role:'assistant', content: finalText });
          setMsgs(m => [...m, { role:'ai', text:'' }]);
          let i = 0;
          await new Promise(resolve => {
            const timer = setInterval(() => {
              i += 6;
              setMsgs(m => { const c=[...m]; c[c.length-1]={...c[c.length-1], text:finalText.slice(0,i)}; return c; });
              if (i >= finalText.length) { setMsgs(m => { const c=[...m]; c[c.length-1]={...c[c.length-1], text:finalText}; return c; }); clearInterval(timer); resolve(); }
            }, 11);
          });
          loop = false;
        }
      }
    } catch (err) {
      setMsgs(m => [...m, { role:'ai', text:`❌ ${err.message}`, isError:true }]);
    }
    setLoading(false);
  };

  const clearChat = () => { setMsgs([]); apiHistoryRef.current = []; };

  const renderText = (txt) => {
    if (!txt) return null;
    return txt.split('\n').map((line, i) => {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code style="background:var(--panel-3);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12.5px">$1</code>');
      return <div key={i} style={{ minHeight: line ? 'auto' : 8 }} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />;
    });
  };

  const toolLabel = (name) => {
    const L = { add_client:t('ai_tool_client'), add_deal:t('ai_tool_deal'), add_task:t('ai_tool_task'), add_prospect:t('ai_tool_prospect'), search_web:t('ai_tool_search'), get_data:t('ai_tool_data') };
    return L[name] || name;
  };

  const prompts = [t('ai_p1'), t('ai_p2'), t('ai_p3'), t('ai_p4')];
  const promptIcons = ['mail','doc','target','spark'];

  return (
    <div className="view" style={{ display:'flex', flexDirection:'column', height:'100%', maxWidth:860, margin:'0 auto' }}>
      {!apiKey && (
        <div style={{ display:'grid', placeItems:'center', flex:1, padding:'20px 0' }}>
          <div style={{ textAlign:'center', maxWidth:500, width:'100%' }}>
            <div className="kpi-ico" style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(140deg,var(--acc-2),var(--acc))', color:'#fff', margin:'0 auto 18px', boxShadow:'0 8px 30px rgba(47,107,255,.25)' }}><I.spark size={28} /></div>
            <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:680 }}>{t('ai_setup_title')}</h2>
            <p className="muted" style={{ fontSize:13.5, marginBottom:28, lineHeight:1.6 }}>{t('ai_setup_desc')}</p>
            <div className="card card-pad" style={{ textAlign:'left', marginBottom:16 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                {[t('ai_setup_step1'), t('ai_setup_step2'), t('ai_setup_step3')].map((step, i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ width:22, height:22, borderRadius:7, background:'var(--acc-soft)', color:'var(--acc-2)', display:'grid', placeItems:'center', fontSize:12, fontWeight:700, flex:'none' }}>{i+1}</div>
                    <span style={{ fontSize:13, color:'var(--tx-2)', lineHeight:1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input className="set-input" type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
                  placeholder="gsk_…" style={{ flex:1, fontFamily: keyInput ? 'monospace' : 'inherit' }}
                  onKeyDown={e => { if (e.key==='Enter') saveKey(); }} />
                <button className="btn primary" onClick={saveKey} disabled={!keyInput.trim()} style={{ minWidth:100 }}>{t('ai_activate')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {apiKey && <div style={{ flex:1, overflowY:'auto', paddingTop:8 }} ref={scrollRef}>
        {msgs.length === 0 ? (
          <div style={{ display:'grid', placeItems:'center', height:'100%', minHeight:380 }}>
            <div style={{ textAlign:'center', maxWidth:480 }}>
              <div className="kpi-ico" style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(140deg,var(--acc-2),var(--acc))', color:'#fff', margin:'0 auto 18px' }}><I.spark size={28} /></div>
              <h2 style={{ margin:0, fontSize:22, fontWeight:680 }}>{t('ai_title')}</h2>
              <p className="muted" style={{ fontSize:13.5, marginTop:8, marginBottom:26 }}>{t('ai_sub')}</p>
              <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {prompts.map((p, i) => { const Ic = I[promptIcons[i]]; return (
                  <button key={p} className="card card-pad" onClick={() => send(p)}
                    style={{ display:'flex', alignItems:'center', gap:11, cursor:'pointer', textAlign:'left', background:'var(--panel)' }}>
                    <div className="kpi-ico" style={{ width:32, height:32, background:'var(--acc-soft)', color:'var(--acc-2)' }}><Ic size={16} /></div>
                    <span style={{ fontSize:13, fontWeight:500 }}>{p}</span>
                  </button>
                ); })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14, padding:'8px 4px' }}>
            {msgs.map((m, i) => {
              if (m.isTool) return (
                <div key={i} style={{ display:'flex', paddingLeft:42 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 13px', background:'var(--panel-2)', border:'1px solid var(--line)', borderRadius:20, fontSize:12.5, color:'var(--tx-3)', maxWidth:'85%' }}>
                    {m.status==='running'
                      ? <span style={{ width:7, height:7, borderRadius:50, background:'var(--acc)', animation:'blink 1s steps(1) infinite', flex:'none' }} />
                      : <I.check2 size={13} style={{ color:'var(--green)', flex:'none' }} />}
                    <strong style={{ color:'var(--tx-2)' }}>{toolLabel(m.text)}</strong>
                    {m.status==='done' && m.toolResult && <span style={{ color:'var(--tx-4)', fontSize:11.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{m.toolResult.slice(0,80)}</span>}
                  </div>
                </div>
              );
              return (
                <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', flexDirection: m.role==='user' ? 'row-reverse' : 'row' }}>
                  {m.role==='ai'
                    ? <div className="kpi-ico" style={{ width:30, height:30, background:'linear-gradient(140deg,var(--acc-2),var(--acc))', color:'#fff', flex:'none' }}><I.spark size={15} /></div>
                    : <div style={{ width:30, height:30, borderRadius:9, background:'var(--panel-3)', display:'grid', placeItems:'center', fontWeight:700, fontSize:13, flex:'none', color:'var(--tx-2)' }}>{(user?.email||'U')[0].toUpperCase()}</div>
                  }
                  <div className="card card-pad" style={{ maxWidth:'78%', fontSize:13.5, lineHeight:1.65, background: m.role==='user' ? 'var(--acc-soft)' : m.isError ? 'rgba(239,68,68,.08)' : 'var(--panel)', borderColor: m.role==='user' ? 'var(--acc-line,var(--line))' : m.isError ? 'rgba(239,68,68,.25)' : 'var(--line)', opacity: m.isThinking ? 0.7 : 1 }}>
                    {m.text ? renderText(m.text) : (
                      <div style={{ display:'flex', gap:4 }}>
                        {[0,1,2].map(j => <span key={j} style={{ width:6, height:6, borderRadius:50, background:'var(--tx-3)', animation:`blink 1.2s ${j*0.2}s infinite` }} />)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div className="kpi-ico" style={{ width:30, height:30, background:'linear-gradient(140deg,var(--acc-2),var(--acc))', color:'#fff', flex:'none' }}><I.spark size={15} /></div>
                <div className="card card-pad" style={{ display:'flex', gap:4 }}>
                  {[0,1,2].map(j => <span key={j} style={{ width:6, height:6, borderRadius:50, background:'var(--tx-3)', animation:`blink 1.2s ${j*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>}

      {apiKey && <div className="card" style={{ padding:8, marginTop:12, display:'flex', alignItems:'flex-end', gap:8 }}>
        {msgs.length > 0 && (
          <button className="icon-btn" style={{ width:30, height:30, flex:'none', color:'var(--tx-4)' }} title={t('ai_clear')} onClick={clearChat}><I.refresh size={14} /></button>
        )}
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={t('ai_ph')} rows={1}
          style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--tx)', fontFamily:'var(--font)', fontSize:14, resize:'none', padding:'8px 6px', maxHeight:120 }} />
        <button className="btn primary" onClick={() => send()} disabled={!input.trim() || loading} style={{ opacity: (input.trim() && !loading) ? 1 : .45 }}>
          <I.send size={16} />
        </button>
      </div>}
    </div>
  );
}

export function Automation() {
  const t = useT();
  return (
    <div className="view" style={{ maxWidth: 680, margin: '0 auto' }}>
      <PageHead title={t('auto_title')} sub={t('auto_sub')} />
      <div className="card card-pad" style={{ textAlign: 'center', padding: '56px 32px' }}>
        <div className="kpi-ico" style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--acc-soft)', color: 'var(--acc-2)', margin: '0 auto 18px' }}><I.flow size={28} /></div>
        <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 680 }}>{t('auto_coming')}</h2>
        <p className="muted" style={{ fontSize: 14, maxWidth: 400, margin: '0 auto 8px', lineHeight: 1.6 }}>{t('auto_desc')}</p>
        <p className="muted" style={{ fontSize: 12.5 }}>{t('auto_dev')}</p>
      </div>
    </div>
  );
}
