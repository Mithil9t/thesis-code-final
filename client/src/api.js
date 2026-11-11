const base = '/api';
export async function api(route,{token,body,...options}={}) {
  const isForm = body instanceof FormData;
  let response;
  try {
    response = await fetch(base+route,{
      ...options,
      headers:{...(isForm?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers},
      ...(body===undefined?{}:{body:isForm?body:JSON.stringify(body)})
    });
  }catch(e){throw new Error('Cannot reach the server. Check that the API and MySQL are running.');}
  if(options.raw&&response.ok)return response;
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const err=new Error(data.error||`Request failed (${response.status})`);err.status=response.status;throw err;}
  return data;
}
export const shortDate = value => value ? new Date(String(value).includes('T') ? value : String(value).replace(' ','T')+'Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
export const pretty = text => String(text||'').replaceAll('_',' ').replace(/\b\w/g,l=>l.toUpperCase());
export const firstName=name=>String(name||'Student').trim().split(/\s+/)[0];
export const initials=name=>String(name||'SW').trim().split(/\s+/).slice(0,2).map(n=>n[0]?.toUpperCase()).join('');
