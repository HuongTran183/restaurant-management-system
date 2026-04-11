import clsx from 'clsx';
import type { PublicBookingArea } from '../../lib/api';

type AreaSelectorProps = {
  areas: PublicBookingArea[];
  selectedAreaId: string | null;
  onSelectArea: (areaId: string) => void;
};

export function AreaSelector({ areas, selectedAreaId, onSelectArea }: AreaSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {areas.map((area) => {
        const isSelected = selectedAreaId === String(area.id);

        return (
          <button
            className={clsx(
              'rounded-lg border bg-white p-4 text-left transition',
              isSelected ? 'border-emerald-700 shadow-sm' : 'border-slate-200 hover:border-slate-300',
            )}
            key={area.id}
            onClick={() => onSelectArea(String(area.id))}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{area.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{area.description || `Sức chứa ${area.totalTables} bàn`}</p>
              </div>
              <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                {area.availableTables}/{area.totalTables}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{area.availableTables} bàn đang có thể chọn</span>
              <span>{area.bookedTables} bàn đã bận</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
