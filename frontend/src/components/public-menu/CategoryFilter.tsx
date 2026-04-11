import { useTranslation } from 'react-i18next';

type CategoryFilterOption = {
  count: number;
  id: string;
  label: string;
};

type CategoryFilterProps = {
  activeCategory: string;
  onChange: (value: string) => void;
  options: CategoryFilterOption[];
};

export function CategoryFilter({
  activeCategory,
  onChange,
  options,
}: CategoryFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Categories')}</p>
      <div className="space-y-2">
        <FilterButton
          active={activeCategory === 'ALL'}
          count={options.reduce((sum, option) => sum + option.count, 0)}
          label={t('All dishes')}
          onClick={() => onChange('ALL')}
        />
        {options.map((option) => (
          <FilterButton
            key={option.id}
            active={activeCategory === option.id}
            count={option.count}
            label={option.label}
            onClick={() => onChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition ${
        active
          ? 'border-forest/20 bg-forest/5 text-forest'
          : 'border-ink/10 bg-white text-ink hover:bg-cream/35'
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold ${active ? 'text-forest' : 'text-ink'}`}>{label}</span>
      </span>
      <span className={`shrink-0 text-xs font-bold uppercase tracking-[0.2em] ${active ? 'text-forest/70' : 'text-slate'}`}>{count}</span>
    </button>
  );
}
