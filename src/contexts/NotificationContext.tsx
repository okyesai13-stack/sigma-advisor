import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {useAuth} from './AuthContext';
import type {Tables} from '@/integrations/supabase/types';
interface State{rows:Tables<'notifications'>[];unread:number;error:string;refresh:()=>Promise<void>;mark:(id?:string,read?:boolean)=>Promise<void>}
const Context=createContext<State|undefined>(undefined);
export function NotificationProvider({children}:{children:ReactNode}){const {user}=useAuth();const [rows,setRows]=useState<Tables<'notifications'>[]>([]);const [unread,setUnread]=useState(0);const [error,setError]=useState('');const request=useRef(0);
const refresh=useCallback(async()=>{const seq=++request.current;if(!user){setRows([]);setUnread(0);return;}const [list,count]=await Promise.all([supabase.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).order('id').limit(10),supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).is('read_at',null)]);if(seq!==request.current)return;setError(list.error?.message||count.error?.message||'');setRows(list.data||[]);setUnread(count.count||0);},[user]);
useEffect(()=>{void refresh();if(!user)return;const c=supabase.channel(`notifications-${user.id}-${Math.random().toString(36).slice(2)}`).on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:`user_id=eq.${user.id}`},()=>void refresh()).subscribe(status=>{if(status==='CHANNEL_ERROR')setError('Live updates interrupted; retrying automatically');});const timer=setInterval(()=>void refresh(),60000);return()=>{request.current++;clearInterval(timer);void supabase.removeChannel(c);};},[user,refresh]);
const mark=async(id?:string,read=true)=>{const r=await supabase.rpc('mark_notifications',{p_id:id,p_read:read});if(r.error){setError(r.error.message);return;}await refresh();};return <Context.Provider value={{rows,unread,error,refresh,mark}}>{children}</Context.Provider>;}
export function useNotifications(){const context=useContext(Context);if(!context)throw new Error('Notification provider missing');return context;}
