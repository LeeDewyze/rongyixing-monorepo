import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  credentialKey,
  maxPassengersForProduct,
  ProductType,
  type FlightAuthorizedContact,
  type FlightOutNumberField,
  type PassengerBookInfo,
  type TrainBookLinkmanDto,
} from "@ryx/shared-types";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FlightBookAddContactSheet } from "@/components/flight/FlightBookAddContactSheet";
import { FlightBookApproverSheet } from "@/components/flight/FlightBookApproverSheet";
import { FlightBookAuthorizedContacts } from "@/components/flight/FlightBookAuthorizedContacts";
import { FlightBookCostCenterSheet } from "@/components/flight/FlightBookCostCenterSheet";
import { FlightBookCredentialSheet } from "@/components/flight/FlightBookCredentialSheet";
import { FlightBookServiceFeeRows } from "@/components/flight/FlightBookExtras";
import { FlightBookNotifyLanguageSheet } from "@/components/flight/FlightBookNotifyLanguageSheet";
import { FlightBookOrganizationSheet } from "@/components/flight/FlightBookOrganizationSheet";
import { FlightBookPayTypes } from "@/components/flight/FlightBookPayTypes";
import { FlightOutNumberPickerSheet } from "@/components/flight/FlightOutNumberPickerSheet";
import { HotelBookOptionRow } from "@/components/hotel/HotelBookOptionRow";
import { usePageHeader } from "@/components/layout";
import { PassengerSelectAlertDialog } from "@/components/passenger";
import { TrainBookFooter } from "@/components/train/TrainBookFooter";
import { TrainBookHeader } from "@/components/train/TrainBookHeader";
import { TrainBookLinkmanCard } from "@/components/train/TrainBookLinkmanCard";
import { TrainBookSubmitConfirmDialog } from "@/components/train/TrainBookSubmitConfirmDialog";
import { TrainBookPassengerCard } from "@/components/train/TrainBookPassengerCard";
import { TrainBookSeatPicker } from "@/components/train/TrainBookSeatPicker";
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
import { buildPassengerSelectPath, clearPassengerSelection } from "@/lib/passenger-selection";
import {
  isBusinessTravelMode,
  loadHomeTravelMode,
  resolveProductChannel,
} from "@/lib/flight-travel-mode";

const FALLBACK_HEADER_HEIGHT = 56;
const TRAIN_PASSENGER_LIMIT = maxPassengersForProduct(ProductType.Train);
const TRAIN_BOOK_PAGE_BACKGROUND = { background: "var(--brand-form-header-gradient)" };

export function TrainBookPage() {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);
  const { selection } = useTrainBookSelection();
  const { selected, setSelected } = usePassengerSelection(ProductType.Train);
  const { showOrganizations, showCostCenter, organizations } = useBookOrgCostVisibility();
  const submitBook = useTrainSubmitBook();
  const submitExchangeBook = useTrainSubmitExchangeBook();
  const exchangeSession = loadTrainExchangeSession();
  const isExchangeBook = Boolean(exchangeSession?.ticketId);
  const travelMode = selection?.travelMode ?? loadHomeTravelMode();
  const isBusinessMode = isBusinessTravelMode(travelMode);
  const productChannel = resolveProductChannel(travelMode);
  const bookReturnTo = "/train/book";

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
  const [orderLinkman, setOrderLinkman] = useState<TrainBookLinkmanDto>({});
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
  const [removePassengerTarget, setRemovePassengerTarget] = useState<PassengerBookInfo | null>(
    null,
  );
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

  useEffect(() => {
    if (bookPassengers.length > TRAIN_PASSENGER_LIMIT) {
      setSelected(bookPassengers.slice(0, TRAIN_PASSENGER_LIMIT));
    }
  }, [bookPassengers, setSelected]);

  const initParams = useMemo(() => {
    if (!selection) return null;
    if (isBusinessMode && bookPassengers.length === 0) return null;
    return buildTrainInitBookDto({
      selection,
      passengers: bookPassengers,
      travelMode,
      channel: productChannel,
      includeTrainOnlyPassenger: !isBusinessMode && bookPassengers.length === 0,
    });
  }, [selection, bookPassengers, isBusinessMode, travelMode, productChannel]);

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

  useEffect(() => {
    if (isBusinessMode) return;
    if (orderLinkman.Name || orderLinkman.Mobile || orderLinkman.Email) return;
    const initialLinkman = initBook.data?.Linkman;
    if (!initialLinkman) return;
    setOrderLinkman({
      Name: initialLinkman.Name ?? "",
      Mobile: initialLinkman.Mobile ?? "",
      Email: initialLinkman.Email ?? "",
    });
  }, [initBook.data?.Linkman, isBusinessMode, orderLinkman.Email, orderLinkman.Mobile, orderLinkman.Name]);

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
  const showPayTypes = isBusinessMode;
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
    contentRef.current?.scrollTo({ top: 0 });
    scrollH5MainToTop();
  }, []);

  function resolveSubmitValidationError(): string | null {
    return validateTrainBookForms({
      passengers: bookPassengers,
      forms,
      outNumberFieldsByPassenger,
      authorizedContacts,
      orderLinkman,
      requireOrderLinkman: !isBusinessMode,
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

  function removePassengerFromBook(target: PassengerBookInfo) {
    const targetKey = credentialKey(target.credential);
    const targetAccountId =
      ("AccountId" in target.passenger ? target.passenger.AccountId : undefined) ??
      target.credential.AccountId;
    const nextPassengers = bookPassengers.filter((item) => {
      const sameCredential = credentialKey(item.credential) === targetKey;
      const itemAccountId =
        ("AccountId" in item.passenger ? item.passenger.AccountId : undefined) ??
        item.credential.AccountId;
      const sameAccount =
        targetAccountId != null &&
        itemAccountId != null &&
        String(itemAccountId) === String(targetAccountId);
      return !sameCredential && !sameAccount;
    });
    setSelected(nextPassengers);
    setBookSeatLocations((current) => current.slice(0, nextPassengers.length));
    setRemovePassengerTarget(null);
  }

  async function executeSubmit(isOfficialBooked: boolean) {
    if (!selection) return;

    const bookDto = buildTrainOrderBookDto({
      selection,
      passengers: bookPassengers,
      passengerForms: forms,
      travelPayType: resolvedPayType,
      authorizedContacts: isBusinessMode ? authorizedContacts : [],
      orderLinkman: isBusinessMode ? undefined : orderLinkman,
      bookSeatLocations: bookSeatLocations.some(Boolean) ? bookSeatLocations : undefined,
      isOfficialBooked,
      accountNumber12306: initBook.data?.AccountNumber12306?.Name,
      globalNotifyLanguage: notifyLanguage,
      exchangeTicketId: exchangeSession?.ticketId,
      travelMode,
      channel: productChannel,
    });

    const isExchange = Boolean(exchangeSession?.ticketId);
    const submitMutation = isExchange ? submitExchangeBook : submitBook;

    try {
      const response = await submitMutation.mutateAsync(bookDto);
      const orderId = resolveTrainBookOrderId(response);
      const payType = resolvedPayType;

      leavingAfterSubmitRef.current = true;

      if (response.IsCheckPay && response.TradeNo) {
        const checkPayReady = await pollTrainCheckPay(response.TradeNo, {
          channel: productChannel,
          productType: "Train",
        });
        if (shouldNavigateToPay({ travelPayType: payType, checkPayReady }) && orderId) {
          clearTrainBookSelection();
          clearPassengerSelection(ProductType.Train);
          if (isExchange) {
            clearTrainExchangeSession();
          }
          const payPath =
            productChannel === "tourist"
              ? `/train/pay/${encodeURIComponent(orderId)}?channel=tourist`
              : `/train/pay/${encodeURIComponent(orderId)}`;
          navigate(payPath, { replace: true });
          return;
        }
      }

      clearTrainBookSelection();
      clearPassengerSelection(ProductType.Train);
      if (isExchange) {
        clearTrainExchangeSession();
      }

      if (orderId) {
        const detailPath =
          productChannel === "tourist"
            ? `/orders/train/${encodeURIComponent(orderId)}?channel=tourist`
            : `/orders/train/${encodeURIComponent(orderId)}`;
        navigate(detailPath, {
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
      <div className="relative h-dvh overflow-hidden" style={TRAIN_BOOK_PAGE_BACKGROUND}>
        <TrainBookHeader ref={headerRef} />
        <div
          className="absolute inset-x-0 bottom-0 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ top: headerHeight }}
        >
          <p className="p-6 text-center text-sm text-[#999999]">加载预订信息…</p>
        </div>
      </div>
    );
  }

  if (initBook.error && bookPassengers.length > 0) {
    return (
      <div className="relative h-dvh overflow-hidden" style={TRAIN_BOOK_PAGE_BACKGROUND}>
        <TrainBookHeader ref={headerRef} />
        <div
          className="absolute inset-x-0 bottom-0 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ top: headerHeight }}
        >
          <p className="p-6 text-center text-sm text-[#ff4d4f]">
            {formatApiError(initBook.error, "train")}
          </p>
        </div>
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
    <div className="relative h-dvh overflow-hidden" style={TRAIN_BOOK_PAGE_BACKGROUND}>
      <TrainBookHeader ref={headerRef} />

      <div
        ref={contentRef}
        className="absolute inset-x-0 bottom-0 overflow-y-auto overscroll-contain pb-[calc(8.5rem+env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ top: headerHeight }}
      >
        <TrainBookSummary selection={selection} />

        <div className="space-y-3 px-3">
          <section className="overflow-hidden rounded-xl bg-white px-3.5 shadow-sm ring-1 ring-[#EEF1F6]">
            <h2 className="border-b border-[#F0F2F5] py-3 text-[15px] font-semibold text-[#111111]">
              旅客信息
            </h2>

            {bookPassengers.length === 0 ? (
              <div className="flex items-center justify-between py-3">
                <p className="text-[13px] text-[#999999]">请选择乘车人</p>
                <Link
                  to={buildPassengerSelectPath(ProductType.Train, bookReturnTo)}
                  className="rounded-full bg-brand-primary px-3 py-1.5 text-[13px] font-medium text-white active:opacity-80"
                >
                  添加旅客
                </Link>
              </div>
            ) : (
              <>
                {bookPassengers.map((passenger) => {
                  const form = forms[passenger.id];
                  if (!form) return null;
                  const serviceFee = resolvePassengerServiceFee(
                    passenger,
                    initBook.data?.ServiceFees,
                  );
                  const outNumberFields = outNumberFieldsByPassenger[passenger.id] ?? [];
                  const requiresApprover = passengerRequiresTrainApprover(
                    passenger,
                    initBook.data?.Staffs,
                  );

                  return (
                  <TrainBookPassengerCard
                    key={passenger.id}
                    grouped
                    passenger={passenger}
                    form={form}
                    showOrganizations={isBusinessMode && showOrganizations}
                    showCostCenter={isBusinessMode && showCostCenter}
                    requiresApprover={requiresApprover}
                    isSkipApproveEnabled={Boolean(initBook.data?.isSkipApprove)}
                    outNumberFields={outNumberFields}
                    illegalReasons={initBook.data?.IllegalReasons ?? []}
                    expenseTypes={expenseTypeOptions}
                    requiresIllegalReason={requiresIllegalReason}
                    onRemove={
                      !isBusinessMode && !isExchangeBook
                        ? () => setRemovePassengerTarget(passenger)
                        : undefined
                    }
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

                {!isBusinessMode && !isExchangeBook ? (
                  <Link
                    to={buildPassengerSelectPath(ProductType.Train, bookReturnTo)}
                    className="flex h-11 items-center justify-center gap-1.5 text-[14px] font-medium text-brand-primary active:opacity-80"
                  >
                    <span className="text-[18px] leading-none" aria-hidden>
                      +
                    </span>
                    添加旅客
                  </Link>
                ) : null}
              </>
            )}
          </section>

          {!isBusinessMode ? (
            <TrainBookLinkmanCard
              linkman={orderLinkman}
              onChange={(patch) =>
                setOrderLinkman((current) => ({
                  ...current,
                  ...patch,
                }))
              }
            />
          ) : null}

          {showSeatPicker && bookPassengers.length > 0 && !isExchangeBook ? (
            <TrainBookSeatPicker
              seatType={selection.seat.SeatType}
              passengerCount={Math.min(bookPassengers.length, TRAIN_PASSENGER_LIMIT)}
              value={bookSeatLocations}
              onChange={setBookSeatLocations}
            />
          ) : null}

          {isBusinessMode && isDisplayNotifyLanguage ? (
            <HotelBookOptionRow
              label="通知语言"
              value={formatFlightNotifyLanguage(notifyLanguage)}
              onClick={() => {
                setNotifyLanguageTarget("order");
                setNotifyLanguageOpen(true);
              }}
            />
          ) : null}

          {isBusinessMode ? (
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
          ) : null}

          {showPayTypes ? (
            <FlightBookPayTypes
              options={payOptions}
              value={resolvedPayType}
              personHoldMinutes={personHoldMinutes}
              onChange={setTravelPayType}
            />
          ) : null}
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

      <ConfirmDialog
        open={removePassengerTarget != null}
        title="移除旅客"
        message={
          removePassengerTarget
            ? `确定从当前订单移除「${removePassengerTarget.credential.Name ?? "该旅客"}」？`
            : ""
        }
        confirmLabel="移除"
        variant="destructive"
        onConfirm={() => {
          if (removePassengerTarget) {
            removePassengerFromBook(removePassengerTarget);
          }
        }}
        onCancel={() => setRemovePassengerTarget(null)}
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
        channel={productChannel}
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
