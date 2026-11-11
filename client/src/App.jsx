import React,{createContext,useContext,useEffect,useState,useCallback} from 'react';
import {Routes,Route,Navigate,NavLink,useLocation,useNavigate,Outlet,Link} from 'react-router-dom';
import {LayoutDashboard,UserRound,ClipboardList,FileUp,House,LifeBuoy,LogOut,Menu,UsersRound,FileCheck2,KeyRound,Megaphone,Bell,MessageCircle,Send,Sparkles,ArrowRight,GraduationCap,CheckCircle2,LockKeyhole,Eye,EyeOff,Shield,Globe2,PanelLeftClose} from 'lucide-react';
import {api,firstName,initials} from './api';
import {Brand,Toast,Avatar,Loading} from './ui';
import {UNIVERSITY} from './university';
import WelcomeChat from './WelcomeChat.jsx';
import {StudentDashboard,StudentProfile,StudentApplications,StudentDocuments,StudentAccommodation,HelpCenter} from './StudentPages';
import {AdminDashboard,AdminStudents,AdminApplications,AdminDocuments,AdminAccommodation,AdminResets,AdminAnnouncements} from './AdminPages';

const AuthContext=createContext(null);
const NoticeContext=createContext(null);
export const useAuth=()=>useContext(AuthContext);
export const useNotice=()=>useContext(NoticeContext);
export function useApi(){const {token,logout}=useAuth();return useCallback(async(path,options={})=>{try{return await api(path,{...options,token});}catch(e){if(e.status===401)logout();throw e;}},[token,logout]);}
export function useData(path){const request=useApi();const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [tick,setTick]=useState(0);
  useEffect(()=>{let live=true;setLoading(true);setError('');request(path).then(v=>{if(live)setData(v);}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false;};},[path,request,tick]);
  return {data,loading,error,refresh:()=>setTick(i=>i+1)};
}
function AuthProvider({children}){
  const [token,setToken]=useState(()=>localStorage.getItem('welcome_token'));
  const [user,setUser]=useState(null);
  const [booting,setBooting]=useState(Boolean(localStorage.getItem('welcome_token')));
  const logout=useCallback(()=>{localStorage.removeItem('welcome_token');setToken(null);setUser(null);setBooting(false);},[]);
  const login=useCallback(({token:newToken,user:newUser})=>{localStorage.setItem('welcome_token',newToken);setToken(newToken);setUser(newUser);setBooting(false);},[]);
  useEffect(()=>{if(!token){setBooting(false);return;}let live=true;api('/auth/me',{token}).then(r=>{if(live){setUser(r.user);setBooting(false)}}).catch(()=>{if(live)logout()});return()=>{live=false}},[token,logout]);
  return <AuthContext.Provider value={{token,user,setUser,login,logout,booting}}>{children}</AuthContext.Provider>;
}
function NoticeProvider({children}){const [toast,setToast]=useState(null);const notify=useCallback((message,type='success')=>setToast({message,type,id:Date.now()}),[]);const dismiss=useCallback(()=>setToast(null),[]);return <NoticeContext.Provider value={notify}>{children}<Toast toast={toast} onDismiss={dismiss}/></NoticeContext.Provider>}
function Protected({role}){const {user,booting}=useAuth();const location=useLocation();if(booting)return <Loading/>;if(!user)return <Navigate to="/login" state={{from:location}} replace/>;if(user.role!==role)return <Navigate to={user.role==='admin'?'/admin':'/student'} replace/>;return <Outlet/>}
function Home(){const {user,booting}=useAuth();if(booting)return <Loading/>;return <Navigate to={user?(user.role==='admin'?'/admin':'/student'):'/login'} replace/>}
const studentMenu=[['/student',LayoutDashboard,'Dashboard'],['/student/profile',UserRound,'My Profile'],['/student/applications',ClipboardList,'Applications'],['/student/documents',FileUp,'Documents'],['/student/accommodation',House,'Accommodation'],['/student/help',LifeBuoy,'Help Center']];
const adminMenu=[['/admin',LayoutDashboard,'Overview'],['/admin/students',UsersRound,'Students'],['/admin/applications',ClipboardList,'Applications'],['/admin/documents',FileCheck2,'Documents'],['/admin/accommodation',House,'Accommodation'],['/admin/resets',KeyRound,'Password Requests'],['/admin/announcements',Megaphone,'Announcements']];
function Shell(){
  const {user,logout}=useAuth();
  const nav=useNavigate();
  const loc=useLocation();
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [desktopCollapsed,setDesktopCollapsed]=useState(false);
  useEffect(()=>{setSidebarOpen(false);},[loc.pathname]);
  useEffect(()=>{
    const onKeyDown=(event)=>{if(event.key==='Escape')setSidebarOpen(false);};
    window.addEventListener('keydown',onKeyDown);
    return ()=>window.removeEventListener('keydown',onKeyDown);
  },[]);
  const admin=user.role==='admin';
  const links=admin?adminMenu:studentMenu;
  const current=links.find(([route])=>route===loc.pathname)?.[2]||'Dashboard';
  const isMobile=()=>window.matchMedia('(max-width: 1020px)').matches;
  const toggleSidebar=()=>{
    if(isMobile())setSidebarOpen(open=>!open);
    else setDesktopCollapsed(collapsed=>!collapsed);
  };
  return <div className={'app-shell '+(desktopCollapsed?'desktop-sidebar-collapsed':'')}>
    <button type="button" className={'mobile-scrim '+(sidebarOpen?'shown':'')} aria-label="Close navigation menu" tabIndex={sidebarOpen?0:-1} onClick={()=>setSidebarOpen(false)}/>
    <aside id="workspace-sidebar" className={'sidebar '+(sidebarOpen?'sidebar-open':'')} aria-label={admin?'Administrator navigation':'Student navigation'}>
      <div className="sidebar-brand"><Brand/></div>
      <div className="sidebar-identity"><Avatar name={user.full_name}/><div><strong>{firstName(user.full_name)}</strong><span>{admin?'Administrator account':'Demo student account'}</span></div><span className="identity-online"/></div>
      <div className="sidebar-label">{admin?'MANAGEMENT':'YOUR WORKSPACE'}</div>
      <nav className="sidebar-nav" aria-label="Main navigation">{links.map(([url,Icon,label])=><NavLink key={url} to={url} end={true} onClick={()=>setSidebarOpen(false)} className={({isActive})=>'nav-item '+(isActive?'nav-active':'')}><Icon size={19} strokeWidth={1.9}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><div className="sidebar-help-icon"><GraduationCap size={22}/></div><strong>New to campus?</strong><p>Your onboarding tasks, all in one convenient demo workspace.</p>{!admin&&<button type="button" onClick={()=>{nav('/student/help');setSidebarOpen(false);}}>Explore guide <ArrowRight size={15}/></button>}</div>
        <button type="button" className="sidebar-logout" onClick={()=>{logout();nav('/login');}}><LogOut size={18}/> Sign out</button>
      </div>
    </aside>
    <div className="main-frame">
      <header className="topbar"><div className="topbar-left">
        <button type="button" className={'hamburger icon-btn '+(sidebarOpen?'hamburger-drawer-open':'')} onClick={toggleSidebar} aria-label={isMobile()?(sidebarOpen?'Hide navigation sidebar':'Show navigation sidebar'):(desktopCollapsed?'Show navigation sidebar':'Hide navigation sidebar')} aria-controls="workspace-sidebar" aria-expanded={isMobile()?sidebarOpen:!desktopCollapsed} title="Show or hide navigation"><Menu size={23}/></button>
        <div className="breadcrumb"><span>Smart Welcome</span><span className="breadcrumb-slash">/</span><strong>{current}</strong></div>
      </div><div className="topbar-right"><span className="semester-pill"><span/> {UNIVERSITY.city} · {UNIVERSITY.abbreviation}</span><div className="top-divider"/><span className="language-button" title="English-language academic demonstration"><Globe2 size={17}/> EN</span><div className="top-divider"/>{admin?
        <div className="top-user"><Avatar name={user.full_name}/><div><strong>{user.full_name}</strong><small>Administrator</small></div></div>:
        <Link to="/student/profile" className="top-user top-user-link" aria-label="Open my student profile" title="Open My Profile"><Avatar name={user.full_name}/><div><strong>{user.full_name}</strong><small>Student Portal</small></div></Link>
      }</div></header>
      <main className="content"><Outlet/></main>
      <footer className="app-footer"><span>© 2026 Smart Welcome · {UNIVERSITY.name} academic prototype (not an official service)</span><span>Designed to make your first steps easier.</span></footer>
    </div>
    {!admin&&<WelcomeChat/>}
  </div>;
}
function AuthLayout({mode}){const nav=useNavigate();const {user,login}=useAuth();const notify=useNotice();const [busy,setBusy]=useState(false);const [showPw,setShowPw]=useState(false);const [values,setValues]=useState({full_name:'',email:'',password:'',new_password:'',nationality:'',major:'',reason:''});const change=e=>setValues(v=>({...v,[e.target.name]:e.target.value}));useEffect(()=>{setValues({full_name:'',email:'',password:'',new_password:'',nationality:'',major:'',reason:''});},[mode]);if(user)return <Navigate to={user.role==='admin'?'/admin':'/student'} replace/>;
 async function submit(e){e.preventDefault();setBusy(true);try{if(mode==='forgot'){const r=await api('/auth/forgot',{method:'POST',body:values});notify(r.message);nav('/login');return;}const route=mode==='register'?'/auth/register':'/auth/login';const r=await api(route,{method:'POST',body:values});login(r);nav(r.user.role==='admin'?'/admin':'/student');notify(mode==='register'?'Your account is ready. Welcome!':'Welcome back!');}catch(e){notify(e.message,'error')}finally{setBusy(false)}}
 function demo(which){setValues(v=>({...v,email:which==='admin'?'admin@welcome.test':'mithil@welcome.test',password:which==='admin'?'Admin123!':'Student123!'}));}
 return <div className="auth-page"><div className="auth-header"><Brand/><div><span>NEW STUDENT ONBOARDING</span><span className="auth-header-dot"/>{UNIVERSITY.name.toUpperCase()} · {UNIVERSITY.city.toUpperCase()}</div></div><div className="auth-demo-note"><Shield size={15}/> Academic prototype created for a {UNIVERSITY.degree} project. Not an official De Montfort University service; please do not upload real personal documents.</div><div className="auth-container"><div className="auth-story"><div className="auth-chip"><Sparkles size={15}/> Your journey starts here</div><h1>Feel at home,<br/><span>in Leicester.</span></h1><p>One welcoming space for every important step. Register, upload documents, track your progress, and get ready for an amazing new chapter.</p><div className="auth-feature-list"><div><span><CheckCircle2 size={18}/></span>Simple, guided application process</div><div><span><CheckCircle2 size={18}/></span>Sample documents in one place</div><div><span><CheckCircle2 size={18}/></span>Review updates in one dashboard</div></div><div className="auth-story-bottom"><div className="auth-circles"><span>A</span><span>D</span><span>S</span><span>+</span></div><span>Designed for new and international students,<br/>in Leicester and beyond.</span></div><div className="auth-decor auth-decor-1"/><div className="auth-decor auth-decor-2"/></div><div className="auth-form-side"><div className="auth-card"><div className="auth-icon">{mode==='forgot'?<KeyRound size={23}/>:mode==='register'?<GraduationCap size={23}/>:<LockKeyhole size={23}/>}</div><h2>{mode==='register'?'Create your account':mode==='forgot'?'Reset your password':'Welcome back'}</h2><p>{mode==='register'?'Let’s get your onboarding started.':mode==='forgot'?'Submit a request for the student support team.':'Sign in to continue your onboarding journey.'}</p><form onSubmit={submit} className="auth-form">
 {mode==='register'&&<><label>Full name<input autoComplete="name" name="full_name" value={values.full_name} onChange={change} placeholder="Your full name" maxLength="150" required/></label></>}
 <label>Email address<input autoComplete="email" type="email" name="email" value={values.email} onChange={change} placeholder="you@example.com" required/></label>
 {mode!=='forgot'&&<label>Password<div className="password-input"><input autoComplete={mode==='register'?'new-password':'current-password'} type={showPw?'text':'password'} name="password" value={values.password} onChange={change} placeholder="Enter your password" minLength={mode==='register'?8:undefined} required/><button type="button" aria-label="Toggle password visibility" onClick={()=>setShowPw(v=>!v)}>{showPw?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>}
 {mode==='forgot'&&<><label>New password<div className="password-input"><input type={showPw?'text':'password'} name="new_password" value={values.new_password} onChange={change} minLength="8" placeholder="At least 8 characters with letters and numbers" required/><button type="button" onClick={()=>setShowPw(v=>!v)}>{showPw?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label><label>Reason (optional)<input name="reason" value={values.reason} onChange={change} placeholder="Why do you need a reset?" maxLength="250"/></label><div className="auth-hint">Your new password activates only after an administrator independently verifies your identity and approves the request.</div></>}
 {mode==='register'&&<><label>Nationality<input name="nationality" value={values.nationality} onChange={change} placeholder="Country of citizenship"/></label><label>Intended major<input name="major" value={values.major} onChange={change} placeholder="e.g. Computer Science"/></label></>}
 {mode==='login'&&<Link className="forgot-link" to="/forgot">Forgot password?</Link>}
 <button disabled={busy} className="btn btn-primary auth-submit" type="submit">{busy?'Please wait…':mode==='register'?'Create account':mode==='forgot'?'Request password reset':'Sign in'}<ArrowRight size={18}/></button></form>
 <div className="auth-switch">{mode==='login'?'New to Smart Welcome?':mode==='register'?'Already have an account?':'Remembered your password?'} <Link to={mode==='login'?'/register':'/login'}>{mode==='login'?'Create an account':'Sign in'}</Link></div>
 {mode==='login'&&<div className="demo-login"><span>TRY THE DEMO ACCOUNTS</span><div><button onClick={()=>demo('student')}>Student demo</button><button onClick={()=>demo('admin')}>Admin demo</button></div></div>}</div></div></div><div className="auth-footer"><span>© 2026 {UNIVERSITY.name}-inspired academic thesis prototype · Not an official DMU service</span><span><Shield size={14}/> Built with student privacy in mind</span></div></div>;
}
export default function App(){return <AuthProvider><NoticeProvider><Routes><Route path="/" element={<Home/>}/><Route path="/login" element={<AuthLayout mode="login"/>}/><Route path="/register" element={<AuthLayout mode="register"/>}/><Route path="/forgot" element={<AuthLayout mode="forgot"/>}/><Route element={<Protected role="student"/>}><Route path="/student" element={<Shell/>}><Route index element={<StudentDashboard/>}/><Route path="profile" element={<StudentProfile/>}/><Route path="applications" element={<StudentApplications/>}/><Route path="documents" element={<StudentDocuments/>}/><Route path="accommodation" element={<StudentAccommodation/>}/><Route path="help" element={<HelpCenter/>}/></Route></Route><Route element={<Protected role="admin"/>}><Route path="/admin" element={<Shell/>}><Route index element={<AdminDashboard/>}/><Route path="students" element={<AdminStudents/>}/><Route path="applications" element={<AdminApplications/>}/><Route path="documents" element={<AdminDocuments/>}/><Route path="accommodation" element={<AdminAccommodation/>}/><Route path="resets" element={<AdminResets/>}/><Route path="announcements" element={<AdminAnnouncements/>}/></Route></Route><Route path="*" element={<Home/>}/></Routes></NoticeProvider></AuthProvider>}
