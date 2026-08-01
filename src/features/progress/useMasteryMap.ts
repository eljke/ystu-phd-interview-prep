import { useEffect, useState } from 'react';
import type { MasteryResult } from '../../entities/progress/mastery';
import { topics } from '../../content/topics';
import { useStudyRepository } from '../../app/providers/RepositoryProvider';
import { loadMasteryMap } from './loadMastery';

export function useMasteryMap(profileId?: string) {
  const {repository,revision}=useStudyRepository();
  const [map,setMap]=useState<Map<string,MasteryResult>>(new Map());
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;if(!profileId){setLoading(false);return;}setLoading(true);loadMasteryMap(repository,profileId,topics).then((result)=>{if(active){setMap(result);setLoading(false)}});return()=>{active=false}},[repository,profileId,revision]);
  return {map,loading};
}
