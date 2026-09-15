const inventory = [
  {
    sku: "ET-CHR-1042", brand: "Steelcase", title: "Leap V2 Task Chair", category: "Task Chair",
    status: "Listed", units: 6, cost: 1180, ask: 2580, days: 42, grade: "Good",
    attributes: ["Black fabric", "Synchro tilt", "Adjustable lumbar"], flags: ["30d markdown due"], supplier: "Northbay Liquidators", margin: 54
  },
  {
    sku: "ET-DSK-0917", brand: "Herman Miller", title: "Renew Executive Desk", category: "Executive Desk",
    status: "In stock", units: 2, cost: 760, ask: 1840, days: 18, grade: "Like New",
    attributes: ["72×30", "Walnut", "Cable ports"], flags: ["Premium brand"], supplier: "OfficeClear Co", margin: 59
  },
  {
    sku: "ET-STO-2231", brand: "Hon", title: "4-Drawer Lateral File", category: "Storage",
    status: "Intake", units: 10, cost: 900, ask: 1850, days: 4, grade: "Fair",
    attributes: ["Locking", "Metal gray", "Lateral"], flags: ["Inspection open"], supplier: "Metro Surplus", margin: 51
  },
  {
    sku: "ET-TBL-0574", brand: "Knoll", title: "Reff Conference Table", category: "Conference Table",
    status: "Listed", units: 1, cost: 620, ask: 1320, days: 67, grade: "Good",
    attributes: ["10 seats", "Boat top", "Power module"], flags: ["60d markdown due"], supplier: "Northbay Liquidators", margin: 53
  },
  {
    sku: "ET-CHR-1188", brand: "Humanscale", title: "Freedom Chair", category: "Task Chair",
    status: "Listed", units: 4, cost: 820, ask: 1560, days: 96, grade: "Fair",
    attributes: ["Graphite", "Self-adjusting recline", "Fixed lumbar"], flags: ["90d stale", "Slow mover"], supplier: "Workspace Renew", margin: 47
  },
  {
    sku: "ET-DSK-1210", brand: "Global", title: "Height Adjustable Desk", category: "Executive Desk",
    status: "Sold", units: 3, cost: 1050, ask: 2250, days: 28, grade: "Good",
    attributes: ["60×30", "Electric lift", "White laminate"], flags: ["Sold cohort Q3"], supplier: "Metro Surplus", margin: 53
  }
];

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const slugStatus = status => status.replace(/\s+/g, "-");
const toast = message => {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
};

function renderInventory() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const category = document.getElementById("categoryFilter").value;
  const sort = document.getElementById("sortSelect").value;

  const filtered = inventory.filter(item => {
    const haystack = [item.sku, item.brand, item.title, item.category, item.grade, ...item.attributes, ...item.flags].join(" ").toLowerCase();
    return (!search || haystack.includes(search)) && (status === "all" || item.status === status) && (category === "all" || item.category === category);
  }).sort((a, b) => {
    if (sort === "askDesc") return b.ask - a.ask;
    if (sort === "marginDesc") return b.margin - a.margin;
    if (sort === "brandAsc") return a.brand.localeCompare(b.brand);
    return b.days - a.days;
  });

  document.getElementById("inventoryTable").innerHTML = filtered.map(item => `
    <tr>
      <td><span class="sku">${item.sku}</span><strong>${item.brand} ${item.title}</strong><br><span class="muted">Supplier: ${item.supplier}</span></td>
      <td>${item.category}<br><span class="grade ${item.grade === "Like New" ? "like" : item.grade === "Good" ? "good" : "fair"}">${item.grade}</span></td>
      <td><div class="tag-row">${item.attributes.map(attr => `<span class="tag">${attr}</span>`).join("")}</div></td>
      <td><span class="status ${slugStatus(item.status)}">${item.status}</span></td>
      <td><strong>${item.units}</strong></td>
      <td><strong>${money(item.ask)}</strong><br><span class="muted">Cost ${money(item.cost)} • ${item.margin}% margin</span></td>
      <td><strong>${item.days}d</strong><br><span class="muted">listed age</span></td>
      <td>${item.flags.map(flag => `<div class="flag">${flag}</div>`).join("")}</td>
      <td><button class="action-link" onclick="applyMarkdown('${item.sku}')">Apply markdown</button><br><button class="action-link" onclick="shareItem('${item.sku}')">Share link</button></td>
    </tr>`).join("");

  renderMetrics();
}

function renderMetrics() {
  const active = inventory.filter(i => ["In stock", "Listed"].includes(i.status));
  const cost = active.reduce((sum, item) => sum + item.cost, 0);
  const ask = active.reduce((sum, item) => sum + item.ask, 0);
  const due = active.filter(i => i.days >= 30).length;
  document.getElementById("metricActive").textContent = active.reduce((sum, item) => sum + item.units, 0);
  document.getElementById("metricCost").textContent = money(cost);
  document.getElementById("metricAsk").textContent = money(ask);
  document.getElementById("metricDue").textContent = due;
}

function calculatePricing() {
  const ref = Number(document.getElementById("refValue").value || 0);
  const cost = Number(document.getElementById("unitCost").value || 0);
  const brand = Number(document.getElementById("brandTier").value);
  const grade = Number(document.getElementById("gradeMultiplier").value);
  const days = Number(document.getElementById("daysListed").value);
  const targetMargin = Number(document.getElementById("targetMargin").value || 35) / 100;
  const markdown = days >= 90 ? 0.8 : days >= 60 ? 0.88 : days >= 30 ? 0.94 : 1;
  const rawAsk = ref * brand * grade * markdown;
  const costFloor = cost / (1 - targetMargin);
  const ask = Math.max(rawAsk, costFloor);
  const margin = ask ? ((ask - cost) / ask) * 100 : 0;

  document.getElementById("suggestedAsk").textContent = money(Math.round(ask));
  document.getElementById("askRange").textContent = `Benchmark range: ${money(Math.round(rawAsk * 0.88))}–${money(Math.round(rawAsk * 1.12))}`;
  document.getElementById("grossMargin").textContent = `${Math.round(margin)}%`;
  const floorWarning = document.getElementById("floorWarning");
  if (ask > rawAsk) {
    floorWarning.textContent = `Raised to protected floor of ${money(Math.round(costFloor))}`;
    floorWarning.style.color = "#8b5b00";
  } else {
    floorWarning.textContent = "Floor clear; target margin protected";
    floorWarning.style.color = "#16713a";
  }
  return { ask: Math.round(ask), margin: Math.round(margin) };
}

function renderAgeAlerts() {
  const alerts = inventory.filter(item => item.status !== "Sold" && item.days >= 30).sort((a, b) => b.days - a.days);
  document.getElementById("ageAlerts").innerHTML = alerts.map(item => {
    const pct = item.days >= 90 ? 20 : item.days >= 60 ? 12 : 6;
    const newAsk = Math.round(item.ask * (1 - pct / 100));
    const margin = Math.round(((newAsk - item.cost) / newAsk) * 100);
    return `<div class="alert-item">
      <div><b>${item.sku}</b> ${item.brand} ${item.title}<small>${item.days} days listed • Policy markdown ${pct}% • Margin after change ${margin}%</small></div>
      <button class="secondary-btn" onclick="applyMarkdown('${item.sku}')">${money(newAsk)}</button>
    </div>`;
  }).join("");
}

function renderVendorChart() {
  const vendors = [
    ["Northbay", 88], ["OfficeClear", 76], ["Metro", 64], ["Renew", 51]
  ];
  document.getElementById("vendorChart").innerHTML = vendors.map(([name, value]) => `
    <div class="bar"><span>${name}</span><div class="bar-track"><div class="bar-fill" style="--w:${value}%"></div></div><strong>${value}</strong></div>
  `).join("");
}

function applyMarkdown(sku) {
  const item = inventory.find(i => i.sku === sku);
  if (!item) return;
  const pct = item.days >= 90 ? 20 : item.days >= 60 ? 12 : item.days >= 30 ? 6 : 0;
  if (!pct) return toast(`${sku} is not yet eligible for a policy markdown.`);
  const newAsk = Math.round(item.ask * (1 - pct / 100));
  const oldAsk = item.ask;
  item.ask = newAsk;
  item.margin = Math.round(((item.ask - item.cost) / item.ask) * 100);
  item.flags = item.flags.filter(flag => !flag.includes("markdown due") && !flag.includes("stale"));
  item.flags.unshift(`${pct}% markdown applied`);
  renderInventory();
  renderAgeAlerts();
  toast(`${sku}: ask changed from ${money(oldAsk)} to ${money(newAsk)} with margin impact preview applied.`);
}

function shareItem(sku) {
  const item = inventory.find(i => i.sku === sku);
  const link = `https://share.etjoaigi.example/products/${sku.toLowerCase()}`;
  navigator.clipboard?.writeText(link);
  toast(`Public buyer link generated for ${item.brand} ${item.title}: ${link}`);
}

const steps = ["Identify", "Attributes", "Inspect", "Photos", "Publish"];
let currentStep = 0;
function renderStepper() {
  document.getElementById("stepper").innerHTML = steps.map((step, index) => `<div class="step ${index <= currentStep ? "active" : ""}" title="${step}"></div>`).join("");
  document.querySelectorAll(".wizard-step").forEach(step => step.classList.toggle("active", Number(step.dataset.step) === currentStep));
  document.getElementById("prevStep").style.display = currentStep === 0 ? "none" : "inline-flex";
  document.getElementById("nextStep").style.display = currentStep === steps.length - 1 ? "none" : "inline-flex";
  document.getElementById("publishBtn").style.display = currentStep === steps.length - 1 ? "inline-flex" : "none";
  renderPublishChecks();
}

function renderPublishChecks() {
  const result = calculatePricing();
  const form = document.getElementById("intakeForm");
  const requiredFilled = [...form.querySelectorAll("input[required], select[required]")].every(input => input.type === "checkbox" ? input.checked : input.value.trim());
  const checks = [
    [requiredFilled, "Mandatory taxonomy and attribute fields complete"],
    [result.margin >= 35, `Protected margin achieved at ${result.margin}%`],
    [true, `Ask price preview ready: ${money(result.ask)}`],
    [true, "Photo guidance acknowledged before publishing"]
  ];
  const target = document.getElementById("publishChecks");
  if (!target) return;
  target.innerHTML = checks.map(([ok, text]) => `<div class="${ok ? "check-pass" : "check-warn"}">${ok ? "✓" : "!"} ${text}</div>`).join("");
  document.getElementById("validationBadge").textContent = requiredFilled ? "Ready for publish" : "Validation required";
  document.getElementById("validationBadge").classList.toggle("warning", !requiredFilled);
}

function wireEvents() {
  ["searchInput", "statusFilter", "categoryFilter", "sortSelect"].forEach(id => document.getElementById(id).addEventListener("input", renderInventory));
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "all";
    document.getElementById("categoryFilter").value = "all";
    document.getElementById("sortSelect").value = "daysDesc";
    renderInventory();
  });
  ["refValue", "unitCost", "brandTier", "gradeMultiplier", "daysListed", "targetMargin"].forEach(id => document.getElementById(id).addEventListener("input", calculatePricing));
  document.getElementById("nextStep").addEventListener("click", () => { currentStep = Math.min(currentStep + 1, steps.length - 1); renderStepper(); });
  document.getElementById("prevStep").addEventListener("click", () => { currentStep = Math.max(currentStep - 1, 0); renderStepper(); });
  document.getElementById("openIntake").addEventListener("click", () => document.querySelector("#intake").scrollIntoView({ behavior: "smooth" }));
  document.getElementById("intakeForm").addEventListener("input", renderPublishChecks);
  document.getElementById("intakeForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      toast("Publishing blocked: complete every mandatory inspection and attribute check first.");
      return;
    }
    toast("Unit published to the Etjoaigi master inventory book with valuation and lifecycle status tags.");
  });
  ["generateShareLink", "copyShareLink"].forEach(id => document.getElementById(id).addEventListener("click", () => shareItem("ET-CHR-1042")));
}

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  renderInventory();
  calculatePricing();
  renderAgeAlerts();
  renderVendorChart();
  renderStepper();
});
