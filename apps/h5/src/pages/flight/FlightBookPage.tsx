import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ProductType,
  type FlightAuthorizedContact,
  type FlightInitStaff,
  type FlightOutNumberField,
} from "@ryx/shared-types";
import { FlightBookAgentPicker } from "@/components/flight/FlightBookAgentPicker";
import { FlightBookApproverSheet } from "@/components/flight/FlightBookApproverSheet";
import { FlightBookCostCenterSheet } from "@/components/flight/FlightBookCostCenterSheet";
import { FlightBookCredentialSheet } from "@/components/flight/FlightBookCredentialSheet";
import { FlightBookAddContactSheet } from "@/components/flight/FlightBookAddContactSheet";
import { FlightBookBillSheet } from "@/components/flight/FlightBookBillSheet";
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
import { FlightBookPassengers } from "@/components/flight/FlightBookPassengers";
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
import { FLIGHT_CABINS_HEADER_BG } from "@/config/flight-cabins";
import { useBookOrgCostVisibility } from "@/hooks/useBookOrgCostVisibility";
import { useFlightBookPassengerForms } from "@/hooks/useFlightBookPassengerForms";
import { useIdentity } from "@/hooks/useIdentity";
import {
  useFlightBookSelection,
  useFlightInitBook,
  useFlightSubmitBook,
} from "@/hooks/useFlightBook";
import { shouldShowApproverPicker } from "@/lib/flight-book-approval";
import { pollFlightCheckPay, shouldNavigateToPay } from "@/lib/flight-book-check-pay";
import {
  buildFlightInitBookDto,
  buildFlightOrderBookDto,
  resolveFlightBookBillBreakdown,
  resolveFlightBookDisplayAmount,
  resolveFlightBookOrderId,
  resolveFlightTicketNoticeRules,
  resolvePassengerServiceFee,
} from "@/lib/flight-book";
import {
  FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  type FlightNotifyLanguage,
} from "@/lib/flight-book-notify";
import {
  parseFlightPayTypeOptions,
  resolveDefaultFlightPayType,
  resolveInitialFlightBookAgentId,
  resolveFlightBookTmcFlags,
  resolveFlightHoldMinutes,
  resolveTotalServiceFee,
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
import { buildCabinsHref, clearFlightBookSelection } from "@/lib/flight-book-session";
import { navigateBack } from "@/lib/navigation";
import { usePassengerSelection } from "@/hooks/usePassenger";
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
import { isFlightListTimedOut } from "@/lib/flight-list-refresh";
import { formatApiError } from "@/lib/formatApiError";
import { clearPassengerSelection } from "@/lib/passenger-selection";

export function FlightBookPage() {
  const navigate = useNavigate();
  const skipEmptySelectionRedirectRef = useRef(false);
  const { selection } = useFlightBookSelection();
  const { selected, setSelected } = usePassengerSelection(ProductType.Flight);
  const submitBook = useFlightSubmitBook();

  const [travelPayType, setTravelPayType] = useState<number | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<"book" | "checkPay">("book");
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

  const initParams = useMemo(() => {
    if (!selection || selected.length === 0) return null;
    return buildFlightInitBookDto({
      selection,
      passengers: selected,
      agentId: agentId ?? undefined,
    });
  }, [agentId, selection, selected]);

  const ticketNoticeRules = useMemo(
    () => resolveFlightTicketNoticeRules(selection?.detailSnapshot),
    [selection?.detailSnapshot],
  );

  const initBook = useFlightInitBook(initParams);
  const initStaffs = initBook.data?.Staffs;
  const { forms, orderedForms, updateForm } = useFlightBookPassengerForms(selected, initStaffs);
  const { showOrganizations, showCostCenter, organizations } = useBookOrgCostVisibility();

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
      }),
    [initBook.data, initStaffs, selected],
  );
  const insurancesByPassenger = useMemo(() => {
    const map: Record<string, ReturnType<typeof resolvePassengerInsuranceProducts>> = {};
    for (const passenger of selected) {
      map[passenger.id] = resolvePassengerInsuranceProducts(initBook.data?.Insurances, passenger);
    }
    return map;
  }, [initBook.data?.Insurances, selected]);
  const showApproverPickerByPassenger = useMemo(() => {
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
      });
    }
    return map;
  }, [flightPolicy, initBook.data, initStaffs, selected, selection]);
  const primaryTravelPassenger = useMemo(() => resolvePrimaryTravelPassenger(selected), [selected]);

  const resolvedPayType = travelPayType ?? resolveDefaultFlightPayType(payOptions);
  const personHoldMinutes = resolveFlightHoldMinutes(initBook.data);

  const showSaveOrder = useMemo(
    () =>
      canSaveFlightOrder({
        identity,
        segment: selection?.segment,
        cabinsQuery: selection?.cabinsQuery,
      }),
    [identity, selection?.cabinsQuery, selection?.segment],
  );
  const resolvedAgentId =
    agentId ?? (tmcAgents.length === 1 ? String(tmcAgents[0]?.Id ?? "") : undefined);

  useEffect(() => {
    if (!selection && !skipEmptySelectionRedirectRef.current) {
      navigate("/flight/list", { replace: true });
    }
  }, [navigate, selection]);

  function finishBookNavigation(path: string, state?: { bookedOrderId: string; product: "flight" }) {
    skipEmptySelectionRedirectRef.current = true;
    navigate(path, { replace: true, state });
    clearFlightBookSelection();
    clearPassengerSelection(ProductType.Flight);
  }

  useEffect(() => {
    if (travelPayType != null || !payOptions.length) return;
    setTravelPayType(resolveDefaultFlightPayType(payOptions));
  }, [payOptions, travelPayType]);

  // Legacy: after Initialize, default selectedTmcAgent to tmcAgents[0] if unset.
  useEffect(() => {
    if (!initBook.data || tmcAgents.length === 0) return;
    const nextAgentId = resolveInitialFlightBookAgentId(agentId, tmcAgents);
    if (nextAgentId && nextAgentId !== agentId) {
      setAgentId(nextAgentId);
    }
  }, [agentId, initBook.data, tmcAgents]);

  useEffect(() => {
    if (!expenseTypes.length || !primaryTravelPassenger) return;
    const defaultExpense = resolveDefaultExpenseType(expenseTypes);
    const form = forms[primaryTravelPassenger.id];
    if (form && !form.expenseType) {
      updateForm(primaryTravelPassenger.id, { expenseType: defaultExpense });
    }
  }, [expenseTypes, forms, primaryTravelPassenger, updateForm]);

  usePageHeader({ visible: false });

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
  const totalServiceFee = resolveTotalServiceFee(selected, serviceFees);
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
    return null;
  }

  const orderAmount = resolveFlightBookDisplayAmount(selection, selected, serviceFees) + totalInsurance;
  const timedOut = isFlightListTimedOut(selection.priceSnapshotAt);
  const isInitBlocking = initBook.isFetching && !initBook.data;
  const isPending = isSubmitting || submitBook.isPending || isInitBlocking;
  const submitPendingLabel =
    submitPhase === "checkPay" ? "等待支付确认…" : "提交中…";
  const initError = initBook.error;
  const submitError = submitBook.error;

  function handleBack() {
    if (!selection) {
      navigateBack(navigate, "/flight/list");
      return;
    }
    navigateBack(navigate, buildCabinsHref(selection));
  }

  async function submitOrder(isSave: boolean) {
    if (!selection || selected.length === 0 || !initParams) {
      window.alert("订单信息不完整，请返回舱位页重新选择");
      return;
    }
    if (!agreed) {
      window.alert("请先阅读并同意购票须知");
      return;
    }
    if (timedOut) {
      window.alert("您的停留时间过长，价格信息可能发生变动，请重新查询");
      navigate(buildCabinsHref(selection));
      return;
    }
    if (tmcAgents.length > 1 && !resolvedAgentId) {
      window.alert("请选择服务商");
      return;
    }

    setIsSubmitting(true);
    setSubmitPhase("book");

    try {
      const passengerValidationError = validatePassengerBookForms(selected, forms);
      if (passengerValidationError) {
        const invalidPassenger = selected.find((passenger) => {
          const form = forms[passenger.id];
          return form && !resolvePassengerFormMobile(form);
        });
        if (invalidPassenger) {
          updateForm(invalidPassenger.id, { expanded: true });
        }
        window.alert(passengerValidationError);
        return;
      }

      const travelValidationError = validateAllPassengerTravelInfo({
        passengers: selected,
        forms,
        policy: flightPolicy,
        policyByPassenger: policiesByPassenger,
        init: initBook.data,
        outNumberFieldsByPassenger,
        showApproverPickerByPassenger,
      });
      if (travelValidationError) {
        window.alert(travelValidationError);
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
        window.alert(insuranceValidationError);
        return;
      }

      const contactValidationError = validateAuthorizedContacts(authorizedContacts);
      if (contactValidationError) {
        window.alert(contactValidationError);
        return;
      }

      const bookDto = buildFlightOrderBookDto({
        selection,
        passengers: selected,
        passengerForms: forms,
        travelPayType: resolvedPayType,
        messageLang: notifyLanguage,
        authorizedContacts,
        agentId: resolvedAgentId,
        isSave,
        insurancesByPassenger,
        outNumberFieldsByPassenger,
        flightPolicy,
        flightPoliciesByPassenger: policiesByPassenger,
        travelNumber: initBook.data?.TravelFrom?.TravelNumber,
      });

      const result = await submitBook.mutateAsync(bookDto);
      const orderId = resolveFlightBookOrderId(result);

      if (isSave) {
        window.alert("订单已保存");
        if (orderId) {
          finishBookNavigation("/orders", { bookedOrderId: orderId, product: "flight" });
        } else {
          finishBookNavigation("/orders");
        }
        return;
      }

      if (result.IsCheckPay && orderId) {
        setSubmitPhase("checkPay");
        const checkPayReady = await pollFlightCheckPay(orderId);
        if (shouldNavigateToPay({ travelPayType: resolvedPayType, checkPayReady })) {
          finishBookNavigation(`/flight/pay/${orderId}`);
          return;
        }
      }

      if (orderId) {
        finishBookNavigation(`/orders/flight/${orderId}`, {
          bookedOrderId: orderId,
          product: "flight",
        });
        return;
      }

      finishBookNavigation("/orders");
    } catch (error) {
      window.alert(formatApiError(error));
    } finally {
      setIsSubmitting(false);
      setSubmitPhase("book");
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f2f4f8] pb-[calc(8.75rem+env(safe-area-inset-bottom))]">
      <div
        className="sticky top-0 z-20 shrink-0 pt-[env(safe-area-inset-top)]"
        style={{
          backgroundColor: FLIGHT_CABINS_HEADER_BG,
          backgroundImage: "linear-gradient(180deg, #8fc5ff 0%, #cfe3ff 58%, #f2f4f8 100%)",
        }}
      >
        <FlightCabinsHeader title="确认信息及预订" onBack={handleBack} />
        <FlightBookSummary selection={selection} onShowRules={() => setRulesOpen(true)} />
      </div>

      <div className="space-y-3 px-3 py-3">
        <FlightBookPolicyBanner policy={flightPolicy} airline={selection.segment.Airline} />

        {!initBook.isFetching ? (
          <FlightBookAgentPicker
            agents={tmcAgents}
            value={agentId ?? ""}
            onChange={(nextAgentId) => setAgentId(nextAgentId)}
          />
        ) : null}

        <FlightBookPassengerSection
          showAuthorizedLabel={authorizedContacts.length > 0}
          passengers={
            <FlightBookPassengers
              returnTo={returnTo}
              passengers={selected}
              forms={orderedForms}
              showOrganizations={showOrganizations}
              showCostCenter={showCostCenter}
              onUpdateForm={updateForm}
              onOpenOrganization={setOrgSheetPassengerId}
              onOpenCostCenter={setCostSheetPassengerId}
              onChangeCredential={setCredentialSheetPassenger}
            />
          }
          notifyLanguage={
            !initBook.isFetching && tmcFlags.isDisplayNotifyLanguage ? (
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
            tmcFlags.isShowServiceFee &&
            passengerServiceFeeRows.some((row) => row.fee > 0) ? (
              <FlightBookServiceFeeRows sectioned serviceFees={passengerServiceFeeRows} />
            ) : undefined
          }
          authorizedContacts={
            <FlightBookAuthorizedContacts
              sectioned
              embedded
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
          }
        />

        {selected.map((passenger) => {
          const form = forms[passenger.id];
          if (!form) return null;
          const insuranceProducts = insurancesByPassenger[passenger.id] ?? [];
          return tmcHasInsurance ? (
            <FlightBookInsurance
              key={passenger.id}
              products={insuranceProducts}
              selectedId={form.selectedInsuranceId}
              mandatory={isMandatoryFlightInsurance(passenger, tmcInsuranceFlags)}
              selectionLocked={isMandatoryFlightInsurance(passenger, tmcInsuranceFlags)}
              onSelect={(selectedInsuranceId) => updateForm(passenger.id, { selectedInsuranceId })}
            />
          ) : null;
        })}

        {primaryTravelPassenger && forms[primaryTravelPassenger.id] ? (
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
          />
        ) : null}

        {!initBook.isFetching ? (
          <FlightBookPayTypes
            options={payOptions}
            value={resolvedPayType}
            personHoldMinutes={personHoldMinutes}
            onChange={setTravelPayType}
          />
        ) : null}

        {timedOut ? (
          <p className="text-[13px] text-[#ff8d1a]">
            价格信息可能已过期，提交前请返回舱位页重新查询。
          </p>
        ) : null}

        {initError ? (
          <p className="text-[13px] text-destructive">
            订单初始化失败：{formatApiError(initError)}
          </p>
        ) : null}

        {submitError ? (
          <p className="text-[13px] text-destructive">{formatApiError(submitError)}</p>
        ) : null}
      </div>

      <FlightBookFooter
        amount={orderAmount}
        agreed={agreed}
        pending={isPending}
        pendingLabel={submitPendingLabel}
        disabled={selected.length === 0 || isPending || initBook.isError}
        showTicketNotice={ticketNoticeRules.length > 0}
        showSaveOrder={showSaveOrder}
        onAgreedChange={setAgreed}
        onShowBill={() => setBillOpen(true)}
        onShowTicketNotice={() => setTicketNoticeOpen(true)}
        onSubmit={() => void submitOrder(false)}
        onSave={() => void submitOrder(true)}
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

      <FlightBookBillSheet
        open={billOpen}
        breakdown={billBreakdown}
        onClose={() => setBillOpen(false)}
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
