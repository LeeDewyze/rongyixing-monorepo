import { PassengerSelectAlertDialog } from "@/components/passenger";

interface HotelPassengerRequiredDialogProps {
  open: boolean;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** Themed passenger-required prompt for hotel/train list booking flows. */
export function HotelPassengerRequiredDialog({
  open,
  message = "请先添加旅客",
  onClose,
  onConfirm,
}: HotelPassengerRequiredDialogProps) {
  return (
    <PassengerSelectAlertDialog
      open={open}
      message={message}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
