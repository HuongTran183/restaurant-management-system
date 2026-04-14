import type { ReactNode } from 'react';
import { ChipButton } from './Button';
import { Input, Select } from './Form';
import type { SelectOption } from './Form';

/* =============================================================================
   SEARCH FILTER BAR TYPES
   ============================================================================= */
export interface FilterConfig {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export interface ChipFilterConfig {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    icon?: string;
  }>;
}

export interface SearchFilterBarProps {
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Select filters
  filters?: FilterConfig[];

  // Chip filters (toggle buttons)
  chipFilters?: ChipFilterConfig[];

  // Actions slot (e.g., Add button)
  actions?: ReactNode;

  // Styling
  className?: string;
}

/* =============================================================================
   SEARCH FILTER BAR COMPONENT
   ============================================================================= */
export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  chipFilters = [],
  actions,
  className = '',
}: SearchFilterBarProps) {
  const hasSearch = onSearchChange !== undefined;
  const hasFilters = filters.length > 0;
  const hasChipFilters = chipFilters.length > 0;

  return (
    <div className={`mb-6 space-y-4 ${className}`}>
      {/* Top row: Search + Filters + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        {hasSearch && (
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate/50">
              search
            </span>
            <Input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10"
            />
          </div>
        )}

        {/* Select Filters */}
        {hasFilters &&
          filters.map((filter) => (
            <Select
              key={filter.id}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              options={filter.options}
              placeholder={filter.placeholder || filter.label}
              className="w-auto min-w-[140px]"
            />
          ))}

        {/* Spacer */}
        {actions && <div className="flex-1" />}

        {/* Action Buttons */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Chip Filters Row */}
      {hasChipFilters && (
        <div className="flex flex-wrap gap-2">
          {chipFilters.map((chipFilter) =>
            chipFilter.options.map((option) => (
              <ChipButton
                key={`${chipFilter.id}-${option.value}`}
                active={chipFilter.value === option.value}
                onClick={() => chipFilter.onChange(option.value)}
              >
                {option.icon && (
                  <span className="material-symbols-outlined text-sm">
                    {option.icon}
                  </span>
                )}
                {option.label}
              </ChipButton>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   SIMPLE SEARCH (Just search input with icon)
   ============================================================================= */
export interface SimpleSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SimpleSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate/50">
        search
      </span>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}

/* =============================================================================
   STATUS FILTER (Common filter pattern)
   ============================================================================= */
export interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    icon?: string;
  }>;
  label?: string;
}

export function StatusFilter({
  value,
  onChange,
  options,
  label = 'Status',
}: StatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs font-semibold text-slate">{label}:</span>}
      <div className="flex gap-1">
        {options.map((option) => (
          <ChipButton
            key={option.value}
            active={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.icon && (
              <span className="material-symbols-outlined text-sm">{option.icon}</span>
            )}
            {option.label}
          </ChipButton>
        ))}
      </div>
    </div>
  );
}
