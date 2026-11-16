export const invitationDays=7;
export const maxFileBytes=10*1024*1024;
export const notificationCategories=['assignment','mention','comment','project','milestone','deadline','invitation'];
export const fileTypes:Record<string,string>={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',txt:'text/plain',csv:'text/csv'};
export function fileMime(name:string){return fileTypes[name.split('.').pop()?.toLowerCase()||'']||'';}
export function validateFile(name:string,size:number,limit:number,mime:string){const expected=fileMime(name);return !!expected&&size>0&&size<=limit&&(!mime||mime===expected||(name.toLowerCase().endsWith('.csv')&&['text/plain','application/vnd.ms-excel'].includes(mime)));}
export function invitationStatus(status:string,expires:string,now=Date.now()){return status==='Pending'&&new Date(expires).getTime()<=now?'Expired':status;}
export function safeReturnPath(value:string|null){return value&&/^\/invite(?:[?#]|$)/.test(value)&&!value.includes('\\')?value:'/dashboard';}
