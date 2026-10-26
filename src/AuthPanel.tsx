import {useEffect,useRef,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {getAuthClient} from './auth';
export function AuthPanel(){
 const [client]=useState(()=>getAuthClient());const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(!!client);const [busy,setBusy]=useState(false);const guard=useRef(false);
 const [email,setEmail]=useState(''),[token,setToken]=useState(''),[sent,setSent]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{if(!client)return;let alive=true;const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{if(alive){setUser(session?.user??null);setLoading(false);}});
 void client.auth.getSession().then(({data,error})=>{if(alive){if(error)setError('로그인 상태를 읽지 못했습니다. 다시 시도하세요.');setUser(data.session?.user??null);setLoading(false);}}).catch(()=>{if(alive){setLoading(false);setError('인증 서버에 연결하지 못했습니다.');}});
 return()=>{alive=false;subscription.unsubscribe();};},[client]);
 async function run(action:'send'|'verify'|'logout'){
 if(!client||guard.current)return;guard.current=true;setBusy(true);setError('');setNotice('');
 try{
 if(action==='send'){const result=await client.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}});if(result.error)throw result.error;setSent(true);setNotice('초대된 이메일이라면 로그인 링크가 발송됩니다. 메일에서 링크를 열어주세요. 코드가 표시된 메일은 아래에서도 확인할 수 있습니다.');}
 if(action==='verify'){const result=await client.auth.verifyOtp({email:email.trim(),token:token.trim(),type:'email'});if(result.error||!result.data.session)throw Error();setUser(result.data.user);setToken('');setNotice('로그인되었습니다. 로컬 계좌는 서버와 동기화되지 않습니다.');}
 if(action==='logout'){const result=await client.auth.signOut({scope:'local'});if(result.error)throw result.error;setUser(null);setToken('');setSent(false);setNotice('이 브라우저에서 로그아웃했습니다. 로컬 데모 계좌는 유지됩니다.');}
 }catch{setError(action==='verify'?'코드를 확인하지 못했습니다. 만료 여부와 코드를 확인하고 다시 시도하세요.':'인증 요청을 완료하지 못했습니다. 연결 상태와 Supabase 설정을 확인하세요.');}finally{guard.current=false;setBusy(false);}}
 return <section className="panel auth-panel"><h2>로그인 및 연결</h2><p>계좌 모드: 개인 로컬 데모 · 서버 계좌 저장 연동예정</p>{!client?<p data-testid="auth-unconfigured">Supabase 미연결 — 로그인 설정이 준비되지 않았습니다. 로컬 가상매매는 계속 이용할 수 있습니다.</p>:loading?<p role="status">로그인 상태 확인 중…</p>:user?<><p>로그인: {user.email??'초대 사용자'}</p><button onClick={()=>void run('logout')} disabled={busy}>{busy?'처리 중…':'로그아웃'}</button></>:<form onSubmit={e=>{e.preventDefault();void run(sent?'verify':'send');}}><div className="trade-form"><label>초대된 이메일<input type="email" autoComplete="email" required value={email} disabled={busy||sent} onChange={e=>setEmail(e.target.value)}/></label>{sent&&<label>이메일 인증 코드 (메일에 코드가 있는 경우)<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required value={token} disabled={busy} onChange={e=>setToken(e.target.value)}/></label>}<button disabled={busy} type="submit">{busy?'처리 중…':sent?'코드 확인':'로그인 링크 받기'}</button>{sent&&<button type="button" disabled={busy} onClick={()=>{setSent(false);setToken('');setError('');setNotice('');}}>이메일 변경·다시 요청</button>}</div><small>초대 사용자만 이용합니다. 기본 메일의 로그인 링크를 열면 앱으로 돌아옵니다. 신규 가입은 제공하지 않습니다.</small></form>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}<small>로그인은 로컬 계좌의 소유권이나 기기 간 동기화를 제공하지 않습니다. 공용 기기에서는 로컬 계좌를 초기화하세요.</small></section>;
}
