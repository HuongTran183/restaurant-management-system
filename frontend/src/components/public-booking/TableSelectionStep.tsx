import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicBookingArea, PublicBookingTable } from '../../lib/api';
import { usePublicBookingOptions } from '../../lib/usePublicBookingOptions';
import { AreaSelector } from './AreaSelector';
import { FloorPlanDrawer } from './FloorPlanDrawer';

type TableSelectionStepProps = {
  reservationTime: string;
  partySize: number;
  requestedArea: string;
  selectedTableId: string | null;
  onChange: (selection: { requestedArea: string; selectedTableId: string | null }) => void;
};

function getSelectedTable(areas: PublicBookingArea[], selectedTableId: string | null): PublicBookingTable | null {
  if (!selectedTableId) {
    return null;
  }

  for (const area of areas) {
    const table = area.tables.find((entry) => String(entry.id) === selectedTableId);
    if (table) {
      return table;
    }
  }

  return null;
}

export function TableSelectionStep({
  reservationTime,
  partySize,
  requestedArea,
  selectedTableId,
  onChange,
}: TableSelectionStepProps) {
  const { t } = useTranslation();
  const bookingOptionsQuery = usePublicBookingOptions(reservationTime, partySize);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);

  const areas = bookingOptionsQuery.data?.areas ?? [];
  const selectedArea = areas.find((area) => String(area.id) === selectedAreaId) ?? null;
  const selectedTable = useMemo(() => getSelectedTable(areas, selectedTableId), [areas, selectedTableId]);

  useEffect(() => {
    if (selectedTable) {
      setSelectedAreaId(String(selectedTable.areaId));
      return;
    }

    if (!requestedArea) {
      return;
    }

    const matchingArea = areas.find((area) => area.name === requestedArea);
    if (matchingArea) {
      setSelectedAreaId(String(matchingArea.id));
    }
  }, [areas, requestedArea, selectedTable]);

  useEffect(() => {
    if (!selectedTableId || bookingOptionsQuery.isLoading) {
      return;
    }

    const liveSelection = getSelectedTable(areas, selectedTableId);
    if (liveSelection?.selectable) {
      return;
    }

    onChange({
      requestedArea: selectedArea?.name ?? '',
      selectedTableId: null,
    });
  }, [areas, bookingOptionsQuery.isLoading, onChange, selectedArea?.name, selectedTableId]);

  const helperContent = (() => {
    if (bookingOptionsQuery.isLoading) {
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          {t('Đang tải sơ đồ bàn và khu vực...')}
        </div>
      );
    }

    if (bookingOptionsQuery.error) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
          {t('Chưa thể tải khu vực và bàn lúc này. Vui lòng thử lại sau.')}
        </div>
      );
    }

    if (areas.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          {t('Hiện chưa có khu vực phục vụ công khai.')}
        </div>
      );
    }

    return null;
  })();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t('Chọn khu vực và bàn')}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {t('Chọn trước khu vực bạn thích, sau đó mở sơ đồ bàn để giữ đúng vị trí phù hợp cho nhóm của bạn.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 px-3 py-1">{partySize} {t('khách')}</span>
            <span className="rounded-full border border-slate-200 px-3 py-1">{areas.length} {t('khu vực')}</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {helperContent}

          {areas.length > 0 ? (
            <>
              <AreaSelector
                areas={areas}
                onSelectArea={(areaId) => {
                  const nextArea = areas.find((area) => String(area.id) === areaId);
                  setSelectedAreaId(areaId);
                  setIsFloorPlanOpen(true);
                  onChange({
                    requestedArea: nextArea?.name ?? '',
                    selectedTableId: nextArea?.id === selectedTable?.areaId ? selectedTableId : null,
                  });
                }}
                selectedAreaId={selectedAreaId}
              />

              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{t('Lựa chọn hiện tại')}</p>
                  {selectedTable ? (
                    <div className="mt-2">
                      <p className="text-base font-semibold text-slate-900">
                        {selectedTable.name} · {selectedTable.areaName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedTable.seatCount} {t('ghế')} · {t('Đã sẵn sàng cho lượt đặt của bạn')}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">{t('Bạn chưa chọn bàn cụ thể. Hệ thống sẽ giữ yêu cầu khu vực nếu bạn bỏ trống bước này.')}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    disabled={!selectedArea}
                    onClick={() => setIsFloorPlanOpen(true)}
                    type="button"
                  >
                    {selectedTable ? t('Đổi bàn') : t('Mở sơ đồ bàn')}
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    onClick={() => {
                      onChange({ requestedArea: '', selectedTableId: null });
                      setSelectedAreaId(null);
                    }}
                    type="button"
                  >
                    {t('Không ưu tiên khu vực')}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <FloorPlanDrawer
        area={selectedArea}
        onClose={() => setIsFloorPlanOpen(false)}
        onConfirm={(tableId) => {
          const confirmedTable = getSelectedTable(areas, tableId);
          onChange({
            requestedArea: confirmedTable?.areaName ?? selectedArea?.name ?? '',
            selectedTableId: tableId,
          });
        }}
        open={isFloorPlanOpen}
        selectedTableId={selectedTableId}
      />
    </div>
  );
}
