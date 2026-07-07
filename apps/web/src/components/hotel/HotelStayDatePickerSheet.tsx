import { CalendarPickerSheet } from "@/components/calendar/CalendarPickerSheet";
import { HOTEL_CALENDAR_CONFIG } from "@/lib/calendar-picker";

export interface HotelStayDatePickerSheetProps {
  open: boolean;
  checkIn: string;
  checkOut: string;
  onClose: () => void;
  onConfirm: (checkIn: string, checkOut: string) => void;
}

export function HotelStayDatePickerSheet({
  open,
  checkIn,
  checkOut,
  onClose,
  onConfirm,
}: HotelStayDatePickerSheetProps) {
  return (
    <CalendarPickerSheet
      open={open}
      config={HOTEL_CALENDAR_CONFIG}
      startDate={checkIn}
      endDate={checkOut}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
