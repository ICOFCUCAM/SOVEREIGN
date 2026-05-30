// Verify the dependency-free SigV4 presign against AWS's PUBLISHED test vector.
// Source: AWS docs "Example: GET Object (using query parameters / presigned URL)"
//   bucket=examplebucket, key=test.txt, GET, 86400s expiry,
//   AKIAIOSFODNN7EXAMPLE / wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY,
//   region us-east-1, date 2013-05-24T00:00:00Z
//   → X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404
// If our canonicalization/signing matches AWS exactly on this vector, the
// implementation is correct (the live PUT/GET path still needs real creds).
import { presignUrl } from "../shared/src/s3.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

console.log("== S3 SigV4 presign (AWS published vector) ==");

const cfg = {
  endpoint: "https://s3.amazonaws.com",
  region: "us-east-1",
  bucket: "examplebucket",
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  pathStyle: false, // AWS vector is virtual-host style: host=examplebucket.s3.amazonaws.com, path=/test.txt
};
const url = presignUrl("test.txt", 86400, { method: "GET", now: new Date("2013-05-24T00:00:00Z"), cfg });
const EXPECTED = "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404";
const got = new URL(url).searchParams.get("X-Amz-Signature");

ok(url.includes("X-Amz-Algorithm=AWS4-HMAC-SHA256"), "URL carries SigV4 algorithm");
ok(url.includes("X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request"), "credential scope correct");
ok(url.includes("X-Amz-Expires=86400") && url.includes("X-Amz-SignedHeaders=host"), "expiry + signed headers");
console.log(`  expected sig: ${EXPECTED}`);
console.log(`  computed sig: ${got}`);
ok(got === EXPECTED, "computed signature MATCHES AWS published vector");

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
