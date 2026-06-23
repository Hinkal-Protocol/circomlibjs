import chai from "chai";
const assert = chai.assert;

import {buildPoseidon as buildPoseidonWasm } from "../src/poseidon_wasm.js";
import { buildPoseidon } from "../src/poseidonRN.js";

describe("Poseidon test", function () {
    let poseidonWasm;
    let poseidonRN;
    this.timeout(10000000);

    before(async () => {
        poseidonWasm = await buildPoseidonWasm();
        poseidonRN = buildPoseidon();
    });

    const range = (k) => Array.from({ length: k }, (_, i) => i + 1);

    it("Should check constrain reference implementation poseidonperm_x5_254_3", async () => {
        const res1 = poseidonWasm([1,2]);
        assert(poseidonWasm.F.eq(poseidonWasm.F.e("0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a"), res1));
        
        const res2 = poseidonRN([1,2]);
        assert(poseidonRN.F.eq(poseidonRN.F.e("0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a"), res2));
    });
    it("Should check constrain reference implementation poseidonperm_x5_254_5", async () => {
        const res3 = poseidonWasm([1,2,3,4]);
        assert(poseidonWasm.F.eq(poseidonWasm.F.e("0x299c867db6c1fdd79dcefa40e4510b9837e60ebb1ce0663dbaa525df65250465"), res3));

        const res4 = poseidonRN([1,2,3,4]);
        assert(poseidonRN.F.eq(poseidonRN.F.e("0x299c867db6c1fdd79dcefa40e4510b9837e60ebb1ce0663dbaa525df65250465"), res4));
    });
    it("Should check state and nOuts", async () => {
        const F = poseidonWasm.F;
        const inp = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
        const st = 0;
        const nOut = 17;
        const res1 = poseidonRN(inp, st, nOut);
        const res2 = poseidonWasm(inp, st, nOut);
        for (let i=0; i<nOut; i++) {
            assert(F.eq(F.e(res1[i]), F.e(res2[i])));
        }

    });
    it("Should check poseidon with 16 inputs", async () => {
        const testvectors = [
            {
                inputs: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
                expected: "9989051620750914585850546081941653841776809718687451684622678807385399211877"
            },
            {
                inputs: [1,2,3,4,5,6,7,8,9,0,0,0,0,0,0,0],
                expected: "11882816200654282475720830292386643970958445617880627439994635298904836126497"
            },
        ];

        for (let i=0; i<testvectors.length; i++) {
            const res1 = poseidonRN.F.toString(poseidonRN(testvectors[i].inputs));
            assert(poseidonRN.F.eq(poseidonRN.F.e(testvectors[i].expected), res1));

            const res2 = poseidonWasm(testvectors[i].inputs);
            assert(poseidonWasm.F.eq(poseidonWasm.F.e(testvectors[i].expected), res2));
        }
    });

    it("RN matches WASM for multiple outputs (nOut)", () => {
        const cases = [
            { inputs: [1, 2], nOut: 2 },
            { inputs: [1, 2, 0, 0, 0], nOut: 3 },
            { inputs: range(16), nOut: 11 },
            { inputs: range(16), nOut: 17 },
        ];
        for (const c of cases) {
            const rRN = poseidonRN(c.inputs, 0, c.nOut);
            const rW = poseidonWasm(c.inputs, 0, c.nOut);
            assert.isArray(rRN);
            assert.equal(rRN.length, c.nOut, `RN should return ${c.nOut} outputs`);
            for (let j = 0; j < c.nOut; j++) {
                assert(poseidonRN.F.eq(poseidonRN.F.toString(rRN[j]), poseidonWasm.F.toString(rW[j])));
            }
        }
    });

    it("RN diverges from WASM when initState != 0 (known limitation)", () => {
        const rRN = poseidonRN([1, 2, 3, 4], 7);
        const rW = poseidonWasm([1, 2, 3, 4], 7);
        assert.isFalse(poseidonWasm.F.eq(poseidonWasm.F.e(rRN), rW));
        assert(poseidonWasm.F.eq(rW, poseidonWasm.F.e("1569211601569591254857354699102545060324851338714426496554851741114291465006")));
    });

    it("RN accepts number, string, and bigint inputs interchangeably", () => {
        const a = poseidonRN([1, 2]);
        assert(poseidonRN.F.eq(poseidonRN(["1", "2"]), a));
        assert(poseidonRN.F.eq(poseidonRN([1n, 2n]), a));
    });

    it("RN is deterministic", () => {
        assert(poseidonRN.F.eq(poseidonRN([1, 2]), poseidonRN([1, 2])));
        assert(poseidonRN.F.eq(poseidonRN([5, 6, 7], 0, 1), poseidonRN([5, 6, 7])));
    });

  
});
