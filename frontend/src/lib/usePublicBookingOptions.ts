import { useQuery } from '@tanstack/react-query';
import { publicApi } from './api';

function toReservationIso(reservationTime: string): string | null {
  if (!reservationTime) {
    return null;
  }

  const parsedDate = new Date(reservationTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

export function usePublicBookingOptions(reservationTime: string, partySize: number) {
  const reservationTimeIso = toReservationIso(reservationTime);

  return useQuery({
    queryKey: ['public-booking-options', reservationTimeIso, partySize],
    queryFn: () => publicApi.bookingOptions({ reservationTime: reservationTimeIso!, partySize }),
    enabled: reservationTimeIso !== null && partySize > 0,
    staleTime: 30_000,
  });
}
