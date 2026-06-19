const $ = (id) => document.getElementById(id);

const examples = {
  support: {
    name: "Client Support Copilot",
    goal: "Answer customer support questions, summarize account context, classify ticket urgency, and draft next-best replies for agents.",
    domain: "support",
    users: 500,
    sensitivity: "medium",
    traffic: "steady",
    capabilities: ["rag", "tools", "classification"],
    constraints: ["human-review", "audit-log", "private-data"]
  },
  security: {
    name: "SOC Triage Analyst",
    goal: "Read alerts, enrich indicators, summarize likely impact, recommend containment, and open response tasks for analyst approval.",
    domain: "security",
    users: 120,
    sensitivity: "high",
    traffic: "spiky",
    capabilities: ["rag", "tools", "classification", "workflow", "analytics"],
    constraints: ["human-review", "audit-log", "private-data", "low-latency"]
  }
};

const domainCopy = {
  support: ["tickets, knowledge base articles, account notes, product release records", "answer accuracy, escalation quality, tone, and first-contact resolution", "unsupported promises, private account leakage, stale policy answers"],
  security: ["alerts, asset inventory, vulnerability data, playbooks, threat intel", "triage precision, false-positive reduction, containment quality, and analyst agreement", "missed critical alerts, over-automation, sensitive incident detail exposure"],
  finance: ["filings, spreadsheets, forecasts, policy memos, transaction exports", "citation accuracy, calculation checks, anomaly detection, and assumption quality", "bad calculations, uncited claims, regulated advice without review"],
  education: ["course notes, rubrics, readings, practice questions, learner progress", "concept coverage, quiz quality, personalization, and learner confidence gain", "incorrect explanations, answer leakage, shallow personalization"],
  operations: ["SOPs, CRM records, inventory, project notes, performance dashboards", "task completion, handoff quality, process compliance, and cycle-time reduction", "bad tool calls, duplicate work, private data leakage"]
};

function checkedValues(legendText) {
  const fieldset = [...document.querySelectorAll("fieldset")].find((set) => set.querySelector("legend")?.textContent === legendText);
  return [...fieldset.querySelectorAll("input:checked")].map((input) => input.value);
}

function readInputs() {
  return {
    name: $("systemName").value.trim() || "AI Product System",
    goal: $("systemGoal").value.trim(),
    domain: $("domain").value,
    users: Math.max(25, Number($("userCount").value) || 25),
    sensitivity: $("sensitivity").value,
    traffic: $("traffic").value,
    capabilities: checkedValues("Capabilities"),
    constraints: checkedValues("Operating constraints")
  };
}

function generateSystem() {
  const inputs = readInputs();
  const cap = new Set(inputs.capabilities);
  const constraints = new Set(inputs.constraints);
  const domain = domainCopy[inputs.domain];
  const complexity = (inputs.sensitivity === "high" ? 18 : inputs.sensitivity === "medium" ? 10 : 4) + inputs.capabilities.length * 9 + (inputs.users > 1000 ? 14 : inputs.users > 300 ? 8 : 3);
  const readiness = clamp(48 + inputs.constraints.length * 8 + (cap.has("rag") ? 10 : 0) + (cap.has("classification") ? 7 : 0) - Math.round(complexity / 4), 35, 96);
  const latency = clamp(1.1 + inputs.capabilities.length * 0.28 + (inputs.sensitivity === "high" ? 0.35 : 0) - (constraints.has("low-latency") ? 0.45 : 0), 0.7, 4.8);
  const cost = Math.round((inputs.users * 3.4) + (cap.has("rag") ? 900 : 250) + (cap.has("tools") ? 600 : 0) + (inputs.sensitivity === "high" ? 850 : 250));
  const quality = clamp(62 + (cap.has("rag") ? 18 : 0) + (cap.has("analytics") ? 7 : 0) - (inputs.traffic === "spiky" ? 4 : 0), 40, 96);
  const safety = clamp(50 + (constraints.has("human-review") ? 15 : 0) + (constraints.has("audit-log") ? 13 : 0) + (constraints.has("private-data") ? 14 : 0) - (inputs.sensitivity === "high" ? 5 : 0), 35, 97);
  const automation = clamp(42 + (cap.has("tools") ? 18 : 0) + (cap.has("workflow") ? 22 : 0) + (cap.has("classification") ? 8 : 0) - (constraints.has("human-review") ? 5 : 0), 25, 95);

  $("architectureTitle").textContent = inputs.name;
  $("modelBadge").textContent = cap.has("tools") || cap.has("workflow") ? "Agentic LLM stack" : cap.has("rag") ? "RAG-first LLM stack" : "Task model stack";
  $("readinessScore").textContent = readiness;
  $("latencyEstimate").textContent = `${latency.toFixed(1)}s`;
  $("monthlyCost").textContent = formatCurrency(cost);
  $("riskBadge").textContent = safety >= 82 ? "Controlled risk" : safety >= 66 ? "Managed risk" : "Needs review";

  renderArchitecture(buildStages(inputs, domain, cap));
  renderItems("modelPlan", buildModelPlan(inputs, cap));
  renderItems("guardrails", buildGuardrails(inputs, domain, constraints));
  renderRoadmap(buildRoadmap(inputs, cap, constraints));
  setMeter("qualityMeter", quality);
  setMeter("safetyMeter", safety);
  setMeter("automationMeter", automation);
  $("summary").textContent = `${inputs.name} should start as a reviewed assistant with ${domain[1]}. The highest design risk is ${domain[2]}, so the first release should combine retrieval grounding, evaluation sets, audit logging, and clear human approval before sensitive actions.`;
}

function buildStages(inputs, domain, cap) {
  const stages = [
    ["01", "Experience layer", `Guided web workspace for ${inputs.users.toLocaleString()} users with role-aware prompts and review states.`],
    ["02", "Data layer", `Connect ${domain[0]}; normalize content into searchable, permission-aware records.`],
    ["03", "AI orchestration", cap.has("tools") ? "Route between retrieval, classification, drafting, and approved tool calls." : "Route requests through retrieval, drafting, and task-specific classifiers."],
    ["04", "Evaluation loop", `Score every release against ${domain[1]}.`],
    ["05", "Operations", `${inputs.traffic === "spiky" ? "Autoscale for burst traffic" : "Monitor steady workload"} with cost, latency, safety, and user feedback dashboards.`]
  ];

  if (inputs.sensitivity === "high") {
    stages.splice(2, 0, ["S", "Privacy boundary", "Redact sensitive fields, enforce access checks, and keep raw records out of prompts unless explicitly allowed."]);
  }

  return stages;
}

function buildModelPlan(inputs, cap) {
  const items = [
    ["Primary reasoning model", inputs.sensitivity === "high" ? "Use a stronger model for policy-heavy answers, sensitive summaries, and disputed cases." : "Use a balanced model for everyday answers and drafting."],
    ["Fast classifier", cap.has("classification") ? "Run a small classifier for intent, urgency, routing, and deflection before generation." : "Add an intent classifier before launch if routing quality becomes uneven."],
    ["Retrieval policy", cap.has("rag") ? "Retrieve scoped records, cite source snippets, and block answers when evidence is weak." : "Add retrieval once content volume grows."],
    ["Fallback path", "Escalate low-confidence, high-impact, or policy-sensitive requests to a human queue."]
  ];

  if (cap.has("tools")) {
    items.push(["Tool controller", "Require structured parameters, dry-run previews, and approval for account-changing actions."]);
  }

  return items;
}

function buildGuardrails(inputs, domain, constraints) {
  const guardrails = [
    ["Grounding checks", `Block or label claims that cannot be traced to ${domain[0]}.`],
    ["Evaluation set", "Maintain golden tasks, adversarial prompts, and real anonymized examples for regression testing."],
    ["Abuse filters", "Detect prompt injection, credential requests, hidden instructions, and data exfiltration attempts."]
  ];

  if (constraints.has("audit-log")) guardrails.push(["Audit trail", "Store prompt metadata, sources used, model route, confidence, and final human decision."]);
  if (inputs.sensitivity === "high") guardrails.push(["Sensitive data handling", "Mask secrets and PII, enforce least privilege, and separate retrieval indexes by access level."]);

  return guardrails;
}

function buildRoadmap(inputs, cap, constraints) {
  return [
    ["Week 1", "Prototype", `Build the intake, prompts, sample data, and ${cap.has("rag") ? "retrieval index" : "baseline response flow"}.`],
    ["Week 2", "Evaluation", "Create golden tests, safety checks, and reviewer labels for good and bad outputs."],
    ["Week 3", "Pilot", `Launch to ${Math.min(inputs.users, 50)} trusted users with feedback capture and daily review.`],
    ["Week 4", "Scale", constraints.has("audit-log") ? "Tune routing, publish dashboards, and review audit samples before broad rollout." : "Add audit logging before broad rollout, then tune routing and publish dashboards."]
  ];
}

function renderArchitecture(stages) {
  const template = $("stageTemplate");
  $("architectureMap").innerHTML = "";
  stages.forEach(([number, title, body]) => {
    const node = template.content.cloneNode(true);
    node.querySelector("span").textContent = number;
    node.querySelector("h3").textContent = title;
    node.querySelector("p").textContent = body;
    $("architectureMap").appendChild(node);
  });
}

function renderItems(id, items) {
  const template = $("itemTemplate");
  $(id).innerHTML = "";
  items.forEach(([title, body]) => {
    const node = template.content.cloneNode(true);
    node.querySelector("strong").textContent = title;
    node.querySelector("p").textContent = body;
    $(id).appendChild(node);
  });
}

function renderRoadmap(items) {
  $("roadmap").innerHTML = items.map(([date, title, body]) => `
    <article>
      <span>${date}</span>
      <div>
        <strong>${title}</strong>
        <p>${body}</p>
      </div>
    </article>
  `).join("");
}

function setMeter(id, value) {
  $(id).style.width = `${value}%`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function loadExample() {
  const example = $("domain").value === "security" ? examples.support : examples.security;
  $("systemName").value = example.name;
  $("systemGoal").value = example.goal;
  $("domain").value = example.domain;
  $("userCount").value = example.users;
  $("sensitivity").value = example.sensitivity;
  $("traffic").value = example.traffic;
  setChecked("Capabilities", example.capabilities);
  setChecked("Operating constraints", example.constraints);
  generateSystem();
}

function setChecked(legendText, values) {
  const fieldset = [...document.querySelectorAll("fieldset")].find((set) => set.querySelector("legend")?.textContent === legendText);
  fieldset.querySelectorAll("input").forEach((input) => {
    input.checked = values.includes(input.value);
  });
}

document.querySelectorAll("input, select, textarea").forEach((input) => {
  input.addEventListener("input", generateSystem);
  input.addEventListener("change", generateSystem);
});

$("generateSystem").addEventListener("click", generateSystem);
$("loadExample").addEventListener("click", loadExample);

generateSystem();
