"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ContractGate } from "@/components/ContractGate";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Field,
  FormError,
  TxSuccess,
  inputClassName,
} from "@/components/ui/FormBits";
import {
  MIN_INVESTMENT,
  isNotWhitelistedError,
  toUserErrorMessage,
} from "@/lib/errors";
import {
  balance as readBalance,
  invest,
  transfer,
  wrapContractCall,
} from "@/lib/stellar/contract";
import { useWallet } from "@/lib/wallet-context";

export default function InvestPage() {
  const { address, connect, connecting, signTransaction, networkOk } =
    useWallet();

  const [bal, setBal] = useState<bigint | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [balError, setBalError] = useState<string | null>(null);

  const [notWhitelisted, setNotWhitelisted] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [investLoading, setInvestLoading] = useState(false);
  const [investError, setInvestError] = useState<string | null>(null);
  const [investHash, setInvestHash] = useState<string | null>(null);
  const [minted, setMinted] = useState<bigint | null>(null);

  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferHash, setTransferHash] = useState<string | null>(null);

  const trimmedAmount = paymentAmount.trim();

  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBal(null);
      return;
    }
    setBalLoading(true);
    setBalError(null);
    try {
      const value = await wrapContractCall(readBalance(address, address));
      setBal(value);
    } catch (err) {
      setBalError(toUserErrorMessage(err));
      setBal(null);
    } finally {
      setBalLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  if (!address) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="poster-page text-text-primary">Invest</h1>
        <Card
          title="Wallet required"
          state="empty"
          emptyMessage="Connect Freighter to view your RWA balance and submit invest / transfer transactions."
          footer={
            <Button loading={connecting} onClick={() => void connect()}>
              Connect Freighter
            </Button>
          }
        />
      </div>
    );
  }

  async function onInvest(e: FormEvent) {
    e.preventDefault();
    if (!address || notWhitelisted) return;
    setInvestLoading(true);
    setInvestError(null);
    setInvestHash(null);
    setMinted(null);
    try {
      const result = await wrapContractCall(
        invest(address, trimmedAmount, signTransaction),
      );
      setInvestHash(result.hash);
      setMinted(result.result);
      setPaymentAmount("");
      await refreshBalance();
    } catch (err) {
      if (isNotWhitelistedError(err)) {
        setNotWhitelisted(true);
      }
      setInvestError(toUserErrorMessage(err));
    } finally {
      setInvestLoading(false);
    }
  }

  async function onTransfer(e: FormEvent) {
    e.preventDefault();
    if (!address) return;
    setTransferLoading(true);
    setTransferError(null);
    setTransferHash(null);
    try {
      const result = await wrapContractCall(
        transfer(address, transferTo.trim(), transferAmount, signTransaction),
      );
      setTransferHash(result.hash);
      setTransferTo("");
      setTransferAmount("");
      await refreshBalance();
    } catch (err) {
      setTransferError(toUserErrorMessage(err));
    } finally {
      setTransferLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="poster-page text-text-primary">Invest</h1>
        <p className="max-w-2xl text-body-sm text-text-secondary">
          Whitelisted investors call <code className="font-mono text-mono">invest</code>{" "}
          with a payment-token amount; the contract mints{" "}
          <code className="font-mono text-mono">payment_amount / price_per_unit</code>{" "}
          RWA units. Each investment must be at least{" "}
          <code className="font-mono text-mono">{MIN_INVESTMENT.toString()}</code>{" "}
          payment units; below that the contract fails with{" "}
          <code className="font-mono text-mono">AmountTooLow</code>. Transfer moves
          RWA balances between addresses.
        </p>
        {!networkOk ? (
          <FormError message="Freighter network does not match NEXT_PUBLIC_NETWORK. Switch networks before submitting." />
        ) : null}
        {notWhitelisted ? (
          <FormError message="This wallet is not whitelisted. Ask an admin to approve your address on /admin before investing." />
        ) : null}
      </div>

      <ContractGate>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card
            title="RWA balance"
            metadata="balance(address)"
            state={balLoading ? "loading" : balError ? "error" : "default"}
            errorMessage={balError ?? undefined}
            footer={
              <button
                type="button"
                className="text-action"
                onClick={() => void refreshBalance()}
              >
                Refresh
              </button>
            }
          >
            <p className="font-mono text-data text-text-primary">
              {bal === null ? "-" : bal.toString()}
            </p>
            <p className="mt-2 font-mono text-mono text-text-muted">
              {address}
            </p>
          </Card>

          <Card title="Invest" metadata="invest(investor, payment_amount)">
            <form className="space-y-4" onSubmit={(e) => void onInvest(e)}>
              <Field
                label="Payment amount"
                hint={`Integer units of the payment token (i128). Minimum ${MIN_INVESTMENT} per investment.`}
              >
                <input
                  className={inputClassName}
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={MIN_INVESTMENT.toString()}
                  disabled={notWhitelisted || !networkOk}
                />
              </Field>
              {investError ? <FormError message={investError} /> : null}
              {investHash ? (
                <TxSuccess hash={investHash}>
                  Invested successfully
                  {minted !== null ? `, minted ${minted.toString()} RWA` : ""}.
                </TxSuccess>
              ) : null}
              <Button
                type="submit"
                loading={investLoading}
                disabled={notWhitelisted || !networkOk}
              >
                Invest
              </Button>
            </form>
          </Card>

          <Card title="Transfer" metadata="transfer(from, to, amount)">
            <form className="space-y-4" onSubmit={(e) => void onTransfer(e)}>
              <Field label="To address">
                <input
                  className={inputClassName}
                  required
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="G… or C…"
                  disabled={!networkOk}
                />
              </Field>
              <Field label="Amount">
                <input
                  className={inputClassName}
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="1"
                  disabled={!networkOk}
                />
              </Field>
              {transferError ? <FormError message={transferError} /> : null}
              {transferHash ? <TxSuccess hash={transferHash} /> : null}
              <Button
                type="submit"
                variant="secondary"
                loading={transferLoading}
                disabled={!networkOk}
              >
                Transfer
              </Button>
            </form>
          </Card>
        </div>
      </ContractGate>
    </div>
  );
}
