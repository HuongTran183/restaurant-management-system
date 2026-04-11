import clsx from 'clsx';
import { useEffect, type ReactNode } from 'react';

type RightDrawerProps = {
  open?: boolean;
  isOpen?: boolean;
  title: string;
  description?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg' | 'xl';
};

export function RightDrawer({ open, isOpen, title, description, subtitle, onClose, children, footer, width = 'lg' }: RightDrawerProps) {
  const visible = open ?? isOpen ?? false;
  const drawerDescription = description ?? subtitle;
  const widthClass = {
    md: 'max-w-md sm:w-[28rem]',
    lg: 'max-w-lg sm:w-[30rem]',
    xl: 'max-w-xl sm:w-[32rem]',
  }[width];

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, onClose]);

  return (
    <div
      aria-hidden={!visible}
      className={clsx(
        'fixed inset-0 z-50 transition',
        visible ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      <button
        aria-label="Đóng sơ đồ bàn"
        className={clsx(
          'absolute inset-0 bg-slate-950/20 transition-opacity',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-modal="true"
        className={clsx(
          'absolute right-0 top-0 flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300',
          widthClass,
          visible ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-slate-900">{title}</p>
              {drawerDescription ? <p className="mt-1 text-sm leading-6 text-slate-500">{drawerDescription}</p> : null}
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              onClick={onClose}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 bg-white px-5 py-4">{footer}</div> : null}
      </aside>
    </div>
  );
}
