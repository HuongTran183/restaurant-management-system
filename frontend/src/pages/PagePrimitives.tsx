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

export function Field({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{label}</span>
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

export function LoadingState({ label }: { label: string }) {
  return <div className="mt-6 rounded-[24px] border border-ink/10 bg-white/70 px-4 py-4 text-sm text-slate">{label}...</div>;
}

export function ErrorState({ error }: { error: unknown }) {
  return <div className="mt-6 rounded-[24px] border border-ember/20 bg-ember/10 px-4 py-4 text-sm text-ember">{getErrorMessage(error)}</div>;
}

export function InlineError({ error, light = false }: { error: unknown; light?: boolean }) {
  return <p className={clsx('text-sm', light ? 'text-cream/80' : 'text-ember')}>{getErrorMessage(error)}</p>;
}

export function EmptyState({ icon, title, message, action }: { icon: string; title: string; message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/50 px-6 py-12 text-center">
      <p className="text-4xl">{icon}</p>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate">{message}</p>
      {action && (
        <button
          className="button-primary mt-6"
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function KPIMetric({ label, value, tone, badge, urgent }: { label: string; value: string; tone: 'forest' | 'ember' | 'slate'; badge?: number; urgent?: boolean }) {
  const toneClass = tone === 'forest' ? 'from-forest to-forest/80' : tone === 'ember' ? 'from-ember to-ember/75' : 'from-slate to-slate/80';
  const borderClass = urgent ? 'border-ember/30 ring-2 ring-ember/20' : '';

  return (
    <div className={clsx('rounded-[24px] bg-gradient-to-br p-[1px] shadow-float', toneClass, borderClass)}>
      <div className="rounded-[23px] bg-white/95 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{label}</p>
            <p className="mt-2 font-display text-3xl text-ink">{value}</p>
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ember text-xs font-bold text-cream">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ icon, title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h2 className="font-display text-2xl text-ink">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-slate">{subtitle}</p>}
    </div>
  );
}

export function DataPanel({ children, testId, title, subtitle }: { children: ReactNode; testId?: string; title: string; subtitle: string }) {
  return (
    <section className="panel px-5 py-6 sm:px-6" data-testid={testId}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-ink/10 bg-white/50 px-4 py-8 text-center text-sm text-slate">
      {message}
    </div>
  );
}
