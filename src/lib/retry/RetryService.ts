import { LOGGER, Logger } from "logging/Logger.js";
import { container } from "tsyringe";

export interface RetryOptions {
    /** Total attempts including the first try. e.g. 3 = 1 try + 2 retries. */
    maxAttempts: number;
    /** Initial delay in ms before the first retry. */
    baseDelayMs: number;
    /** Cap the computed backoff at this value in ms. */
    maxDelayMs: number;
    /**
     * Predicate to decide whether a given error should be retried.
     * Defaults to retrying common transient network errors.
     */
    isRetryable?: (err: Error) => boolean;
    /**
     * Optional hook called before each retry sleep.
     * Use for metrics, custom logging, or testing instrumentation.
     */
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Default retryable error predicate.
 * Retries common transient network errors; does NOT retry application-level
 * errors (4xx, validation failures, etc.) which would never succeed on retry.
 */
const DEFAULT_IS_RETRYABLE = (err: Error): boolean => {
    const retryableMessages = [
        "ECONNRESET",
        "ETIMEDOUT",
        "ECONNREFUSED",
        "socket hang up",
    ];
    return retryableMessages.some((m) => err.message.includes(m));
};

/**
 * Executes `fn` with exponential backoff and full jitter.
 *
 * Jitter formula (AWS recommendation):
 *   wait = random(0, min(maxDelayMs, baseDelayMs * 2^(attempt-1)))
 *
 * Full jitter spreads retries randomly across the time window, preventing
 * the thundering herd problem when many clients retry simultaneously after
 * a shared service recovers.
 *
 * @param fn   - Async function to execute. Called up to `opts.maxAttempts` times.
 * @param opts - Retry configuration (attempts, delays, retryable predicate).
 * @returns    - The resolved value of `fn` on success.
 * @throws     - The last error if all attempts are exhausted, or immediately
 *               if the error is deemed non-retryable by `isRetryable`.
 *
 * @example
 * const result = await withRetry(
 *   () => cloudinaryService.upload(buffer, mimeType, options),
 *   {
 *     maxAttempts: 3,
 *     baseDelayMs: 200,
 *     maxDelayMs: 2000,
 *     isRetryable: (err) =>
 *       err.message.includes("ECONNRESET") || err.message.includes("500"),
 *   },
 * );
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    opts: RetryOptions,
): Promise<T> {
    const isRetryable = opts.isRetryable ?? DEFAULT_IS_RETRYABLE;
    let lastError: Error = new Error("Unknown error");

    // Lazily resolve logger - withRetry is a plain function, not a DI class,
    // so we resolve from the container only when actually needed (on first retry).
    let logger: Logger | null = null;
    const getLogger = (): Logger => {
        if (!logger) {
            logger = container.resolve<Logger>(LOGGER);
        }
        return logger;
    };

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err as Error;
            const isLast = attempt === opts.maxAttempts;

            if (isLast || !isRetryable(lastError)) {
                // Final attempt or non-retryable error - propagate immediately
                throw lastError;
            }

            // Full jitter: random(0, cap) - avoids synchronized retry storms
            const cap = Math.min(
                opts.maxDelayMs,
                opts.baseDelayMs * Math.pow(2, attempt - 1),
            );
            const delayMs = Math.random() * cap;

            if (opts.onRetry) {
                opts.onRetry(attempt, lastError, delayMs);
            } else {
                getLogger().warn("[Retry] Attempt failed, retrying", {
                    attempt,
                    maxAttempts: opts.maxAttempts,
                    delayMs: Math.round(delayMs),
                    error: lastError.message,
                });
            }

            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
        }
    }

    // TypeScript requires this - the loop always throws before reaching here
    throw lastError;
}
