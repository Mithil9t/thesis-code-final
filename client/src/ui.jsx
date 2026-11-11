import React,{useEffect,useState} from 'react';
import {LoaderCircle, Check, X, CircleAlert, Inbox, ChevronRight} from 'lucide-react';
import {pretty,shortDate} from './api';
import {UNIVERSITY} from './university';
import {digitsOnly, blockNonDigitKey, blockNonDigitBeforeInput, phoneAfterPaste, PHONE_MAX_LENGTH} from './phoneInput.js';
export function Brand({small=false}){return <div className={'brand dmu-brand '+(small?'brand-small':'')}><div className="dmu-logo-frame"><img src="/dmu-logo.png" alt="De Montfort University Leicester" /></div><div className="dmu-brand-caption"><strong>SMART WELCOME</strong><small>{UNIVERSITY.faculty}</small></div></div>}
export function Status({value}){const cls=({approved:'success',verified:'success',pending:'warning',in_review:'info',changes_requested:'purple',rejected:'danger',draft:'neutral'})[value]||'neutral';return <span className={'status status-'+cls}><span className="status-dot"/>{pretty(value||'Not started')}</span>}
export function Loading(){return <div className="loading"><LoaderCircle className="spin" size={26}/><span>Loading your portal…</span></div>}
export function Empty({icon:Icon=Inbox,title='Nothing here yet',message='Items will appear here when available.',action}){return <div className="empty-state"><div className="empty-icon"><Icon size={25}/></div><h3>{title}</h3><p>{message}</p>{action}</div>}
export function PageHeader({eyebrow,title,subtitle,action}){return <div className="page-title-row"><div><div className="eyebrow">{eyebrow||'YOUR ONBOARDING PORTAL'}</div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action&&<div className="page-action">{action}</div>}</div>}
export function CardTitle({title,subtitle,action}){return <div className="card-title"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>}
export function Field({label,children,help,required=false}){return <label className="form-field"><span className="field-label">{label}{required&&<em>*</em>}</span>{children}{help&&<small>{help}</small>}</label>}
export function FormInput({label,required=false,...rest}){return <Field label={label} required={required}><input required={required} {...rest}/></Field>}

/** Use for student and administrator phone editing; valid entries are 7-15 digits. */
export function PhoneNumberInput({label='Telephone number (7-15 digits)',value='',onChange,...rest}){
  const update=(event)=>{
    const safe=digitsOnly(event.currentTarget.value);
    // Update the DOM immediately even if React state has not rendered yet.
    if(event.currentTarget.value!==safe) event.currentTarget.value=safe;
    onChange?.({target:{value:safe}});
  };
  const paste=(event)=>{
    event.preventDefault();
    const input=event.currentTarget;
    const text=event.clipboardData?.getData('text/plain') || '';
    const start=input.selectionStart ?? input.value.length;
    const end=input.selectionEnd ?? start;
    const {value:safe,caret}=phoneAfterPaste(input.value,text,start,end);
    input.value=safe;
    onChange?.({target:{value:safe}});
    input.setSelectionRange?.(caret,caret);
  };
  return <FormInput {...rest} label={label} type="text" inputMode="numeric" autoComplete="tel-national"
    value={digitsOnly(value)} maxLength={PHONE_MAX_LENGTH} minLength={7} pattern="[0-9]{7,15}"
    title="Enter 7 to 15 digits, without letters, spaces, or symbols" placeholder="Digits only, e.g. 07123456789"
    onBeforeInput={blockNonDigitBeforeInput} onKeyDown={blockNonDigitKey}
    onPaste={paste} onDrop={event=>event.preventDefault()}
    onInput={update} onChange={update}/>;
}

export function FormSelect({label,children,required=false,...rest}){return <Field label={label} required={required}><select required={required} {...rest}>{children}</select></Field>}
export function FormText({label,required=false,...rest}){return <Field label={label} required={required}><textarea required={required} rows="3" {...rest}/></Field>}
export function Submit({busy,children,secondary=false,...rest}){return <button className={'btn '+(secondary?'btn-secondary':'btn-primary')} disabled={busy||rest.disabled} {...rest}>{busy?<LoaderCircle className="spin" size={16}/>:null}{children}</button>}
export function Toast({toast,onDismiss}){useEffect(()=>{if(!toast)return;const t=setTimeout(onDismiss,4200);return()=>clearTimeout(t);},[toast,onDismiss]);return toast?<div className={'toast '+(toast.type==='error'?'toast-error':'')} role="status">{toast.type==='error'?<CircleAlert size={19}/>:<Check size={19}/>}<span>{toast.message}</span><button aria-label="Dismiss" onClick={onDismiss}><X size={16}/></button></div>:null}
export function InfoNotice({children}){return <div className="info-notice"><CircleAlert size={18}/><span>{children}</span></div>}
export function Avatar({name,large=false}){return <div className={'avatar '+(large?'avatar-large':'')} aria-label={name}>{String(name||'SW').split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()}</div>}
export function DateCell({date}){return <span className="muted">{shortDate(date)}</span>}
export function MoreLink({onClick,children='View all'}){return <button className="text-link" onClick={onClick}>{children}<ChevronRight size={15}/></button>}
export function ConfirmModal({title,message,onCancel,onConfirm,busy,children,confirmText='Confirm',disableConfirm=false}){return <div className="modal-backdrop" onMouseDown={onCancel}><div className="modal modal-sm" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e=>e.stopPropagation()}><div className="modal-heading"><h2>{title}</h2><button className="icon-btn" onClick={onCancel}><X size={19}/></button></div><p className="modal-description">{message}</p>{children}<div className="modal-actions"><button className="btn btn-secondary" onClick={onCancel}>Cancel</button><Submit busy={busy} onClick={onConfirm}>{confirmText}</Submit></div></div></div>}
