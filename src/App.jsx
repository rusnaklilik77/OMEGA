import {useEffect,useMemo,useRef,useState} from 'react';
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'firebase/auth';
import {collection,onSnapshot,addDoc,updateDoc,deleteDoc,doc,arrayUnion,query,orderBy} from 'firebase/firestore';
import {auth,db} from './firebase';import {T} from './i18n';

const ls={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const AUTH_ERR={ru:{'auth/invalid-credential':'Неверный email или пароль','auth/invalid-email':'Некорректный email','auth/email-already-in-use':'Этот email уже зарегистрирован','auth/weak-password':'Пароль слишком короткий (мин. 6 символов)','auth/network-request-failed':'Нет соединения с интернетом','auth/too-many-requests':'Слишком много попыток, попробуй позже','auth/operation-not-allowed':'Вход по Email/Password не включён в Firebase','auth/unauthorized-domain':'Домен не добавлен в Firebase → Authentication → Authorized domains'},
ro:{'auth/invalid-credential':'Email sau parolă incorecte','auth/invalid-email':'Email invalid','auth/email-already-in-use':'Acest email este deja înregistrat','auth/weak-password':'Parola e prea scurtă (min. 6 caractere)','auth/network-request-failed':'Fără conexiune la internet','auth/too-many-requests':'Prea multe încercări, încearcă mai târziu','auth/operation-not-allowed':'Email/Password nu este activat în Firebase','auth/unauthorized-domain':'Domeniul nu e adăugat în Firebase → Authentication → Authorized domains'},
en:{'auth/invalid-credential':'Wrong email or password','auth/invalid-email':'Invalid email','auth/email-already-in-use':'This email is already registered','auth/weak-password':'Password is too short (min. 6 characters)','auth/network-request-failed':'No internet connection','auth/too-many-requests':'Too many attempts, try again later','auth/operation-not-allowed':'Email/Password sign-in is not enabled in Firebase','auth/unauthorized-domain':'Domain is not added in Firebase → Authentication → Authorized domains'}};
const norm=s=>s.toLowerCase().replace(/[.,;:]/g,' ').replace(/\s+/g,' ').trim();
const same=(a,b)=>norm(a.name)===norm(b.name)&&norm(a.address)===norm(b.address);

function Splash({done}){
  useEffect(()=>{const t=setTimeout(done,3600);return()=>clearTimeout(t)},[]);
  return <div className="splash"><div className="logo-wrap">
    <img className="g g1" src="/logo.jpg" alt=""/><img className="g g2" src="/logo.jpg" alt=""/><img className="g main" src="/logo.jpg" alt="OMEGA"/>
  </div><div className="word">OMEGA</div></div>;
}

function Auth({t,lang}){
  const [reg,setReg]=useState(false),[email,setE]=useState(''),[pass,setP]=useState(''),[err,setErr]=useState('');
  const go=async e=>{e.preventDefault();setErr('');try{reg?await createUserWithEmailAndPassword(auth,email,pass):await signInWithEmailAndPassword(auth,email,pass)}catch(x){setErr((AUTH_ERR[lang]||{})[x.code]||x.code||x.message)}};
  return <form className="auth card" onSubmit={go}>
    <img src="/logo.jpg" className="auth-logo" alt=""/><h1>OMEGA</h1>
    <input type="email" placeholder={t.email} value={email} onChange={e=>setE(e.target.value)} required/>
    <input type="password" placeholder={t.pass} value={pass} onChange={e=>setP(e.target.value)} minLength={6} required/>
    {err&&<p className="err">{err}</p>}
    <button className="btn">{reg?t.register:t.login}</button>
    <button type="button" className="link" onClick={()=>setReg(!reg)}>{reg?t.hasacc:t.noacc}</button>
  </form>;
}

function Modal({children,onClose}){return <div className="overlay" onClick={onClose}><div className="modal card" onClick={e=>e.stopPropagation()}>{children}</div></div>}

function AddDialog({t,mode,onClose,onSubmit}){
  const [name,setN]=useState(''),[address,setA]=useState(''),[busy,setBusy]=useState(false),[hint,setH]=useState(false),[fail,setFail]=useState(false);
  const file=useRef();
  useEffect(()=>{if(mode==='scan')file.current?.click()},[]);
  const scan=async f=>{
    if(!f)return;setBusy(true);setH(true);setFail(false);
    try{
      const {default:Tesseract}=await import('tesseract.js');
      const {data}=await Tesseract.recognize(f,'rus+ron+eng');
      const lines=data.text.split('\n').map(l=>l.trim()).filter(l=>l.length>3);
      const ai=lines.findIndex(l=>/\d/.test(l)&&/(ул|str|bd|bl|st\.|street|д\.|nr|№|ap|кв|\d{4,})/i.test(l));
      const addr=ai>=0?lines.slice(ai,ai+2).join(', '):lines.slice(1,3).join(', ');
      const nm=lines.find((l,i)=>i!==ai&&/^[A-Za-zА-Яа-яĂÂÎȘȚăâîșț.\- ]{5,40}$/.test(l)&&l.split(' ').length>=2)||lines[0]||'';
      setN(nm);setA(addr);
    }catch{setFail(true)}
    setBusy(false);
  };
  const submit=e=>{e.preventDefault();if(name.trim()&&address.trim())onSubmit({name:name.trim(),address:address.trim()})};
  return <Modal onClose={onClose}><form onSubmit={submit}>
    <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={e=>scan(e.target.files[0])}/>
    {mode==='scan'&&<button type="button" className="btn ghost" onClick={()=>file.current.click()}>📷 {t.scan}</button>}
    {busy&&<p className="muted">{t.scanning}</p>}{hint&&!busy&&!fail&&<p className="muted">{t.scanHint}</p>}{fail&&!busy&&<p className="err">{t.err}</p>}
    <input placeholder={t.name} value={name} onChange={e=>setN(e.target.value)}/>
    <textarea placeholder={t.address} rows={2} value={address} onChange={e=>setA(e.target.value)}/>
    <div className="row"><button type="button" className="btn ghost" onClick={onClose}>{t.cancel}</button><button className="btn" disabled={busy}>{t.save}</button></div>
  </form></Modal>;
}

function Bars({data,max}){const m=max||Math.max(1,...data.map(d=>d.v));
  return <div className="bars">{data.map((d,i)=><div key={i} className="bar"><span className="num">{d.v||''}</span><i style={{height:`${(d.v/m)*100}%`}}/><span className="lbl">{d.l}</span></div>)}</div>}

function Stats({t,people,lang}){
  const all=people.flatMap(p=>p.incidents||[]);const now=new Date();
  const days=[...Array(14)].map((_,i)=>{const d=new Date(now);d.setDate(d.getDate()-13+i);d.setHours(0,0,0,0);const e=d.getTime()+864e5;return{l:d.getDate(),v:all.filter(x=>x>=d.getTime()&&x<e).length}});
  const months=[...Array(6)].map((_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1),e=new Date(d.getFullYear(),d.getMonth()+1,1);return{l:d.toLocaleDateString(lang,{month:'short'}),v:all.filter(x=>x>=d.getTime()&&x<e.getTime()).length}});
  const thisM=months[5].v;const top=[...people].sort((a,b)=>(b.incidents?.length||0)-(a.incidents?.length||0)).slice(0,5);
  return <div className="page"><div className="kpis"><div className="card"><b>{people.length}</b><span>{t.total}</span></div><div className="card"><b className="red">{thisM}</b><span>{t.month}</span></div></div>
    <div className="card"><h3>{t.perDay}</h3><Bars data={days}/></div>
    <div className="card"><h3>{t.perMonth}</h3><Bars data={months}/></div>
    <div className="card"><h3>{t.top}</h3>{top.map(p=><div key={p.id} className="top"><div><div className="w">{p.name}</div><div className="w sub">{p.address}</div></div><b className="red">{p.incidents?.length||1}</b></div>)}</div></div>;
}

export default function App(){
  const [splash,setSplash]=useState(true),[user,setUser]=useState(undefined),[people,setPeople]=useState([]);
  const [lang,setLang]=useState(()=>{const l=ls.get('lang');return T[l]?l:'ru'}),[theme,setTheme]=useState(()=>ls.get('theme')==='light'?'light':'dark');
  const [open,setOpen]=useState(false),[view,setView]=useState('addresses'),[dlg,setDlg]=useState(null),[alertP,setAlert]=useState(null),[toast,setToast]=useState(''),[q,setQ]=useState('');
  const t=T[lang];
  useEffect(()=>{document.documentElement.dataset.theme=theme;ls.set('theme',theme)},[theme]);
  useEffect(()=>{ls.set('lang',lang);document.documentElement.lang=lang},[lang]);
  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{if(!user){setPeople([]);return}
    return onSnapshot(query(collection(db,'users',user.uid,'people'),orderBy('created','desc')),s=>setPeople(s.docs.map(d=>({id:d.id,...d.data()}))),e=>{setToast(T[lang].err+': '+(e.code||e.message))})},[user]);
  const submit=async v=>{
    setDlg(null);const hit=people.find(p=>same(p,v));const now=Date.now();
    try{
      if(hit){await updateDoc(doc(db,'users',user.uid,'people',hit.id),{incidents:arrayUnion(now)});setAlert(hit)}
      else{await addDoc(collection(db,'users',user.uid,'people'),{...v,created:now,incidents:[now]});setToast(t.added)}
    }catch(e){setToast(t.err+': '+e.code)}
  };
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(id)},[toast]);
  const shown=useMemo(()=>people.filter(p=>norm(p.name+' '+p.address).includes(norm(q))),[people,q]);
  const fmt=ms=>new Date(ms).toLocaleString(lang,{dateStyle:'short',timeStyle:'short'});
  if(splash)return <Splash done={()=>setSplash(false)}/>;
  if(user===undefined)return <div className="splash"/>;
  if(!user)return <div className="center"><Auth t={t} lang={lang}/></div>;
  const nav=(v)=>{setView(v);setOpen(false)};
  return <div className="app">
    <header><button className="burger" aria-label={t.menu} onClick={()=>setOpen(true)}><i/><i/><i/></button><h2>OMEGA</h2></header>
    {open&&<div className="overlay left" onClick={()=>setOpen(false)}><nav className="drawer" onClick={e=>e.stopPropagation()}>
      <div className="brand"><img src="/logo.jpg" alt=""/><span>OMEGA</span></div>
      <button className={view==='addresses'?'on':''} onClick={()=>nav('addresses')}>📍 {t.addresses}</button>
      <button className={view==='stats'?'on':''} onClick={()=>nav('stats')}>📊 {t.stats}</button>
      <div className="grp"><span>{t.lang}</span><div className="seg">{['ru','ro','en'].map(l=><button key={l} className={lang===l?'on':''} onClick={()=>setLang(l)}>{l.toUpperCase()}</button>)}</div></div>
      <div className="grp"><span>{t.theme}</span><div className="seg theme"><button className={theme==='light'?'on':''} aria-label="light" onClick={()=>setTheme('light')}>☀️</button><button className={theme==='dark'?'on':''} aria-label="dark" onClick={()=>setTheme('dark')}>🌙</button></div></div>
      <button className="out" onClick={()=>signOut(auth)}>⎋ {t.logout}</button>
    </nav></div>}
    <main>
      {view==='stats'?<Stats t={t} people={people} lang={lang}/>:
      <div className="page">
        <div className="addrow"><button className="btn big" onClick={()=>setDlg('manual')}>＋ {t.add} · ✍️ {t.manual}</button>
          <button className="btn big ghost logo-btn" onClick={()=>setDlg('scan')}>＋ {t.add} · <img src="/logo.jpg" alt=""/> 📷 {t.scan}</button></div>
        <input className="search" placeholder={t.search} value={q} onChange={e=>setQ(e.target.value)}/>
        {!shown.length&&<p className="muted c">{t.empty}</p>}
        {shown.map(p=><div className="card person" key={p.id}>
          <div><div className="w name">{p.name}</div><div className="w addr">{p.address}</div>
            <div className="w sub">{t.date}: {fmt(p.created)}</div></div>
          <div className="side"><b className="red">{p.incidents?.length||1}</b><small>{t.times}</small>
            <button className="x" aria-label={t.del} onClick={()=>{if(window.confirm(t.del+'? '+p.name))deleteDoc(doc(db,'users',user.uid,'people',p.id)).catch(e=>setToast(t.err+': '+e.code))}}>✕</button></div></div>)}
      </div>}
    </main>
    {dlg&&<AddDialog t={t} mode={dlg} onClose={()=>setDlg(null)} onSubmit={submit}/>}
    {alertP&&<Modal onClose={()=>setAlert(null)}><div className="alertbox"><img src="/alert.png" alt="!"/><h2>{t.match}</h2>
      <p className="w name">{alertP.name}</p><p className="w addr">{alertP.address}</p>
      <p className="muted">{(alertP.incidents?.length||0)+1} {t.times} · {fmt(Date.now())}</p>
      <button className="btn" onClick={()=>setAlert(null)}>{t.ok}</button></div></Modal>}
    {toast&&<div className="toast">{toast}</div>}
  </div>;
}
