import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 const url=Deno.env.get('SUPABASE_URL');const anon=Deno.env.get('SUPABASE_ANON_KEY');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!anon||!key)return reply(503,{error:'Server configuration unavailable'});
 const authorization=req.headers.get('Authorization')||'';const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}});const {data:auth,error}=await caller.auth.getUser();if(error||!auth.user)return reply(401,{error:'Sign in required'});
 const input=await req.json().catch(()=>null);if(!input||typeof input.workspace_id!=='string'||!/^[0-9a-f-]{36}$/i.test(input.workspace_id))return reply(400,{error:'Workspace required'});
 const role=await caller.rpc('workspace_role',{p_workspace:input.workspace_id});if(!['owner','admin'].includes(role.data||''))return reply(403,{error:'Workspace manager required'});
 // No queue is claimed without provider configuration: delivery remains honestly pending.
 const providerKey=Deno.env.get('RESEND_API_KEY');const sender=Deno.env.get('COLLABORATION_EMAIL_FROM');if(!providerKey||!sender)return reply(503,{error:'Email provider is not configured. Add RESEND_API_KEY and a verified COLLABORATION_EMAIL_FROM.'});
 const admin=createClient(url,key);const pending=await admin.from('notification_outbox').select('*').eq('workspace_id',input.workspace_id).in('status',['Pending','Failed']).lte('next_attempt_at',new Date().toISOString()).lt('attempts',5).order('created_at').limit(20);if(pending.error)return reply(500,{error:'Queue unavailable'});
 let sent=0,failed=0;
 for(const item of pending.data||[]){
  if(item.event_key.startsWith('invite:')){const inv=await admin.from('workspace_invitations').select('status,expires_at').eq('id',item.event_key.slice(7)).limit(1).maybeSingle();if(inv.data?.status!=='Pending'||new Date(inv.data.expires_at)<new Date()){await admin.from('notification_outbox').update({status:'Cancelled'}).eq('id',item.id);continue;}}
  else if(item.user_id){const member=await admin.from('workspace_members').select('id').eq('workspace_id',item.workspace_id).eq('user_id',item.user_id).limit(1).maybeSingle();const prefs=await admin.from('notification_preferences').select('email').eq('user_id',item.user_id).limit(1).maybeSingle();if(!member.data||prefs.data?.email?.[item.category]===false){await admin.from('notification_outbox').update({status:'Cancelled'}).eq('id',item.id);continue;}}
  const claim=await admin.from('notification_outbox').update({status:'Sending',attempts:item.attempts+1,updated_at:new Date().toISOString()}).eq('id',item.id).eq('status',item.status).select('id');if(!claim.data?.length)continue;
  const ws=await admin.from('workspaces').select('name').eq('id',item.workspace_id).limit(1).maybeSingle();
  try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${providerKey}`,'Content-Type':'application/json','Idempotency-Key':item.id},body:JSON.stringify({from:sender,to:[item.recipient_email],subject:item.title,html:`<h1>Planz</h1><p>${escape(ws.data?.name||'Workspace')}</p><h2>${escape(item.title)}</h2><p>${escape(item.body)}</p><a href="${escape('https://okesha.com'+item.link)}">Open Planz</a>`})});const result=await response.json();if(!response.ok)throw new Error('Provider rejected delivery');await admin.from('notification_outbox').update({status:'Sent',provider_id:result.id,error:null,updated_at:new Date().toISOString()}).eq('id',item.id);sent++;}catch{await admin.from('notification_outbox').update({status:'Failed',error:'Provider delivery failed',next_attempt_at:new Date(Date.now()+Math.min(3600000,60000*2**item.attempts)).toISOString(),updated_at:new Date().toISOString()}).eq('id',item.id);failed++;}
 }
 return reply(200,{sent,failed});
});
