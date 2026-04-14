import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AuthSession } from '../../lib/api';
import { LanguageSwitcher } from '../LanguageSwitcher';

/* =============================================================================
   PAGE LAYOUT COMPONENT
   ============================================================================= */
export interface PageLayoutProps {
  // Header content
  title: string;
  subtitle?: string;
  breadcrumb?: Array<{ label: string; to?: string }>;
  
  // Navigation
  backTo?: string;
  backLabel?: string;
  
  // User session
  session?: AuthSession | null;
  onLogout?: () => void;
  
  // Actions slot (right side of header)
  headerActions?: ReactNode;
  
  // Sidebar (optional)
  sidebar?: ReactNode;
  sidebarWidth?: 'sm' | 'md' | 'lg';
  
  // Content
  children: ReactNode;
  
  // Styling
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

const maxWidthClasses = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

const sidebarWidthClasses = {
  sm: 'w-56',
  md: 'w-64',
  lg: 'w-72',
};

export function PageLayout({
  title,
  subtitle,
  breadcrumb,
  backTo = '/staff',
  backLabel,
  session,
  onLogout,
  headerActions,
  sidebar,
  sidebarWidth = 'md',
  children,
  maxWidth = '7xl',
  className = '',
  contentClassName = '',
  noPadding = false,
}: PageLayoutProps) {
  const hasSidebar = !!sidebar;

  return (
    <div className={`min-h-screen bg-mesh ${className}`}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/80 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between px-4 py-3 ${maxWidthClasses[maxWidth]}`}>
          {/* Left: Back + Breadcrumb */}
          <div className="flex items-center gap-4">
            <Link to={backTo} className="button-ghost py-2">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              {backLabel && <span className="hidden sm:inline">{backLabel}</span>}
            </Link>
            
            {breadcrumb && breadcrumb.length > 0 && (
              <nav className="hidden items-center gap-2 text-sm sm:flex">
                {breadcrumb.map((item, index) => (
                  <span key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-slate/50">/</span>}
                    {item.to ? (
                      <Link to={item.to} className="text-slate hover:text-forest">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-ink font-medium">{item.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* Right: User info + Actions */}
          <div className="flex items-center gap-3">
            {headerActions}
            <LanguageSwitcher />
            {session && (
              <>
                <span className="hidden text-sm text-slate sm:inline">
                  {session.user.fullName}
                </span>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="button-ghost py-2 text-sm text-slate hover:text-ember"
                  >
                    <span className="material-symbols-outlined text-xl">logout</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className={hasSidebar ? 'flex' : ''}>
        {/* Sidebar */}
        {hasSidebar && (
          <aside
            className={`sticky top-[57px] h-[calc(100vh-57px)] shrink-0 overflow-y-auto border-r border-ink/10 bg-cream/50 ${sidebarWidthClasses[sidebarWidth]}`}
          >
            {sidebar}
          </aside>
        )}

        {/* Main content */}
        <main className={`flex-1 ${hasSidebar ? '' : `mx-auto ${maxWidthClasses[maxWidth]}`}`}>
          {/* Page header */}
          <div className={`${noPadding ? '' : 'px-4 py-6'}`}>
            {!noPadding && (
              <div className="mb-6">
                <h1 className="heading-1">{title}</h1>
                {subtitle && <p className="body-text-lg mt-1">{subtitle}</p>}
              </div>
            )}
            
            {/* Content */}
            <div className={contentClassName}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =============================================================================
   SIMPLE PAGE LAYOUT (No header, just centered content)
   ============================================================================= */
export interface SimplePageLayoutProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const simpleMaxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function SimplePageLayout({
  children,
  maxWidth = 'md',
  className = '',
}: SimplePageLayoutProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-mesh p-4 ${className}`}>
      <div className={`w-full ${simpleMaxWidthClasses[maxWidth]}`}>{children}</div>
    </div>
  );
}

/* =============================================================================
   PAGE SECTION (Content grouping)
   ============================================================================= */
export interface PageSectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className = '',
}: PageSectionProps) {
  return (
    <section className={`section-spacing ${className}`}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="heading-2">{title}</h2>}
            {description && <p className="body-text mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* =============================================================================
   SIDEBAR NAV (For pages with sidebar)
   ============================================================================= */
export interface SidebarNavItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

export interface SidebarNavProps {
  items: SidebarNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  title?: string;
  className?: string;
}

export function SidebarNav({
  items,
  activeId,
  onSelect,
  title,
  className = '',
}: SidebarNavProps) {
  return (
    <nav className={`p-4 ${className}`}>
      {title && <h3 className="label-text mb-4">{title}</h3>}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                activeId === item.id
                  ? 'bg-forest text-cream'
                  : 'text-slate hover:bg-ink/5 hover:text-ink'
              }`}
            >
              {item.icon && (
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
              )}
              <span className="flex-1 font-medium">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeId === item.id ? 'bg-cream/20 text-cream' : 'bg-ink/10 text-ink'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
