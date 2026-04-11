import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { Reservation } from '../lib/api';
import { publicApi } from '../lib/api';
import { formatDateTime } from './pageUtils';

const TIME_SLOTS = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

function toDateInputValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeSlotValue(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function toIsoString(dateValue: string, timeValue: string) {
  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
}

function getStatusLabel(status: Reservation['status']) {
  return {
    PENDING: 'ĐANG CHỜ',
    CONFIRMED: 'ĐÃ XÁC NHẬN',
    CHECKED_IN: 'ĐÃ CHECK-IN',
    COMPLETED: 'HOÀN TẤT',
    CANCELLED: 'ĐÃ HỦY',
  }[status];
}

function getStatusClass(status: Reservation['status']) {
  return {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CHECKED_IN: 'border-sky-200 bg-sky-50 text-sky-700',
    COMPLETED: 'border-slate-200 bg-slate-100 text-slate-700',
    CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  }[status];
}

function ReservationMetaCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyReservationState() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-slate-900">Chủ động theo dõi lịch hẹn của bạn</p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          Nhập mã đặt chỗ hoặc số điện thoại để xem lại thời gian, khu vực, vị trí bàn và cập nhật lịch hẹn nếu cần.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tìm lại mã đặt chỗ</p>
            <p className="mt-2 text-sm text-slate-600">Nếu nhớ mã, bạn sẽ vào thẳng đúng lịch hẹn tương ứng.</p>
          </div>
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tra cứu theo số điện thoại</p>
            <p className="mt-2 text-sm text-slate-600">Nếu nhập số điện thoại, hệ thống sẽ hiển thị toàn bộ các lượt đặt liên quan.</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bento preview</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Chi tiết lịch hẹn</p>
            <p className="mt-2 text-sm text-slate-500">Ngày, giờ, khu vực, vị trí bàn và yêu cầu đặc biệt.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Thay đổi linh hoạt</p>
            <p className="mt-2 text-sm text-slate-500">Chọn ngày mới và khung giờ phù hợp hơn cho nhóm của bạn.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <p className="text-sm font-semibold text-slate-900">Một nơi để quản lý toàn bộ đặt chỗ</p>
            <p className="mt-2 text-sm text-slate-500">Đủ rõ ràng để tra cứu nhanh, đủ tinh gọn để cập nhật lịch hẹn chỉ trong vài bước.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ReservationManagementPage() {
  const [lookupQuery, setLookupQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'CODE' | 'PHONE' | null>(null);
  const [matchedReservations, setMatchedReservations] = useState<Reservation[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const lookupMutation = useMutation({
    mutationFn: () =>
      publicApi.lookupReservation({
        query: lookupQuery.trim(),
      }),
    onSuccess: (payload) => {
      const nextReservation = payload.reservations[0] ?? null;
      setSearchMode(payload.matchMode);
      setMatchedReservations(payload.reservations);
      setReservation(nextReservation);
      if (nextReservation) {
        setSelectedDate(toDateInputValue(nextReservation.reservationTime));
        setSelectedTime(toTimeSlotValue(nextReservation.reservationTime));
      }
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      publicApi.rescheduleReservation(reservation!.reservationCode, {
        phone: reservation!.phone,
        reservationTime: toIsoString(selectedDate, selectedTime),
      }),
    onSuccess: (payload) => {
      setReservation(payload);
      setMatchedReservations((current) => current.map((item) => (item.id === payload.id ? payload : item)));
      setSelectedDate(toDateInputValue(payload.reservationTime));
      setSelectedTime(toTimeSlotValue(payload.reservationTime));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => publicApi.cancelReservation(reservation!.reservationCode, 'Đã hủy từ cổng quản lý đặt chỗ'),
    onSuccess: (payload) => {
      setReservation(payload);
      setMatchedReservations((current) => current.map((item) => (item.id === payload.id ? payload : item)));
    },
  });

  useEffect(() => {
    if (!reservation) {
      return;
    }
    setSelectedDate(toDateInputValue(reservation.reservationTime));
    setSelectedTime(toTimeSlotValue(reservation.reservationTime));
  }, [reservation?.reservationTime]);

  const saveDisabled = !reservation
    || !selectedDate
    || !selectedTime
    || rescheduleMutation.isPending
    || cancelMutation.isPending
    || reservation.status === 'CANCELLED'
    || reservation.status === 'COMPLETED'
    || reservation.status === 'CHECKED_IN';

  const availableTimeSlots = useMemo(() => {
    const today = new Date();
    return TIME_SLOTS.map((slot) => {
      const slotDate = new Date(`${selectedDate}T${slot}:00`);
      const disabled = Number.isNaN(slotDate.getTime()) ? true : slotDate.getTime() <= today.getTime();
      return { slot, disabled };
    });
  }, [selectedDate]);

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMatchedReservations([]);
    setSearchMode(null);
    setReservation(null);
    lookupMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4efe7_48%,#f8f6f1_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" to="/">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold uppercase tracking-[0.28em] text-slate-900">
              TCA
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">The Culinary Architect</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quản lý đặt chỗ dành cho khách hàng</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link className="text-sm font-medium text-slate-600 transition hover:text-slate-900" to="/menu">Thực đơn</Link>
            <Link className="text-sm font-medium text-slate-600 transition hover:text-slate-900" to="/book">Đặt bàn</Link>
            <a className="text-sm font-medium text-slate-600 transition hover:text-slate-900" href="#events">Sự kiện</a>
            <a className="text-sm font-medium text-slate-600 transition hover:text-slate-900" href="#gallery">Thư viện</a>
          </nav>

          <Link className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800" to="/book">
            Đặt bàn ngay
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Lookup section</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Quản lý đặt chỗ</h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Nhập mã đặt chỗ hoặc số điện thoại để xem lại lịch hẹn hiện tại, rồi điều chỉnh ngày giờ nếu kế hoạch của bạn thay đổi.
              </p>
            </div>

            <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={submitLookup}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mã đặt chỗ hoặc số điện thoại</span>
                <input
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-400"
                  onChange={(event) => setLookupQuery(event.target.value)}
                  placeholder="RES-XXXX hoặc 0901 234 567"
                  value={lookupQuery}
                />
              </label>
              <button
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                disabled={lookupMutation.isPending}
                type="submit"
              >
                {lookupMutation.isPending ? 'Đang tìm...' : 'Tìm kiếm lịch hẹn'}
              </button>
            </form>
          </div>

          {lookupMutation.error ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {lookupMutation.error instanceof Error ? lookupMutation.error.message : 'Không thể tìm thấy lịch hẹn phù hợp.'}
            </div>
          ) : null}

          {matchedReservations.length > 1 && searchMode === 'PHONE' ? (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-900">Các lượt đặt tìm thấy theo số điện thoại</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{matchedReservations.length} lịch hẹn</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {matchedReservations.map((item) => {
                  const isActive = reservation?.id === item.id;

                  return (
                    <button
                      className={`rounded-lg border p-4 text-left transition ${
                        isActive
                          ? 'border-emerald-700 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      key={item.id}
                      onClick={() => setReservation(item)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.customerName}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.reservationCode}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${getStatusClass(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-slate-600">{formatDateTime(item.reservationTime)}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.requestedArea || 'Chưa chọn khu vực'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>

        {reservation ? (
          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4">
              <article className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusClass(reservation.status)}`}>
                      {getStatusLabel(reservation.status)}
                    </span>
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{reservation.customerName}</h2>
                    <p className="mt-2 text-sm text-slate-500">Mã tham chiếu · {reservation.reservationCode}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nhóm khách</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{reservation.partySize} khách</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <ReservationMetaCard icon="calendar_month" label="Ngày" value={new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date(reservation.reservationTime))} />
                  <ReservationMetaCard icon="schedule" label="Giờ" value={new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date(reservation.reservationTime))} />
                  <ReservationMetaCard icon="chair_alt" label="Khu vực" value={reservation.requestedArea || 'Nhà hàng sẽ sắp xếp khu vực phù hợp'} />
                  <ReservationMetaCard icon="table_restaurant" label="Vị trí bàn" value={reservation.assignedTableName || 'Sẽ xác nhận khi gần giờ phục vụ'} />
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Yêu cầu đặc biệt & Ghi chú</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {reservation.note || 'Hiện chưa có ghi chú đặc biệt cho lịch hẹn này.'}
                </p>
              </article>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hướng dẫn đỗ xe</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Bãi đỗ xe dành cho khách nằm phía sau sảnh chính. Vui lòng xuất trình mã đặt chỗ tại quầy đón tiếp.
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[22px] text-slate-400">local_parking</span>
                  </div>
                </article>

                <article className="rounded-lg border border-slate-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thực đơn của chúng tôi</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Xem trước các món nổi bật để chuẩn bị trải nghiệm trọn vẹn hơn trước khi bạn đến.
                  </p>
                  <Link className="mt-5 inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400" to="/menu">
                    Xem thực đơn
                  </Link>
                </article>
              </div>
            </div>

            <div className="grid gap-4">
              <article className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thay đổi lịch hẹn</p>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">Cập nhật ngày và khung giờ</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Chọn một ngày mới và khung giờ phù hợp hơn. Hệ thống sẽ giữ lại lịch hẹn của bạn nếu thay đổi hợp lệ.
                </p>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chọn ngày mới</span>
                    <input
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-400"
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      type="date"
                      value={selectedDate}
                    />
                  </label>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chọn khung giờ</p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimeSlots.map(({ slot, disabled }) => (
                        <button
                          className={`rounded-md border px-3 py-2.5 text-sm font-medium transition ${
                            selectedTime === slot
                              ? 'border-emerald-700 bg-emerald-700 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800'
                          } ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 hover:border-slate-200' : ''}`}
                          disabled={disabled}
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          type="button"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {(rescheduleMutation.error || cancelMutation.error) ? (
                  <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {(rescheduleMutation.error instanceof Error && rescheduleMutation.error.message)
                      || (cancelMutation.error instanceof Error && cancelMutation.error.message)
                      || 'Không thể cập nhật lịch hẹn lúc này.'}
                  </div>
                ) : null}

                {rescheduleMutation.isSuccess ? (
                  <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Lịch hẹn đã được cập nhật thành công vào {formatDateTime(reservation.reservationTime)}.
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={saveDisabled}
                    onClick={() => rescheduleMutation.mutate()}
                    type="button"
                  >
                    {rescheduleMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!reservation || cancelMutation.isPending || reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED'}
                    onClick={() => cancelMutation.mutate()}
                    type="button"
                  >
                    {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy đặt bàn'}
                  </button>
                </div>
              </article>

              <article id="events" className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sự kiện</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Đêm chef’s table, thực đơn theo mùa và các buổi pairing riêng tư được cập nhật định kỳ cho khách đã đặt chỗ.
                </p>
              </article>

              <article id="gallery" className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thư viện</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Không gian phục vụ, bàn riêng và trải nghiệm theo khu vực được giới thiệu ngắn gọn để bạn dễ hình dung trước khi đến.
                </p>
              </article>
            </div>
          </section>
        ) : (
          <EmptyReservationState />
        )}
      </main>
    </div>
  );
}
