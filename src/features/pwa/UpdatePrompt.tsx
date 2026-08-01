import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '../../shared/ui/Button';
export function UpdatePrompt(){const{needRefresh:[needRefresh,setNeedRefresh],updateServiceWorker}=useRegisterSW();if(!needRefresh)return null;return <div className="update-toast" role="status"><div><strong>Доступно обновление</strong><span>Прогресс в IndexedDB сохранится.</span></div><Button onClick={()=>void updateServiceWorker(true)}>Обновить</Button><button className="icon-button" aria-label="Закрыть" onClick={()=>setNeedRefresh(false)}>×</button></div>}
