import type { ReactNode } from 'react';

/* =============================================================================
   DATA TABLE TYPES
   ============================================================================= */
export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  items: T[];
  columns: DataTableColumn<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: string;
  className?: string;
  rowClassName?: string | ((item: T) => string);
}

/* =============================================================================
   DATA TABLE COMPONENT
   ============================================================================= */
export function DataTable<T>({
  items,
  columns,
  keyField,
  onRowClick,
  isLoading = false,
  error = null,
  emptyMessage = 'No data found',
  emptyIcon = 'inbox',
  className = '',
  rowClassName,
}: DataTableProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <div className={`list-spacing ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="data-row animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-ink/10" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-ink/10" />
                <div className="h-3 w-24 rounded bg-ink/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined text-4xl text-ember">error</span>
        <p className="text-ember">{error}</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined text-5xl text-slate/50">
          {emptyIcon}
        </span>
        <p className="body-text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Data rows
  return (
    <div className={`list-spacing ${className}`}>
      {items.map((item, index) => {
        const key = String(item[keyField]);
        const extraClass = typeof rowClassName === 'function' ? rowClassName(item) : rowClassName || '';
        const isClickable = !!onRowClick;

        return (
          <div
            key={key}
            onClick={() => onRowClick?.(item)}
            className={`${isClickable ? 'data-row-clickable' : 'data-row'} ${extraClass}`.trim()}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onRowClick?.(item);
              }
            }}
          >
            {columns.map((col) => {
              const cellContent = col.render
                ? col.render(item, index)
                : String((item as Record<string, unknown>)[col.key] ?? '');

              return (
                <div
                  key={col.key}
                  className={`${col.hideOnMobile ? 'hidden sm:block' : ''} ${col.className || ''}`}
                >
                  {cellContent}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* =============================================================================
   DATA CARD (Alternative grid display)
   ============================================================================= */
export interface DataCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DataCard({ children, onClick, className = '' }: DataCardProps) {
  const isClickable = !!onClick;
  const baseClass = isClickable
    ? 'card cursor-pointer transition hover:border-forest/25 hover:shadow-md'
    : 'card';

  return (
    <div
      onClick={onClick}
      className={`${baseClass} ${className}`}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {children}
    </div>
  );
}

/* =============================================================================
   DATA GRID (Card grid layout)
   ============================================================================= */
export interface DataGridProps<T> {
  items: T[];
  keyField: keyof T;
  renderCard: (item: T, index: number) => ReactNode;
  columns?: 2 | 3 | 4;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: string;
  className?: string;
}

export function DataGrid<T>({
  items,
  keyField,
  renderCard,
  columns = 3,
  isLoading = false,
  error = null,
  emptyMessage = 'No data found',
  emptyIcon = 'grid_view',
  className = '',
}: DataGridProps<T>) {
  const colsClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`grid gap-4 ${colsClass[columns]} ${className}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-32 rounded-lg bg-ink/10" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-ink/10" />
              <div className="h-3 w-1/2 rounded bg-ink/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined text-4xl text-ember">error</span>
        <p className="text-ember">{error}</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined text-5xl text-slate/50">
          {emptyIcon}
        </span>
        <p className="body-text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Grid
  return (
    <div className={`grid gap-4 ${colsClass[columns]} ${className}`}>
      {items.map((item, index) => (
        <div key={String(item[keyField])}>{renderCard(item, index)}</div>
      ))}
    </div>
  );
}
