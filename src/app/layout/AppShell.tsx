import { BookOpen, ChartNoAxesCombined, DatabaseBackup, GraduationCap, Home, Info, Menu, Moon, Sun, Users, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useProfiles } from '../providers/ProfileProvider';
import { useStudyRepository } from '../providers/RepositoryProvider';
import { useTheme } from '../providers/ThemeProvider';

const links=[
  {to:'/',label:'Главная',icon:Home,end:true},
  {to:'/topics',label:'Все темы',icon:BookOpen},
  {to:'/oral',label:'Устный ответ',icon:GraduationCap},
  {to:'/pair',label:'Парная сессия',icon:Users},
  {to:'/progress',label:'Прогресс',icon:ChartNoAxesCombined},
  {to:'/backup',label:'Резервная копия',icon:DatabaseBackup},
  {to:'/about',label:'О программе',icon:Info},
];
export function AppShell(){const[open,setOpen]=useState(false);const{profiles,activeProfileId,setActiveProfileId}=useProfiles();const{theme,setTheme}=useTheme();const{noSaveMode}=useStudyRepository();const nextTheme=theme==='system'?'dark':theme==='dark'?'light':'system';const themeLabel=theme==='system'?'Системная тема':theme==='dark'?'Тёмная тема':'Светлая тема';return <div className="app-shell"><a className="skip-link" href="#main-content">Перейти к содержанию</a><header className="mobile-header"><button className="icon-button" aria-label="Открыть меню" onClick={()=>setOpen(true)}><Menu/></button><strong>ЯГТУ · 1.2.2</strong></header><aside className={`sidebar ${open?'sidebar--open':''}`}><div className="sidebar__brand"><div className="brand-mark"><GraduationCap/></div><div><strong>ЯГТУ</strong><span>Подготовка 1.2.2</span></div><button className="icon-button sidebar__close" aria-label="Закрыть меню" onClick={()=>setOpen(false)}><X/></button></div><nav aria-label="Основная навигация">{links.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end ?? false} onClick={()=>setOpen(false)} className={({isActive})=>`nav-link ${isActive?'nav-link--active':''}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav><div className="sidebar__footer"><label className="compact-field"><span>Активный участник</span><select value={activeProfileId} onChange={(e)=>void setActiveProfileId(e.target.value)}>{profiles.map((profile)=><option value={profile.id} key={profile.id}>{profile.name}</option>)}</select></label><button className="theme-button" onClick={()=>void setTheme(nextTheme)}>{theme==='dark'?<Moon size={18}/>:<Sun size={18}/>}<span>{themeLabel}</span></button>{noSaveMode&&<p className="no-save-badge">Режим без сохранения</p>}</div></aside>{open&&<button className="backdrop" aria-label="Закрыть меню" onClick={()=>setOpen(false)}/>}<main id="main-content" className="page"><Outlet/></main></div>}
