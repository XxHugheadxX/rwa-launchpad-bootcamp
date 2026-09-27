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
import { toUserErrorMessage } from "@/lib/errors";
import {
  balance as readBalance,
  transfer,
  wrapContractCall,
} from "@/lib/stellar/contract";
import { useWallet } from "@/lib/wallet-context";
import { truncateAddress } from "@/lib/stellar/wallet";

export default function UserPage() {
  const { address, connect, connecting, signTransaction, networkOk } =
    useWallet();

  const [lookupAddress, setLookupAddress] = useState("");
  const [bal, setBal] = useState<bigint | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [balError, setBalError] = useState<string | null>(null);

  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferHash, setTransferHash] = useState<string | null>(null);

  useEffect(() => {
    if (address && !lookupAddress) {
      setLookupAddress(address);
    }
  }, [address, lookupAddress]);

  const effectiveLookup = lookupAddress.trim() || address || "";

  const refreshBalance = useCallback(async () => {
    if (!effectiveLookup || !address) {
      setBal(null);
      return;
    }
    setBalLoading(true);
    setBalError(null);
    try {
      const value = await wrapContractCall(
        readBalance(effectiveLookup, address),
      );
      setBal(value);
    } catch (err) {
      setBalError(toUserErrorMessage(err));
      setBal(null);
    } finally {
      setBalLoading(false);
    }
  }, [effectiveLookup, address]);

  useEffect(() => {
    if (address && effectiveLookup) {
      void refreshBalance();
    }
  }, [address, effectiveLookup, refreshBalance]);

  if (!address) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="poster-page text-text-primary">User</h1>
        <Card
          title="Wallet required"
          state="empty"
          emptyMessage="Connect Freighter to look up balances and submit transfer transactions."
          footer={
            <Button loading={connecting} onClick={() => void connect()}>
              Connect Freighter
            </Button>
          }
        />
      </div>
    );
  }

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    await refreshBalance();
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
        <h1 className="poster-page text-text-primary">User</h1>
        <p className="max-w-2xl text-body-sm text-text-secondary">
          Look up RWA token balances and transfer units between addresses.
          Connected as{" "}
          <code className="font-mono text-mono text-text-primary">
            {truncateAddress(address, 6)}
          </code>
          .
        </p>
        {!networkOk ? (
          <FormError message="Freighter network does not match NEXT_PUBLIC_NETWORK. Switch networks before submitting." />
        ) : null}
      </div>

      <ContractGate>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Balance lookup" metadata="balance(id)">
            <form className="space-y-4" onSubmit={(e) => void onLookup(e)}>
              <Field
                label="Address"
                hint="Defaults to your connected wallet."
              >
                <input
                  className={inputClassName}
                  required
                  value={lookupAddress}
                  onChange={(e) => setLookupAddress(e.target.value)}
                  placeholder="G…"
                />
              </Field>
              {balError ? <FormError message={balError} /> : null}
              <div className="rounded-md border border-border-subtle bg-bg-elevated/50 px-4 py-3">
                <p className="text-label uppercase text-text-muted">Balance</p>
                {balLoading ? (
                  <p className="mt-1 text-body-sm text-text-secondary">
                    Loading…
                  </p>
                ) : (
                  <p className="mt-1 font-mono text-data text-text-primary">
                    {bal === null ? "-" : bal.toString()}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                variant="secondary"
                loading={balLoading}
                disabled={!networkOk}
              >
                Look up balance
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
                  placeholder="G…"
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
