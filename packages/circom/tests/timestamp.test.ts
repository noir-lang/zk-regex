const ff = require('ffjavascript');
const stringifyBigInts = ff.utils.stringifyBigInts;
const circom_tester = require("circom_tester");
const wasm_tester = circom_tester.wasm;
import * as path from "path";
import { readFileSync } from "fs";
const p = "21888242871839275222246405745257275088548364400416034343698204186575808495617";
const field = new ff.F1Field(p);
const apis = require("../../apis");
const option = {
    include: path.join(__dirname, "../../../node_modules")
};

jest.setTimeout(120000);
describe("Timestamp Regex", () => {
    it("timestamp in the header", async () => {
        const signatureField = `dkim-signature:v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20230601; t=1694989812; x=1695594612; dara=google.com; h=to:subject:message-id:date:from:mime-version:from:to:cc:subject :date:message-id:reply-to; bh=BWETwQ9JDReS4GyR2v2TTR8Bpzj9ayumsWQJ3q7vehs=; b=`;
        const revealed = "1694989812";
        const paddedStr = apis.padString(signatureField, 1024);
        const circuitInputs = {
            msg: paddedStr,
        };
        const circuit = await wasm_tester(path.join(__dirname, "./circuits/test_timestamp_regex.circom"), option);
        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.checkConstraints(witness);
        expect(1n).toEqual(witness[1]);
        const timestampIdx = apis.extractSubstrIdxes(signatureField, readFileSync(path.join(__dirname, "../circuits/common/timestamp.json"), "utf8"))[0][0];
        for (let idx = 0; idx < revealed.length; ++idx) {
            expect(BigInt(paddedStr[timestampIdx + idx])).toEqual(witness[2 + timestampIdx + idx]);
        }
    });
});