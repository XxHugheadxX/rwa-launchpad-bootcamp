/** Contract Error enum from dia-3/src/lib.rs */
export enum ContractErrorCode {
  NotInitialized = 1,
  AlreadyInitialized = 2,
  InsufficientBalance = 3,
  InvalidAmount = 4,
  NotWhitelisted = 5,
  Paused = 6,
  AmountTooLow = 7,
}

/** Minimum payment amount enforced by check_variation_gate in dia-3/src/lib.rs. */
export const MIN_INVESTMENT = 500n;

/** Every code declared above, so adding a variant is enough to make it parseable. */
const KNOWN_CODES: ReadonlySet<number> = new Set(
  Object.values(ContractErrorCode).filter(
    (value): value is number => typeof value === "number",
  ),
);

const MESSAGES: Record<ContractErrorCode, string> = {
  [ContractErrorCode.NotInitialized]:
    "The launchpad has not been initialized yet. An admin must call initialize first.",
  [ContractErrorCode.AlreadyInitialized]:
    "The launchpad is already initialized. initialize can only run once.",
  [ContractErrorCode.InsufficientBalance]:
    "Insufficient RWA token balance for this transfer.",
  [ContractErrorCode.InvalidAmount]:
    "Invalid amount. Amounts must be greater than zero (and large enough to mint at least 1 unit).",
  [ContractErrorCode.NotWhitelisted]:
    "This wallet is not whitelisted. Ask an admin to approve your address before investing.",
  [ContractErrorCode.Paused]:
    "The launchpad is paused. Mint, transfer, and invest are disabled until an admin unpauses.",
  [ContractErrorCode.AmountTooLow]:
    `Investment too small. Each invest must be at least ${MIN_INVESTMENT} units of the payment token.`,
};

export function messageForContractError(
  code: ContractErrorCode | number,
): string {
  return (
    MESSAGES[code as ContractErrorCode] ??
    `Contract error #${code}. Check the transaction details on Stellar Expert.`
  );
}

/** Extract Soroban contract error code from SDK / RPC error text. */
export function parseContractErrorCode(error: unknown): number | null {
  const text =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? `${error.message}\n${String((error as Error & { response?: unknown }).response ?? "")}`
        : String(error);

  const patterns = [
    /Error\(Contract,\s*#(\d+)\)/i,
    /ContractError\((\d+)\)/i,
    /"code"\s*:\s*(\d+)/,
    /error:\s*#(\d+)/i,
    /HostError[^\d]*(\d+)/i,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    if (match?.[1]) {
      const code = Number(match[1]);
      if (KNOWN_CODES.has(code)) return code;
    }
  }

  // Sometimes the numeric code alone appears near "contract"
  const loose = text.match(/contract[^0-9]{0,40}#?(\d+)\b/i);
  if (loose?.[1] && KNOWN_CODES.has(Number(loose[1]))) return Number(loose[1]);

  return null;
}

export class ContractCallError extends Error {
  readonly code: number | null;

  constructor(message: string, code: number | null = null) {
    super(message);
    this.name = "ContractCallError";
    this.code = code;
  }
}

export function toUserErrorMessage(error: unknown): string {
  const code = parseContractErrorCode(error);
  if (code !== null) return messageForContractError(code);

  if (error instanceof Error && error.message) {
    if (/User declined|rejected|denied/i.test(error.message)) {
      return "Transaction rejected in Freighter.";
    }
    if (/network/i.test(error.message) && /mismatch|passphrase/i.test(error.message)) {
      return "Wallet network does not match this app. Switch Freighter to the configured network.";
    }
    return error.message;
  }

  return "Something went wrong. See the browser console for details.";
}

export function toContractCallError(error: unknown): ContractCallError {
  const code = parseContractErrorCode(error);
  return new ContractCallError(toUserErrorMessage(error), code);
}

export function isNotWhitelistedError(error: unknown): boolean {
  if (error instanceof ContractCallError) {
    return error.code === ContractErrorCode.NotWhitelisted;
  }
  if (parseContractErrorCode(error) === ContractErrorCode.NotWhitelisted) {
    return true;
  }
  const text =
    error instanceof Error ? error.message : String(error ?? "");
  return /not whitelisted/i.test(text);
}
