import {useEffect, useState, useCallback, useRef} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {useProjectEngine} from '@/contexts/ProjectEngineContext';
import type {AnalyticsData,AnalyticsFilters} from '@/lib/analytics';
import {localDay} from '@/lib/workspace';
export async function fetchAnalytics(workspace:string,filters:AnalyticsFilters,offset=0,limit=25){
 const r=await supabase.rpc('workspace_analytics',{p_workspace:workspace,p_from:filters.from,p_to:filters.to,p_today:localDay(),p_project:filters.project==='all'?undefined:filters.project,p_member:filters.member==='all'?undefined:filters.member,p_status:filters.status==='all'?undefined:filters.status,p_priority:filters.priority==='all'?undefined:filters.priority,p_offset:offset,p_limit:limit});
 if(r.error)throw new Error(r.error.message);return r.data as unknown as AnalyticsData;
}
export function useAnalytics(filters:AnalyticsFilters,page:number){
 const e=useProjectEngine();const [data,setData]=useState<AnalyticsData>();const [loading,setLoading]=useState(false);const [error,setError]=useState('');const seq=useRef(0);
 const {from,to,project,member,status,priority}=filters;
 const refresh=useCallback(async()=>{const id=++seq.current;if(!e.activeId){setData(undefined);return;}setLoading(true);setError('');try{const result=await fetchAnalytics(e.activeId,{from,to,project,member,status,priority},page*25);if(id===seq.current)setData(result);}catch(err){if(id===seq.current){setData(undefined);setError(err instanceof Error?err.message:'Report could not load');}}finally{if(id===seq.current)setLoading(false);}},[e.activeId,from,to,project,member,status,priority,page]);
 useEffect(()=>{setData(undefined);void refresh();return()=>{seq.current++;};},[refresh]);
 useEffect(()=>{if(!e.loading)void refresh();},[e.loading,refresh]);
 useEffect(()=>{if(!e.activeId)return;let timer:ReturnType<typeof setTimeout>;const channel=supabase.channel(`analytics-${Math.random().toString(36).slice(2)}`);for(const table of ['tasks','projects','milestones'])channel.on('postgres_changes',{event:'*',schema:'public',table,filter:`workspace_id=eq.${e.activeId}`},()=>{clearTimeout(timer);timer=setTimeout(()=>void refresh(),300);});channel.subscribe();return()=>{clearTimeout(timer);void supabase.removeChannel(channel);};},[e.activeId,refresh]);
 // Polling also covers dependency/member edits and tables without realtime publication.
 useEffect(()=>{const timer=setInterval(()=>{if(!document.hidden)void refresh();},60000);return()=>clearInterval(timer);},[refresh]);
 return {data,loading,error,refresh};
}