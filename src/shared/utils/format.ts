export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
export const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('ru-RU', { day:'numeric', month:'short' }).format(new Date(value)) : 'ещё не было';
