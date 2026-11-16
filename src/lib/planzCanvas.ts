import { containsNote, type SectionRect } from "./whiteboardGeometry";
const defaults:Record<string,SectionRect>={problem:{x:0,y:0,w:300,h:696},solution:{x:316,y:0,w:300,h:340},key_metrics:{x:316,y:356,w:300,h:340},uvp:{x:632,y:0,w:300,h:696},unfair_advantage:{x:948,y:0,w:300,h:340},channels:{x:948,y:356,w:300,h:340},customer_segments:{x:1264,y:0,w:300,h:696},cost_structure:{x:0,y:712,w:616,h:280},revenue_streams:{x:632,y:712,w:932,h:280}};
type Note={id:string;text:string;x:number;y:number;color:string;ai?:boolean};
export function mergeCanvasSuggestions(boxes:Record<string,unknown>,suggestions:Record<string,string[]>,id:()=>string):Record<string,unknown> {
  const board=(boxes.__board&&typeof boxes.__board==="object"?boxes.__board:{}) as Record<string,unknown>;
  const sections={...defaults,...(board.sections as Record<string,SectionRect>||{})};
  const notes:Note[]=Array.isArray(board.notes)?[...board.notes] as Note[]:Object.entries(defaults).flatMap(([key,r])=>(Array.isArray(boxes[key])?boxes[key] as string[]:[]).map((text,i)=>({id:id(),text,color:"orange",x:r.x+12,y:r.y+56+i*110})));
  const result={...boxes};const removed=new Set(Array.isArray(board.removedSections)?board.removedSections as string[]:[]);
  for(const [key,values] of Object.entries(suggestions)) {
    const rect=sections[key];if(!rect)continue;removed.delete(key);
    const existing=Array.isArray(result[key])?result[key] as string[]:[];const fresh=values.filter(t=>!existing.includes(t));result[key]=Array.from(new Set([...existing,...fresh]));
    let count=notes.filter(n=>containsNote(rect,n)).length;const columns=Math.max(1,Math.floor((rect.w-16)/212));
    for(const text of fresh){notes.push({id:id(),text,color:"mint",ai:true,x:rect.x+12+(count%columns)*212,y:rect.y+56+Math.floor(count/columns)*110});count++;}
  }
  return {...result,__board:{...board,notes,sections,removedSections:[...removed]}};
}