// Reusable UI: data table (search / sort / pagination / CSV), modal form, modal viewer
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function csv(file, cols, rows) {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const text = [cols.map(c => q(c[1])).join(","), ...rows.map(r => cols.map(c => q(r[c[0]])).join(","))].join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = file; a.click();
}

// cols: [key, label, optionalFormatter(value,row) -> HTML]   actions: [label, fn(row)]
export function dataTable(el, { cols, rows, actions = [], file }) {
  let q = "", sortKey = null, asc = true, page = 0; const SIZE = 8;
  const draw = () => {
    const found = rows.filter(r => cols.some(c => String(r[c[0]] ?? "").toLowerCase().includes(q)));
    if (sortKey) found.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * (asc ? 1 : -1));
    const pages = Math.max(1, Math.ceil(found.length / SIZE)); page = Math.min(page, pages - 1);
    const view = found.slice(page * SIZE, page * SIZE + SIZE);
    el.innerHTML = `<div class="flex gap-2 mb-3 flex-wrap"><input id="q" value="${esc(q)}" placeholder="Search..." class="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 flex-1 min-w-40">
      ${file ? '<button id="ex" class="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg">Export CSV</button>' : ""}</div>
      <div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-slate-400">
      ${cols.map(c => `<th class="p-2 cursor-pointer whitespace-nowrap" data-k="${c[0]}">${c[1]}${sortKey === c[0] ? (asc ? " ▲" : " ▼") : ""}</th>`).join("")}${actions.length ? "<th class='p-2'>Actions</th>" : ""}</tr></thead>
      <tbody>${view.length ? view.map((r, i) => `<tr class="border-t border-slate-700 hover:bg-slate-800">
        ${cols.map(c => `<td class="p-2">${c[2] ? c[2](r[c[0]], r) : esc(r[c[0]])}</td>`).join("")}
        ${actions.length ? `<td class="p-2 whitespace-nowrap">${actions.map((a, j) => `<button data-a="${j}" data-i="${i}" class="text-indigo-400 hover:underline mr-3">${a[0]}</button>`).join("")}</td>` : ""}</tr>`).join("")
        : `<tr><td colspan="${cols.length + 1}" class="p-8 text-center text-slate-400">No records found</td></tr>`}</tbody></table></div>
      <div class="flex justify-between items-center mt-3 text-slate-400 text-sm"><button id="pv" class="px-3 py-1 bg-slate-800 rounded-lg" ${page === 0 ? "disabled" : ""}>Prev</button>
      <span>Page ${page + 1} of ${pages} (${found.length} records)</span><button id="nx" class="px-3 py-1 bg-slate-800 rounded-lg" ${page >= pages - 1 ? "disabled" : ""}>Next</button></div>`;
    const qi = el.querySelector("#q");
    qi.oninput = e => { q = e.target.value.toLowerCase(); page = 0; draw(); const n = el.querySelector("#q"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    el.querySelectorAll("th[data-k]").forEach(h => h.onclick = () => { asc = sortKey === h.dataset.k ? !asc : true; sortKey = h.dataset.k; draw(); });
    el.querySelector("#pv").onclick = () => { page--; draw(); }; el.querySelector("#nx").onclick = () => { page++; draw(); };
    if (file) el.querySelector("#ex").onclick = () => csv(file, cols, found);
    el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => actions[b.dataset.a][1](view[b.dataset.i]));
  };
  draw();
}

function overlay(inner) {
  const m = document.createElement("div"); m.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4";
  m.innerHTML = inner; document.body.append(m); return m;
}
export function showModal(title, html) {
  const m = overlay(`<div class="bg-slate-800 border border-slate-600 rounded-xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto text-sm">
    <h3 class="text-lg font-semibold text-white mb-3">${esc(title)}</h3>${html}<div class="text-right mt-4"><button class="px-4 py-2 rounded-lg bg-slate-700">Close</button></div></div>`);
  m.querySelector("button").onclick = () => m.remove();
}

// fields: [name, label, type, extra]  — type "select" takes extra = options ([value,label] or plain strings); other types take extra = HTML attributes
export function form(title, fields, init, onSubmit) {
  const m = overlay(`<form class="bg-slate-800 border border-slate-600 rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-3">
    <h3 class="text-lg font-semibold text-white">${esc(title)}</h3>
    ${fields.map(([n, l, t = "text", x = ""]) => `<label class="block text-sm text-slate-300">${l}${t === "select"
      ? `<select name="${n}" class="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg p-2">${x.map(o => { const [v, lab] = Array.isArray(o) ? o : [o, o];
          return `<option value="${esc(v)}" ${String(init[n] ?? "") === String(v) ? "selected" : ""}>${esc(lab)}</option>`; }).join("")}</select>`
      : `<input name="${n}" type="${t}" value="${esc(init[n])}" ${x} class="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg p-2">`}</label>`).join("")}
    <p id="err" class="text-red-400 text-sm"></p>
    <div class="flex justify-end gap-2"><button type="button" id="c" class="px-4 py-2 rounded-lg bg-slate-700">Cancel</button><button id="s" class="px-4 py-2 rounded-lg bg-indigo-600 text-white">Save</button></div></form>`);
  m.querySelector("#c").onclick = () => m.remove();
  m.querySelector("form").onsubmit = async e => {
    e.preventDefault(); const s = m.querySelector("#s"); s.disabled = true; s.textContent = "Saving...";   // blocks double submit
    try { await onSubmit(Object.fromEntries(new FormData(e.target))); m.remove(); }
    catch (er) { m.querySelector("#err").textContent = er.message; s.disabled = false; s.textContent = "Save"; }
  };
}
