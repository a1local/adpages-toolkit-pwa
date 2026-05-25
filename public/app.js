export function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildUtmUrl(input) {
  const url = new URL(required(input.url, "url"));
  url.searchParams.set("utm_source", slugify(required(input.source, "source")));
  url.searchParams.set("utm_medium", slugify(required(input.medium, "medium")));
  url.searchParams.set("utm_campaign", slugify(required(input.campaign, "campaign")));
  if (input.term) url.searchParams.set("utm_term", slugify(input.term));
  if (input.content) url.searchParams.set("utm_content", slugify(input.content));
  return url.toString();
}

export function validateGoogleAdsCopy(input) {
  const headline = String(input.headline ?? "");
  const description = String(input.description ?? "");
  const issues = [];
  if (!headline.trim()) issues.push("Headline is required.");
  if (!description.trim()) issues.push("Description is required.");
  if (headline.length > 30) issues.push(`Headline is ${headline.length} characters; limit is 30.`);
  if (description.length > 90) issues.push(`Description is ${description.length} characters; limit is 90.`);

  return {
    valid: issues.length === 0,
    headlineLength: headline.length,
    descriptionLength: description.length,
    issues
  };
}

export function buildLocalBusinessSchema(input) {
  const areas = String(input.areaServed ?? "")
    .split(",")
    .map((area) => area.trim())
    .filter(Boolean);
  const schema = {
    "@context": "https://schema.org",
    "@type": input.businessType || "LocalBusiness",
    name: required(input.businessName, "businessName"),
    url: required(input.url, "url"),
    telephone: required(input.telephone, "telephone"),
    address: {
      "@type": "PostalAddress",
      addressLocality: required(input.addressLocality, "addressLocality"),
      addressRegion: required(input.addressRegion, "addressRegion"),
      addressCountry: required(input.addressCountry, "addressCountry")
    }
  };
  if (areas.length > 0) {
    schema.areaServed = areas.map((name) => ({ "@type": "Place", name }));
  }
  return schema;
}

export function buildLaunchChecklist(input) {
  const pageName = required(input.pageName, "pageName");
  const campaign = required(input.campaign, "campaign");
  return [
    `${pageName} (${campaign})`,
    "Confirm ad headline and page H1 match the same service/location intent.",
    "Confirm one primary CTA appears above the fold on mobile.",
    "Confirm phone links, forms, and booking links can be measured.",
    "Confirm LocalBusiness schema, title, meta description, canonical, and OG tags are present.",
    "Confirm proof points, reviews, service areas, and privacy notes are visible."
  ];
}

function init() {
  const byId = (id) => document.getElementById(id);
  const output = (id, value, state = "result") => {
    const element = byId(id);
    if (!element) return;
    element.textContent = String(value ?? "");
    element.classList.toggle("has-result", state === "result");
    element.classList.toggle("has-error", state === "error");
  };
  const withResult = (outputId, callback) => {
    try {
      output(outputId, callback(), "result");
    } catch (error) {
      output(outputId, error instanceof Error ? error.message : String(error), "error");
    }
  };
  const updateCopyCounts = () => {
    const headlineLength = byId("ad-headline")?.value.length ?? 0;
    const descriptionLength = byId("ad-description")?.value.length ?? 0;
    byId("headline-count").textContent = `${headlineLength}/30`;
    byId("description-count").textContent = `${descriptionLength}/90`;
  };

  byId("build-utm")?.addEventListener("click", () => {
    withResult("utm-output", () => buildUtmUrl({
        url: byId("utm-url").value,
        source: byId("utm-source").value,
        medium: byId("utm-medium").value,
        campaign: byId("utm-campaign").value,
        term: byId("utm-term").value,
        content: byId("utm-content").value
      }));
  });

  byId("check-copy")?.addEventListener("click", () => {
    withResult("copy-output", () => {
      const result = validateGoogleAdsCopy({
        headline: byId("ad-headline").value,
        description: byId("ad-description").value
      });
      return result.valid
        ? `Pass. Headline ${result.headlineLength}/30, description ${result.descriptionLength}/90.`
        : result.issues.join("\n");
    });
  });

  byId("build-schema")?.addEventListener("click", () => {
    withResult("schema-output", () => {
      const schema = buildLocalBusinessSchema({
        businessName: byId("business-name").value,
        businessType: byId("business-type").value,
        url: byId("business-url").value,
        telephone: byId("business-phone").value,
        addressLocality: byId("business-locality").value,
        addressRegion: byId("business-region").value,
        addressCountry: byId("business-country").value,
        areaServed: byId("business-areas").value
      });
      return JSON.stringify(schema, null, 2);
    });
  });

  byId("build-checklist")?.addEventListener("click", () => {
    withResult("checklist-output", () => buildLaunchChecklist({
        pageName: byId("page-name").value,
        campaign: byId("checklist-campaign").value
      }).map((item, index) => (index === 0 ? item : `- ${item}`)).join("\n"));
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = byId(button.dataset.copyTarget);
      const text = target?.textContent?.trim() ?? "";
      if (!text) return;
      await copyText(text);
      const original = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  });

  byId("ad-headline")?.addEventListener("input", updateCopyCounts);
  byId("ad-description")?.addEventListener("input", updateCopyCounts);
  updateCopyCounts();
  byId("build-utm")?.click();
  byId("check-copy")?.click();
  byId("build-schema")?.click();
  byId("build-checklist")?.click();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the textarea copy path for browsers with stricter clipboard permissions.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function required(value, field) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

if (typeof document !== "undefined") {
  init();
}
