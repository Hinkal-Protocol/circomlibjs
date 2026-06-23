import { CIRCOM_P } from "./protocol.constants.js";

// Reduce value into [0, m); handles negative inputs.
export const mod = (value, m = CIRCOM_P) => {
  const result = value % m;
  return result >= 0n ? result : result + m;
};

// Modular inverse via extended Euclidean algorithm (a^-1 mod m).
export const modInverse = (value, m = CIRCOM_P) => {
  let lm = 1n;
  let hm = 0n;
  let low = mod(value, m);
  let high = m;

  if (low === 0n) throw new Error("Division by zero");

  while (low > 1n) {
    const remainder = high % low;
    const quotient = high / low;
    high = low;
    low = remainder;
    const nm = hm - lm * quotient;
    hm = lm;
    lm = nm;
  }

  return lm < 0n ? lm + m : lm;
};
