import { CIRCOM_P } from "./protocol.constants.js";
import { mod, modInverse } from "./bigint-math.utils.js";

const P = CIRCOM_P;

// BabyJub base-field arithmetic over CIRCOM_P (same semantics as circomlibjs F).
const F = {
  p: P,
  zero: 0n,
  one: 1n,
  e: (v) => mod(BigInt(v)),
  add: (a, b) => mod(a + b),
  sub: (a, b) => mod(a - b),
  mul: (a, b) => mod(a * b),
  div: (a, b) => {
    if (b === 0n) throw new Error("Division by zero in BabyJub field");
    return mod(a * modInverse(b));
  },
  toString: (a) => mod(a).toString(),
};

/**
 * @typedef {{ X: bigint, Y: bigint, Z: bigint, T: bigint }} ExtPoint
 */

// Neutral element in extended coordinates (affine identity 0, 1).
const IDENTITY = { X: F.zero, Y: F.one, Z: F.one, T: F.zero };

// Embed an affine (x, y) point into extended twisted Edwards form.
const toExtended = (affine) => {
  const x = F.e(affine[0]);
  const y = F.e(affine[1]);
  return { X: x, Y: y, Z: F.one, T: F.mul(x, y) };
};

// Project an extended point back to affine (x, y) coordinates.
const toAffine = (point) => {
  const zInv = modInverse(point.Z);
  return [F.mul(point.X, zInv), F.mul(point.Y, zInv)];
};

const A = F.e("168700");
const D = F.e("168696");

// Add two extended points (add-2008-hwcd; no per-step field inversions).
const addExtended = (p1, p2) => {
  const a = F.mul(p1.X, p2.X);
  const b = F.mul(p1.Y, p2.Y);
  const c = F.mul(F.mul(p1.T, p2.T), D);
  const d = F.mul(p1.Z, p2.Z);
  const e = F.sub(F.mul(F.add(p1.X, p1.Y), F.add(p2.X, p2.Y)), F.add(a, b));
  const f = F.sub(d, c);
  const g = F.add(d, c);
  const h = F.sub(b, F.mul(A, a));
  return {
    X: F.mul(e, f),
    Y: F.mul(g, h),
    T: F.mul(e, h),
    Z: F.mul(f, g),
  };
};

// Double an extended point (dbl-2008-hwcd; no per-step field inversions).
const doubleExtended = (p) => {
  const a = F.mul(p.X, p.X);
  const b = F.mul(p.Y, p.Y);
  const c = F.mul(F.mul(p.Z, p.Z), 2n);
  const d = F.mul(A, a);
  const e = F.sub(F.mul(F.add(p.X, p.Y), F.add(p.X, p.Y)), F.add(a, b));
  const g = F.add(d, b);
  const f = F.sub(g, c);
  const h = F.sub(d, b);
  return {
    X: F.mul(e, f),
    Y: F.mul(g, h),
    T: F.mul(e, h),
    Z: F.mul(f, g),
  };
};

// Pure-JS BabyJub curve used on React Native (circomlibjs uses WASM instead).
export class BabyJubRN {
  static A = A;

  static D = D;

  F = F;

  A = A;

  D = D;

  // Standard BabyJub generator used by EdDSA (matches circomlibjs Base8).
  Base8 = [
    F.e(
      "5299619240641551281634865583518297030282874472190772894086521144482721001553",
    ),
    F.e(
      "16950150798460657717958625567821834550301663161624707787222815936182638968203",
    ),
  ];

  // Add two affine curve points.
  addPoint(a, b) {
    return toAffine(addExtended(toExtended(a), toExtended(b)));
  }

  // Scalar multiplication: returns e * base (double-and-add in extended coords).
  mulPointEscalar(base, e) {
    let res = IDENTITY;
    let exp = toExtended(base);
    let rem = BigInt(e);

    while (rem !== 0n) {
      if (rem % 2n === 1n) res = addExtended(res, exp);
      exp = doubleExtended(exp);
      rem /= 2n;
    }

    return toAffine(res);
  }
}
