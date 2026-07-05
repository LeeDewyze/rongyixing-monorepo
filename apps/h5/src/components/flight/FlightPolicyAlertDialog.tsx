import { HotelPolicyAlertDialog } from "@/components/hotel/HotelPolicyAlertDialog";

interface FlightPolicyAlertDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

/** Flight policy prompt reuses the shared warm-reminder policy dialog presentation. */
export function FlightPolicyAlertDialog({
  open,
  message,
  onClose,
}: FlightPolicyAlertDialogProps) {
  return <HotelPolicyAlertDialog open={open} message={message} onClose={onClose} />;
}
