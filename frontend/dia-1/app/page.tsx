"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ContractGate } from "@/components/ContractGate";
import { config, isContractConfigured } from "@/lib/config";
import { fetchAssetInfo, type AssetInfo } from "@/lib/stellar/contract";
import { toUserErrorMessage } from "@/lib/errors";
import {
  fetchStellarToml,
  isPlaceholderValue,
  tomlHasPlaceholders,
  type StellarCurrency,
  type StellarToml,
} from "@/lib/stellar-toml";

const LATER_DAY_FUNCTIONS = [
  { name: "balance", desc: "Read an investor's RWA token balance" },
  { name: "mint", desc: "Admin mints RWA units to a whitelisted address" },
  { name: "transfer", desc: "Move RWA units between holders" },
  { name: "set_whitelist", desc: "Admin approves or revokes investor access" },
];

function AssetInfoPanel() {
  const [asset, setAsset] = useState<AssetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isContractConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const info = await fetchAssetInfo();
      setAsset(info);
    } catch (err) {
      setError(toUserErrorMessage(err));
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isContractConfigured()) {
    return (
      <Card
        title="On-chain status"
        state="empty"
        emptyMessage="Set NEXT_PUBLIC_CONTRACT_ID to read contract state after initialize."
      />
    );
  }

  if (loading) {
    return <Card title="On-chain status" state="loading" metadata="instance storage" />;
  }

  if (error) {
    return (
      <Card
        title="On-chain status"
        state="error"
        errorMessage={error}
        footer={
          <button
            type="button"
            onClick={() => void load()}
            className="text-action"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!asset) {
    return (
      <Card
        title="On-chain status"
        state="empty"
        emptyMessage="Contract is deployed but not initialized yet. Call initialize on /initialize."
        metadata={
          <code className="font-mono text-mono text-text-muted">
            {config.contractId?.slice(0, 8)}…
          </code>
        }
        footer={
          <Link
            href="/initialize"
            className="text-action"
          >
            Go to Initialize →
          </Link>
        }
      />
    );
  }

  return (
    <Card
      title="On-chain status"
      metadata={
        <span
          className={[
            "status-pip text-label font-semibold uppercase tracking-[0.22em]",
            asset.paused
              ? "status-pip-off text-semantic-warning"
              : "text-semantic-success",
          ].join(" ")}
        >
          {asset.paused ? "Paused" : "Initialized"}
        </span>
      }
      footer={
        <span className="font-mono text-mono">
          payment_token {asset.payment_token}
        </span>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-label uppercase text-text-muted">Name</dt>
          <dd className="mt-1 font-mono text-data text-text-primary">
            {asset.name}
          </dd>
        </div>
        <div>
          <dt className="text-label uppercase text-text-muted">Total supply</dt>
          <dd className="mt-1 font-mono text-data text-text-primary">
            {asset.total_supply.toString()}
          </dd>
        </div>
        <div>
          <dt className="text-label uppercase text-text-muted">Price / unit</dt>
          <dd className="mt-1 font-mono text-data text-text-primary">
            {asset.price_per_unit.toString()}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function CurrencyFields({ currency }: { currency: StellarCurrency }) {
  return (
    <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
      <div className="min-w-0">
        <dt className="text-label uppercase text-text-muted">code</dt>
        <dd className="mt-1">
          {isPlaceholderValue(currency.code) ? (
            <span className="inline-flex items-center rounded-sm border border-dashed border-border-default px-2 py-1 text-label uppercase text-text-muted">
              Not set
            </span>
          ) : (
            <span className="font-mono text-data text-text-primary">
              {currency.code}
            </span>
          )}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-label uppercase text-text-muted">issuer</dt>
        <dd className="mt-1">
          {isPlaceholderValue(currency.issuer) ? (
            <span className="inline-flex items-center rounded-sm border border-dashed border-border-default px-2 py-1 text-label uppercase text-text-muted">
              Not set
            </span>
          ) : (
            <span className="break-all font-mono text-body-sm text-text-primary">
              {currency.issuer}
            </span>
          )}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-label uppercase text-text-muted">status</dt>
        <dd className="mt-1 font-mono text-data text-text-primary">
          {currency.status}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-label uppercase text-text-muted">
          display_decimals
        </dt>
        <dd className="mt-1 font-mono text-data text-text-primary">
          {currency.display_decimals}
        </dd>
      </div>
      <div className="min-w-0 sm:col-span-2">
        <dt className="text-label uppercase text-text-muted">name</dt>
        <dd className="mt-1">
          {isPlaceholderValue(currency.name) ? (
            <span className="inline-flex items-center rounded-sm border border-dashed border-border-default px-2 py-1 text-label uppercase text-text-muted">
              Not set
            </span>
          ) : (
            <span className="break-words text-body text-text-primary">
              {currency.name}
            </span>
          )}
        </dd>
      </div>
      <div className="min-w-0 sm:col-span-2">
        <dt className="text-label uppercase text-text-muted">desc</dt>
        <dd className="mt-1">
          {isPlaceholderValue(currency.desc) ? (
            <span className="inline-flex items-center rounded-sm border border-dashed border-border-default px-2 py-1 text-label uppercase text-text-muted">
              Not set
            </span>
          ) : (
            <span className="break-words text-body text-text-primary">
              {currency.desc}
            </span>
          )}
        </dd>
      </div>
      <div className="min-w-0 sm:col-span-2">
        <dt className="text-label uppercase text-text-muted">conditions</dt>
        <dd className="mt-1">
          {isPlaceholderValue(currency.conditions) ? (
            <span className="inline-flex items-center rounded-sm border border-dashed border-border-default px-2 py-1 text-label uppercase text-text-muted">
              Not set
            </span>
          ) : (
            <span className="break-words text-body text-text-primary">
              {currency.conditions}
            </span>
          )}
        </dd>
      </div>
    </dl>
  );
}

function Sep1Panel() {
  const [toml, setToml] = useState<StellarToml | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await fetchStellarToml();
      setToml(parsed);
    } catch (err) {
      setError(toUserErrorMessage(err));
      setToml(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card
        title="SEP-1 · stellar.toml"
        state="loading"
        metadata="as declared in your stellar.toml"
      />
    );
  }

  if (error) {
    return (
      <Card
        title="SEP-1 · stellar.toml"
        state="error"
        errorMessage={error}
        metadata="as declared in your stellar.toml"
        footer={
          <button
            type="button"
            onClick={() => void load()}
            className="text-action"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!toml) {
    return (
      <Card
        title="SEP-1 · stellar.toml"
        state="empty"
        emptyMessage="No stellar.toml data available."
        metadata="as declared in your stellar.toml"
      />
    );
  }

  return (
    <Card
      title="SEP-1 · stellar.toml"
      metadata="as declared in your stellar.toml"
      className="min-w-0"
      footer={
        <span className="font-mono text-mono">/.well-known/stellar.toml</span>
      }
    >
      <div className="min-w-0 space-y-6">
        {tomlHasPlaceholders(toml) && (
          <div className="motion-pop border-l border-semantic-warning pl-4 text-body-sm text-text-secondary">
            This stellar.toml is still the unfilled template. Replace every TODO
            field with your real org and asset details before showing this to
            anyone.
          </div>
        )}
        <p className="text-body-sm text-text-secondary">
          SEP-1 is the Stellar standard for publishing a{" "}
          <code className="font-mono text-mono text-text-primary">
            stellar.toml
          </code>{" "}
          file at{" "}
          <code className="font-mono text-mono text-text-primary">
            /.well-known/stellar.toml
          </code>
          . Wallets and explorers read it to discover who issues an asset and
          what disclosures apply.
        </p>

        <div>
          <p className="mb-3 text-label font-semibold uppercase text-text-muted">
            [DOCUMENTATION]
          </p>
          <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-label uppercase text-text-muted">
                ORG_NAME
              </dt>
              <dd className="mt-1">
                {isPlaceholderValue(toml.DOCUMENTATION.ORG_NAME) ? (
                  <span className="inline-flex items-center rounded-sm border border-dashed border-border-default px-2 py-1 text-label uppercase text-text-muted">
                    Not set
                  </span>
                ) : (
                  <span className="break-words text-body text-text-primary">
                    {toml.DOCUMENTATION.ORG_NAME}
                  </span>
                )}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-label uppercase text-text-muted">
                ORG_OFFICIAL_EMAIL
              </dt>
              <dd className="mt-1">
                {isPlaceholderValue(toml.DOCUMENTATION.ORG_OFFICIAL_EMAIL) ? (
                  <span className="inline-flex items-center rounded-sm border border-dashed border-border-default px-2 py-1 text-label uppercase text-text-muted">
                    Not set
                  </span>
                ) : (
                  <span className="break-words text-body text-text-primary">
                    {toml.DOCUMENTATION.ORG_OFFICIAL_EMAIL}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {toml.CURRENCIES.map((currency, index) => (
          <div key={`${currency.code}-${index}`} className="min-w-0">
            <p className="mb-3 text-label font-semibold uppercase text-text-muted">
              [[CURRENCIES]]{toml.CURRENCIES.length > 1 ? ` #${index + 1}` : ""}
            </p>
            <CurrencyFields currency={currency} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="border-b border-border-default pb-14 md:pb-24">
        <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)]">
          <div className="space-y-5">
            <p className="meta-kicker">
              Oppia · Stellar Bolivia Bootcamp · Día 1
            </p>
            <h1 className="poster-title text-text-primary">
              RWA <span className="accent-word">Launchpad</span>
            </h1>
          </div>
          <div className="max-w-md space-y-6 lg:pb-2">
            <p className="text-body text-text-secondary">
              Day-one checkpoint: create the repo, fill in{" "}
              <code className="font-mono text-mono text-text-primary">
                stellar.toml
              </code>
              , compile the Soroban scaffold, fund your testnet address, and call{" "}
              <code className="font-mono text-mono text-text-primary">
                initialize
              </code>{" "}
              on your deployed contract. This UI covers that loop; nothing more
              until Día 2.
            </p>
            <Link href="/initialize">
              <Button>Initialize contract</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContractGate>
          <AssetInfoPanel />
        </ContractGate>

        <Sep1Panel />
      </div>

      <Card
        title="Coming in later days"
        metadata="not available on Día 1"
        className="opacity-75"
        footer="These contract functions exist as todo!() stubs; invoking them would panic."
      >
        <p className="mb-4 text-body-sm text-text-muted">
          The Día 1 scaffold declares these entry points but they are not
          implemented yet. Día 2 and Día 3 frontends wire them up as the contract
          grows.
        </p>
        <ul className="space-y-3">
          {LATER_DAY_FUNCTIONS.map((fn) => (
            <li
              key={fn.name}
              className="flex items-start justify-between gap-4 rounded-sm border border-border-subtle bg-bg-elevated/50 px-4 py-3 opacity-60"
            >
              <div>
                <span className="font-mono text-mono text-text-muted">
                  {fn.name}
                </span>
                <p className="mt-0.5 text-body-sm text-text-muted">{fn.desc}</p>
              </div>
              <span className="shrink-0 text-label font-semibold uppercase text-text-muted">
                Día 1: unavailable
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
