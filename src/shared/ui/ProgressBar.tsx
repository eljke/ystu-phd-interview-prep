import { formatPercent } from '../utils/format';
export function ProgressBar({ value, label }: { value:number; label?:string }) {
  const safe=Math.max(0,Math.min(1,value));
  return <div className="progress" aria-label={label ?? 'Готовность'} aria-valuenow={Math.round(safe*100)} role="progressbar"><div className="progress__fill" style={{width:formatPercent(safe)}} /></div>;
}
