import { useTranslation } from 'react-i18next';

type SearchBarProps = {
  onChange: (value: string) => void;
  value: string;
};

export function SearchBar({ onChange, value }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
        {t('Search menu')}
      </span>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate/55">
          search
        </span>
        <input
          className="field pl-12"
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('Search dishes, descriptions, or categories')}
          value={value}
        />
      </div>
    </label>
  );
}
