import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; children: ReactNode; }
export function Button({ variant='primary', className='', children, ...props }: Props) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}
export function LinkButton({ to, variant='primary', children }: { to:string; variant?:Variant; children:ReactNode }) {
  return <Link className={`button button--${variant}`} to={to}>{children}</Link>;
}
