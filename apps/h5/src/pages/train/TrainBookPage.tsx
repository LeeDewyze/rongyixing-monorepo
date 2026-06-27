import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ProductType,
  type FlightAuthorizedContact,
  type FlightOutNumberField,
  type PassengerBookInfo,
} from "@ryx/shared-types";

import { FlightBookAddContactSheet } from "@/components/flight/FlightBookAddContactSheet";
import { FlightBookApproverSheet } from "@/components/flight/FlightBookApproverSheet";
import { FlightBookAuthorizedContacts } from "@/components/flight/FlightBookAuthorizedContacts";
import { FlightBookCostCenterSheet } from "@/components/flight/FlightBookCostCenterSheet";
import { FlightBookCredentialSheet } from "@/components/flight/FlightBookCredentialSheet";
import { FlightBookServiceFeeRows } from "@/components/flight/FlightBookExtras";
import { FlightBookNotifyLanguageSheet } from "@/components/flight/FlightBookNotifyLanguageSheet";
import { FlightBookOrganizationSheet } from "@/components/flight/FlightBookOrganizationSheet";
import { FlightBookPassengerSection } from "@/components/flight/FlightBookPassengerSection";
import { FlightBookPayTypes } from "@/components/flight/FlightBookPayTypes";
import { FlightOutNumberPickerSheet } from "@/components/flight/FlightOutNumberPickerSheet";
import { HotelBookOptionRow } from "@/components/hotel/HotelBookOptionRow";
import { usePageHeader } from "@/components/layout";
import { PassengerSelectAlertDialog } from "@/components/passenger";
import { TrainBookFooter } from "@/components/train/TrainBookFooter";
import { TrainBookHeader } from "@/components/train/TrainBookHeader";
import { TrainBookSubmitConfirmDialog } from "@/components/train/TrainBookSubmitConfirmDialog";
import { TrainBookPassengerCard } from "@/components/train/TrainBookPassengerCard";
import {
  TrainBookPassengerSeatPicker,
  togglePassengerSeatSelection,
} from "@/components/train/TrainBookSeatPicker";
import { TrainBookSummary } from "@/components/train/TrainBookSummary";
import { useBookOrgCostVisibility } from "@/hooks/useBookOrgCostVisibility";
import { usePassengerSelection } from "@/hooks/usePassenger";
import { useTrainBookPassengerForms } from "@/hooks/useTrainBookPassengerForms";
import {
  useTrainBookSelection,
  useTrainInitBook,
  useTrainSubmitBook,
  useTrainSubmitExchangeBook,
} from "@/hooks/useTrainBook";
import {
  accountIdFromNotifyTarget,
  authorizedContactNotifyTarget,
  isAuthorizedContactNotifyTarget,
} from "@/lib/flight-book-contacts";
import {
  FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  formatFlightNotifyLanguage,
  type FlightNotifyLanguage,
} from "@/lib/flight-book-notify";
import { replacePassengerCredential } from "@/lib/passenger-select-logic";
import { TAB_ID_TO_PARAM } from "@/lib/order-list-params";
import { formatApiError } from "@/lib/formatApiError";
import { scrollH5MainToTop } from "@/lib/scroll-h5-main";
import {
  buildTrainInitBookDto,
  buildTrainOrderBookDto,
  buildTrainPassengerOutNumberFieldsMap,
  canSelectTrainSeat,
  resolveTrainBookDisplayAmount,
  resolveTrainBookBillBreakdown,
  resolveTrainBookOrderId,
  resolvePassengerServiceFee,
  validateTrainBookForms,
  passengerRequiresTrainApprover,
} from "@/lib/train-book";
import {
  parseTrainPayTypeOptions,
  resolveDefaultTrainPayType,
  resolveTrainBookTmcFlags,
  resolveTrainHoldMinutes,
} from "@/lib/train-book-pay";
import { pollTrainCheckPay, shouldNavigateToPay } from "@/lib/train-book-check-pay";
import { clearTrainBookSelection } from "@/lib/train-book-session";
import { clearTrainExchangeSession, loadTrainExchangeSession } from "@/lib/train-exchange-session";
import { clearPassengerSelection } from "@/lib/passenger-selection";

const FALLBACK_HEADER_HEIGHT = 56;

export function TrainBookPage() {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);
  const { selection } = useTrainBookSelection();
  const { selected, setSelected } = usePassengerSelection(ProductType.Train);
  const { showOrganizations, showCostCenter, organizations } = useBookOrgCostVisibility();
  const submitBook = useTrainSubmitBook();
  const submitExchangeBook = useTrainSubmitExchangeBook();
  const exchangeSession = loadTrainExchangeSession();

  const [redirecting, setRedirecting] = useState(false);
  const [travelPayType, setTravelPayType] = useState<number | null>(null);
  const [bookSeatLocations, setBookSeatLocations] = useState<string[]>([]);
  const [billOpen, setBillOpen] = useState(false);
  const [authorizedContacts, setAuthorizedContacts] = useState<FlightAuthorizedContact[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [notifyLanguageOpen, setNotifyLanguageOpen] = useState(false);
  const [notifyLanguageTarget, setNotifyLanguageTarget] = useState<string>("order");
  const [notifyLanguage, setNotifyLanguage] = useState<FlightNotifyLanguage>(
    FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  );
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [approverSheetOpen, setApproverSheetOpen] = useState(false);
  const [approverPassengerId, setApproverPassengerId] = useState<string | null>(null);
  const [orgSheetPassengerId, setOrgSheetPassengerId] = useState<string | null>(null);
  const [costSheetPassengerId, setCostSheetPassengerId] = useState<string | null>(null);
  const [credentialSheetPassenger, setCredentialSheetPassenger] =
    useState<PassengerBookInfo | null>(null);
  const [outNumberPicker, setOutNumberPicker] = useState<{
    passengerId: string;
    field: FlightOutNumberField;
  } | null>(null);
  const [directBookConfirmOpen, setDirectBookConfirmOpen] = useState(false);
  /** Skip guard redirect when leaving after a successful submit. */
  const leavingAfterSubmitRef = useRef(false);

  usePageHeader({ visible: false });

  useEffect(() => {
    if (leavingAfterSubmitRef.current) return;
    if (!selection && !redirecting) {
      setRedirecting(true);
      navigate("/home?product=train", { replace: true });
    }
  }, [selection, redirecting, navigate]);

  useEffect(() => {
    if (!selected.length && selection?.passengers?.length) {
      setSelected(selection.passengers);
    }
  }, [selection?.passengers, selected.length, setSelected]);

  const bookPassengers = useMemo(() => {
    if (selected.length > 0) return selected;
    return selection?.passengers ?? [];
  }, [selected, selection?.passengers]);

  const initParams = useMemo(() => {
    if (!selection || bookPassengers.length === 0) return null;
    return buildTrainInitBookDto({ selection, passengers: bookPassengers });
  }, [selection, bookPassengers]);

  const initBook = useTrainInitBook(initParams);
  const { forms, updateForm, toggleExpanded } = useTrainBookPassengerForms(
    bookPassengers,
    initBook.data?.Staffs,
  );

  useEffect(() => {
    setBookSeatLocations((current) =>
      Array.from({ length: bookPassengers.length }, (_, index) => current[index] ?? ""),
    );
  }, [bookPassengers.length]);

  const payOptions = useMemo(
    () => parseTrainPayTypeOptions(initBook.data?.PayTypes),
    [initBook.data?.PayTypes],
  );

  const resolvedPayType = travelPayType ?? resolveDefaultTrainPayType(payOptions);
  const { isShowServiceFee, isDisplayNotifyLanguage } = resolveTrainBookTmcFlags(initBook.data);
  const personHoldMinutes = resolveTrainHoldMinutes(initBook.data);
  const outNumberFieldsByPassenger = useMemo(
    () => buildTrainPassengerOutNumberFieldsMap(initBook.data, bookPassengers),
    [initBook.data, bookPassengers],
  );

  const displayAmount = useMemo(() => {
    if (!selection) return 0;
    return resolveTrainBookDisplayAmount(selection, bookPassengers, initBook.data?.ServiceFees);
  }, [selection, bookPassengers, initBook.data?.ServiceFees]);

  const billBreakdown = useMemo(() => {
    if (!selection || bookPassengers.length === 0) return null;
    return resolveTrainBookBillBreakdown({
      selection,
      passengers: bookPassengers,
      serviceFees: initBook.data?.ServiceFees,
    });
  }, [selection, bookPassengers, initBook.data?.ServiceFees]);

  const expenseTypeOptions = useMemo(
    () =>
      (initBook.data?.ExpenseTypes ?? []).map((item) => ({
        id: item.Id,
        name: item.Name,
      })),
    [initBook.data?.ExpenseTypes],
  );

  const requiresIllegalReason = Boolean(selection?.policy?.Rules?.length);
  const isInitBlocking = initBook.isFetching && !initBook.data;
  const isSubmitDisabled =
    bookPassengers.length === 0 ||
    isInitBlocking ||
    submitBook.isPending ||
    submitExchangeBook.isPending;
  const showSeatPicker = selection ? canSelectTrainSeat(selection.seat.SeatType) : false;

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => setHeaderHeight(header.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scrollH5MainToTop();
  }, []);

  function resolveSubmitValidationError(): string | null {
    return validateTrainBookForms({
      passengers: bookPassengers,
      forms,
      outNumberFieldsByPassenger,
      authorizedContacts,
      staffs: initBook.data?.Staffs,
      requireIllegalReason: requiresIllegalReason,
    });
  }

  function handleSubmitClick(isOfficialBooked: boolean) {
    if (!selection) return;

    const validationError = resolveSubmitValidationError();
    if (validationError) {
      setAlertMessage(validationError);
      return;
    }

    if (isOfficialBooked) {
      void executeSubmit(true);
      return;
    }

    setDirectBookConfirmOpen(true);
  }

  async function executeSubmit(isOfficialBooked: boolean) {
    if (!selection) return;

    const bookDto = buildTrainOrderBookDto({
      selection,
      passengers: bookPassengers,
      passengerForms: forms,
      travelPayType: resolvedPayType,
      authorizedContacts,
      bookSeatLocations: bookSeatLocations.some(Boolean) ? bookSeatLocations : undefined,
      isOfficialBooked,
      accountNumber12306: initBook.data?.AccountNumber12306?.Name,
      globalNotifyLanguage: notifyLanguage,
      exchangeTicketId: exchangeSession?.ticketId,
    });

    const isExchange = Boolean(exchangeSession?.ticketId);
    const submitMutation = isExchange ? submitExchangeBook : submitBook;

    try {
      const response = await submitMutation.mutateAsync(bookDto);
      const orderId = resolveTrainBookOrderId(response);
      const payType = resolvedPayType;

      leavingAfterSubmitRef.current = true;

      if (response.IsCheckPay && response.TradeNo) {
        const checkPayReady = await pollTrainCheckPay(response.TradeNo);
        if (shouldNavigateToPay({ travelPayType: payType, checkPayReady }) && orderId) {
          clearTrainBookSelection();
          clearPassengerSelection(ProductType.Train);
          if (isExchange) {
            clearTrainExchangeSession();
          }
          navigate(`/train/pay/${encodeURIComponent(orderId)}`, { replace: true });
          return;
        }
      }

      clearTrainBookSelection();
      clearPassengerSelection(ProductType.Train);
      if (isExchange) {
        clearTrainExchangeSession();
      }

      if (orderId) {
        navigate(`/orders/train/${encodeURIComponent(orderId)}`, {
          replace: true,
          state: { bookedOrderId: orderId, product: "train" },
        });
        return;
      }

      navigate(`/home/orders?tab=${TAB_ID_TO_PARAM.train}`, { replace: true });
    } catch (error) {
      setAlertMessage(formatApiError(error, "train"));
    } finally {
      setDirectBookConfirmOpen(false);
    }
  }

  if (!selection) return null;

  if (initBook.isLoading) {
    return (
      <div className="relative min-h-dvh bg-[#F5F6F9]">
        <TrainBookHeader ref={headerRef} />
        <p className="p-6 text-center text-sm text-[#999999]">加载预订信息…</p>
      </div>
    );
  }

  if (initBook.error) {
    return (
      <div className="relative min-h-dvh bg-[#F5F6F9]">
        <TrainBookHeader ref={headerRef} />
        <p className="p-6 text-center text-sm text-[#ff4d4f]">
          {formatApiError(initBook.error, "train")}
        </p>
      </div>
    );
  }

  const notifyLanguageValue =
    notifyLanguageTarget === "order"
      ? notifyLanguage
      : ((authorizedContacts.find(
          (item) =>
            item.accountId ===
            (isAuthorizedContactNotifyTarget(notifyLanguageTarget)
              ? accountIdFromNotifyTarget(notifyLanguageTarget)
              : notifyLanguageTarget),
        )?.notifyLanguage ?? FLIGHT_NOTIFY_LANGUAGE_DEFAULT) as FlightNotifyLanguage);

  return (
    <div className="relative min-h-dvh bg-[#F5F6F9]">
      <TrainBookHeader ref={headerRef} />

      <div
        className="pb-[calc(8.5rem+env(safe-area-inset-bottom))]"
        style={{ paddingTop: headerHeight }}
      >
        <TrainBookSummary selection={selection} />

        <div className="space-y-3 px-3">
          {bookPassengers.map((passenger, index) => {
            const form = forms[passenger.id];
            if (!form) return null;
            const serviceFee = resolvePassengerServiceFee(passenger, initBook.data?.ServiceFees);
            const outNumberFields = outNumberFieldsByPassenger[passenger.id] ?? [];
            const requiresApprover = passengerRequiresTrainApprover(
              passenger,
              initBook.data?.Staffs,
            );

            return (
              <FlightBookPassengerSection
                key={passenger.id}
                passengerIndex={bookPassengers.length > 1 ? index + 1 : undefined}
                passengers={
                  <TrainBookPassengerCard
                    passenger={passenger}
                    form={form}
                    showOrganizations={showOrganizations}
                    showCostCenter={showCostCenter}
                    requiresApprover={requiresApprover}
                    isSkipApproveEnabled={Boolean(initBook.data?.isSkipApprove)}
                    outNumberFields={outNumberFields}
                    illegalReasons={initBook.data?.IllegalReasons ?? []}
                    expenseTypes={expenseTypeOptions}
                    requiresIllegalReason={requiresIllegalReason}
                    onUpdateForm={updateForm}
                    onToggleExpanded={() => toggleExpanded(passenger.id)}
                    onOpenOrganization={() => setOrgSheetPassengerId(passenger.id)}
                    onOpenCostCenter={() => setCostSheetPassengerId(passenger.id)}
                    onOpenApprover={() => {
                      setApproverPassengerId(passenger.id);
                      setApproverSheetOpen(true);
                    }}
                    onOpenOutNumberPicker={(field) =>
                      setOutNumberPicker({ passengerId: passenger.id, field })
                    }
                    onChangeCredential={setCredentialSheetPassenger}
                  />
                }
                seatPicker={
                  showSeatPicker ? (
                    <TrainBookPassengerSeatPicker
                      seatType={selection.seat.SeatType}
                      value={bookSeatLocations[index] ?? ""}
                      showDisclaimer={index === bookPassengers.length - 1}
                      onChange={(code) =>
                        setBookSeatLocations((current) =>
                          togglePassengerSeatSelection(current, index, bookPassengers.length, code),
                        )
                      }
                    />
                  ) : null
                }
                serviceFee={
                  isShowServiceFee && serviceFee > 0 ? (
                    <FlightBookServiceFeeRows
                      sectioned
                      serviceFees={[
                        {
                          passengerId: passenger.id,
                          passengerName: passenger.credential.Name ?? "",
                          fee: serviceFee,
                        },
                      ]}
                    />
                  ) : null
                }
              />
            );
          })}

          {isDisplayNotifyLanguage ? (
            <HotelBookOptionRow
              label="通知语言"
              value={formatFlightNotifyLanguage(notifyLanguage)}
              onClick={() => {
                setNotifyLanguageTarget("order");
                setNotifyLanguageOpen(true);
              }}
            />
          ) : null}

          <FlightBookAuthorizedContacts
            contacts={authorizedContacts}
            onAdd={() => setAddContactOpen(true)}
            onRemove={(accountId) =>
              setAuthorizedContacts((current) =>
                current.filter((item) => item.accountId !== accountId),
              )
            }
            onUpdate={(accountId, patch) =>
              setAuthorizedContacts((current) =>
                current.map((item) =>
                  item.accountId === accountId ? { ...item, ...patch } : item,
                ),
              )
            }
            onOpenNotifyLanguage={(accountId) => {
              setNotifyLanguageTarget(authorizedContactNotifyTarget(accountId));
              setNotifyLanguageOpen(true);
            }}
          />

          <FlightBookPayTypes
            options={payOptions}
            value={resolvedPayType}
            personHoldMinutes={personHoldMinutes}
            onChange={setTravelPayType}
          />
        </div>
      </div>

      <TrainBookFooter
        amount={displayAmount}
        disabled={isSubmitDisabled}
        pending={submitBook.isPending || submitExchangeBook.isPending}
        billOpen={billOpen}
        billBreakdown={billBreakdown}
        showOfficialBook={false}
        showDirectBook={initBook.data?.IsShowDirectBooked !== false}
        onBillToggle={() => setBillOpen((open) => !open)}
        onOfficialBook={() => handleSubmitClick(true)}
        onDirectBook={() => handleSubmitClick(false)}
      />

      <TrainBookSubmitConfirmDialog
        open={directBookConfirmOpen}
        pending={submitBook.isPending || submitExchangeBook.isPending}
        onCancel={() => {
          if (!submitBook.isPending && !submitExchangeBook.isPending)
            setDirectBookConfirmOpen(false);
        }}
        onConfirm={() => void executeSubmit(false)}
      />

      <FlightBookNotifyLanguageSheet
        open={notifyLanguageOpen}
        value={notifyLanguageValue as FlightNotifyLanguage}
        onClose={() => setNotifyLanguageOpen(false)}
        onSelect={(value) => {
          if (notifyLanguageTarget === "order") {
            setNotifyLanguage(value);
          } else {
            const accountId = isAuthorizedContactNotifyTarget(notifyLanguageTarget)
              ? accountIdFromNotifyTarget(notifyLanguageTarget)
              : notifyLanguageTarget;
            setAuthorizedContacts((current) =>
              current.map((item) =>
                item.accountId === accountId ? { ...item, notifyLanguage: value } : item,
              ),
            );
          }
          setNotifyLanguageOpen(false);
        }}
      />

      <FlightBookAddContactSheet
        open={addContactOpen}
        existingAccountIds={authorizedContacts.map((item) => item.accountId)}
        onClose={() => setAddContactOpen(false)}
        onSelect={(contact) => {
          setAuthorizedContacts((current) => [...current, contact]);
          setAddContactOpen(false);
        }}
      />

      <FlightBookCredentialSheet
        open={Boolean(credentialSheetPassenger)}
        passenger={credentialSheetPassenger}
        onClose={() => setCredentialSheetPassenger(null)}
        onSelect={(credential) => {
          if (!credentialSheetPassenger) return;
          setSelected(
            replacePassengerCredential(bookPassengers, credentialSheetPassenger, credential),
          );
          setCredentialSheetPassenger(null);
        }}
      />

      <FlightBookApproverSheet
        open={approverSheetOpen}
        onClose={() => setApproverSheetOpen(false)}
        onSelect={(approver) => {
          if (approverPassengerId) {
            updateForm(approverPassengerId, {
              approvalId: approver.accountId,
              approvalName: approver.name,
            });
          }
          setApproverSheetOpen(false);
        }}
      />

      <FlightBookOrganizationSheet
        open={orgSheetPassengerId != null}
        organizations={organizations}
        selectedCode={
          orgSheetPassengerId ? forms[orgSheetPassengerId]?.organization.code : undefined
        }
        onClose={() => setOrgSheetPassengerId(null)}
        onSelect={(organization) => {
          if (!orgSheetPassengerId) return;
          updateForm(orgSheetPassengerId, {
            organization,
            otherOrganizationName: "",
          });
          setOrgSheetPassengerId(null);
        }}
      />

      <FlightBookCostCenterSheet
        open={costSheetPassengerId != null}
        selectedCode={
          costSheetPassengerId ? forms[costSheetPassengerId]?.costCenter.code : undefined
        }
        onClose={() => setCostSheetPassengerId(null)}
        onSelect={(costCenter) => {
          if (!costSheetPassengerId) return;
          updateForm(costSheetPassengerId, {
            costCenter,
            otherCostCenterName: "",
            otherCostCenterCode: "",
          });
          setCostSheetPassengerId(null);
        }}
      />

      <FlightOutNumberPickerSheet
        open={Boolean(outNumberPicker)}
        field={outNumberPicker?.field ?? null}
        selected={
          outNumberPicker
            ? forms[outNumberPicker.passengerId]?.outNumbers[outNumberPicker.field.key]
            : undefined
        }
        onClose={() => setOutNumberPicker(null)}
        onSelect={(value) => {
          if (!outNumberPicker) return;
          updateForm(outNumberPicker.passengerId, {
            outNumbers: {
              ...forms[outNumberPicker.passengerId]!.outNumbers,
              [outNumberPicker.field.key]: value,
            },
          });
          setOutNumberPicker(null);
        }}
      />

      <PassengerSelectAlertDialog
        open={Boolean(alertMessage)}
        message={alertMessage ?? ""}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}
