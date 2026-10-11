
const API_URL = "http://localhost:3000";

const ALL = ["ADMIN", "SUPERVISOR", "FINANCE"];

export const NAV = [
  ["dashboard", "Dashboard", ALL],
  ["sites", "Sites", ["ADMIN"]],
  ["trades", "Trades & Rates", ["ADMIN"]],
  ["labour", "Labour", ["ADMIN"]],
  ["supervisors", "Supervisors", ["ADMIN"]],
  ["hajiri", "Daily Hajiri", ["ADMIN", "SUPERVISOR"]],
  ["advances", "Advances", ALL],
  ["extra-work", "Extra Work", ALL],
  ["payroll", "Payroll", ["ADMIN", "FINANCE"]],
  ["audit-logs", "Audit Logs", ["ADMIN", "FINANCE"]]
];

export const BUILT = [
  "dashboard", "sites", "trades", "labour", "supervisors",
  "hajiri", "advances", "extra-work", "payroll", "audit-logs"
];

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function login(email, password) {
  return api("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function logout() {
  localStorage.removeItem("labourflow_token");
  localStorage.removeItem("labourflow_user");
  sessionStorage.removeItem("labourflow_token");
  sessionStorage.removeItem("labourflow_user");
  location.href = "login.html";
}

export function requireAuth(page, onReady) {
  const token = localStorage.getItem("labourflow_token") || sessionStorage.getItem("labourflow_token");
  const profile = JSON.parse(localStorage.getItem("labourflow_user") || sessionStorage.getItem("labourflow_user") || "null");

  if (!token || !profile) {
    location.href = "login.html";
    return;
  }

  const role = String(profile.role || "").toUpperCase();
  const entry = NAV.find(n => n[0] === page);

  if (profile.isActive === false) {
    logout();
    return;
  }

  if (entry && !entry[2].includes(role)) {
    location.href = "dashboard.html";
    return;
  }

  document.getElementById("app").innerHTML = `
    <div class="md:flex min-h-screen">
      <aside id="side"
        class="hidden md:block bg-[#1e293b] border-r border-slate-700 md:w-60 p-4 shrink-0">
        <div class="font-bold text-white mb-4">LabourFlow</div>
        <nav class="space-y-1">
          ${NAV.filter(n => n[2].includes(role)).map(n =>
            BUILT.includes(n[0])
              ? `<a href="${n[0]}.html"
                  class="block px-3 py-2 rounded-lg ${
                    n[0] === page
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-slate-700"
                  }">${n[1]}</a>`
              : `<span class="block px-3 py-2 text-slate-600">
                  ${n[1]} <small>(soon)</small>
                </span>`
          ).join("")}
        </nav>
        <button id="logout" class="mt-6 text-red-400">Logout</button>
        <div class="text-xs text-slate-400 mt-2">
          ${profile.fullName || profile.email}<br>${role}
        </div>
      </aside>
      <main class="flex-1 p-4 min-w-0">
        <div class="flex items-center justify-between gap-3 mb-7 pb-4 border-b">
          <button id="menu" class="md:hidden bg-slate-700 px-3 py-2 rounded-lg">
            ☰ Menu
          </button>
          <div class="hidden md:block">
            <div class="text-xs text-slate-500">LABOUR PAYMENT MANAGEMENT</div>
            <div class="text-sm font-semibold text-slate-800">
              Workforce &amp; payroll workspace
            </div>
          </div>
          <div class="ml-auto flex items-center gap-3">
            <div class="text-right">
              <div class="text-sm font-semibold text-slate-800">
                ${profile.fullName || profile.email}
              </div>
              <div class="text-xs text-slate-500">${role}</div>
            </div>
            <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700
              flex items-center justify-center font-bold">
              ${String(profile.fullName || profile.email || "?")
                .trim().charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <div id="content"></div>
      </main>
    </div>`;

  document.getElementById("logout").onclick = logout;
  document.getElementById("menu").onclick = () =>
    document.getElementById("side").classList.toggle("hidden");

  onReady({
    user: profile,
    role,
    profile,
    content: document.getElementById("content")
  });
}
