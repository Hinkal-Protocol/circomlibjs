/**
 * @typedef {((key: string, value: any) => any) | null} JsonReplacer
 */
  
  // Safe JSON.stringify wrapper. Converts BigInt -> string so JSON serialization never throws.
    export const safeJsonStringify = (value, replacer = null, space) =>
    JSON.stringify(
    value,
    (key, nestedValue) => {
        const next = typeof replacer === 'function' ? replacer(key, nestedValue) : nestedValue;
        return typeof next === 'bigint' ? next.toString() : next;
    },
    space,
    );