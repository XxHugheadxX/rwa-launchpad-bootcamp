import {
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { Api, Server, assembleTransaction } from "@stellar/stellar-sdk/rpc";
import { config, isContractConfigured } from "@/lib/config";
import { toContractCallError } from "@/lib/errors";
import { networkPassphrase } from "@/lib/stellar/network";

export type SignTransactionFn = (
  xdr: string,
  opts: { networkPassphrase: string; address: string },
) => Promise<string>;

export type TxResult<T = void> = {
  hash: string;
  result: T;
};

export type AssetInfo = {
  name: string;
  total_supply: bigint;
  price_per_unit: bigint;
  payment_token: string;
  paused: boolean;
};

function requireContractId(): string {
  if (!config.contractId) {
    throw new Error(
      "Contract not configured. Set NEXT_PUBLIC_CONTRACT_ID in your environment.",
    );
  }
  return config.contractId;
}

export function getRpcServer(): Server {
  return new Server(config.sorobanRpcUrl, { allowHttp: false });
}

function addressScVal(address: string): xdr.ScVal {
  return Address.fromString(address).toScVal();
}

function i128ScVal(amount: bigint | string | number): xdr.ScVal {
  return nativeToScVal(BigInt(amount), { type: "i128" });
}

function boolScVal(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

function symbolScVal(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "symbol" });
}

function assetInfoScVal(asset: {
  name: string;
  total_supply: bigint | string | number;
  price_per_unit: bigint | string | number;
  payment_token: string;
  paused: boolean;
}): xdr.ScVal {
  // Soroban only accepts a map whose keys are sorted; any other order fails
  // with "ScMap was not sorted by key for conversion to host object".
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: symbolScVal("name"),
      val: symbolScVal(asset.name),
    }),
    new xdr.ScMapEntry({
      key: symbolScVal("paused"),
      val: boolScVal(asset.paused),
    }),
    new xdr.ScMapEntry({
      key: symbolScVal("payment_token"),
      val: addressScVal(asset.payment_token),
    }),
    new xdr.ScMapEntry({
      key: symbolScVal("price_per_unit"),
      val: i128ScVal(asset.price_per_unit),
    }),
    new xdr.ScMapEntry({
      key: symbolScVal("total_supply"),
      val: i128ScVal(asset.total_supply),
    }),
  ]);
}

function parseAssetInfoNative(raw: unknown): AssetInfo {
  const obj = raw as Record<string, unknown>;
  const name =
    typeof obj.name === "string"
      ? obj.name
      : String(obj.name ?? "");
  return {
    name,
    total_supply: BigInt(String(obj.total_supply ?? 0)),
    price_per_unit: BigInt(String(obj.price_per_unit ?? 0)),
    payment_token: String(obj.payment_token ?? ""),
    paused: Boolean(obj.paused),
  };
}

async function pollTransaction(
  server: Server,
  hash: string,
): Promise<Api.GetSuccessfulTransactionResponse> {
  const started = Date.now();
  const timeoutMs = 60_000;

  while (Date.now() - started < timeoutMs) {
    const tx = await server.getTransaction(hash);
    if (tx.status === Api.GetTransactionStatus.SUCCESS) {
      return tx as Api.GetSuccessfulTransactionResponse;
    }
    if (tx.status === Api.GetTransactionStatus.FAILED) {
      throw new Error(
        `Transaction failed on-chain: ${JSON.stringify(tx, null, 2)}`,
      );
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error(`Timed out waiting for transaction ${hash}`);
}

async function simulateRead<T>(
  functionName: string,
  args: xdr.ScVal[],
  sourceAddress: string,
): Promise<T> {
  const contractId = requireContractId();
  const server = getRpcServer();
  const account = await server.getAccount(sourceAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase(),
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  }
  if (!Api.isSimulationSuccess(simulated) || !simulated.result) {
    throw new Error("Simulation did not return a result.");
  }

  return scValToNative(simulated.result.retval) as T;
}

async function invoke(
  functionName: string,
  args: xdr.ScVal[],
  signerAddress: string,
  signTransaction: SignTransactionFn,
): Promise<{ hash: string; retval?: xdr.ScVal }> {
  const contractId = requireContractId();
  const server = getRpcServer();
  const account = await server.getAccount(signerAddress);
  const contract = new Contract(contractId);
  const passphrase = networkPassphrase();

  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(built);
  if (Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  }
  if (Api.isSimulationRestore(simulated)) {
    throw new Error(
      "Account or contract data needs restore before this call. Fund/restore via Freighter or Friendbot, then retry.",
    );
  }

  const prepared = assembleTransaction(built, simulated).build();
  const signedXdr = await signTransaction(prepared.toXDR(), {
    networkPassphrase: passphrase,
    address: signerAddress,
  });

  const signedTx = TransactionBuilder.fromXDR(signedXdr, passphrase);
  const send = await server.sendTransaction(signedTx);

  if (send.status === "ERROR") {
    throw new Error(
      `Submit error: ${JSON.stringify(send.errorResult ?? send, null, 2)}`,
    );
  }

  const hash = send.hash;
  const confirmed = await pollTransaction(server, hash);
  const retval = confirmed.returnValue;

  return { hash, retval };
}

export async function fetchAssetInfo(): Promise<AssetInfo | null> {
  if (!isContractConfigured()) return null;

  const server = getRpcServer();
  const contractId = requireContractId();

  const ledgerKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: Address.fromString(contractId).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    }),
  );

  const { entries } = await server.getLedgerEntries(ledgerKey);
  if (!entries.length) return null;

  const instance = entries[0].val.contractData().val().instance();
  const storage = instance.storage();
  if (!storage || storage.length === 0) return null;

  for (const entry of storage) {
    const keyNative = scValToNative(entry.key());
    if (!isAssetInfoKey(keyNative)) continue;

    const value = scValToNative(entry.val());
    return parseAssetInfoNative(value);
  }

  return null;
}

function isAssetInfoKey(keyNative: unknown): boolean {
  if (keyNative === "AssetInfo") return true;
  if (Array.isArray(keyNative) && keyNative[0] === "AssetInfo") return true;
  if (keyNative && typeof keyNative === "object") {
    const obj = keyNative as Record<string, unknown>;
    if (obj.tag === "AssetInfo" || obj._tag === "AssetInfo") return true;
  }
  return false;
}

export async function balance(
  id: string,
  sourceAddress: string,
): Promise<bigint> {
  const result = await simulateRead<bigint | number | string>(
    "balance",
    [addressScVal(id)],
    sourceAddress,
  );
  return BigInt(result);
}

export async function initialize(
  admin: string,
  asset: {
    name: string;
    total_supply: bigint | string | number;
    price_per_unit: bigint | string | number;
    payment_token: string;
    paused?: boolean;
  },
  signTransaction: SignTransactionFn,
): Promise<TxResult> {
  const { hash } = await invoke(
    "initialize",
    [
      addressScVal(admin),
      assetInfoScVal({
        name: asset.name,
        total_supply: asset.total_supply,
        price_per_unit: asset.price_per_unit,
        payment_token: asset.payment_token,
        paused: asset.paused ?? false,
      }),
    ],
    admin,
    signTransaction,
  );
  return { hash, result: undefined };
}

export async function mint(
  admin: string,
  to: string,
  amount: bigint | string | number,
  signTransaction: SignTransactionFn,
): Promise<TxResult> {
  const { hash } = await invoke(
    "mint",
    [addressScVal(admin), addressScVal(to), i128ScVal(amount)],
    admin,
    signTransaction,
  );
  return { hash, result: undefined };
}

export async function transfer(
  from: string,
  to: string,
  amount: bigint | string | number,
  signTransaction: SignTransactionFn,
): Promise<TxResult> {
  const { hash } = await invoke(
    "transfer",
    [addressScVal(from), addressScVal(to), i128ScVal(amount)],
    from,
    signTransaction,
  );
  return { hash, result: undefined };
}

export async function setWhitelist(
  admin: string,
  investor: string,
  approved: boolean,
  signTransaction: SignTransactionFn,
): Promise<TxResult> {
  const { hash } = await invoke(
    "set_whitelist",
    [addressScVal(admin), addressScVal(investor), boolScVal(approved)],
    admin,
    signTransaction,
  );
  return { hash, result: undefined };
}

export function wrapContractCall<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err) => {
    throw toContractCallError(err);
  });
}
