import { CalendarPickerDialog } from "@/components/calendar/CalendarPickerDialog";
import {
  FLIGHT_CALENDAR_CONFIG,
  HOTEL_CALENDAR_CONFIG,
  TRAIN_CALENDAR_CONFIG,
  type CalendarPickerConfig,
} from "@/lib/calendar-picker";

interface DatePickerDialogProps {
  open: boolean;
  title?: string;
  value: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
  config?: CalendarPickerConfig;
}

/** Pad/PC single-date picker — same interaction as H5 CalendarPickerSheet. */
export function DatePickerDialog({
  open,
  title,
  value,
  onClose,
  onConfirm,
  config = FLIGHT_CALENDAR_CONFIG,
}: DatePickerDialogProps) {
  const pickerConfig = title ? { ...config, title } : config;

  return (
    <CalendarPickerDialog
      open={open}
      config={pickerConfig}
      startDate={value}
      endDate={value}
      onClose={onClose}
      onConfirm={(start) => onConfirm(start)}
    />
  );
}

interface HotelStayDatePickerDialogProps {
  open: boolean;
  checkIn: string;
  checkOut: string;
  onClose: () => void;
  onConfirm: (checkIn: string, checkOut: string) => void;
}

/** Pad/PC hotel check-in / check-out range picker — same interaction as H5. */
export function HotelStayDatePickerDialog({
  open,
  checkIn,
  checkOut,
  onClose,
  onConfirm,
}: HotelStayDatePickerDialogProps) {
  return (
    <CalendarPickerDialog
      open={open}
      config={HOTEL_CALENDAR_CONFIG}
      startDate={checkIn}
      endDate={checkOut}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

export { TRAIN_CALENDAR_CONFIG };
