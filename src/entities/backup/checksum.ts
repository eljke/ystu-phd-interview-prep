import type { BackupSnapshot } from './backup';
function canonical(snapshot:BackupSnapshot){const copy={...snapshot,checksum:''};return JSON.stringify(copy)}
export async function calculateChecksum(snapshot:BackupSnapshot):Promise<string>{const bytes=new TextEncoder().encode(canonical(snapshot));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map((b)=>b.toString(16).padStart(2,'0')).join('')}
export async function withChecksum(snapshot:BackupSnapshot):Promise<BackupSnapshot>{return {...snapshot,checksum:await calculateChecksum(snapshot)}}
export async function verifyChecksum(snapshot:BackupSnapshot):Promise<boolean>{return snapshot.checksum===await calculateChecksum(snapshot)}
