import { safeJsonStringify } from "./serialize.utils.js";

/**
 * @typedef {string | number | boolean | bigint | { toBigInt: () => bigint }} BigIntable
 */

export const calculateSum = (arr) => arr.reduce((prev, item) => prev + item, 0);

export const beepsToPercentage = (beeps) => beeps / 100;
export const calculateAmountUsingBeeps = (beep, amount) =>
  (amount * beep) / 10000n;

export function toBigInt(value) {
  if (typeof value === "object" && "toBigInt" in value) {
    return value.toBigInt();
  }
  return BigInt(value);
}

export const advancedToBigInt = (value) => {
  if (Array.isArray(value) && value.length === 32) {
    // Convert big-endian byte array to BigInt
    let result = 0n;
    for (let i = 0; i < 32; i += 1) {
      // eslint-disable-next-line no-bitwise
      result = (result << 8n) | BigInt(value[i]);
    }

    return result;
  }

  if (typeof value === "string" || typeof value === "number") {
    return BigInt(value);
  }

  if (typeof value === "bigint") {
    return value;
  }

  throw new Error(
    `Cannot convert value to BigInt: ${typeof value}, value: ${safeJsonStringify(value)}`,
  );
};

/** Converts the value to a BigInt or returns undefined if can't */
export const toBigIntOrUndefined = (value) => {
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
};

/** Converts the value to a number or returns undefined if can't */
export const toNumberOrUndefined = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export const toInt = (param, defaultValue) =>
  param ? parseInt(param, 10) : defaultValue;

export function bigintMax(...values) {
  return values.reduce((max, value) => (value > max ? value : max));
}

// here + before Number convers string to number and cuts unused 0s at the end
export function fixDecimalsAmount(n, decimals) {
  if (n === 0) {
    return 0;
  }
  return n < 0.00000099999 ? " < 0.000001" : +Number(n).toFixed(decimals ?? 6);
}

export const getValueFirstNDigit = (num, numberOfDigits) => {
  const numStr = num.toFixed(20); // if num = 0.03232e-17 -> it will transform to 0.00...03232

  const indexOfDecimal = numStr.indexOf(".");
  // If there's no decimal point, return the original number (or handle this case as you need)
  if (indexOfDecimal === -1) return numStr;

  // Determine the end position for substring, which is start position + n digits after decimal
  const endPosition = indexOfDecimal + numberOfDigits + 1;

  // Get the string from the start to the specified end position
  const resultStr = numStr.substring(0, endPosition);

  return resultStr;
};

export const trimLeadingZeros = (numberString) => {
  // String of repeating 0's (e.g. '0000000') should be replaced with '0', not empty string
  if (/^0+$/.test(numberString)) {
    return "0";
  }
  // One leading zero before decimal point is valid
  if (/^0\.\d+$/.test(numberString)) {
    return numberString;
  }
  const trimmed = numberString.replace(/^0+/, "");
  return trimmed.startsWith(".") ? `0${trimmed}` : trimmed;
};

export const toCommaSeparatedNumberString = (numberString) => {
  const parts = numberString.split(".");
  const integerPart = parts[0];
  // Only add the . and decimal part if exist
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : "";

  // Use a regular expression to format the integer part with commas
  const formattedIntegerPart = trimLeadingZeros(integerPart).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

  return `${formattedIntegerPart}${decimalPart}`;
};

export const truncateToDecimalPlaces = (numStr, decimalPlaces = 18) => {
  const match = numStr.match(/^(\d+)(\.(\d+))?$/);
  if (match) {
    const integerPart = match[1];
    const decimalPart = match[3]?.slice(0, decimalPlaces) || "";
    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  }
  return numStr;
};

export const formatAmountInput = (valueStr, decimals, inputEl) => {
  if (!/^[0-9]*[.]?[0-9]*$/.test(valueStr)) return null;

  const formatted = truncateToDecimalPlaces(
    trimLeadingZeros(valueStr),
    decimals,
  );

  if (inputEl && formatted !== valueStr) {
    const oldPos = inputEl.selectionStart ?? 0;
    const leadingZerosLength = valueStr.match(/^0+(?=\d)/)?.[0]?.length ?? 0;
    const newCursorPos = Math.max(oldPos - leadingZerosLength, 1);

    requestAnimationFrame(() => {
      inputEl.setSelectionRange(newCursorPos, newCursorPos);
    });
  }

  return formatted;
};

/** Return absolute value of BigInt */
export const absBigInt = (n) => (n < 0n ? -n : n);

/** Return the smallest values of the 2 or 3 values provided */
export const minBigInt = (a, b, c) => {
  const minOne = a < b ? a : b;
  if (!c) return minOne;
  return minOne < c ? minOne : c;
};

export const maxBigInt = (a, b) => (a > b ? a : b);
