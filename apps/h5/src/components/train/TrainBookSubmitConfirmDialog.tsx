import { ConfirmDialog } from "@/components/ConfirmDialog";

export const TRAIN_DIRECT_BOOK_CONFIRM_MESSAGE =
  "提交订单后暂未完成出票，请在订单详情中确认座位信息，确认无误后，提交完成出票，过期不确认提交将自动取消订单";

interface TrainBookSubmitConfirmDialogProps {
  open: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirm before direct train book (生成订单) — uses shared ConfirmDialog styling. */
export function TrainBookSubmitConfirmDialog({
  open,
  pending = false,
  onCancel,
  onConfirm,
}: TrainBookSubmitConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="温馨提示"
      message={TRAIN_DIRECT_BOOK_CONFIRM_MESSAGE}
      cancelLabel="取消"
      confirmLabel="确定"
      loading={pending}
      showCloseButton={false}
      variant="default"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
