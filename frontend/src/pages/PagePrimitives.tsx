import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from './pageUtils';

export function ShortcutCard({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <Link className="group rounded-[28px] border border-ink/10 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-forest/20 hover:shadow-float" to={to}>
      <p className="font-display text-2xl text-ink transition group-hover:text-forest">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{body}</p>
    </Link>
  );
}

export function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'forest' | 'ember' | 'slate' }) {
  const toneClass = tone === 'forest' ? 'from-forest to-forest/80' : tone === 'ember' ? 'from-ember to-ember/75' : 'from-slate to-slate/80';

  return (
    <div className={clsx('rounded-[28px] bg-gradient-to-br p-[1px] shadow-float', toneClass)}>
      <div className="rounded-[27px] bg-white/90 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{label}</p>
        <p className="mt-3 font-display text-4xl text-ink">{value}</p>
      </div>
    </div>
  );
}

export function InfoCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/70 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{label}</p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate">{detail}</p>
    </div>
  );
}

export function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-ink/10 bg-cream/60 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

export function Field({ children, className, label, required }: { children: ReactNode; className?: string; label: string; required?: boolean }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
        {label}
        {required && <span className="text-ember ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

export function StatusPill({ children, tone }: { children: ReactNode; tone: 'forest' | 'ember' | 'warm' | 'neutral' }) {
  const styles = {
    forest: 'bg-forest/10 text-forest border-forest/20',
    ember: 'bg-ember/10 text-ember border-ember/20',
    warm: 'bg-ember/10 text-ember border-ember/20',
    neutral: 'bg-slate/10 text-slate border-slate/20',
  }[tone];

  return <span className={clsx('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]', styles)}>{children}</span>;
}

export function LoadingState({ label, message }: { label?: string; message?: string }) {
  const text = message || label || 'Loading';
  return <div className="mt-6 rounded-[24px] border border-ink/10 bg-white/70 px-4 py-4 text-sm text-slate">{text}...</div>;
}

export function ErrorState({ error, message }: { error?: unknown; message?: string }) {
  const text = message || getErrorMessage(error);
  return <div className="mt-6 rounded-[24px] border border-ember/20 bg-ember/10 px-4 py-4 text-sm text-ember">{text}</div>;
}

export function InlineError({ error, message, light = false }: { error?: unknown; message?: string; light?: boolean }) {
  const text = message || getErrorMessage(error);
  return <p className={clsx('text-sm', light ? 'text-cream/80' : 'text-ember')}>{text}</p>;
}
