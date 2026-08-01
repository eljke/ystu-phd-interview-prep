import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Profile } from '../../entities/profile/profile';
import { useStudyRepository } from './RepositoryProvider';

interface ProfileContextValue { profiles:Profile[]; activeProfile:Profile|undefined; activeProfileId:string|undefined; setActiveProfileId(id:string):Promise<void>; refreshProfiles():Promise<void>; }
const ProfileContext=createContext<ProfileContextValue|null>(null);
export function ProfileProvider({children}:{children:ReactNode}) {
  const {repository}=useStudyRepository(); const [profiles,setProfiles]=useState<Profile[]>([]); const [activeProfileId,setActive]=useState<string>(); const [loaded,setLoaded]=useState(false);
  const refreshProfiles=useCallback(async()=>{ const [items,settings]=await Promise.all([repository.listProfiles(),repository.getSettings()]); setProfiles(items); setActive(settings.activeProfileId && items.some((p)=>p.id===settings.activeProfileId)?settings.activeProfileId:items[0]?.id); setLoaded(true); },[repository]);
  useEffect(()=>{void refreshProfiles()},[refreshProfiles]);
  const setActiveProfileId=useCallback(async(id:string)=>{ setActive(id); const settings=await repository.getSettings(); await repository.saveSettings({...settings,activeProfileId:id,updatedAt:new Date().toISOString()}); },[repository]);
  const value=useMemo(()=>({profiles,activeProfile:profiles.find((p)=>p.id===activeProfileId),activeProfileId,setActiveProfileId,refreshProfiles}),[profiles,activeProfileId,setActiveProfileId,refreshProfiles]);
  if(!loaded) return <main className="center-screen"><div className="loader"/></main>;
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
export function useProfiles(){const value=useContext(ProfileContext);if(!value)throw new Error('ProfileProvider is missing');return value;}
