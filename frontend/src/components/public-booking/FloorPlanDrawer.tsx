import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicBookingArea } from '../../lib/api';
import { RightDrawer } from '../ui/RightDrawer';

type FloorPlanDrawerProps = {
  area: PublicBookingArea | null;
  open: boolean;
  selectedTableId: string | null;
  onClose: () => void;
  onConfirm: (tableId: string) => void;
};

export function FloorPlanDrawer({ area, open, selectedTableId, onClose, onConfirm }: FloorPlanDrawerProps) {
  const { t } = useTranslation();
  const [draftTableId, setDraftTableId] = useState<string | null>(selectedTableId);

  useEffect(() => {
    if (open) {
      setDraftTableId(selectedTableId);
    }
  }, [open, selectedTableId, area?.id]);

  const selectedTable = area?.tables.find((table) => String(table.id) === draftTableId) ?? null;

  return (
    <RightDrawer
      description={area ? `${area.availableTables} ${t('bàn có thể chọn')} • ${area.bookedTables} ${t('bàn đã bận')}` : undefined}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {selectedTable ? `${selectedTable.name} • ${selectedTable.seatCount} ${t('ghế')}` : t('Chưa chọn bàn')}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedTable ? t('Bàn sẽ được giữ chỗ ngay khi bạn hoàn tất đặt bàn.') : t('Chọn một bàn trống để tiếp tục.')}
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={!selectedTable}
            onClick={() => {
              if (!selectedTable) {
                return;
              }
              onConfirm(String(selectedTable.id));
              onClose();
            }}
            type="button"
          >
            {t('Xác nhận chọn bàn')}
          </button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={area ? `${t('Sơ đồ bàn')} · ${area.name}` : t('Sơ đồ bàn')}
    >
      {area ? (
        area.tables.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {area.tables.map((table) => {
                const isBooked = !table.selectable;
                const isSelected = draftTableId === String(table.id);

                return (
                  <button
                    className={clsx(
                      'rounded-lg border px-3 py-4 text-left transition',
                      isBooked
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                        : isSelected
                          ? 'border-2 border-emerald-700 bg-white text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700',
                    )}
                    disabled={isBooked}
                    key={table.id}
                    onClick={() => setDraftTableId(String(table.id))}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={clsx('text-sm font-semibold', isSelected ? 'text-slate-900' : undefined)}>{table.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{table.code}</p>
                      </div>
                      {isSelected ? <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] font-semibold text-white">✓</span> : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span>{table.seatCount} {t('ghế')}</span>
                      <span className={clsx(isBooked ? 'text-slate-400' : 'text-emerald-700')}>{t(table.bookingStatus)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {t('Bố cục được hiển thị theo lưới để khách chọn nhanh khu vực và bàn còn trống trước khi đến nhà hàng.')}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {t('Khu vực này hiện chưa có bàn nào khả dụng.')}
          </div>
        )
      ) : null}
    </RightDrawer>
  );
}
