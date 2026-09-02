import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookingSubmitTransition } from "@ryx/ui/components/booking/booking-submit-transition";
import {
  ProductType,
  type FlightAuthorizedContact,
  type FlightBookLinkmanDto,
  type FlightOutNumberField,
  type PassengerBookInfo,
} from "@ryx/shared-types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FlightBookAgentPicker } from "@/components/flight/FlightBookAgentPicker";
import { FlightBookApproverSheet } from "@/components/flight/FlightBookApproverSheet";
import { FlightBookCostCenterSheet } from "@/components/flight/FlightBookCostCenterSheet";
import { FlightBookCredentialSheet } from "@/components/flight/FlightBookCredentialSheet";
import { FlightBookAddContactSheet } from "@/components/flight/FlightBookAddContactSheet";
import { FlightBookOrganizationSheet } from "@/components/flight/FlightBookOrganizationSheet";
import { FlightBookAuthorizedContacts } from "@/components/flight/FlightBookAuthorizedContacts";
import { FlightBookFooter } from "@/components/flight/FlightBookFooter";
import {
  FlightBookInsurance,
  resolveInsuranceAmount,
  resolvePassengerInsuranceProducts,
} from "@/components/flight/FlightBookInsurance";
import { FlightBookNotifyLanguageSheet } from "@/components/flight/FlightBookNotifyLanguageSheet";
import {
  FlightBookNotifyLanguageRow,
  FlightBookServiceFeeRows,
} from "@/components/flight/FlightBookExtras";
import {
  FlightBookPassengers,
  FlightBookPassengerCard,
} from "@/components/flight/FlightBookPassengers";
import { FlightBookPassengerSection } from "@/components/flight/FlightBookPassengerSection";
import { FlightBookPayTypes } from "@/components/flight/FlightBookPayTypes";
import { FlightOutNumberPickerSheet } from "@/components/flight/FlightOutNumberPickerSheet";
import { FlightBookPickerSheet } from "@/components/flight/FlightBookPickerSheet";
import { FlightBookPolicyBanner } from "@/components/flight/FlightBookPolicyBanner";
import { FlightBookSummary } from "@/components/flight/FlightBookSummary";
import {
  FlightBookTravelSection,
  buildPassengerOutNumberFieldsMap,
} from "@/components/flight/FlightBookTravelSection";
import { FlightCabinsHeader } from "@/components/flight/FlightCabinsHeader";
import { FlightBookTicketNoticeSheet } from "@/components/flight/FlightBookTicketNoticeSheet";
import { FlightFareRulesSheet } from "@/components/flight/FlightFareRulesSheet";
import { usePageHeader } from "@/components/layout";
import { PassengerSelectAlertDialog } from "@/components/passenger";
import { TrainBookLinkmanCard } from "@/components/train/TrainBookLinkmanCard";
import { useFlightPriceTimeout } from "@/hooks/useFlightPriceTimeout";
import { useBookOrgCostVisibility } from "@/hooks/useBookOrgCostVisibility";
import { useFlightBookPassengerForms } from "@/hooks/useFlightBookPassengerForms";
import { useIdentity } from "@/hooks/useIdentity";
import {
  useFlightBookSelection,
  useFlightInitBook,
  useFlightSubmitBook,
  useFlightValidateBook,
} from "@/hooks/useFlightBook";
import { shouldShowApproverPicker } from "@/lib/flight-book-approval";
import {
  buildFlightExchangeBookDto,
  buildFlightInitBookDto,
  buildFlightOrderBookDto,
  resolveFlightBookBillBreakdown,
  resolveFlightBookDisplayAmount,
  resolveFlightBookOrderId,
  resolveFlightTicketNoticeRules,
  resolvePassengerServiceFee,
  validateFlightOrderLinkman,
} from "@/lib/flight-book";
import {
  FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  type FlightNotifyLanguage,
} from "@/lib/flight-book-notify";
import {
  FLIGHT_PAY_TYPE_PERSON,
  parseFlightPayTypeOptions,
  resolveDefaultFlightPayType,
  resolveInitialFlightBookAgentId,
  resolveFlightBookTmcFlags,
  resolveFlightHoldMinutes,
} from "@/lib/flight-book-pay";
import { findInitStaffForPassenger } from "@/lib/flight-book-passenger-form";
import {
  isMandatoryFlightInsurance,
  resolveForcedInsuranceProductId,
  validateAllPassengerInsuranceSelections,
} from "@/lib/flight-book-insurance";
import {
  filterFlightExpenseTypes,
  resolveDefaultExpenseType,
  resolvePrimaryTravelPassenger,
  validateAllPassengerTravelInfo,
} from "@/lib/flight-book-travel";
import { canSaveFlightOrder } from "@/lib/flight-book-save-order";
import { resolvePassengerPolicyFromSelection } from "@/lib/flight-book-policy";
import {
  buildCabinsHref,
  clearFlightBookSelection,
  markFlightBookExitToHome,
  type FlightBookSelection,
} from "@/lib/flight-book-session";
import { navigateBack } from "@/lib/navigation";
import { useBusinessSelfBookPassenger } from "@/hooks/useBusinessSelfBookPassenger";
import { replacePassengerCredential } from "@/lib/passenger-select-logic";
import {
  accountIdFromNotifyTarget,
  authorizedContactNotifyTarget,
  isAuthorizedContactNotifyTarget,
  validateAuthorizedContacts,
} from "@/lib/flight-book-contacts";
import {
  validatePassengerBookForms,
  resolvePassengerFormMobile,
} from "@/lib/flight-book-passenger-form";
import { isFlightListTimedOut, buildFlightListRefreshHref } from "@/lib/flight-list-refresh";
import { formatApiError } from "@/lib/formatApiError";
import { clearPassengerSelection } from "@/lib/passenger-selection";
import { pollFlightCheckPay, shouldNavigateToPay } from "@/lib/flight-book-check-pay";
import { clearFlightExchangeSession } from "@/lib/flight-exchange-session";
import {
  isBusinessTravelMode,
  loadHomeTravelMode,
  resolveProductChannel,
} from "@/lib/flight-travel-mode";
import { WEB_PAGE_BODY, WEB_PAGE_ROOT, WEB_PAGE_STICKY_HEADER } from "@/lib/web-page-layout";

const FLIGHT_BOOK_PAGE_BACKGROUND = { background: "var(--brand-form-header-gradient)" };

function shouldValidateTouristFlightBook(selection: FlightBookSelection): boolean {
  const fare = selection.fare as {
    IsAgreement?: boolean;
    FareType?: number | string;
    FareTypeName?: string;
    TypeName?: string;
  };
  const segment = selection.segment as { IsAgreement?: boolean };
  const text = `${fare.FareTypeName ?? ""}${fare.TypeName ?? ""}`;
  return (
    Boolean(fare.IsAgreement || segment.IsAgreement) ||
    text.includes("协议") ||
    text.includes("军警") ||
    String(fare.FareType ?? "") === "3"
  );
}

export function FlightBookPage() {
  const navigate = useNavigate();
  const skipEmptySelectionRedirectRef = useRef(false);
  const { selection } = useFlightBookSelection();
  const submitBook = useFlightSubmitBook();
  const validateBook = useFlightValidateBook();

  const [travelPayType, setTravelPayType] = useState<number | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingPay, setCheckingPay] = useState(false);
  const [isLeavingAfterSubmit, setIsLeavingAfterSubmit] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [ticketNoticeOpen, setTicketNoticeOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [notifyLanguageOpen, setNotifyLanguageOpen] = useState(false);
  const [notifyLanguageTarget, setNotifyLanguageTarget] = useState<"order" | string>("order");
  const [notifyLanguage, setNotifyLanguage] = useState<FlightNotifyLanguage>(
    FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  );
  const [authorizedContacts, setAuthorizedContacts] = useState<FlightAuthorizedContact[]>([]);
  const [orderLinkman, setOrderLinkman] = useState<FlightBookLinkmanDto>({});
  const [removePassengerTarget, setRemovePassengerTarget] = useState<PassengerBookInfo | null>(
    null,
  );
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [orgSheetPassengerId, setOrgSheetPassengerId] = useState<string | null>(null);
  const [costSheetPassengerId, setCostSheetPassengerId] = useState<string | null>(null);
  const [credentialSheetPassenger, setCredentialSheetPassenger] = useState<
    import("@ryx/shared-types").PassengerBookInfo | null
  >(null);
  const [illegalReasonPassengerId, setIllegalReasonPassengerId] = useState<string | null>(null);
  const [expensePassengerId, setExpensePassengerId] = useState<string | null>(null);
  const [approverPassengerId, setApproverPassengerId] = useState<string | null>(null);
  const [outNumberPicker, setOutNumberPicker] = useState<{
    passengerId: string;
    field: FlightOutNumberField;
  } | null>(null);

  const { data: identity } = useIdentity();
  const returnTo = "/flight/book";
  const travelMode = selection?.travelMode ?? loadHomeTravelMode();
  const isBusinessMode = isBusinessTravelMode(travelMode);
  const productChannel = resolveProductChannel(travelMode);
  const isExchangeBook = Boolean(selection?.isExchange && selection.exchangeTicketId);
  const passengerContext = useBusinessSelfBookPassenger(
    ProductType.Flight,
    isBusinessMode && !isExchangeBook,
  );
  const selected = isExchangeBook ? passengerContext.selected : passengerContext.passengers;
  const setSelected = passengerContext.setSelected;

  const initParams = useMemo(() => {
    if (isExchangeBook) return null;
    if (!selection || selected.length === 0) return null;
    return buildFlightInitBookDto({
      selection,
      passengers: selected,
      agentId: agentId ?? undefined,
      travelMode,
      channel: productChannel,
    });
  }, [agentId, isExchangeBook, productChannel, selection, selected, travelMode]);

  const ticketNoticeRules = useMemo(
    () => resolveFlightTicketNoticeRules(selection?.detailSnapshot),
    [selection?.detailSnapshot],
  );

  const initBook = useFlightInitBook(initParams);
  const initStaffs = initBook.data?.Staffs;
  const { forms, orderedForms, updateForm } = useFlightBookPassengerForms(selected, initStaffs);
  const { showOrganizations, showCostCenter, organizations } = useBookOrgCostVisibility({
    enabled: isBusinessMode,
  });

  const payOptions = useMemo(
    () => parseFlightPayTypeOptions(initBook.data?.PayTypes),
    [initBook.data?.PayTypes],
  );
  const expenseTypes = useMemo(
    () => filterFlightExpenseTypes(initBook.data?.ExpenseTypes),
    [initBook.data?.ExpenseTypes],
  );
  const tmcAgents = initBook.data?.TmcServices ?? [];
  const flightPolicy = selection?.flightPolicy;
  const policiesByPassenger = selection?.flightPoliciesByPassengerId;
  const outNumberFieldsByPassenger = useMemo(
    () =>
      buildPassengerOutNumberFieldsMap({
        passengers: selected,
        staffs: initStaffs,
        init: initBook.data,
        travelMode,
      }),
    [initBook.data, initStaffs, selected, travelMode],
  );
  const insurancesByPassenger = useMemo(() => {
    const map: Record<string, ReturnType<typeof resolvePassengerInsuranceProducts>> = {};
    for (const passenger of selected) {
      map[passenger.id] = resolvePassengerInsuranceProducts(initBook.data?.Insurances, passenger);
    }
    return map;
  }, [initBook.data?.Insurances, selected]);
  const showApproverPickerByPassenger = useMemo(() => {
    if (!isBusinessMode || isExchangeBook) return {};
    const map: Record<string, boolean> = {};
    for (const passenger of selected) {
      const staff = findInitStaffForPassenger(passenger, initStaffs);
      const passengerPolicy = selection
        ? resolvePassengerPolicyFromSelection(selection, passenger)
        : flightPolicy;
      map[passenger.id] = shouldShowApproverPicker({
        init: initBook.data,
        policy: passengerPolicy,
        staff,
        passenger,
      });
    }
    return map;
  }, [
    flightPolicy,
    initBook.data,
    initStaffs,
    isBusinessMode,
    isExchangeBook,
    selected,
    selection,
  ]);
  const primaryTravelPassenger = useMemo(() => resolvePrimaryTravelPassenger(selected), [selected]);

  const resolvedPayType =
    isExchangeBook && selection?.exchangeTravelPayType != null
      ? selection.exchangeTravelPayType
      : isBusinessMode
        ? (travelPayType ?? resolveDefaultFlightPayType(payOptions))
        : FLIGHT_PAY_TYPE_PERSON;
  const personHoldMinutes = resolveFlightHoldMinutes(initBook.data);

  const showSaveOrder = useMemo(
    () =>
      !isExchangeBook &&
      isBusinessMode &&
      canSaveFlightOrder({
        identity,
        segment: selection?.segment,
        cabinsQuery: selection?.cabinsQuery,
      }),
    [identity, isBusinessMode, isExchangeBook, selection?.cabinsQuery, selection?.segment],
  );
  const resolvedAgentId =
    agentId ?? (tmcAgents.length === 1 ? String(tmcAgents[0]?.Id ?? "") : undefined);

  useEffect(() => {
    if (!selection && !skipEmptySelectionRedirectRef.current) {
      navigate("/flight/list", { replace: true });
    }
  }, [navigate, selection]);

  function finishBookNavigation(
    path: string,
    state?: { bookedOrderId: string; product: "flight" },
  ) {
    setIsLeavingAfterSubmit(true);
    skipEmptySelectionRedirectRef.current = true;
    markFlightBookExitToHome();
    navigate(path, { replace: true, state });
    clearFlightBookSelection();
    clearFlightExchangeSession();
    clearPassengerSelection(ProductType.Flight);
  }

  useEffect(() => {
    if (!isBusinessMode || isExchangeBook || travelPayType != null || !payOptions.length) return;
    setTravelPayType(resolveDefaultFlightPayType(payOptions));
  }, [isBusinessMode, isExchangeBook, payOptions, travelPayType]);

  // Legacy: after Initialize, default selectedTmcAgent to tmcAgents[0] if unset.
  useEffect(() => {
    if (!initBook.data || tmcAgents.length === 0) return;
    const nextAgentId = resolveInitialFlightBookAgentId(agentId, tmcAgents);
    if (nextAgentId && nextAgentId !== agentId) {
      setAgentId(nextAgentId);
    }
  }, [agentId, initBook.data, tmcAgents]);

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
  }, [
    initBook.data?.Linkman,
    isBusinessMode,
    orderLinkman.Email,
    orderLinkman.Mobile,
    orderLinkman.Name,
  ]);

  useEffect(() => {
    if (!expenseTypes.length || !primaryTravelPassenger) return;
    const defaultExpense = resolveDefaultExpenseType(expenseTypes);
    const form = forms[primaryTravelPassenger.id];
    if (form && !form.expenseType) {
      updateForm(primaryTravelPassenger.id, { expenseType: defaultExpense });
    }
  }, [expenseTypes, forms, primaryTravelPassenger, updateForm]);

  usePageHeader({ visible: false });

  const handleTimeoutRefresh = useCallback(() => {
    if (selection) {
      clearFlightBookSelection();
      navigate(buildFlightListRefreshHref(selection.cabinsQuery));
      return;
    }
    navigate("/flight/list?doRefresh=true");
  }, [navigate, selection]);

  const { openTimeoutDialog } = useFlightPriceTimeout({
    enabled: Boolean(selection?.priceSnapshotAt),
    snapshotAt: selection?.priceSnapshotAt ?? 0,
    onRefresh: handleTimeoutRefresh,
  });

  const serviceFees = initBook.data?.ServiceFees;
  const tmcFlags = resolveFlightBookTmcFlags(initBook.data);
  const passengerServiceFeeRows = useMemo(
    () =>
      selected.map((passenger) => ({
        passengerId: passenger.id,
        passengerName: passenger.credential.Name ?? passenger.passenger.Name ?? "",
        fee: resolvePassengerServiceFee(passenger, serviceFees),
      })),
    [selected, serviceFees],
  );
  const totalInsurance = useMemo(
    () =>
      selected.reduce((sum, passenger) => {
        const form = forms[passenger.id];
        return (
          sum +
          resolveInsuranceAmount(
            insurancesByPassenger[passenger.id] ?? [],
            form?.selectedInsuranceId ?? "",
          )
        );
      }, 0),
    [forms, insurancesByPassenger, selected],
  );
  const billBreakdown = useMemo(() => {
    if (!selection || selected.length === 0) return null;
    return resolveFlightBookBillBreakdown({ selection, passengers: selected, serviceFees });
  }, [selection, selected, serviceFees]);

  const tmcHasInsurance = Boolean(
    (initBook.data?.Tmc as { FlightHasInsurance?: boolean } | undefined)?.FlightHasInsurance,
  );
  const tmcInsuranceFlags = initBook.data?.Tmc as
    | { MandatoryBuyInsurance?: boolean; FlightHasInsurance?: boolean }
    | undefined;

  useEffect(() => {
    if (!selection || !initBook.data || !tmcHasInsurance) return;
    for (const passenger of selected) {
      const products = insurancesByPassenger[passenger.id] ?? [];
      const forcedId = resolveForcedInsuranceProductId(passenger, products, tmcInsuranceFlags);
      if (!forcedId) continue;
      const form = forms[passenger.id];
      if (form && form.selectedInsuranceId !== forcedId) {
        updateForm(passenger.id, { selectedInsuranceId: forcedId });
      }
    }
  }, [
    forms,
    initBook.data,
    insurancesByPassenger,
    selected,
    selection,
    tmcHasInsurance,
    tmcInsuranceFlags,
    updateForm,
  ]);

  if (!selection) {
    if (isLeavingAfterSubmit) {
      return (
        <BookingSubmitTransition />
      );
    }
    return null;
  }

  const initOrderAmount = Number(initBook.data?.OrderAmount);
  const orderAmount =
    isExchangeBook && Number.isFinite(initOrderAmount)
      ? initOrderAmount
      : resolveFlightBookDisplayAmount(selection, selected, serviceFees) + totalInsurance;
  const timedOut = isFlightListTimedOut(selection.priceSnapshotAt);
  const isInitBlocking = initBook.isFetching && !initBook.data;
  const isPending =
    isSubmitting || submitBook.isPending || validateBook.isPending || isInitBlocking || checkingPay;
  const submitPendingLabel = checkingPay ? "确认中…" : "提交中…";
  const initError = initBook.error;
  const submitError = submitBook.error;

  function handleBack() {
    if (!selection) {
      navigateBack(navigate, "/flight/list");
      return;
    }
    navigateBack(navigate, buildCabinsHref(selection));
  }

  function showAlert(message: string) {
    setAlertMessage(message);
  }

  function removePassengerFromBook(target: PassengerBookInfo) {
    setSelected(selected.filter((item) => item.id !== target.id));
    setRemovePassengerTarget(null);
  }

  async function submitOrder(isSave: boolean) {
    if (!selection || selected.length === 0 || (!isExchangeBook && !initParams)) {
      showAlert("订单信息不完整，请返回舱位页重新选择");
      return;
    }
    if (!agreed) {
      showAlert("请先阅读并同意购票须知");
      return;
    }
    if (timedOut) {
      openTimeoutDialog();
      return;
    }
    if (tmcAgents.length > 1 && !resolvedAgentId) {
      showAlert("请选择服务商");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isExchangeBook) {
        const exchangeDto = buildFlightExchangeBookDto({
          selection,
          passengers: selected,
          channel: productChannel,
        });
        const result = await submitBook.mutateAsync(exchangeDto);
        const orderId = resolveFlightBookOrderId(result);
        if (orderId) {
          const detailPath =
            productChannel === "tourist"
              ? `/orders/flight/${orderId}?channel=tourist`
              : `/orders/flight/${orderId}`;
          finishBookNavigation(detailPath, {
            bookedOrderId: orderId,
            product: "flight",
          });
          return;
        }
        finishBookNavigation("/orders");
        return;
      }

      const passengerValidationError = validatePassengerBookForms(selected, forms);
      if (passengerValidationError) {
        const invalidPassenger = selected.find((passenger) => {
          const form = forms[passenger.id];
          return form && !resolvePassengerFormMobile(form);
        });
        if (invalidPassenger) {
          updateForm(invalidPassenger.id, { expanded: true });
        }
        showAlert(passengerValidationError);
        return;
      }

      const travelValidationError = validateAllPassengerTravelInfo({
        passengers: selected,
        forms,
        policy: isBusinessMode ? flightPolicy : undefined,
        policyByPassenger: isBusinessMode ? policiesByPassenger : undefined,
        init: initBook.data,
        outNumberFieldsByPassenger,
        showApproverPickerByPassenger,
      });
      if (travelValidationError) {
        showAlert(travelValidationError);
        return;
      }

      const insuranceValidationError = validateAllPassengerInsuranceSelections({
        passengers: selected,
        forms,
        insurancesByPassenger,
        init: initBook.data,
        tmcHasInsurance,
      });
      if (insuranceValidationError) {
        showAlert(insuranceValidationError);
        return;
      }

      if (!isBusinessMode && authorizedContacts.length > 0) {
        setAuthorizedContacts([]);
      }
      const orderLinkmanValidationError = !isBusinessMode
        ? validateFlightOrderLinkman(orderLinkman)
        : null;
      if (orderLinkmanValidationError) {
        showAlert(orderLinkmanValidationError);
        return;
      }

      const contactValidationError = isBusinessMode
        ? validateAuthorizedContacts(authorizedContacts)
        : null;
      if (contactValidationError) {
        showAlert(contactValidationError);
        return;
      }

      const bookDto = buildFlightOrderBookDto({
        selection,
        passengers: selected,
        passengerForms: forms,
        travelPayType: resolvedPayType,
        messageLang: notifyLanguage,
        authorizedContacts: isBusinessMode ? authorizedContacts : [],
        orderLinkman: isBusinessMode ? undefined : orderLinkman,
        agentId: resolvedAgentId,
        channel: productChannel,
        isSave,
        insurancesByPassenger,
        outNumberFieldsByPassenger,
        flightPolicy: isBusinessMode ? flightPolicy : undefined,
        flightPoliciesByPassenger: isBusinessMode ? policiesByPassenger : undefined,
        travelNumber: initBook.data?.TravelFrom?.TravelNumber,
        travelMode,
      });

      if (
        productChannel === "tourist" &&
        !isSave &&
        !isExchangeBook &&
        shouldValidateTouristFlightBook(selection)
      ) {
        await validateBook.mutateAsync(bookDto);
      }

      const result = await submitBook.mutateAsync(bookDto);
      const orderId = resolveFlightBookOrderId(result);

      if (isSave) {
        showAlert("订单已保存");
        if (orderId) {
          finishBookNavigation("/orders", { bookedOrderId: orderId, product: "flight" });
        } else {
          finishBookNavigation("/orders");
        }
        return;
      }

      if (result.IsCheckPay && result.TradeNo) {
        setCheckingPay(true);
        const checkPayReady = await pollFlightCheckPay(result.TradeNo, {
          channel: productChannel,
          productType: "Flight",
        });
        if (shouldNavigateToPay({ travelPayType: resolvedPayType, checkPayReady }) && orderId) {
          const channelQuery = productChannel === "tourist" ? "?channel=tourist" : "";
          finishBookNavigation(`/flight/pay/${encodeURIComponent(orderId)}${channelQuery}`, {
            bookedOrderId: orderId,
            product: "flight",
          });
          return;
        }
      }

      if (
        productChannel === "tourist" &&
        shouldNavigateToPay({ travelPayType: resolvedPayType, checkPayReady: true }) &&
        orderId
      ) {
        finishBookNavigation(`/flight/pay/${encodeURIComponent(orderId)}?channel=tourist`, {
          bookedOrderId: orderId,
          product: "flight",
        });
        return;
      }

      if (orderId) {
        const detailPath =
          productChannel === "tourist"
            ? `/orders/flight/${orderId}?channel=tourist`
            : `/orders/flight/${orderId}`;
        finishBookNavigation(detailPath, {
          bookedOrderId: orderId,
          product: "flight",
        });
        return;
      }

      finishBookNavigation("/orders");
    } catch (error) {
      showAlert(formatApiError(error));
    } finally {
      setIsSubmitting(false);
      setCheckingPay(false);
    }
  }

  return (
    <div className={WEB_PAGE_ROOT} style={FLIGHT_BOOK_PAGE_BACKGROUND}>
      <div
        className={`${WEB_PAGE_STICKY_HEADER} z-30 overflow-hidden`}
        style={FLIGHT_BOOK_PAGE_BACKGROUND}
      >
        <FlightCabinsHeader
          title={isExchangeBook ? "确认改签" : "确认信息及预订"}
          onBack={handleBack}
        />
      </div>

      <div
        className={`${WEB_PAGE_BODY} overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        <FlightBookSummary selection={selection} onShowRules={() => setRulesOpen(true)} />

        <div className="space-y-3 px-3">
          {isBusinessMode ? (
            <FlightBookPolicyBanner policy={flightPolicy} airline={selection.segment.Airline} />
          ) : null}

          {!initBook.isFetching && isBusinessMode ? (
            <FlightBookAgentPicker
              agents={tmcAgents}
              value={agentId ?? ""}
              onChange={(nextAgentId) => setAgentId(nextAgentId)}
            />
          ) : null}

          {selected.length <= 1 ? (
            <FlightBookPassengerSection
              passengers={
                <FlightBookPassengers
                  returnTo={returnTo}
                  passengers={selected}
                  forms={orderedForms}
                  showOrganizations={isBusinessMode && showOrganizations}
                  showCostCenter={isBusinessMode && showCostCenter}
                  allowAddPassenger={!isBusinessMode && !isExchangeBook}
                  readOnly={isExchangeBook}
                  onRemove={
                    !isBusinessMode && !isExchangeBook ? setRemovePassengerTarget : undefined
                  }
                  onUpdateForm={updateForm}
                  onOpenOrganization={setOrgSheetPassengerId}
                  onOpenCostCenter={setCostSheetPassengerId}
                  onChangeCredential={setCredentialSheetPassenger}
                />
              }
              notifyLanguage={
                !isExchangeBook &&
                !initBook.isFetching &&
                isBusinessMode &&
                tmcFlags.isDisplayNotifyLanguage ? (
                  <FlightBookNotifyLanguageRow
                    sectioned
                    notifyLanguage={notifyLanguage}
                    onOpenNotifyLanguage={() => {
                      setNotifyLanguageTarget("order");
                      setNotifyLanguageOpen(true);
                    }}
                  />
                ) : undefined
              }
              serviceFee={
                !initBook.isFetching &&
                isBusinessMode &&
                tmcFlags.isShowServiceFee &&
                passengerServiceFeeRows.some((row) => row.fee > 0) ? (
                  <FlightBookServiceFeeRows sectioned serviceFees={passengerServiceFeeRows} />
                ) : undefined
              }
            />
          ) : (
            <>
              {selected.map((passenger, index) => {
                const form = forms[passenger.id];
                if (!form) return null;
                const feeRow = passengerServiceFeeRows.find(
                  (row) => row.passengerId === passenger.id,
                );
                const showPassengerServiceFee =
                  !initBook.isFetching && tmcFlags.isShowServiceFee && feeRow && feeRow.fee > 0;

                return (
                  <FlightBookPassengerSection
                    key={passenger.id}
                    passengerIndex={index + 1}
                    passengers={
                      <FlightBookPassengerCard
                        passenger={passenger}
                        form={form}
                        showOrganizations={isBusinessMode && showOrganizations}
                        showCostCenter={isBusinessMode && showCostCenter}
                        readOnly={isExchangeBook}
                        onRemove={
                          !isBusinessMode && !isExchangeBook ? setRemovePassengerTarget : undefined
                        }
                        onUpdateForm={updateForm}
                        onOpenOrganization={setOrgSheetPassengerId}
                        onOpenCostCenter={setCostSheetPassengerId}
                        onChangeCredential={setCredentialSheetPassenger}
                      />
                    }
                    serviceFee={
                      showPassengerServiceFee && feeRow ? (
                        <FlightBookServiceFeeRows sectioned serviceFees={[feeRow]} />
                      ) : undefined
                    }
                  />
                );
              })}

              {!isExchangeBook &&
              !initBook.isFetching &&
              isBusinessMode &&
              tmcFlags.isDisplayNotifyLanguage ? (
                <section className="overflow-hidden rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-[#EEF1F6]">
                  <FlightBookNotifyLanguageRow
                    sectioned
                    notifyLanguage={notifyLanguage}
                    onOpenNotifyLanguage={() => {
                      setNotifyLanguageTarget("order");
                      setNotifyLanguageOpen(true);
                    }}
                  />
                </section>
              ) : null}
            </>
          )}

          {!isBusinessMode && !isExchangeBook ? (
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

          {!isExchangeBook && !initBook.isFetching && isBusinessMode ? (
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

          {!isExchangeBook
            ? selected.map((passenger) => {
                const form = forms[passenger.id];
                if (!form) return null;
                const insuranceProducts = insurancesByPassenger[passenger.id] ?? [];
                const showInsurance = isBusinessMode
                  ? tmcHasInsurance
                  : insuranceProducts.length > 0;
                return showInsurance ? (
                  <FlightBookInsurance
                    key={passenger.id}
                    products={insuranceProducts}
                    selectedId={form.selectedInsuranceId}
                    mandatory={
                      isBusinessMode && isMandatoryFlightInsurance(passenger, tmcInsuranceFlags)
                    }
                    selectionLocked={
                      isBusinessMode && isMandatoryFlightInsurance(passenger, tmcInsuranceFlags)
                    }
                    onSelect={(selectedInsuranceId) =>
                      updateForm(passenger.id, { selectedInsuranceId })
                    }
                  />
                ) : null;
              })
            : null}

          {primaryTravelPassenger &&
          forms[primaryTravelPassenger.id] &&
          isBusinessMode &&
          !isExchangeBook ? (
            <FlightBookTravelSection
              passenger={primaryTravelPassenger}
              form={forms[primaryTravelPassenger.id]!}
              passengerCount={selected.length}
              staff={findInitStaffForPassenger(primaryTravelPassenger, initStaffs)}
              init={initBook.data}
              policy={
                selection
                  ? resolvePassengerPolicyFromSelection(selection, primaryTravelPassenger)
                  : flightPolicy
              }
              onUpdate={(patch) => updateForm(primaryTravelPassenger.id, patch)}
              onOpenApprover={() => setApproverPassengerId(primaryTravelPassenger.id)}
              onOpenIllegalReason={() => setIllegalReasonPassengerId(primaryTravelPassenger.id)}
              onOpenExpenseType={() => setExpensePassengerId(primaryTravelPassenger.id)}
              onOpenOutNumber={(field) =>
                setOutNumberPicker({ passengerId: primaryTravelPassenger.id, field })
              }
              travelMode={travelMode}
            />
          ) : null}

          {!initBook.isFetching && isBusinessMode && !isExchangeBook ? (
            <FlightBookPayTypes
              options={payOptions}
              value={resolvedPayType}
              personHoldMinutes={personHoldMinutes}
              onChange={setTravelPayType}
            />
          ) : null}

          {!isExchangeBook && initError ? (
            <p className="text-[13px] text-destructive">
              订单初始化失败：{formatApiError(initError)}
            </p>
          ) : null}

          {submitError ? (
            <p className="text-[13px] text-destructive">{formatApiError(submitError)}</p>
          ) : null}
        </div>
      </div>

      <FlightBookFooter
        amount={orderAmount}
        agreed={agreed}
        pending={isPending}
        pendingLabel={submitPendingLabel}
        submitLabel={isExchangeBook ? "改签预订" : undefined}
        disabled={selected.length === 0 || isPending || (!isExchangeBook && initBook.isError)}
        showTicketNotice={ticketNoticeRules.length > 0}
        showSaveOrder={showSaveOrder}
        billOpen={billOpen}
        billBreakdown={billBreakdown}
        onAgreedChange={setAgreed}
        onBillToggle={() => setBillOpen((open) => !open)}
        onShowTicketNotice={() => setTicketNoticeOpen(true)}
        onSubmit={() => void submitOrder(false)}
        onSave={() => void submitOrder(true)}
      />

      {checkingPay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-8">
          <div className="w-full max-w-[18rem] rounded-2xl bg-white px-5 py-6 text-center shadow-lg">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[#DCE8FF] border-t-[#2768FA]" />
            <p className="mt-4 text-[16px] font-semibold text-[#222222]">正在确认预订状态</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#666666]">
              订单已提交，请稍候，确认后将进入支付页面
            </p>
          </div>
        </div>
      ) : null}

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

      <PassengerSelectAlertDialog
        open={Boolean(alertMessage)}
        message={alertMessage ?? ""}
        onClose={() => setAlertMessage(null)}
      />

      <FlightBookTicketNoticeSheet
        open={ticketNoticeOpen}
        rules={ticketNoticeRules}
        onClose={() => setTicketNoticeOpen(false)}
      />

      <FlightFareRulesSheet
        open={rulesOpen}
        fare={selection.fare}
        onClose={() => setRulesOpen(false)}
      />

      <FlightBookPickerSheet
        open={illegalReasonPassengerId != null}
        title="超标原因"
        options={initBook.data?.IllegalReasons ?? []}
        selected={
          illegalReasonPassengerId ? forms[illegalReasonPassengerId]?.illegalReason : undefined
        }
        onClose={() => setIllegalReasonPassengerId(null)}
        onSelect={(value) => {
          if (!illegalReasonPassengerId) return;
          updateForm(illegalReasonPassengerId, { illegalReason: value, otherIllegalReason: "" });
        }}
      />

      <FlightBookPickerSheet
        open={expensePassengerId != null}
        title="费用类别"
        options={expenseTypes.map((item) => item.Name)}
        selected={expensePassengerId ? forms[expensePassengerId]?.expenseType : undefined}
        onClose={() => setExpensePassengerId(null)}
        onSelect={(value) => {
          if (!expensePassengerId) return;
          updateForm(expensePassengerId, { expenseType: value });
        }}
      />

      <FlightBookApproverSheet
        open={approverPassengerId != null}
        onClose={() => setApproverPassengerId(null)}
        onSelect={(approver) => {
          if (!approverPassengerId) return;
          updateForm(approverPassengerId, {
            approvalId: approver.accountId,
            selectedApproverName: approver.name,
          });
        }}
      />

      <FlightOutNumberPickerSheet
        open={outNumberPicker != null}
        field={outNumberPicker?.field ?? null}
        selected={
          outNumberPicker
            ? (forms[outNumberPicker.passengerId]?.outNumbers[outNumberPicker.field.key] ??
              outNumberPicker.field.value)
            : undefined
        }
        onClose={() => setOutNumberPicker(null)}
        onSelect={(value) => {
          if (!outNumberPicker) return;
          const { passengerId, field } = outNumberPicker;
          updateForm(passengerId, {
            outNumbers: {
              ...forms[passengerId]?.outNumbers,
              [field.key]: value,
            },
          });
          setOutNumberPicker(null);
        }}
      />

      <FlightBookNotifyLanguageSheet
        open={notifyLanguageOpen}
        value={
          notifyLanguageTarget === "order"
            ? notifyLanguage
            : ((authorizedContacts.find(
                (item) =>
                  item.accountId ===
                  (isAuthorizedContactNotifyTarget(notifyLanguageTarget)
                    ? accountIdFromNotifyTarget(notifyLanguageTarget)
                    : notifyLanguageTarget),
              )?.notifyLanguage ?? FLIGHT_NOTIFY_LANGUAGE_DEFAULT) as FlightNotifyLanguage)
        }
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
        }}
      />

      <FlightBookCredentialSheet
        open={credentialSheetPassenger != null}
        passenger={credentialSheetPassenger}
        channel={productChannel}
        onClose={() => setCredentialSheetPassenger(null)}
        onSelect={(credential) => {
          if (!credentialSheetPassenger) return;
          setSelected(replacePassengerCredential(selected, credentialSheetPassenger, credential));
        }}
      />

      <FlightBookAddContactSheet
        open={addContactOpen}
        existingAccountIds={authorizedContacts.map((item) => item.accountId)}
        onClose={() => setAddContactOpen(false)}
        onSelect={(contact) => setAuthorizedContacts((current) => [...current, contact])}
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
        }}
      />
    </div>
  );
}
