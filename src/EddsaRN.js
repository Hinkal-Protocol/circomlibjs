/* eslint-disable no-bitwise */
// React Native port of circomlibjs-hinkal-fork/src/eddsa.js (Poseidon EdDSA over BabyJubJub).
import { blake512 } from '@noble/hashes/blake1.js';
import { buildBabyJubRN } from './babyjubRN.js';
import { buildPoseidon as buildPoseidonRN } from './poseidonRN.js';
import { mod } from './bigint-math.utils.js';

const BABYJUB_ORDER = 21888242871839275222246405745257275088614511777268538073601725287587578984328n;
const SUB_ORDER = BABYJUB_ORDER / 8n;

const leBuff2int = (buff, offset = 0, length = buff.length - offset) => {
  let result = 0n;
  for (let i = length - 1; i >= 0; i -= 1) {
    result = (result << 8n) + BigInt(buff[offset + i]);
  }
  return result;
};

const toRprLE = (buff, offset, value, length) => {
  let v = mod(value);
  for (let i = 0; i < length; i += 1) {
    buff[offset + i] = Number(v & 0xffn);
    v >>= 8n;
  }
};

const modSubOrder = (value) => mod(value, SUB_ORDER);

const pruneBuffer = (buff) => {
  const out = new Uint8Array(buff);
  out[0] = out[0] & 0xf8;
  out[31] = out[31] & 0x7f;
  out[31] = out[31] | 0x40;
  return out;
};

/**
 * @typedef {((inputs: bigint[]) => bigint) & { F: { toString: (v: bigint | number | string) => string } }} PoseidonFn
 */

export class EddsaRN {
  constructor(babyJub, poseidon) {
    this.babyJub = babyJub;
    this.poseidon = poseidon;
  }

  prv2pub(prv) {
    const sBuff = pruneBuffer(blake512(prv).slice(0, 32));
    const s = leBuff2int(sBuff, 0, 32);
    return this.babyJub.mulPointEscalar(this.babyJub.Base8, s / 8n);
  }

  signPoseidon(prv, msg) {
    const sBuff = pruneBuffer(blake512(prv));
    const s = leBuff2int(sBuff, 0, 32);
    const A = this.babyJub.mulPointEscalar(this.babyJub.Base8, s / 8n);

    const composeBuff = new Uint8Array(64);
    composeBuff.set(sBuff.slice(32), 0);
    toRprLE(composeBuff, 32, msg, 32);

    const rBuff = blake512(composeBuff);
    const r = modSubOrder(leBuff2int(rBuff, 0, 64));
    const R8 = this.babyJub.mulPointEscalar(this.babyJub.Base8, r);

    const hm = this.poseidon([R8[0], R8[1], A[0], A[1], msg]);
    const hms = mod(BigInt(this.poseidon.F.toString(hm)));
    const S = modSubOrder(r + modSubOrder(hms * s));

    return { R8, S };
  }
}

export const buildEddsaRN = async () => {
  return new EddsaRN(buildBabyJubRN(), buildPoseidonRN());
};