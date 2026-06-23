import * as poseidonLite from 'poseidon-lite';

const toBigInt = (v) => {
    switch (typeof v) {
      case 'bigint':  return v;
      case 'boolean': return v ? 1n : 0n;
      case 'number':
        if (!Number.isInteger(v)) throw new TypeError(`Poseidon: non-integer Number ${v}`);
        return BigInt(v);
      case 'string': {
        try { return BigInt(v.trim()); }
        catch { throw new TypeError(`Poseidon: cannot parse string "${v}" as an integer`); }
      }
      default:
        throw new TypeError(`Poseidon.F: unsupported value of type ${typeof v}`);
    }
  };

// poseidon-lite exposes `poseidon1`..`poseidon16`; wrap them in a `buildPoseidon`-shaped
// factory (matching the WASM reference) so callers — and the existing
// `poseidon.F.toString(...)` pattern — keep working on RN.
export const buildPoseidon = () => {
  const poseidon = (inputs, initState = 0, nOut = 1) => {
    const fn = poseidonLite[`poseidon${inputs.length}`];
    if (!fn) throw new Error(`Poseidon: arity ${inputs.length} not supported (1..16)`);
    const formattedInputs = inputs.map((v) => toBigInt(v));

    if (nOut > 1) {
      const results = fn(formattedInputs, nOut);
      return results.map(v => BigInt(v));
    }

    const res = fn(formattedInputs);
    return BigInt(res);
  };
  poseidon.F = {
    toString: (v) => toBigInt(v).toString(),
    e: (v) => toBigInt(v),
    eq: (a, b) => toBigInt(a) === toBigInt(b),
  };
  return poseidon;
};