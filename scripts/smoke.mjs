import { readFile } from "node:fs/promises";
import { buildLaunchChecklist, buildLocalBusinessSchema, buildUtmUrl, validateGoogleAdsCopy } from "../public/app.js";

const sample = JSON.parse(await readFile(new URL("../examples/tool-state.json", import.meta.url), "utf8"));

const utmUrl = buildUtmUrl(sample.utm);
assert(utmUrl.includes("utm_source=google"), "UTM URL should include source");
assert(utmUrl.includes("utm_campaign=perth-electrician-leads"), "UTM URL should include campaign");

const copy = validateGoogleAdsCopy(sample.adCopy);
assert(copy.valid === true, "sample copy should pass");
assert(copy.headlineLength === 21, "headline length should be deterministic");

const schema = buildLocalBusinessSchema(sample.business);
assert(schema["@type"] === "Electrician", "schema should use business type");
assert(schema.areaServed.length === 3, "schema should include service areas");

const checklist = buildLaunchChecklist(sample.checklist);
assert(checklist.length >= 6, "checklist should include core launch checks");
assert(checklist.some((item) => item.includes("CTA")), "checklist should include CTA check");

console.log("adpages toolkit pwa smoke ok");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
