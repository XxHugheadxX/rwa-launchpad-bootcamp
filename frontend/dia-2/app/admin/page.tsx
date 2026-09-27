"use client";

import { FormEvent, useState } from "react";
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
import { toUserErrorMessage } from "@/lib/errors";
import {
  initialize,
  mint,
  setWhitelist,
  wrapContractCall,
} from "@/lib/stellar/contract";
import { useWallet } from "@/lib/wallet-context";
import { truncateAddress } from "@/lib/stellar/wallet";

type ActionState = {
  loading: boolean;
  error: string | null;
  hash: string | null;
};

const idle: ActionState = { loading: false, error: null, hash: null };

export default function AdminPage() {
  const {
    address,
    connect,
    connecting,
    signTransaction,
    networkOk,
    isAdmin,
  } = useWallet();

  const adminConfigured = Boolean(config.adminAddress);

  const [assetName, setAssetName] = useState("RWAToken");
  const [totalSupply, setTotalSupply] = useState("1000000");
  const [pricePerUnit, setPricePerUnit] = useState("100");
  const [paymentToken, setPaymentToken] = useState(
    config.paymentTokenId ?? "",
  );
  const [initState, setInitState] = useState<ActionState>(idle);

  const [investor, setInvestor] = useState("");
  const [approved, setApproved] = useState(true);
  const [wlState, setWlState] = useState<ActionState>(idle);

  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintState, setMintState] = useState<ActionState>(idle);

  if (!address) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="poster-page text-text-primary">Admin</h1>
        <Card
          title="Connect as the admin wallet"
          state="empty"
          emptyMessage={
            adminConfigured
              ? `Connect Freighter with ${truncateAddress(config.adminAddress!, 6)} to manage the launchpad.`
              : "Connect Freighter. Also set NEXT_PUBLIC_ADMIN_ADDRESS so this page can verify the admin key."
          }
          footer={
            <Button loading={connecting} onClick={() => void connect()}>
              Connect Freighter
            </Button>
          }
        />
      </div>
    );
  }

  if (!adminConfigured) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="poster-page text-text-primary">Admin</h1>
        <Card
          title="Admin address not configured"
          state="empty"
          emptyMessage="Set NEXT_PUBLIC_ADMIN_ADDRESS to the G… key that owns the contract so instructors can gate this panel cleanly."
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="poster-page text-text-primary">Admin</h1>
        <Card
          title="Connect as the admin wallet"
          state="empty"
          emptyMessage={`Connected ${truncateAddress(address, 5)} is not the configured admin (${truncateAddress(config.adminAddress!, 5)}). Switch accounts in Freighter, then reconnect.`}
          footer={
            <Button variant="secondary" onClick={() => void connect()}>
              Switch / reconnect
            </Button>
          }
        />
      </div>
    );
  }

  async function runAction(
    setState: (s: ActionState) => void,
    fn: () => Promise<{ hash: string }>,
  ) {
    setState({ loading: true, error: null, hash: null });
    try {
      const result = await wrapContractCall(fn());
      setState({ loading: false, error: null, hash: result.hash });
    } catch (err) {
      setState({
        loading: false,
        error: toUserErrorMessage(err),
        hash: null,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="poster-page text-text-primary">Admin</h1>
        <p className="max-w-2xl text-body-sm text-text-secondary">
          Admin calls for the Día 2 launchpad. Connected as{" "}
          <code className="font-mono text-mono text-text-primary">
            {truncateAddress(address, 6)}
          </code>
          .
        </p>
        {!networkOk ? (
          <FormError message="Freighter network does not match NEXT_PUBLIC_NETWORK." />
        ) : null}
      </div>

      <ContractGate>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Initialize" metadata="initialize(admin, asset)">
            <form
              className="space-y-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void runAction(setInitState, () =>
                  initialize(
                    address,
                    {
                      name: assetName.trim(),
                      total_supply: totalSupply,
                      price_per_unit: pricePerUnit,
                      payment_token: paymentToken.trim(),
                      paused: false,
                    },
                    signTransaction,
                  ),
                );
              }}
            >
              <Field label="Asset name (Symbol, ≤32 chars)">
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
              <Field label="Payment token address">
                <input
                  className={inputClassName}
                  required
                  value={paymentToken}
                  onChange={(e) => setPaymentToken(e.target.value)}
                  placeholder="C…"
                />
              </Field>
              {initState.error ? <FormError message={initState.error} /> : null}
              {initState.hash ? <TxSuccess hash={initState.hash} /> : null}
              <Button
                type="submit"
                loading={initState.loading}
                disabled={!networkOk}
              >
                Initialize
              </Button>
            </form>
          </Card>

          <Card title="Mint" metadata="mint(admin, to, amount)">
            <form
              className="space-y-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void runAction(setMintState, () =>
                  mint(address, mintTo.trim(), mintAmount, signTransaction),
                );
              }}
            >
              <Field label="To">
                <input
                  className={inputClassName}
                  required
                  value={mintTo}
                  onChange={(e) => setMintTo(e.target.value)}
                  placeholder="G…"
                />
              </Field>
              <Field label="Amount">
                <input
                  className={inputClassName}
                  required
                  inputMode="numeric"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                />
              </Field>
              {mintState.error ? <FormError message={mintState.error} /> : null}
              {mintState.hash ? <TxSuccess hash={mintState.hash} /> : null}
              <Button
                type="submit"
                variant="secondary"
                loading={mintState.loading}
                disabled={!networkOk}
              >
                Mint
              </Button>
            </form>
          </Card>

          <Card
            title="Whitelist"
            metadata="set_whitelist(admin, investor, approved)"
            className="lg:col-span-2"
          >
            <form
              className="space-y-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void runAction(setWlState, () =>
                  setWhitelist(
                    address,
                    investor.trim(),
                    approved,
                    signTransaction,
                  ),
                );
              }}
            >
              <Field label="Investor address">
                <input
                  className={inputClassName}
                  required
                  value={investor}
                  onChange={(e) => setInvestor(e.target.value)}
                  placeholder="G…"
                />
              </Field>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-border-default bg-bg-elevated px-3">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-border-default accent-brand-blue"
                />
                <span className="text-body-sm text-text-primary">Approved</span>
              </label>
              {wlState.error ? <FormError message={wlState.error} /> : null}
              {wlState.hash ? <TxSuccess hash={wlState.hash} /> : null}
              <Button
                type="submit"
                loading={wlState.loading}
                disabled={!networkOk || !investor.trim()}
              >
                Set whitelist
              </Button>
            </form>
          </Card>
        </div>
      </ContractGate>
    </div>
  );
}
