import {createClient} from 'npm:@supabase/supabase-js@2';
export async function claimSpecialist(admin:any,auth:string,user:string,business:string,endpoint:string,paidRun:unknown){
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!key)throw new Error('Billing configuration unavailable');
 let run=typeof paidRun==='string'?paidRun:crypto.randomUUID();
 if(!paidRun){const db=createClient(url,key,{global:{headers:{Authorization:auth}}});const r=await db.rpc('authorize_ai_specialists',{p_id:run,p_business:business,p_endpoint:endpoint});if(r.error)throw Object.assign(new Error(r.error.message),{status:r.error.message.includes('insufficient_credits')?402:403});run=r.data;}
 const claim=await admin.rpc('claim_ai_specialist',{p_id:run,p_user:user,p_business:business,p_endpoint:endpoint});if(claim.error||!claim.data)throw Object.assign(new Error('This paid specialist request was already used or is unavailable. Check saved results.'),{status:409});
 return run;
}
