
const CLOUD_APP_NAME = window.CLOUD_APP_NAME;
const SUPABASE_URL = String(window.SUPABASE_URL || '').replace(/\/+$/,'');
const SUPABASE_KEY = window.SUPABASE_PUBLISHABLE_KEY || '';
const CLOUD_SESSION_KEY = `${CLOUD_APP_NAME}_supabase_session`;
const CLOUD_LOCAL_SAFETY_KEY = `${CLOUD_APP_NAME}_pre_cloud_restore`;

function cloudConfigured(){
 return SUPABASE_URL &&
        SUPABASE_KEY &&
        !SUPABASE_URL.includes('SEU-PROJETO') &&
        !SUPABASE_KEY.includes('SUA-CHAVE');
}
function cloudSession(){
 try{return JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY)||'null')}catch{return null}
}
function saveCloudSession(session){
 localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify(session));
}
function clearCloudSession(){
 localStorage.removeItem(CLOUD_SESSION_KEY);
}
async function cloudRequest(path,options={}){
 const session=cloudSession();
 const headers={
  'apikey':SUPABASE_KEY,
  'Content-Type':'application/json',
  ...(options.headers||{})
 };
 if(session?.access_token)headers.Authorization=`Bearer ${session.access_token}`;
 let response=await fetch(`${SUPABASE_URL}${path}`,{...options,headers,cache:'no-store'});
 if(response.status===401 && session?.refresh_token && !path.includes('/auth/v1/token')){
  const refreshed=await refreshCloudSession();
  if(refreshed){
   headers.Authorization=`Bearer ${cloudSession().access_token}`;
   response=await fetch(`${SUPABASE_URL}${path}`,{...options,headers,cache:'no-store'});
  }
 }
 return response;
}
async function refreshCloudSession(){
 const session=cloudSession();
 if(!session?.refresh_token)return false;
 try{
  const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{
   method:'POST',
   headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({refresh_token:session.refresh_token})
  });
  if(!response.ok){clearCloudSession();return false}
  saveCloudSession(await response.json());
  return true;
 }catch{return false}
}
async function ensureCloudUser(){
 let session=cloudSession();
 if(!session)return null;
 if(session.expires_at && Date.now()/1000 > session.expires_at-60){
  if(!await refreshCloudSession())return null;
  session=cloudSession();
 }
 return session.user||null;
}
async function cloudSignIn(email,password){
 const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
  method:'POST',
  headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({email,password})
 });
 const data=await response.json();
 if(!response.ok)throw new Error(data.error_description||data.msg||data.message||'Não foi possível entrar.');
 saveCloudSession(data);
 return data.user;
}
async function cloudSignUp(email,password){
 const response=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{
  method:'POST',
  headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({email,password})
 });
 const data=await response.json();
 if(!response.ok)throw new Error(data.error_description||data.msg||data.message||'Não foi possível criar a conta.');
 if(data.access_token)saveCloudSession(data);
 return data;
}
async function cloudSignOut(){
 try{await cloudRequest('/auth/v1/logout',{method:'POST'})}catch{}
 clearCloudSession();
 renderCloudPanel();
}
function cloudDate(value){
 if(!value)return 'Nunca';
 return new Date(value).toLocaleString('pt-BR');
}
async function renderCloudPanel(){
 const status=byId('cloudStatus');
 const auth=byId('cloudAuth');
 const connected=byId('cloudConnected');
 if(!cloudConfigured()){
  status.innerHTML='<strong>Configuração pendente</strong><p>Preencha SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no arquivo config.js.</p>';
  auth.hidden=true;connected.hidden=true;return;
 }
 const user=await ensureCloudUser();
 if(!user){
  status.innerHTML='<strong>Não conectado</strong><p>Entre ou crie uma conta para usar a sincronização manual.</p>';
  auth.hidden=false;connected.hidden=true;return;
 }
 auth.hidden=true;connected.hidden=false;
 byId('cloudEmail').textContent=user.email||'Conta conectada';
 try{
  const response=await cloudRequest(`/rest/v1/app_backups?app_name=eq.${encodeURIComponent(CLOUD_APP_NAME)}&select=updated_at&order=updated_at.desc&limit=1`);
  const rows=response.ok?await response.json():[];
  byId('cloudLastSync').textContent=rows[0]?.updated_at?cloudDate(rows[0].updated_at):'Nenhum backup enviado';
  status.innerHTML='<strong>Conta conectada</strong><p>Os dados continuam locais. A nuvem só é alterada quando você toca em um botão abaixo.</p>';
 }catch{
  byId('cloudLastSync').textContent='Não foi possível consultar';
 }
}
async function submitCloudLogin(event){
 event.preventDefault();
 if(!cloudConfigured())return alert('Configure o arquivo config.js.');
 try{
  await cloudSignIn(byId('cloudLoginEmail').value.trim(),byId('cloudLoginPassword').value);
  byId('cloudLoginPassword').value='';
  await renderCloudPanel();
 }catch(error){alert(error.message)}
}
async function createCloudAccount(){
 if(!cloudConfigured())return alert('Configure o arquivo config.js.');
 const email=byId('cloudLoginEmail').value.trim(),password=byId('cloudLoginPassword').value;
 if(!email||password.length<6)return alert('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.');
 try{
  const data=await cloudSignUp(email,password);
  if(data.access_token){
   alert('Conta criada e conectada.');
  }else{
   alert('Conta criada. Se a confirmação de e-mail estiver habilitada no Supabase, confirme o e-mail antes de entrar.');
  }
  await renderCloudPanel();
 }catch(error){alert(error.message)}
}
async function uploadCloudData(){
 const user=await ensureCloudUser();
 if(!user)return alert('Entre na sua conta primeiro.');
 const payload=getCloudPayload();
 const counts=getCloudCounts(payload);
 if(!confirm(`Enviar os dados locais para a nuvem?\n\n${counts}\n\nO backup anterior na nuvem será atualizado.`))return;
 try{
  const response=await cloudRequest('/rest/v1/app_backups?on_conflict=user_id,app_name',{
   method:'POST',
   headers:{'Prefer':'resolution=merge-duplicates,return=representation'},
   body:JSON.stringify({user_id:user.id,app_name:CLOUD_APP_NAME,data:payload,updated_at:new Date().toISOString()})
  });
  if(!response.ok){const e=await response.text();throw new Error(e||'Erro ao enviar dados.')}
  const result=await response.json();
  const updatedAt=result?.[0]?.updated_at;
  if(updatedAt && byId('cloudLastSync')){
   byId('cloudLastSync').textContent=cloudDate(updatedAt);
  }
  alert('Dados enviados para a nuvem com sucesso.');
  if(!updatedAt){
   await renderCloudPanel();
  }
 }catch(error){alert(`Falha no envio: ${error.message}`)}
}
async function downloadCloudData(){
 const user=await ensureCloudUser();
 if(!user)return alert('Entre na sua conta primeiro.');
 try{
  const response=await cloudRequest(`/rest/v1/app_backups?app_name=eq.${encodeURIComponent(CLOUD_APP_NAME)}&select=data,updated_at&limit=1`);
  if(!response.ok)throw new Error(await response.text());
  const rows=await response.json();
  if(!rows.length)return alert('Ainda não existe backup deste aplicativo na nuvem.');
  const payload=rows[0].data;
  const counts=getCloudCounts(payload);
  if(!confirm(`Baixar os dados da nuvem?\n\n${counts}\n\nOs dados locais atuais serão substituídos. Uma cópia de segurança local será criada antes.`))return;
  localStorage.setItem(CLOUD_LOCAL_SAFETY_KEY,JSON.stringify({created_at:new Date().toISOString(),data:getCloudPayload()}));
  applyCloudPayload(payload);
  alert('Dados baixados e restaurados com sucesso.');
  await renderCloudPanel();
 }catch(error){alert(`Falha no download: ${error.message}`)}
}
function restorePreCloudBackup(){
 const saved=localStorage.getItem(CLOUD_LOCAL_SAFETY_KEY);
 if(!saved)return alert('Nenhuma cópia de segurança anterior ao download foi encontrada.');
 try{
  const backup=JSON.parse(saved);
  if(!confirm(`Restaurar a cópia local criada em ${cloudDate(backup.created_at)}?`))return;
  applyCloudPayload(backup.data);
  alert('Cópia de segurança local restaurada.');
 }catch{alert('A cópia de segurança local está inválida.')}
}
