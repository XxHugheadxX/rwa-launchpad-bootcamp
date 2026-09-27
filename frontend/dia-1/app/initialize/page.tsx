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
import { config } from "@/lib/config";
import {
  ContractErrorCode,
  messageForContractError,
  toUserErrorMessage,
} from "@/lib/errors";
import {
  fetchAssetInfo,
  initialize,
  wrapContractCall,
  type AssetInfo,
} from "@/lib/stellar/contract";
import { useWallet } from "@/lib/wallet-context";
import { truncateAddress } from "@/lib/stellar/wallet";

type ActionState = {
  loading: boolean;
  error: string | null;
  hash: string | null;
};

const idle: ActionState = { loading: false, error: null, hash: null };

export default function InitializePage() {
  const { address, connect, connecting, signTransaction, networkOk } =
    useWallet();

  const [assetName, setAssetName] = useState("RWA");
  const [totalSupply, setTotalSupply] = useState("1000000");
  const [pricePerUnit, setPricePerUnit] = useState("100");
  const [paymentToken, setPaymentToken] = useState(
    config.paymentTokenId ?? "",
  );
  const [paused, setPaused] = useState(false);
  const [initState, setInitState] = useState<ActionState>(idle);
  const [existingAsset, setExistingAsset] = useState<AssetInfo | null>(null);
  const [checkingInit, setCheckingInit] = useState(true);

  const checkInitialized = useCallback(async () => {
    setCheckingInit(true);
    try {
      const info = await fetchAssetInfo();
      setExistingAsset(info);
    } catch {
      setExistingAsset(null);
    } finally {
      setCheckingInit(false);
    }
  }, []);

  useEffect(() => {
    void checkInitialized();
  }, [checkInitialized]);

  async function runInitialize() {
    if (!address) return;

    if (existingAsset) {
      setInitState({
        loading: false,
        error: messageForContractError(ContractErrorCode.AlreadyInitialized),
        hash: null,
      });
      return;
    }

    setInitState({ loading: true, error: null, hash: null });
    try {
      const result = await wrapContractCall(
        initialize(
          address,
          {
            name: assetName.trim(),
            total_supply: totalSupply,
            price_per_unit: pricePerUnit,
            payment_token: paymentToken.trim(),
            paused,
          },
          signTransaction,
        ),
      );
      setInitState({ loading: false, error: null, hash: result.hash });
      await checkInitialized();
    } catch (err) {
      setInitState({
        loading: false,
        error: toUserErrorMessage(err),
        hash: null,
      });
    }
  }

  if (!address) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="poster-page text-text-primary">Initialize</h1>
        <Card
          title="Connect Freighter"
          state="empty"
          emptyMessage="Connect your funded testnet wallet. The connected address becomes the contract admin passed to initialize(admin, asset)."
          footer={
            <Button loading={connecting} onClick={() => void connect()}>
              Connect Freighter
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="poster-page text-text-primary">Initialize</h1>
        <p className="text-body-sm text-text-secondary">
          Call{" "}
          <code className="font-mono text-mono text-text-primary">
            initialize(admin, asset)
          </code>{" "}
          on the Día 1 contract. Connected as{" "}
          <code className="font-mono text-mono text-text-primary">
            {truncateAddress(address, 6)}
          </code>{" "}
          (admin).
        </p>
        {!networkOk ? (
          <FormError message="Freighter network does not match NEXT_PUBLIC_NETWORK." />
        ) : null}
      </div>

      <ContractGate>
        {checkingInit ? (
          <Card title="Checking contract state" state="loading" />
        ) : existingAsset && !initState.hash ? (
          <Card
            title="Already initialized"
            state="empty"
            emptyMessage={messageForContractError(
              ContractErrorCode.AlreadyInitialized,
            )}
            metadata={
              <span className="font-mono text-mono">{existingAsset.name}</span>
            }
            footer={
              <dl className="grid gap-2 text-body-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Total supply</dt>
                  <dd className="font-mono text-mono text-text-primary">
                    {existingAsset.total_supply.toString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Price / unit</dt>
                  <dd className="font-mono text-mono text-text-primary">
                    {existingAsset.price_per_unit.toString()}
                  </dd>
                </div>
              </dl>
            }
          />
        ) : (
          <Card title="Asset parameters" metadata="initialize(admin, asset)">
            <form
              className="space-y-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void runInitialize();
              }}
            >
              <Field label="Name" hint="Stored as a Soroban Symbol (≤ 32 chars).">
                <input
                  className={inputClassName}
                  required
                  maxLength={32}
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Total supply">
                  <input
                    className={inputClassName}
                    required
                    inputMode="numeric"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                  />
                </Field>
                <Field label="Price per unit">
                  <input
                    className={inputClassName}
                    required
                    inputMode="numeric"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Payment token" hint="Contract address (C…) for the payment SAC.">
                <input
                  className={inputClassName}
                  required
                  value={paymentToken}
                  onChange={(e) => setPaymentToken(e.target.value)}
                  placeholder="C…"
                />
              </Field>

              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-border-default bg-bg-elevated px-3 transition duration-fast ease-out hover:border-text-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-cyan">
                <input
                  type="checkbox"
                  checked={paused}
                  onChange={(e) => setPaused(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-border-default accent-brand-blue"
                />
                <span className="text-body-sm text-text-primary">
                  Start paused
                </span>
              </label>

              {initState.error ? (
                <FormError message={initState.error} />
              ) : null}
              {initState.hash ? (
                <TxSuccess hash={initState.hash}>
                  Launchpad initialized successfully.
                </TxSuccess>
              ) : null}

              <Button
                type="submit"
                loading={initState.loading}
                disabled={!networkOk}
              >
                Initialize
              </Button>
            </form>
          </Card>
        )}
      </ContractGate>
    </div>
  );
}
