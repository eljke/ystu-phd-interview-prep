import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppSettings } from '../../entities/progress/progress';
import { useStudyRepository } from './RepositoryProvider';
type Theme=AppSettings['theme'];
const ThemeContext=createContext<{theme:Theme;setTheme(theme:Theme):Promise<void>}|null>(null);
export function ThemeProvider({children}:{children:ReactNode}){const{repository}=useStudyRepository();const[theme,setThemeState]=useState<Theme>('system');useEffect(()=>{repository.getSettings().then((s)=>setThemeState(s.theme))},[repository]);useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);const setTheme=async(next:Theme)=>{setThemeState(next);const s=await repository.getSettings();await repository.saveSettings({...s,theme:next,updatedAt:new Date().toISOString()})};return <ThemeContext.Provider value={{theme,setTheme}}>{children}</ThemeContext.Provider>}
export function useTheme(){const v=useContext(ThemeContext);if(!v)throw new Error('ThemeProvider is missing');return v;}
