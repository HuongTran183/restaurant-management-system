import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import type { Reservation } from '../../lib/api';
import { formatDateTime } from '../../pages/pageUtils';

export function ReservationTableQrCard({ reservation }: { reservation: Reservation }) {
  const { t } = useTranslation();

  if (reservation.status !== 'COMPLETED' || !reservation.tableQr) {
    return null;
  }

  const tableLabel = reservation.assignedTableName || reservation.assignedTableCode || t('Assigned table');

  return (
    <article
      className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-5"
      data-testid="reservation-table-qr"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{t('Ordering QR')}</p>
          <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{t('Your table is ready for menu ordering.')}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {t('Table {{table}} already has a staff-generated QR. Open the ordering page directly or scan this code on another device.', {
              table: tableLabel,
            })}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1">{reservation.reservationCode}</span>
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1">{tableLabel}</span>
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1">
              {reservation.tableQr.expiresAt
                ? t('Valid until {{time}}', { time: formatDateTime(reservation.tableQr.expiresAt) })
                : t('No expiry')}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              href={reservation.tableQr.landingUrl}
              rel="noreferrer"
              target="_blank"
            >
              {t('Open menu QR')}
            </a>
            <p className="break-all text-xs text-slate-500">{reservation.tableQr.landingUrl}</p>
          </div>
        </div>

        <div className="mx-auto rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <QRCodeSVG includeMargin size={180} value={reservation.tableQr.landingUrl} />
        </div>
      </div>
    </article>
  );
}
