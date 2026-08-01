import type { BackupSnapshot } from './backup';

function canonical(snapshot: BackupSnapshot): string {
  return JSON.stringify({ ...snapshot, checksum: '' }, (_key, value: unknown) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return value;
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
    );
  });
}

export async function calculateChecksum(snapshot: BackupSnapshot): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(snapshot));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function withChecksum(snapshot: BackupSnapshot): Promise<BackupSnapshot> {
  return { ...snapshot, checksum: await calculateChecksum(snapshot) };
}

export async function verifyChecksum(snapshot: BackupSnapshot): Promise<boolean> {
  return snapshot.checksum === (await calculateChecksum(snapshot));
}
