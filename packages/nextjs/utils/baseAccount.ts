/**
 * Utility functions for Base Account features
 * Including paymaster support for gasless transactions
 */

/**
 * Get the paymaster URL from environment variables
 * @returns The paymaster URL or undefined if not configured
 */
export const getPaymasterUrl = (): string | undefined => {
  return process.env.NEXT_PUBLIC_PAYMASTER_URL;
};
