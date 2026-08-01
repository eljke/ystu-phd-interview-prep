import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { StudyRepository } from '../../repositories/StudyRepository';
import { DexieStudyRepository } from '../../storage/dexie/DexieStudyRepository';
import { StorageError } from '../../storage/dexie/databaseErrors';
import { MemoryStudyRepository } from '../../storage/memory/MemoryStudyRepository';
import { Button } from '../../shared/ui/Button';

interface RepositoryContextValue { repository: StudyRepository; revision:number; notifyDataChanged():void; noSaveMode:boolean; }
const RepositoryContext=createContext<RepositoryContextValue|null>(null);

export function RepositoryProvider({ children, repository: provided }: { children:ReactNode; repository?:StudyRepository }) {
  const primary=useMemo(()=>provided ?? new DexieStudyRepository(),[provided]);
  const [repository,setRepository]=useState(primary);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [message,setMessage]=useState('');
  const [revision,setRevision]=useState(0);
  const [noSaveMode,setNoSaveMode]=useState(false);
  useEffect(()=>{ let active=true; repository.initialize().then(()=>active&&setStatus('ready')).catch((error:unknown)=>{ if(active){ setMessage(error instanceof Error?error.message:String(error)); setStatus('error'); } }); return()=>{active=false}; },[repository]);
  if(status==='loading') return <main className="center-screen"><div className="loader"/><p>Открываем локальное хранилище…</p></main>;
  if(status==='error') return <main className="center-screen"><section className="dialog"><h1>Не удалось открыть локальное хранилище</h1><p>{message}</p><div className="button-row"><Button onClick={()=>{setStatus('loading');setRepository(new DexieStudyRepository())}}>Повторить</Button><Button variant="secondary" onClick={()=>{setNoSaveMode(true);setStatus('loading');setRepository(new MemoryStudyRepository())}}>Продолжить без сохранения</Button></div></section></main>;
  return <RepositoryContext.Provider value={{repository,revision,notifyDataChanged:()=>setRevision((v)=>v+1),noSaveMode}}>{children}</RepositoryContext.Provider>;
}

export function useStudyRepository() { const value=useContext(RepositoryContext); if(!value) throw new StorageError('unknown','RepositoryProvider is missing'); return value; }
