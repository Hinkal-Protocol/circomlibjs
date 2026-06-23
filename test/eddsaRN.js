import chai from "chai";
import { Scalar } from "ffjavascript";
import { buildEddsaRN } from "../src/EddsaRN.js";
import { Buffer } from "node:buffer";

const assert = chai.assert;

import buildEddsa from "../src/eddsa.js";

const fromHexString = (hexString) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const KEY_A = Buffer.from(
  "0001020304050607080900010203040506070809000102030405060708090001",
  "hex",
);
const KEY_B = Buffer.from(
  "1111111111111111111111111111111111111111111111111111111111111111",
  "hex",
);
const KEY_C = Buffer.from(
  "f00dcafef00dcafef00dcafef00dcafef00dcafef00dcafef00dcafef00dcafe0",
  "hex",
);

describe("EdDSA js test", function () {
  let eddsa;
  let eddsaRN;
  this.timeout(100000);

  before(async () => {
    eddsa = await buildEddsa();
    eddsaRN = await buildEddsaRN();
  });

  const asMsg = (big) => ({
    msg: eddsa.babyJub.F.e(big),
    msgRN: BigInt(Scalar.toString(big)),
  });
  const toF = (pair) => [
    eddsa.babyJub.F.e(pair[0]),
    eddsa.babyJub.F.e(pair[1]),
  ];

  it("Sign (using Poseidon) a single 10 bytes from 0 to 9", () => {
    const F = eddsa.babyJub.F;
    const msgBuf = fromHexString("000102030405060708090000");

    const msg = eddsa.babyJub.F.e(Scalar.fromRprLE(msgBuf, 0));
    const msgRN = BigInt(Scalar.toString(Scalar.fromRprLE(msgBuf, 0)));

    //  const prvKey = crypto.randomBytes(32);

    const prvKey = Buffer.from(
      "0001020304050607080900010203040506070809000102030405060708090001",
      "hex",
    );

    const pubKey = eddsa.prv2pub(prvKey);

    assert(
      F.eq(
        pubKey[0],
        F.e(
          "13277427435165878497778222415993513565335242147425444199013288855685581939618",
        ),
      ),
    );
    assert(
      F.eq(
        pubKey[1],
        F.e(
          "13622229784656158136036771217484571176836296686641868549125388198837476602820",
        ),
      ),
    );

    const pPubKey = eddsa.babyJub.packPoint(pubKey);

    const signature = eddsa.signPoseidon(prvKey, msg);
    // console.log(F.toString(signature.R8[0]));
    assert(
      F.eq(
        signature.R8[0],
        F.e(
          "11384336176656855268977457483345535180380036354188103142384839473266348197733",
        ),
      ),
    );
    // console.log(F.toString(signature.R8[1]));
    assert(
      F.eq(
        signature.R8[1],
        F.e(
          "15383486972088797283337779941324724402501462225528836549661220478783371668959",
        ),
      ),
    );
    // console.log(Scalar.toString(signature.S));
    assert(
      Scalar.eq(
        signature.S,
        Scalar.e(
          "1672775540645840396591609181675628451599263765380031905495115170613215233181",
        ),
      ),
    );

    const pubKeyRN = eddsaRN.prv2pub(prvKey);
    assert(F.eq(F.e(pubKeyRN[0]), pubKey[0]));
    assert(F.eq(F.e(pubKeyRN[1]), pubKey[1]));
    const signatureRN = eddsaRN.signPoseidon(prvKey, msgRN);
    assert(F.eq(F.e(signatureRN.R8[0]), signature.R8[0]));
    assert(F.eq(F.e(signatureRN.R8[1]), signature.R8[1]));
    assert(Scalar.eq(signatureRN.S, signature.S));
  });

  it("eddsaRN signature verifies under eddsa.verifyPoseidon", () => {
    const big = Scalar.fromRprLE(fromHexString("000102030405060708090000"), 0);
    const { msg, msgRN } = asMsg(big);

    const pubRN = eddsaRN.prv2pub(KEY_A);
    const sigRN = eddsaRN.signPoseidon(KEY_A, msgRN);

    const sig = { R8: toF(sigRN.R8), S: sigRN.S };
    const pub = toF(pubRN);

    assert.isTrue(eddsa.verifyPoseidon(msg, sig, pub));
  });

  it("RN signPoseidon is deterministic for identical (key, msg)", () => {
    const { msgRN } = asMsg(42n);
    const s1 = eddsaRN.signPoseidon(KEY_A, msgRN);
    const s2 = eddsaRN.signPoseidon(KEY_A, msgRN);
    assert(
      eddsa.babyJub.F.eq(
        eddsa.babyJub.F.e(s1.R8[0]),
        eddsa.babyJub.F.e(s2.R8[0]),
      ),
    );
    assert(
      eddsa.babyJub.F.eq(
        eddsa.babyJub.F.e(s1.R8[1]),
        eddsa.babyJub.F.e(s2.R8[1]),
      ),
    );
    assert(Scalar.eq(s1.S, s2.S));
  });

  it("RN distinct keys yield distinct public keys", () => {
    const a = eddsaRN.prv2pub(KEY_A);
    const b = eddsaRN.prv2pub(KEY_B);
    assert.notDeepEqual(a, b);
  });
});
