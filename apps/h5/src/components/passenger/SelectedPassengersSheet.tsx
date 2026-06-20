import type { PassengerBookInfo } from "@ryx/shared-types";
import { credentialDisplayNumber, credentialDisplayType } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";

interface SelectedPassengersSheetProps {
  open: boolean;
  items: PassengerBookInfo[];
  onClose: () => void;
  onRemove: (item: PassengerBookInfo) => void;
}

export function SelectedPassengersSheet({
  open,
  items,
  onClose,
  onRemove,
}: SelectedPassengersSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-background p-4 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">已选择乘客</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">无数据</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {item.credential.Name}
                    {item.credential.OrgName ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.credential.OrgName}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {credentialDisplayType(item.credential)}：{credentialDisplayNumber(item.credential)}
                  </p>
                  {item.credential.Mobile ? (
                    <p className="text-sm text-muted-foreground">{item.credential.Mobile}</p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive"
                  onClick={() => onRemove(item)}
                >
                  移除
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
