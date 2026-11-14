import * as C from "./core.js";

const $app = () => document.getElementById("app");

const ICON = {
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.5 2 2 6.36 2 11.76c0 1.72.46 3.4 1.34 4.88L2 22l5.52-1.44A10.2 10.2 0 0 0 12.04 21.5C17.58 21.5 22 17.14 22 11.76S17.58 2 12.04 2z"/></svg>',
  queue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2 .3 3.6 1.7 4.2 4.3"/></svg>',
  groups: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
  tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
  quick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5z"/></svg>',
};


function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function dimOf(contact, dimId) {
  return C.contactDim(contact, dimId);
}

function setDim(contact, dimId, value) {
  contact.updatedAt = new Date().toISOString();
  if (dimId === "shabbat") contact.shabbat = value;
  else if (dimId === "gender") {
    contact.gender = value;
    contact.genderSource = "manual";
  } else if (dimId === "closeness") contact.closeness = value;
  else {
    contact.dims = contact.dims || {};
    contact.dims[dimId] = value;
  }
}

const state = {
  contacts: [],
  config: C.defaultConfig(),
  ui: { tab: "quick", onboarding: true, search: "", sentFilter: "unsent", dimFilters: {}, uiVersion: 2 },
  shabbat: C.shabbatInfo(),
  sheet: null,
  toast: null,
  skip: new Set(),
  lastSentId: null,
  importReport: null,
  scheduled: [],
  recents: [],
  searchIndex: [],
  quick: { query: "", selected: null, message: "", highlight: 0, scheduleAt: "" },
  _dueShown: 0,
};

function load() {
  try {
    const rawC = localStorage.getItem(C.STORAGE.contacts);
    if (rawC) {
      const parsed = JSON.parse(rawC);
      state.contacts = C.extractContactsPayload(parsed).map(C.sanitizeContact).filter(Boolean);
    }
  } catch (err) {
    console.warn("contacts load failed", err);
  }
  try {
    const rawK = localStorage.getItem(C.STORAGE.config);
    if (rawK) state.config = C.normalizeConfig(JSON.parse(rawK));
  } catch (err) {
    console.warn("config load failed", err);
  }
  try {
    const rawU = localStorage.getItem(C.STORAGE.ui);
    if (rawU) {
      const u = JSON.parse(rawU);
      const ver = u.uiVersion || 0;
      state.ui = { ...state.ui, ...u, search: "" };
      if (ver < 2) {
        state.ui.tab = "quick";
        state.ui.uiVersion = 2;
        try { saveUi(); } catch (_) { /* ignore */ }
      }
    }
  } catch (_) { /* ignore */ }
  if ((state.ui.uiVersion || 0) < 2) {
    state.ui.tab = "quick";
    state.ui.uiVersion = 2;
    try { saveUi(); } catch (_) { /* ignore */ }
  }
  try {
    const rawS = localStorage.getItem(C.STORAGE.scheduled);
    if (rawS) {
      const parsed = JSON.parse(rawS);
      const list = Array.isArray(parsed) ? parsed : (parsed.items || []);
      state.scheduled = list.map(C.sanitizeScheduled).filter(Boolean);
    }
  } catch (err) { console.warn("scheduled load failed", err); }
  try {
    const rawR = localStorage.getItem(C.STORAGE.recents);
    if (rawR) {
      const parsed = JSON.parse(rawR);
      const list = Array.isArray(parsed) ? parsed : [];
      state.recents = list.map(C.sanitizeRecent).filter(Boolean);
    }
  } catch (err) { console.warn("recents load failed", err); }
  rebuildIndex();
}

function rebuildIndex() {
  state.searchIndex = C.buildSearchIndex(state.contacts);
}

function saveScheduled() {
  localStorage.setItem(C.STORAGE.scheduled, JSON.stringify(state.scheduled));
}

function saveRecents() {
  localStorage.setItem(C.STORAGE.recents, JSON.stringify(state.recents));
}

function saveContacts() {
  localStorage.setItem(C.STORAGE.contacts, JSON.stringify({
    type: C.CONTACTS_TYPE,
    version: C.VERSION,
    savedAt: new Date().toISOString(),
    contacts: state.contacts,
  }));
}

function saveConfig() {
  localStorage.setItem(C.STORAGE.config, JSON.stringify({
    ...state.config,
    type: C.CONFIG_TYPE,
    version: C.VERSION,
  }));
}

function saveUi() {
  const { search, ...rest } = state.ui;
  localStorage.setItem(C.STORAGE.ui, JSON.stringify(rest));
}

function showToast(text, action) {
  state.toast = { text, action, until: Date.now() + 8000 };
  render();
  setTimeout(() => {
    if (state.toast && Date.now() >= state.toast.until - 20) {
      state.toast = null;
      render();
    }
  }, 8200);
}

function counts() {
  const all = state.contacts.length;
  const sent = state.contacts.filter((c) => c.sentAt).length;
  const observant = state.contacts.filter((c) => c.shabbat === "observant" && !c.sentAt).length;
  const untagged = state.contacts.filter((c) => !c.closeness && !c.groupOverride).length;
  return { all, sent, left: all - sent, observant, untagged };
}

function queueList() {
  const hideObservant = state.shabbat.isShabbat;
  const list = state.contacts.filter((c) => {
    if (c.sentAt) return false;
    if (state.skip.has(c.id)) return false;
    if (hideObservant && c.shabbat === "observant") return false;
    return true;
  });
  return C.sortQueue(list, state.config, state.shabbat);
}

function formatWhen(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function optionLabel(dim, id) {
  return dim.options.find((o) => o.id === id)?.label || id;
}

function chip(dim, contact, opt, extraClass = "") {
  const on = dimOf(contact, dim.id) === opt.id;
  return `<button type="button" class="chip ${extraClass} ${on ? "is-on" : ""}" data-act="set-dim" data-id="${esc(contact.id)}" data-dim="${esc(dim.id)}" data-val="${esc(opt.id)}">${esc(opt.label)}</button>`;
}

function dimChips(contact) {
  return state.config.dimensions.map((dim) => {
    const legend = `<span class="chip-legend">${esc(dim.name)}</span>`;
    const cls = (opt) => {
      if (dim.id === "shabbat" && opt.id === "observant") return "chip--warn";
      if (dim.id === "shabbat" && opt.id === "not") return "chip--ok";
      if (opt.id === "unknown" || opt.id === "") return "chip--mute";
      return "";
    };
    return `${legend}<div class="chips">${dim.options.map((o) => chip(dim, contact, o, cls(o))).join("")}</div>`;
  }).join("");
}


function render() {
  const root = $app();
  if (!root) return;
  const active = document.activeElement;
  const restore = active && active.dataset && active.dataset.field
    ? { field: active.dataset.field, id: active.dataset.id || "", start: active.selectionStart, end: active.selectionEnd }
    : null;

  state.shabbat = C.shabbatInfo();
  const n = counts();
  const tab = state.ui.tab;

  root.innerHTML = `
    <header class="header">
      <div class="brand">
        <strong>שיתוף «הנה הם»</strong>
        <span>אמתי שלם · נשמר רק אצלך</span>
      </div>
      <div class="progress-pill" title="התקדמות השליחה">נשלחו <em>${n.sent}</em> מתוך ${n.all || "—"}</div>
    </header>
    ${renderBanners(n)}
    <main class="main" id="main">
      ${renderDueCards()}
      ${tab === "quick" ? renderQuick() : ""}
      ${tab === "queue" ? renderQueue(n) : ""}
      ${tab === "contacts" ? renderContacts() : ""}
      ${tab === "groups" ? renderGroups() : ""}
      ${tab === "tools" ? renderTools(n) : ""}
    </main>
    <nav class="nav" aria-label="ניווט ראשי">
      ${navBtn("quick", ICON.quick, "הודעה", C.scheduledDue(state.scheduled).length)}
      ${navBtn("queue", ICON.queue, "תור")}
      ${navBtn("contacts", ICON.people, "קשרים")}
      ${navBtn("groups", ICON.groups, "קבוצות")}
      ${navBtn("tools", ICON.tools, "ייבוא")}
    </nav>
    ${state.sheet ? renderSheet() : ""}
    ${state.toast ? renderToast() : ""}
    ${state.ui.onboarding ? renderOnboarding() : ""}
    <input class="hidden" id="file-import" type="file" accept=".vcf,.vcard,.csv,.txt,text/vcard,text/csv,text/plain" data-act-change="import-file">
    <input class="hidden" id="json-import" type="file" accept=".json,application/json" data-act-change="import-json">
  `;

  if (restore) {
    const el = root.querySelector(`[data-field="${restore.field}"]${restore.id ? `[data-id="${restore.id}"]` : ""}`);
    if (el && typeof el.setSelectionRange === "function") {
      el.focus();
      try { el.setSelectionRange(restore.start, restore.end); } catch (_) { /* ignore */ }
    } else if (el) el.focus();
  }
}


function navBtn(id, icon, label, badge = 0) {
  const on = state.ui.tab === id ? "is-on" : "";
  const badgeCls = badge ? " nav-badge" : "";
  const badgeAttr = badge ? ` data-badge="${badge > 9 ? "9+" : badge}"` : "";
  return `<button type="button" class="${on}${badgeCls}" data-act="tab" data-tab="${id}" aria-current="${state.ui.tab === id ? "page" : "false"}"${badgeAttr}>${icon}<span>${label}</span></button>`;
}

function formatWhenLong(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function toLocalInput(date) {
  const x = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

function quickSuggestions() {
  const q = state.quick.query || "";
  const hits = C.searchContacts(state.searchIndex, q, 15);
  const rawPhone = C.normalizePhone(q);
  const items = [];
  if (rawPhone && !hits.some((h) => h.phone === rawPhone || (h.phones || []).includes(rawPhone))) {
    items.push({ type: "phone", name: "מספר חדש", phone: rawPhone, displayPhone: C.formatPhoneDisplay(rawPhone) });
  }
  for (const h of hits) items.push({ type: "contact", ...h });
  return items;
}

function renderSuggestList() {
  const items = quickSuggestions();
  if (!(state.quick.query || "").trim()) return "";
  if (!items.length) {
    return `<div class="suggest"><p class="tiny" style="padding:.8rem">אין התאמה ברשימה. אפשר להקליד מספר טלפון מלא ולשלוח אליו.</p></div>`;
  }
  const hi = Math.max(0, Math.min(state.quick.highlight || 0, items.length - 1));
  state.quick.highlight = hi;
  return `<div class="suggest" id="quick-suggest" role="listbox">${items.map((it, i) => `
    <button type="button" class="person ${i === hi ? "is-hi" : ""}" role="option" data-act="pick-quick" data-phone="${esc(it.phone)}" data-id="${esc(it.id || "")}" data-name="${esc(it.name || "")}">
      <span class="avatar">${esc((it.name || "?").slice(0, 1))}</span>
      <span class="person-body"><strong>${esc(it.name)}</strong><small>${esc(it.displayPhone || C.formatPhoneDisplay(it.phone))}${it.type === "phone" ? " · לא ברשימה" : ""}</small></span>
    </button>`).join("")}</div>`;
}

function paintQuickSuggestions() {
  const host = document.getElementById("quick-suggest-slot");
  if (host) host.innerHTML = renderSuggestList();
}

function renderDueCards() {
  const due = C.scheduledDue(state.scheduled);
  if (!due.length) return "";
  return due.map((item) => `
    <article class="card due-card">
      <h2>הגיע הזמן לשלוח</h2>
      <p class="kicker">אל ${esc(item.name)} · נועד ל־${esc(formatWhenLong(item.at))}</p>
      <pre class="preview">${esc(item.message || "(בלי טקסט)")}</pre>
      <button type="button" class="btn btn-wa" data-act="send-scheduled" data-id="${esc(item.id)}">${ICON.wa}<span>שליחה בוואטסאפ</span></button>
      <p class="tiny">השליחה עצמה דורשת לחיצה שלך. האתר לא שולח לבד.</p>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-act="snooze-scheduled" data-id="${esc(item.id)}">עוד שעה</button>
        <button type="button" class="btn btn-ghost" data-act="dismiss-scheduled" data-id="${esc(item.id)}">הסר</button>
      </div>
    </article>`).join("");
}

function renderQuick() {
  const q = state.quick;
  const selected = q.selected;
  const templates = state.config.quickTemplates || [];
  const upcoming = C.scheduledUpcoming(state.scheduled);
  const recents = state.recents || [];
  const perm = typeof Notification !== "undefined" ? Notification.permission : "denied";
  return `
    <div class="card">
      <div class="hero-name">הודעה מהירה</div>
      <p class="kicker">חפשו חלק משם — גם מילה תיאורית כמו «דוד» או «עבודה» — או הקלידו מספר. הכל נשאר במכשיר.</p>
      ${selected ? `
        <div class="picked">
          <div>
            <strong>${esc(selected.name)}</strong>
            <small>${esc(C.formatPhoneDisplay(selected.phone))}</small>
          </div>
          <button type="button" class="icon-btn" data-act="clear-quick" aria-label="בחירה אחרת">✕</button>
        </div>
      ` : `
        <div class="field">
          <label for="quick-search">אל מי</label>
          <input class="search" id="quick-search" data-field="quick-search" value="${esc(q.query || "")}" placeholder="שם, מילה מתוך השם, או מספר" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-autocomplete="list">
        </div>
        ${!q.query && recents.length ? `<div class="recent-wrap"><span class="chip-legend">נשלחו לאחרונה</span><div class="chips">${recents.map((r) =>
          `<button type="button" class="chip" data-act="pick-quick" data-id="${esc(r.id || "")}" data-phone="${esc(r.phone)}" data-name="${esc(r.name)}">${esc(r.name)}</button>`
        ).join("")}</div></div>` : ""}
        <div id="quick-suggest-slot">${renderSuggestList()}</div>
      `}
      ${!state.contacts.length ? `<p class="tiny">עוד אין רשימה מיובאת — אפשר בכל זאת לשלוח למספר, או <button type="button" class="linkish" data-act="tab" data-tab="tools">לייבא אנשי קשר</button>.</p>` : ""}
      <div class="field">
        <label for="quick-message">ההודעה</label>
        <textarea class="textarea" id="quick-message" data-field="quick-message" placeholder="כתבו כאן כל הודעה">${esc(q.message || "")}</textarea>
      </div>
      ${templates.length ? `<span class="chip-legend">תבניות שמורות</span><div class="chips">${templates.map((tp) =>
        `<button type="button" class="chip" data-act="use-template" data-id="${esc(tp.id)}">${esc(tp.name)}</button>`
      ).join("")}</div>` : ""}
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-act="save-template" ${!(q.message || "").trim() ? "disabled" : ""}>שמור כתבנית</button>
      </div>
      <button type="button" class="btn btn-wa" data-act="send-quick" ${selected?.phone && (q.message || "").length >= 0 ? "" : "disabled"}>${ICON.wa}<span>שליחה בוואטסאפ</span></button>
      <p class="tiny">הכפתור פותח צ׳אט עם ההודעה כבר כתובה. השליחה עצמה תמיד דורשת לחיצה שלך בוואטסאפ.</p>
      <hr class="sep">
      <span class="section-title">תזמון</span>
      <p class="tiny">שומרים תזכורת כאן. אם האתר פתוח בזמן, תופיע כרטיסיית «הגיע הזמן לשלוח». אפשר גם להוסיף ליומן — שימושי כשהאתר סגור. האתר לא שולח הודעות לבד.</p>
      <div class="sched-row">
        <input class="input" type="datetime-local" data-field="schedule-at" value="${esc(q.scheduleAt || "")}" aria-label="תאריך ושעה">
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-act="save-scheduled">שמור לתזמון</button>
        <button type="button" class="btn btn-ghost" data-act="download-ics">הוסף ליומן</button>
      </div>
      ${perm === "default" ? `<button type="button" class="btn btn-ghost" data-act="ask-notify">אפשר התראות כשהאתר פתוח</button>` : ""}
      ${perm === "granted" ? `<p class="tiny ok-text">התראות מותרות — יעבדו רק כשהאתר פתוח בדפדפן (באייפון, לרוב רק אחרי «הוספה למסך הבית»).</p>` : ""}
      ${perm === "denied" ? `<p class="tiny">התראות חסומות בדפדפן. היומן הוא הדרך הבטוחה להיזכר.</p>` : ""}
    </div>
    ${upcoming.length ? `<span class="section-title">מתוזמנות</span>${upcoming.map((item) => `
      <article class="card">
        <h3>${esc(item.name)}</h3>
        <p class="count">${esc(formatWhenLong(item.at))} · ${esc(C.formatPhoneDisplay(item.phone))}</p>
        <pre class="preview">${esc(item.message || "")}</pre>
        <div class="btn-row">
          <button type="button" class="btn btn-ghost" data-act="download-ics" data-id="${esc(item.id)}">הוסף ליומן</button>
          <button type="button" class="btn btn-ghost btn-danger" data-act="dismiss-scheduled" data-id="${esc(item.id)}">מחיקה</button>
        </div>
      </article>`).join("")}` : ""}
  `;
}

function currentQuickTarget() {
  return state.quick.selected;
}

function applyFreeTemplate(text) {
  const sel = state.quick.selected;
  const contact = sel?.id ? (findContact(sel.id) || sel) : { name: sel?.name || "", gender: "unknown" };
  let out = String(text ?? "").replace(/\{שם\}/g, C.firstNameOf(contact?.name) || contact?.name || "");
  out = out.replace(/\{קישור\}/g, state.config.videoUrl || C.VIDEO_URL);
  const gender = contact?.gender || "unknown";
  out = out.replace(/\{([^}/|\n]+?)\/([^}]+?)\}/g, (_, male, female) => {
    if (gender === "female") return female;
    if (gender === "male") return male;
    return `${male}/${female}`;
  });
  return out;
}

function sendToWhatsApp(name, phone, message, contactId) {
  if (!phone) return;
  const url = C.waMeUrl(phone, message || "");
  state.recents = C.pushRecent(state.recents, { id: contactId || null, name, phone });
  saveRecents();
  window.open(url, "_blank", "noopener");
}

function downloadIcs(item) {
  const blob = new Blob([C.buildIcs(item)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const safe = String(item.name || "contact").replace(/[^\u0590-\u05FFa-zA-Z0-9]+/g, "-").slice(0, 30);
  a.href = url;
  a.download = `send-${safe || "message"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function draftScheduledItem(at) {
  const sel = state.quick.selected;
  if (!sel?.phone || !at) return null;
  return C.sanitizeScheduled({
    id: C.uid("s"),
    contactId: sel.id || null,
    name: sel.name,
    phone: sel.phone,
    message: state.quick.message || "",
    at,
  });
}

function fireNotification(item) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification("הגיע הזמן לשלוח", {
      body: `${item.name}\n${(item.message || "").slice(0, 90)}`,
      tag: "amitai-share-" + item.id,
      dir: "rtl",
      lang: "he",
    });
    n.onclick = () => {
      window.focus();
      state.ui.tab = "quick";
      render();
    };
  } catch (_) { /* ignore */ }
}

let dueTimer = null;
function checkDue({ notify = true } = {}) {
  const due = C.scheduledDue(state.scheduled);
  let changed = false;
  if (notify) {
    for (const item of due) {
      if (!item.notified) {
        item.notified = true;
        changed = true;
        fireNotification(item);
      }
    }
    if (changed) saveScheduled();
  }
  if (due.length !== state._dueShown || changed) {
    state._dueShown = due.length;
    if (document.getElementById("app")) render();
  }
}

function startDueWatch() {
  checkDue({ notify: true });
  if (dueTimer) clearInterval(dueTimer);
  dueTimer = setInterval(() => checkDue({ notify: true }), 20000);
}



function renderBanners(n) {
  const sh = state.shabbat;
  if (sh.isShabbat) {
    return `<div class="banner banner--shabbat" role="status"><strong>עכשיו שבת בישראל.</strong> שומרי שבת מוסתרים מהתור ויחכו למוצ״ש (בערך ${esc(C.formatIsraelTime(sh.end))}). נשארו ${n.observant} כאלה שעדיין לא נשלח להם.</div>`;
  }
  if (sh.fridayAfternoon) {
    return `<div class="banner" role="status"><strong>שישי אחר הצהריים.</strong> השבת נכנסת בסביבות ${esc(C.formatIsraelTime(sh.start))} (שעה לפני השקיעה בירושלים). כדאי לסיים לשלוח לשומרי שבת לפני כן, או להשאיר למוצ״ש.</div>`;
  }
  return "";
}

function renderQueue(n) {
  if (!n.all) {
    return `<div class="card empty">
      <h2>עוד אין אנשי קשר</h2>
      <p>הכל נשמר רק במכשיר הזה. אפשר לייבא קובץ אנשי קשר מהטלפון, או להדביק רשימה.</p>
      <div class="actions">
        <button type="button" class="btn btn-primary" data-act="tab" data-tab="tools">לייבוא אנשי קשר</button>
      </div>
    </div>`;
  }
  const q = queueList();
  const next = q[0];
  let head = "";
  if (n.untagged) {
    head += `<p class="stat-line">יש ${n.untagged} בלי תיוג קרבה. <button type="button" class="linkish" data-act="quick-tag">לתיוג מהיר</button></p>`;
  }
  if (!next) {
    if (n.left === 0) {
      return head + `<div class="card empty"><h2>הכל יצא לדרך</h2><p>נשלחו ${n.sent} הודעות. אפשר תמיד לבטל שליחה מתוך הרשימה אם לחצת בטעות.</p></div>`;
    }
    if (state.shabbat.isShabbat && n.observant) {
      return head + `<div class="card empty"><h2>נשאר רק למוצ״ש</h2><p>${n.observant} שומרי שבת מחכים. אחרי צאת השבת (בערך ${esc(C.formatIsraelTime(state.shabbat.end))}) הם יחזרו לתור.</p></div>`;
    }
    return head + `<div class="card empty"><h2>התור ריק</h2><p>אולי דילגת על כולם לרגע. <button type="button" class="linkish" data-act="clear-skip">להחזיר את מי שדולג</button></p></div>`;
  }
  const rest = q.length - 1;
  return head + renderContactCard(next, true) +
    (rest ? `<p class="stat-line">עוד ${rest} בתור אחרי ${esc(C.firstNameOf(next.name) || next.name)}.</p>` : "") +
    (rest ? `<div class="card">${q.slice(1, 6).map((c) => personRow(c)).join("")}${rest > 5 ? `<p class="tiny">ועוד ${rest - 5}…</p>` : ""}</div>` : "");
}

function renderContactCard(c, isQueue = false) {
  const { group, wording, alternatives } = C.wordingForContact(c, state.config);
  const message = C.messageForContact(c, state.config);
  const hold = state.shabbat.isShabbat && c.shabbat === "observant";
  const groupName = group?.name || "לא מסווג";
  return `<article class="card" data-contact="${esc(c.id)}">
    <div class="hero-name">${esc(c.name)}</div>
    <div class="hero-phone">${esc(C.formatPhoneDisplay(c.phone))}</div>
    <div class="meta-row">
      <span class="chip is-on chip--mute">${esc(groupName)}</span>
      ${c.sentAt ? `<span class="chip is-on chip--ok">נשלח ${esc(formatWhen(c.sentAt))}</span>` : ""}
      ${hold ? `<span class="chip is-on chip--warn">לשלוח במוצ״ש</span>` : ""}
    </div>
    ${dimChips(c)}
    <div class="field">
      <label for="rel-${esc(c.id)}">איך לתאר את הקשר</label>
      <input class="input" id="rel-${esc(c.id)}" data-field="relationNote" data-id="${esc(c.id)}" value="${esc(c.relationNote || "")}" placeholder="למשל: דוד מצד אמא, חבר מהצבא, שכנה…">
    </div>
    <div class="field">
      <label for="note-${esc(c.id)}">הערה לעצמך</label>
      <input class="input" id="note-${esc(c.id)}" data-field="note" data-id="${esc(c.id)}" value="${esc(c.note || "")}" placeholder="לא נכנס להודעה">
    </div>
    ${alternatives.length > 1 ? `<span class="chip-legend">ניסוח ההודעה</span><div class="chips wording-switch">${alternatives.map((w) => {
      const on = wording && w.id === wording.id;
      return `<button type="button" class="chip ${on ? "is-on" : ""}" data-act="set-wording" data-id="${esc(c.id)}" data-val="${esc(w.id)}">${esc(w.name)}${w.shabbatRespectful ? " · נימוס" : ""}</button>`;
    }).join("")}</div>` : ""}
    <div class="field">
      <label for="msg-${esc(c.id)}">ההודעה שתישלח</label>
      <textarea class="textarea" id="msg-${esc(c.id)}" data-field="messageOverride" data-id="${esc(c.id)}">${esc(message)}</textarea>
    </div>
    <p class="tiny">${c.messageOverride ? `ניסוח ערוך ידנית. <button type="button" class="linkish" data-act="reset-msg" data-id="${esc(c.id)}">חזרה לתבנית</button>` : "אפשר לערוך לפני השליחה. הקישור ליוטיוב כבר בפנים."}</p>
    ${hold ? `<p class="warn-text tiny">שומר שבת, ועכשיו שבת — עדיף לחכות למוצ״ש.</p>
      <button type="button" class="btn btn-ghost" data-act="send" data-id="${esc(c.id)}" data-force="1">לפתוח וואטסאפ בכל זאת</button>` :
      `<button type="button" class="btn btn-wa" data-act="send" data-id="${esc(c.id)}">${ICON.wa}<span>שליחה בוואטסאפ</span></button>`}
    <div class="btn-row">
      ${isQueue ? `<button type="button" class="btn btn-ghost" data-act="skip" data-id="${esc(c.id)}">דלג לבינתיים</button>` : ""}
      ${c.sentAt
        ? `<button type="button" class="btn btn-ghost" data-act="undo-sent" data-id="${esc(c.id)}">בטל «נשלח»</button>`
        : `<button type="button" class="btn btn-ghost" data-act="mark-sent" data-id="${esc(c.id)}">סמן כנשלח בלי לפתוח</button>`}
    </div>
  </article>`;
}

function personRow(c) {
  const group = C.groupForContact(c, state.config);
  const hold = state.shabbat.isShabbat && c.shabbat === "observant" && !c.sentAt;
  const initial = (C.firstNameOf(c.name) || c.name || "?").slice(0, 1);
  const bits = [C.formatPhoneDisplay(c.phone)];
  if (group) bits.push(group.name);
  if (c.relationNote) bits.push(c.relationNote);
  let status = "";
  let stClass = "";
  if (c.sentAt) { status = "נשלח"; stClass = "is-sent"; }
  else if (hold) { status = "מוצ״ש"; stClass = "is-hold"; }
  return `<button type="button" class="person" data-act="open-contact" data-id="${esc(c.id)}">
    <span class="avatar ${c.sentAt ? "is-sent" : ""}">${esc(initial)}</span>
    <span class="person-body"><strong>${esc(c.name)}</strong><small>${esc(bits.join(" · "))}</small></span>
    <span class="person-status ${stClass}">${esc(status)}</span>
  </button>`;
}

function filteredContacts() {
  const q = (state.ui.search || "").trim().toLowerCase();
  const sentF = state.ui.sentFilter;
  const dims = state.ui.dimFilters || {};
  return C.sortQueue(state.contacts, state.config, state.shabbat).filter((c) => {
    if (sentF === "unsent" && c.sentAt) return false;
    if (sentF === "sent" && !c.sentAt) return false;
    if (sentF === "shabbat-hold" && !(c.shabbat === "observant" && !c.sentAt)) return false;
    if (sentF === "untagged" && (c.closeness || c.groupOverride)) return false;
    for (const [dim, val] of Object.entries(dims)) {
      if (val && dimOf(c, dim) !== val) return false;
    }
    if (!q) return true;
    const hay = [c.name, c.phone, c.relationNote, c.note, ...(c.customTags || [])].join(" ").toLowerCase();
    return hay.includes(q) || C.formatPhoneDisplay(c.phone).includes(q);
  });
}

function renderContacts() {
  if (!state.contacts.length) {
    return `<div class="card empty"><h2>אין עדיין רשימה</h2><p>יבאו אנשי קשר בלשונית «ייבוא».</p></div>`;
  }
  const list = filteredContacts();
  const filters = [
    ["unsent", "לא נשלח"],
    ["all", "הכול"],
    ["sent", "נשלח"],
    ["untagged", "בלי תיוג"],
    ["shabbat-hold", "שומרי שבת"],
  ];
  return `
    <input class="search" type="search" placeholder="חיפוש לפי שם, טלפון או הערה" value="${esc(state.ui.search || "")}" data-field="search" aria-label="חיפוש">
    <div class="filters">
      ${filters.map(([id, lab]) => `<button type="button" class="chip ${state.ui.sentFilter === id ? "is-on" : ""}" data-act="sent-filter" data-val="${id}">${lab}</button>`).join("")}
    </div>
    <p class="stat-line">${list.length} אנשי קשר${state.contacts.length !== list.length ? ` מתוך ${state.contacts.length}` : ""}. <button type="button" class="linkish" data-act="quick-tag">תיוג מהיר</button></p>
    <div class="card">${list.length ? list.slice(0, 80).map(personRow).join("") + (list.length > 80 ? `<p class="tiny">מציג 80 מתוך ${list.length}. חיפוש מצמצם מהר, או שלחו מהלשונית «הודעה».</p>` : "") : `<p class="empty">אין מישהו שמתאים לסינון.</p>`}</div>
  `;
}


function renderGroups() {
  const cfg = state.config;
  const membersOf = (g) => state.contacts.filter((c) => C.groupForContact(c, cfg)?.id === g.id);
  const ungrouped = state.contacts.filter((c) => !C.groupForContact(c, cfg));
  const sorted = [...cfg.groups].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return `
    <p class="kicker">כאן חיים הכללים: איך מחלקים לקבוצות תפוצה, ואיזה ניסוחים הולכים לכל קבוצה. אפשר לערוך, למזג, להוסיף ממד קשר חדש, ולייצא את ההגדרות לקובץ נפרד — בלי אנשי הקשר — כדי שנדייק את זה יחד אחר כך.</p>
    <span class="section-title">קבוצות תפוצה</span>
    ${sorted.map((g) => {
      const members = membersOf(g);
      const wordings = (g.wordingIds || []).map((wid) => cfg.wordings.find((w) => w.id === wid)).filter(Boolean);
      const rules = describeRules(g);
      return `<article class="card group-card">
        <h3>${esc(g.name)}</h3>
        <div class="count">${members.length} אנשי קשר · עדיפות ${g.priority}</div>
        <div class="rule-list">${esc(rules)}</div>
        <ul class="wording-list">${wordings.map((w) => `<li>${esc(w.name)}${w.shabbatRespectful ? `<span class="badge">נימוס / שבת</span>` : ""}${g.defaultWordingId === w.id ? `<span class="badge">ברירת מחדל</span>` : ""}</li>`).join("") || "<li>אין ניסוח צמוד — ייעשה שימוש בניסוח הכללי.</li>"}</ul>
        <div class="btn-row">
          <button type="button" class="btn btn-ghost" data-act="edit-group" data-id="${esc(g.id)}">עריכה</button>
        </div>
      </article>`;
    }).join("")}
    ${ungrouped.length ? `<p class="stat-line">${ungrouped.length} אנשי קשר עדיין לא מסווגים — יקבלו את הניסוח הכללי.</p>` : ""}
    <button type="button" class="btn btn-primary" data-act="add-group">קבוצה חדשה</button>
    <hr class="sep">
    <span class="section-title">ממדי קשר</span>
    <p class="tiny">מעבר לקרבה, מין ושמירת שבת — אפשר להוסיף ממדים משלך, למשל «צבא», «קהילה», «דוברי אנגלית».</p>
    ${cfg.dimensions.map((d) => `<article class="card">
      <h3>${esc(d.name)}</h3>
      <div class="meta-row">${d.options.map((o) => `<span class="chip is-soft">${esc(o.label)}</span>`).join("")}</div>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-act="edit-dim" data-id="${esc(d.id)}">${d.locked ? "צפייה" : "עריכה"}</button>
      </div>
    </article>`).join("")}
    <button type="button" class="btn btn-ghost" data-act="add-dim">ממד חדש</button>
    <hr class="sep">
    <span class="section-title">ספריית ניסוחים</span>
    ${cfg.wordings.map((w) => `<article class="card">
      <h3>${esc(w.name)}${w.shabbatRespectful ? `<span class="badge">נימוס / שבת</span>` : ""}</h3>
      <pre class="preview">${esc(w.text)}</pre>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-act="edit-wording" data-id="${esc(w.id)}">עריכה</button>
      </div>
    </article>`).join("")}
    <button type="button" class="btn btn-ghost" data-act="add-wording">ניסוח חדש</button>
    <hr class="sep">
    <button type="button" class="btn btn-ghost" data-act="export-config">ייצוא הגדרות (בלי אנשי קשר)</button>
    <div class="btn-row">
      <button type="button" class="btn btn-ghost" data-act="pick-json">ייבוא הגדרות</button>
      <button type="button" class="btn btn-ghost btn-danger" data-act="reset-config">איפוס לברירת מחדל</button>
    </div>
  `;
}

function describeRules(g) {
  const rules = g.rules || {};
  const parts = [];
  for (const [dimId, vals] of Object.entries(rules)) {
    if (!vals?.length) continue;
    const dim = state.config.dimensions.find((d) => d.id === dimId);
    const labels = vals.map((v) => optionLabel(dim || { options: [] }, v));
    parts.push(`${dim?.name || dimId}: ${labels.join(" / ")}`);
  }
  return parts.length ? "כלל: " + parts.join(" · ") : "בלי כלל אוטומטי — רק מי ששויך ידנית.";
}

function renderTools(n) {
  return `
    <div class="privacy"><strong>הפרטיות קודמת.</strong> אנשי הקשר, התגיות וההודעות נשמרים רק במכשיר הזה (localStorage). שום דבר לא נשלח לשרת, לא לסאפאבייס ולא אליי. כדי לעבור למכשיר אחר — ייצאו גיבוי והעלו אותו שם.</div>
    <span class="section-title">ייבוא אנשי קשר</span>
    <div class="card help">
      <p class="kicker">אחרי שסיננת בטלפון את מי שנוח לך לשלוח לו, ייצא את הרשימה לקובץ והעלו אותה לכאן. כפילויות לפי מספר טלפון לא ייובאו שוב.</p>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" data-act="pick-file">העלאת קובץ vcf או csv</button>
      </div>
      <button type="button" class="btn btn-ghost" data-act="paste-open">הדבקת רשימה (שם, טלפון)</button>
      <details>
        <summary>איך מייצאים מאייפון</summary>
        <ol>
          <li>הכי פשוט: ב־icloud.com, בחשבון של אפל, נכנסים ל«אנשי קשר».</li>
          <li>בוחרים את הרשימה (או את כולם), לוחצים על גלגל השיניים, ו«ייצוא vCard».</li>
          <li>שומרים את הקובץ vcf ומעלים אותו כאן. עברית נשמרת כמו שצריך.</li>
        </ol>
        <p>במכשיר עצמו אפשר גם לשתף אנשי קשר נבחרים לקובץ, דרך רשימה או קיבוץ, ולשמור ל«קבצים».</p>
      </details>
      <details>
        <summary>איך מייצאים מאנדרואיד</summary>
        <ol>
          <li>פותחים את אפליקציית «אנשי קשר».</li>
          <li>תפריט (שלוש נקודות) ← הגדרות / ניהול אנשי קשר ← ייצוא.</li>
          <li>שומרים קובץ vcf (לפעמים נקרא «גיבוי») ומעלים אותו לכאן.</li>
        </ol>
        <p>בסמסונג: אנשי קשר ← תפריט ← ניהול אנשי קשר ← ייבוא/ייצוא ← ייצוא.</p>
      </details>
      <details>
        <summary>איך מייצאים מגוגל</summary>
        <ol>
          <li>נכנסים ל־contacts.google.com (באותו חשבון שמסונכרן לטלפון).</li>
          <li>בתפריט הצד: ייצוא.</li>
          <li>אפשר Google CSV או vCard — שניהם יעבדו כאן.</li>
        </ol>
      </details>
    </div>
    <span class="section-title">גיבוי והעברה</span>
    <div class="card">
      <p class="kicker">יש ${n.all} אנשי קשר במכשיר הזה. הגיבוי הוא קובץ JSON שנשאר אצלך.</p>
      <button type="button" class="btn btn-ghost" data-act="export-backup">ייצוא גיבוי מלא</button>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-act="export-contacts">אנשי קשר בלבד</button>
        <button type="button" class="btn btn-ghost" data-act="export-config">הגדרות וקבוצות</button>
      </div>
      <button type="button" class="btn btn-ghost" data-act="pick-json">ייבוא JSON (גיבוי / הגדרות / אנשי קשר)</button>
    </div>
    <span class="section-title">קישור הסרטון</span>
    <div class="card">
      <div class="field">
        <label for="video-url">קישור יוטיוב בהודעות</label>
        <input class="input" id="video-url" data-field="videoUrl" dir="ltr" value="${esc(state.config.videoUrl || C.VIDEO_URL)}">
      </div>
      <p class="tiny">משתמשים בזה בכל ניסוח שיש בו {קישור}.</p>
    </div>
    <div class="btn-row">
      <button type="button" class="btn btn-ghost btn-danger" data-act="clear-all">מחיקת כל אנשי הקשר במכשיר</button>
    </div>
  `;
}

function renderOnboarding() {
  return `<div class="onboard" role="dialog" aria-labelledby="ob-title">
    <div class="onboard-card">
      <h2 id="ob-title">הודעה מהירה, וגם «הנה הם»</h2>
      <p>הכלי הזה רץ רק אצלך בטלפון. אנשי הקשר לא יוצאים מכאן לשום מקום.</p>
      <ol>
        <li>מייבאים את הרשימה מהטלפון (גם אלפי אנשי קשר).</li>
        <li>בלשונית «הודעה» מחפשים שם, כותבים, ופותחים וואטסאפ בלחיצה.</li>
        <li>אפשר גם לתזמן תזכורת — השליחה עצמה תמיד דורשת לחיצה שלך.</li>
      </ol>
      <button type="button" class="btn btn-primary" data-act="dismiss-onboard">הבנתי, בואו נתחיל</button>
    </div>
  </div>`;
}

function renderToast() {
  const t = state.toast;
  return `<div class="toast" role="status"><span>${esc(t.text)}</span>${t.action ? `<button type="button" data-act="${esc(t.action.act)}" data-id="${esc(t.action.id || "")}">${esc(t.action.label)}</button>` : ""}</div>`;
}

function renderSheet() {
  const s = state.sheet;
  let body = "";
  if (s.type === "contact") {
    const c = state.contacts.find((x) => x.id === s.id);
    if (!c) return "";
    body = renderContactSheet(c);
  } else if (s.type === "quick-tag") body = renderQuickTag();
  else if (s.type === "group") body = renderGroupSheet();
  else if (s.type === "wording") body = renderWordingSheet();
  else if (s.type === "dim") body = renderDimSheet();
  else if (s.type === "paste") body = renderPasteSheet();
  else if (s.type === "confirm") body = renderConfirmSheet();
  else if (s.type === "import-report") body = renderImportReport();
  else if (s.type === "save-tpl") body = renderSaveTplSheet();
  else return "";
  return `<div class="overlay" data-act="overlay-close" role="presentation"><div class="sheet" role="dialog" aria-modal="true">${body}</div></div>`;
}

function renderContactSheet(c) {
  const groups = [...state.config.groups].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const tags = (c.customTags || []).map((t) =>
    `<button type="button" class="chip is-on chip--mute" data-act="remove-tag" data-id="${esc(c.id)}" data-val="${esc(t)}">${esc(t)} ×</button>`
  ).join("");
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head">
      <div>
        <h2>עריכת איש קשר</h2>
        <p class="sheet-sub">${esc(C.formatPhoneDisplay(c.phone))}</p>
      </div>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button>
    </div>
    <div class="field">
      <label for="cn">שם</label>
      <input class="input" id="cn" data-field="name" data-id="${esc(c.id)}" value="${esc(c.name)}">
    </div>
    <div class="field">
      <label for="cp">טלפון</label>
      <input class="input" id="cp" data-field="phone" data-id="${esc(c.id)}" dir="ltr" value="${esc(C.formatPhoneDisplay(c.phone))}">
    </div>
    <div class="field">
      <label>שיוך לקבוצה</label>
      <select class="select" data-field="groupOverride" data-id="${esc(c.id)}">
        <option value="">אוטומטי לפי הכללים</option>
        ${groups.map((g) => `<option value="${esc(g.id)}" ${c.groupOverride === g.id ? "selected" : ""}>${esc(g.name)}</option>`).join("")}
      </select>
    </div>
    ${renderContactCard(c, false)}
    <span class="chip-legend">תגיות חופשיות</span>
    <div class="chips">${tags}</div>
    <div class="field">
      <input class="input" data-field="newTag" data-id="${esc(c.id)}" placeholder="תגית חדשה, ואז Enter">
    </div>
    <div class="btn-row">
      <button type="button" class="btn btn-ghost btn-danger" data-act="ask-delete" data-id="${esc(c.id)}">מחיקה מהרשימה</button>
    </div>
  `;
}

function renderQuickTag() {
  const pool = state.contacts.filter((c) => !c.sentAt);
  const untaggedFirst = [
    ...pool.filter((c) => !c.closeness && !c.groupOverride),
    ...pool.filter((c) => c.closeness || c.groupOverride),
  ];
  if (!untaggedFirst.length) {
    return `<div class="sheet-handle"></div><div class="sheet-head"><h2>תיוג מהיר</h2><button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button></div><p>אין את מי לתאר כרגע.</p>`;
  }
  let i = state.sheet.index || 0;
  if (i < 0) i = 0;
  if (i >= untaggedFirst.length) i = untaggedFirst.length - 1;
  state.sheet.index = i;
  const c = untaggedFirst[i];
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head">
      <div>
        <h2>תיוג מהיר</h2>
        <p class="sheet-sub">${i + 1} מתוך ${untaggedFirst.length}</p>
      </div>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button>
    </div>
    <div class="hero-name">${esc(c.name)}</div>
    <div class="hero-phone">${esc(C.formatPhoneDisplay(c.phone))}</div>
    ${dimChips(c)}
    <div class="field">
      <label for="qrel">איך לתאר את הקשר</label>
      <input class="input" id="qrel" data-field="relationNote" data-id="${esc(c.id)}" value="${esc(c.relationNote || "")}" placeholder="במילים שלך">
    </div>
    <div class="btn-row">
      <button type="button" class="btn btn-ghost" data-act="quick-prev" ${i === 0 ? "disabled" : ""}>הקודם</button>
      <button type="button" class="btn btn-primary" data-act="quick-next">${i === untaggedFirst.length - 1 ? "סיום" : "הבא"}</button>
    </div>
    <p class="tiny">אפשר גם להחליק ימינה ושמאלה.</p>
  `;
}


function renderGroupSheet() {
  const isNew = state.sheet.id === "new";
  const g = isNew
    ? { id: "new", name: "", priority: 30, rules: {}, wordingIds: [], defaultWordingId: null }
    : state.config.groups.find((x) => x.id === state.sheet.id);
  if (!g) return `<p>הקבוצה לא נמצאה.</p>`;
  const draft = state.sheet.draft || g;
  state.sheet.draft = draft;
  const dims = state.config.dimensions;
  const others = state.config.groups.filter((x) => x.id !== g.id);
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head">
      <h2>${isNew ? "קבוצה חדשה" : "עריכת קבוצה"}</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button>
    </div>
    <div class="field">
      <label for="gn">שם הקבוצה</label>
      <input class="input" id="gn" data-field="g-name" value="${esc(draft.name || "")}">
    </div>
    <div class="field">
      <label for="gp">עדיפות (גבוה יותר = קודם בתור, וגם גובר בהתאמה)</label>
      <input class="input" id="gp" data-field="g-priority" dir="ltr" value="${esc(draft.priority ?? 30)}">
    </div>
    <p class="chip-legend">כללים — איש קשר נכנס לקבוצה אם הוא מתאים לכל הממדים שסומנו (ובתוך ממד, לאחת האפשרויות)</p>
    ${dims.map((d) => {
      const selected = new Set(draft.rules?.[d.id] || []);
      return `<div><span class="chip-legend">${esc(d.name)}</span><div class="chips">
        ${d.options.map((o) => `<button type="button" class="chip ${selected.has(o.id) ? "is-on" : ""}" data-act="toggle-rule" data-dim="${esc(d.id)}" data-val="${esc(o.id)}">${esc(o.label)}</button>`).join("")}
      </div></div>`;
    }).join("")}
    <p class="chip-legend">ניסוחים של הקבוצה</p>
    <div class="chips">
      ${state.config.wordings.map((w) => {
        const on = (draft.wordingIds || []).includes(w.id);
        const def = draft.defaultWordingId === w.id;
        return `<button type="button" class="chip ${on ? "is-on" : ""}" data-act="toggle-wording" data-val="${esc(w.id)}">${esc(w.name)}${def ? " ★" : ""}</button>`;
      }).join("")}
    </div>
    <p class="tiny">לחיצה בוחרת ניסוח לקבוצה. לחיצה חוזרת על ניסוח מסומן הופכת אותו לברירת מחדל. עוד לחיצה מסירה אותו.</p>
    <div class="btn-row">
      <button type="button" class="btn btn-primary" data-act="save-group">שמירה</button>
    </div>
    ${!isNew && others.length ? `<hr class="sep"><label class="lab">מיזוג קבוצה אחרת לתוך זו</label>
      <select class="select" data-field="merge-src">
        <option value="">בחירה…</option>
        ${others.map((o) => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join("")}
      </select>
      <button type="button" class="btn btn-ghost" data-act="merge-group">מזג לכאן</button>` : ""}
    ${!isNew ? `<button type="button" class="btn btn-ghost btn-danger" data-act="ask-delete-group" data-id="${esc(g.id)}">מחיקת הקבוצה</button>` : ""}
  `;
}

function renderWordingSheet() {
  const isNew = state.sheet.id === "new";
  const w = isNew
    ? { id: "new", name: "", text: "היי {שם},\n\n\n\n{קישור}\n\nאמתי", shabbatRespectful: false }
    : state.config.wordings.find((x) => x.id === state.sheet.id);
  if (!w) return "";
  const draft = state.sheet.draft || { ...w };
  state.sheet.draft = draft;
  const sample = C.applyTemplate(draft.text, { name: "שירה", gender: "female" }, state.config.videoUrl);
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head">
      <h2>${isNew ? "ניסוח חדש" : "עריכת ניסוח"}</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button>
    </div>
    <div class="field">
      <label for="wn">שם פנימי</label>
      <input class="input" id="wn" data-field="w-name" value="${esc(draft.name || "")}">
    </div>
    <div class="chips">
      <button type="button" class="chip ${draft.shabbatRespectful ? "is-on chip--warn" : ""}" data-act="toggle-shabbat-w">ניסוח מנומס לשומרי שבת</button>
    </div>
    <div class="field">
      <label for="wt">ההודעה</label>
      <textarea class="textarea" id="wt" data-field="w-text">${esc(draft.text || "")}</textarea>
    </div>
    <p class="tiny">משתנים: {שם} ו{קישור}. צורות מין נכתבות כך: {תראה/תראי} — קודם זכר, אחר כך נקבה.</p>
    <span class="chip-legend">תצוגה מקדימה (לשירה)</span>
    <pre class="preview">${esc(sample)}</pre>
    <div class="btn-row">
      <button type="button" class="btn btn-primary" data-act="save-wording">שמירה</button>
      ${!isNew ? `<button type="button" class="btn btn-ghost btn-danger" data-act="ask-delete-wording" data-id="${esc(w.id)}">מחיקה</button>` : ""}
    </div>
  `;
}

function renderDimSheet() {
  const isNew = state.sheet.id === "new";
  const d = isNew
    ? { id: "new", name: "", options: [{ id: "", label: "" }], locked: false }
    : state.config.dimensions.find((x) => x.id === state.sheet.id);
  if (!d) return "";
  const draft = state.sheet.draft || { ...d, options: d.options.map((o) => ({ ...o })) };
  state.sheet.draft = draft;
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head">
      <h2>${isNew ? "ממד קשר חדש" : esc(draft.name)}</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button>
    </div>
    <div class="field">
      <label for="dn">שם הממד</label>
      <input class="input" id="dn" data-field="d-name" value="${esc(draft.name || "")}" ${draft.locked ? "disabled" : ""}>
    </div>
    <span class="chip-legend">אפשרויות</span>
    ${(draft.options || []).map((o, i) => `<div class="field">
      <input class="input" data-field="d-opt" data-i="${i}" value="${esc(o.label)}" placeholder="תווית" ${draft.locked ? "disabled" : ""}>
    </div>`).join("")}
    ${!draft.locked ? `<button type="button" class="btn btn-ghost" data-act="add-opt">הוספת אפשרות</button>
      <div class="btn-row"><button type="button" class="btn btn-primary" data-act="save-dim">שמירה</button></div>
      ${!isNew ? `<button type="button" class="btn btn-ghost btn-danger" data-act="ask-delete-dim" data-id="${esc(d.id)}">מחיקת הממד</button>` : ""}` : `<p class="tiny">את הממד הזה אי אפשר למחוק, כי הלוגיקה של השבת ושל לשון הפנייה נשענת עליו.</p>`}
  `;
}

function renderPasteSheet() {
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head">
      <h2>הדבקת רשימה</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button>
    </div>
    <p class="kicker">שורה לכל אדם, בצורה «שם, טלפון». למשל:<br>יוסי כהן, 050-123-4567</p>
    <div class="field">
      <textarea class="textarea" data-field="paste-text" placeholder="שם, טלפון">${esc(state.sheet.text || "")}</textarea>
    </div>
    <button type="button" class="btn btn-primary" data-act="import-paste">ייבוא</button>
  `;
}

function renderConfirmSheet() {
  const s = state.sheet;
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head"><h2>${esc(s.title || "בטוח?")}</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button></div>
    <p class="kicker">${esc(s.text || "")}</p>
    <div class="btn-row">
      <button type="button" class="btn btn-ghost" data-act="close-sheet">ביטול</button>
      <button type="button" class="btn ${s.danger ? "btn-ghost btn-danger" : "btn-primary"}" data-act="${esc(s.okAct)}" data-id="${esc(s.id || "")}">${esc(s.okLabel || "אישור")}</button>
    </div>
  `;
}

function renderSaveTplSheet() {
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head"><h2>שמירת תבנית</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button></div>
    <p class="kicker">נשמר רק במכשיר, בלי אנשי הקשר.</p>
    <div class="field">
      <label for="tpln">שם התבנית</label>
      <input class="input" id="tpln" data-field="tpl-name" value="${esc(state.sheet.name || "")}">
    </div>
    <button type="button" class="btn btn-primary" data-act="confirm-save-template">שמירה</button>
  `;
}

function renderImportReport() {
  const r = state.importReport || { added: [], skipped: [], invalid: 0, kind: "" };
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-head"><h2>הייבוא הסתיים</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="סגירה">✕</button></div>
    <p class="kicker">נוספו ${r.added.length} אנשי קשר${r.kind ? ` (מקובץ ${esc(r.kind)})` : ""}. דולגו ${r.skipped.length} כפולים (אותו מספר כבר אצלך). ${r.invalid ? `לא זוהו ${r.invalid} מספרים.` : ""}</p>
    <div class="btn-row">
      <button type="button" class="btn btn-primary" data-act="after-import">לתיוג מהיר</button>
      <button type="button" class="btn btn-ghost" data-act="close-sheet">סגירה</button>
    </div>
  `;
}


function findContact(id) {
  return state.contacts.find((c) => c.id === id);
}

function sendContact(c, { force = false } = {}) {
  if (!force && state.shabbat.isShabbat && c.shabbat === "observant") return;
  const message = C.messageForContact(c, state.config);
  const url = C.waMeUrl(c.phone, message);
  c.sentAt = new Date().toISOString();
  c.updatedAt = c.sentAt;
  state.lastSentId = c.id;
  saveContacts();
  showToast(`סומן כנשלח אל ${C.firstNameOf(c.name) || c.name}`, { act: "undo-sent", id: c.id, label: "בטל" });
  window.open(url, "_blank", "noopener");
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function todayStamp() {
  const parts = C.israelParts();
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function importRawContacts(raw, kind) {
  const { added, skipped } = C.mergeIncoming(state.contacts, raw);
  saveContacts();
  state.importReport = { added, skipped, invalid: 0, kind };
  state.sheet = { type: "import-report" };
  if (added.length) state.ui.tab = "quick";
  rebuildIndex();
  render();
}

async function importFile(file) {
  const text = await file.text();
  if (/\.json$/i.test(file.name) || text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try {
      importJson(JSON.parse(text));
      return;
    } catch { /* fall through */ }
  }
  const parsed = C.detectAndParse(file.name, text);
  importRawContacts(parsed.contacts, parsed.kind);
}

function importJson(data) {
  const type = data?.type;
  if (type === C.BACKUP_TYPE || (data.contacts && data.config)) {
    if (Array.isArray(data.contacts)) {
      const incoming = data.contacts.map(C.sanitizeContact).filter(Boolean);
      const byPhone = new Map();
      for (const c of state.contacts) {
        for (const phone of c.phones || [c.phone]) byPhone.set(phone, c);
      }
      const added = [];
      let skipped = 0;
      for (const c of incoming) {
        const hit = c.phones.map((phone) => byPhone.get(phone)).find(Boolean);
        if (hit) { skipped++; continue; }
        state.contacts.push(c);
        for (const phone of c.phones) byPhone.set(phone, c);
        added.push(c);
      }
      saveContacts();
      state.importReport = { added, skipped: Array(skipped).fill(0), invalid: 0, kind: "גיבוי" };
    }
    if (data.config) {
      state.config = C.normalizeConfig(data.config);
      saveConfig();
    }
    if (Array.isArray(data.scheduled)) {
      const have = new Set(state.scheduled.map((s) => s.id));
      for (const raw of data.scheduled) {
        const s = C.sanitizeScheduled(raw);
        if (s && !have.has(s.id)) { state.scheduled.push(s); have.add(s.id); }
      }
      saveScheduled();
    }
    if (Array.isArray(data.recents)) {
      for (const raw of data.recents.slice().reverse()) {
        state.recents = C.pushRecent(state.recents, raw);
      }
      saveRecents();
    }
    rebuildIndex();
    state.sheet = { type: "import-report" };
    render();
    return;
  }
  if (type === C.CONFIG_TYPE || data.groups || data.wordings) {
    state.config = C.normalizeConfig(data);
    saveConfig();
    showToast("ההגדרות עודכנו מהקובץ");
    state.sheet = null;
    render();
    return;
  }
  if (type === C.CONTACTS_TYPE || Array.isArray(data.contacts) || Array.isArray(data)) {
    const list = C.extractContactsPayload(data).map(C.sanitizeContact).filter(Boolean);
    const existingPhones = new Set(state.contacts.flatMap((c) => c.phones || [c.phone]));
    const fresh = list.filter((c) => !c.phones.some((phone) => existingPhones.has(phone)));
    const skippedN = list.length - fresh.length;
    state.contacts.push(...fresh);
    saveContacts();
    rebuildIndex();
    state.importReport = { added: fresh, skipped: Array(skippedN).fill(0), invalid: 0, kind: "json" };
    state.sheet = { type: "import-report" };
    render();
    return;
  }
  showToast("לא זיהיתי את סוג הקובץ");
}

function closeSheet() {
  state.sheet = null;
  render();
}

function slugify(name) {
  const base = String(name || "item").trim().replace(/\s+/g, "-").slice(0, 40) || "item";
  return C.uid(base);
}


function pickQuick(item) {
  if (!item?.phone) return;
  const contact = item.id ? findContact(item.id) : null;
  state.quick.selected = {
    id: item.id || contact?.id || null,
    name: item.name || contact?.name || C.formatPhoneDisplay(item.phone),
    phone: item.phone,
  };
  state.quick.query = "";
  state.quick.highlight = 0;
  render();
}

function handleAct(act, el, ev) {
  const id = el.dataset?.id || "";
  const val = el.dataset?.val || "";
  if (act === "tab") {
    state.ui.tab = el.dataset.tab;
    saveUi();
    render();
    return;
  }
  if (act === "dismiss-onboard") {
    state.ui.onboarding = false;
    saveUi();
    render();
    return;
  }
  if (act === "close-sheet") { closeSheet(); return; }
  if (act === "overlay-close") {
    if (ev.target === el) closeSheet();
    return;
  }
  if (act === "set-dim") {
    const c = findContact(id);
    if (!c) return;
    const dim = el.dataset.dim;
    const current = dimOf(c, dim);
    setDim(c, dim, current === val ? (dim === "closeness" ? "" : "unknown") : val);
    saveContacts();
    render();
    return;
  }
  if (act === "set-wording") {
    const c = findContact(id);
    if (!c) return;
    c.wordingId = val;
    c.messageOverride = null;
    c.updatedAt = new Date().toISOString();
    saveContacts();
    render();
    return;
  }
  if (act === "reset-msg") {
    const c = findContact(id);
    if (!c) return;
    c.messageOverride = null;
    saveContacts();
    render();
    return;
  }
  if (act === "send") {
    const c = findContact(id);
    if (c) sendContact(c, { force: el.dataset.force === "1" });
    return;
  }
  if (act === "mark-sent") {
    const c = findContact(id);
    if (!c) return;
    c.sentAt = new Date().toISOString();
    c.updatedAt = c.sentAt;
    state.lastSentId = c.id;
    saveContacts();
    showToast(`סומן כנשלח אל ${C.firstNameOf(c.name) || c.name}`, { act: "undo-sent", id: c.id, label: "בטל" });
    return;
  }
  if (act === "undo-sent") {
    const c = findContact(id);
    if (!c) return;
    c.sentAt = null;
    c.updatedAt = new Date().toISOString();
    saveContacts();
    state.toast = null;
    showToast("השליחה בוטלה");
    return;
  }
  if (act === "skip") {
    state.skip.add(id);
    render();
    return;
  }
  if (act === "clear-skip") {
    state.skip.clear();
    render();
    return;
  }
  if (act === "open-contact") {
    state.sheet = { type: "contact", id };
    render();
    return;
  }
  if (act === "quick-tag") {
    state.sheet = { type: "quick-tag", index: 0 };
    render();
    return;
  }
  if (act === "quick-next") {
    const max = state.contacts.filter((c) => !c.sentAt).length;
    if ((state.sheet.index || 0) >= max - 1) closeSheet();
    else { state.sheet.index = (state.sheet.index || 0) + 1; render(); }
    return;
  }
  if (act === "quick-prev") {
    state.sheet.index = Math.max(0, (state.sheet.index || 0) - 1);
    render();
    return;
  }
  if (act === "sent-filter") {
    state.ui.sentFilter = val;
    saveUi();
    render();
    return;
  }
  if (act === "pick-file") {
    document.getElementById("file-import")?.click();
    return;
  }
  if (act === "pick-json") {
    document.getElementById("json-import")?.click();
    return;
  }
  if (act === "paste-open") {
    state.sheet = { type: "paste", text: "" };
    render();
    return;
  }
  if (act === "import-paste") {
    importRawContacts(C.parsePaste(state.sheet.text || ""), "הדבקה");
    return;
  }
  if (act === "after-import") {
    state.sheet = { type: "quick-tag", index: 0 };
    state.ui.tab = "contacts";
    saveUi();
    render();
    return;
  }
  if (act === "export-backup") {
    downloadJson(`amitai-share-backup-${todayStamp()}.json`, {
      type: C.BACKUP_TYPE,
      version: C.VERSION,
      exportedAt: new Date().toISOString(),
      contacts: state.contacts,
      config: state.config,
      scheduled: state.scheduled,
      recents: state.recents,
    });
    return;
  }
  if (act === "export-contacts") {
    downloadJson(`amitai-share-contacts-${todayStamp()}.json`, {
      type: C.CONTACTS_TYPE,
      version: C.VERSION,
      exportedAt: new Date().toISOString(),
      contacts: state.contacts,
    });
    return;
  }
  if (act === "export-config") {
    downloadJson(`amitai-share-config-${todayStamp()}.json`, {
      ...state.config,
      type: C.CONFIG_TYPE,
      version: C.VERSION,
      exportedAt: new Date().toISOString(),
    });
    return;
  }
  if (act === "add-group") {
    state.sheet = { type: "group", id: "new", draft: { name: "", priority: 30, rules: {}, wordingIds: [], defaultWordingId: null } };
    render();
    return;
  }
  if (act === "edit-group") {
    const g = state.config.groups.find((x) => x.id === id);
    state.sheet = { type: "group", id, draft: g ? JSON.parse(JSON.stringify(g)) : null };
    render();
    return;
  }
  if (act === "toggle-rule") {
    const draft = state.sheet?.draft;
    if (!draft) return;
    const dim = el.dataset.dim;
    draft.rules = draft.rules || {};
    const arr = new Set(draft.rules[dim] || []);
    if (arr.has(val)) arr.delete(val); else arr.add(val);
    draft.rules[dim] = [...arr];
    if (!draft.rules[dim].length) delete draft.rules[dim];
    render();
    return;
  }
  if (act === "toggle-wording") {
    const draft = state.sheet?.draft;
    if (!draft) return;
    const ids = draft.wordingIds || [];
    if (!ids.includes(val)) {
      draft.wordingIds = [...ids, val];
      if (!draft.defaultWordingId) draft.defaultWordingId = val;
    } else if (draft.defaultWordingId !== val) {
      draft.defaultWordingId = val;
    } else {
      draft.wordingIds = ids.filter((x) => x !== val);
      if (draft.defaultWordingId === val) draft.defaultWordingId = draft.wordingIds[0] || null;
    }
    render();
    return;
  }
  if (act === "save-group") {
    const draft = state.sheet?.draft;
    if (!draft || !String(draft.name || "").trim()) { showToast("צריך שם לקבוצה"); return; }
    draft.name = draft.name.trim();
    draft.priority = Number(draft.priority) || 0;
    if (state.sheet.id === "new") {
      draft.id = slugify(draft.name);
      state.config.groups.push(draft);
    } else {
      const i = state.config.groups.findIndex((g) => g.id === state.sheet.id);
      if (i >= 0) state.config.groups[i] = { ...state.config.groups[i], ...draft, id: state.sheet.id };
    }
    saveConfig();
    closeSheet();
    showToast("הקבוצה נשמרה");
    return;
  }
  if (act === "merge-group") {
    const srcId = document.querySelector("[data-field=merge-src]")?.value;
    const dest = state.sheet?.draft;
    const src = state.config.groups.find((g) => g.id === srcId);
    if (!src || !dest) return;
    dest.rules = dest.rules || {};
    for (const [k, vals] of Object.entries(src.rules || {})) {
      dest.rules[k] = [...new Set([...(dest.rules[k] || []), ...vals])];
    }
    dest.wordingIds = [...new Set([...(dest.wordingIds || []), ...(src.wordingIds || [])])];
    dest.priority = Math.max(dest.priority ?? 0, src.priority ?? 0);
    const destId = state.sheet.id;
    for (const c of state.contacts) {
      if (c.groupOverride === src.id) c.groupOverride = destId;
    }
    state.config.groups = state.config.groups.filter((g) => g.id !== src.id);
    const i = state.config.groups.findIndex((g) => g.id === destId);
    if (i >= 0) state.config.groups[i] = { ...state.config.groups[i], ...dest, id: destId };
    saveConfig();
    saveContacts();
    state.sheet.draft = state.config.groups.find((g) => g.id === destId);
    showToast(`«${src.name}» מוזגה לכאן`);
    render();
    return;
  }
  
  if (act === "pick-quick") {
    pickQuick({ id: el.dataset.id || "", name: el.dataset.name || "", phone: el.dataset.phone });
    return;
  }
  if (act === "clear-quick") {
    state.quick.selected = null;
    render();
    document.getElementById("quick-search")?.focus();
    return;
  }
  if (act === "send-quick") {
    const sel = state.quick.selected;
    if (!sel?.phone) { showToast("בחרו איש קשר או הקלידו מספר"); return; }
    sendToWhatsApp(sel.name, sel.phone, state.quick.message || "", sel.id);
    showToast(`נפתח וואטסאפ עם ${sel.name}`);
    return;
  }
  if (act === "use-template") {
    const tp = (state.config.quickTemplates || []).find((x) => x.id === id);
    if (!tp) return;
    state.quick.message = applyFreeTemplate(tp.text);
    render();
    return;
  }
  if (act === "save-template") {
    const text = (state.quick.message || "").trim();
    if (!text) return;
    state.sheet = { type: "save-tpl", name: text.split("\n")[0].slice(0, 24) };
    render();
    return;
  }
  if (act === "confirm-save-template") {
    const text = (state.quick.message || "").trim();
    const name = (state.sheet?.name || "תבנית").trim() || "תבנית";
    if (!text) { closeSheet(); return; }
    const t = C.sanitizeQuickTemplate({ name, text });
    state.config.quickTemplates = state.config.quickTemplates || [];
    state.config.quickTemplates.push(t);
    saveConfig();
    closeSheet();
    showToast("התבנית נשמרה במכשיר");
    return;
  }
  if (act === "save-scheduled") {
    const sel = state.quick.selected;
    if (!sel?.phone) { showToast("בחרו קודם אל מי לשלוח"); return; }
    if (!state.quick.scheduleAt) { showToast("בחרו תאריך ושעה"); return; }
    const at = new Date(state.quick.scheduleAt);
    if (!Number.isFinite(at.getTime())) { showToast("הזמן לא תקין"); return; }
    if (at.getTime() < Date.now() - 60000) { showToast("בחרו זמן בעתיד"); return; }
    const item = draftScheduledItem(at.toISOString());
    if (!item) return;
    state.scheduled.push(item);
    saveScheduled();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().then(() => render());
    }
    showToast("נשמר לתזמון — השליחה תדרוש לחיצה שלך");
    render();
    return;
  }
  if (act === "download-ics") {
    let item = id ? state.scheduled.find((s) => s.id === id) : null;
    if (!item) {
      const sel = state.quick.selected;
      if (!sel?.phone) { showToast("בחרו קודם אל מי לשלוח"); return; }
      const at = state.quick.scheduleAt ? new Date(state.quick.scheduleAt) : new Date(Date.now() + 3600000);
      if (!Number.isFinite(at.getTime())) { showToast("הזמן לא תקין"); return; }
      item = draftScheduledItem(at.toISOString());
    }
    if (item) downloadIcs(item);
    return;
  }
  if (act === "send-scheduled") {
    const item = state.scheduled.find((s) => s.id === id);
    if (!item) return;
    sendToWhatsApp(item.name, item.phone, item.message || "", item.contactId);
    item.sentAt = new Date().toISOString();
    saveScheduled();
    showToast(`נפתח וואטסאפ עם ${item.name}`);
    render();
    return;
  }
  if (act === "snooze-scheduled") {
    const item = state.scheduled.find((s) => s.id === id);
    if (!item) return;
    item.at = new Date(Date.now() + 3600000).toISOString();
    item.notified = false;
    saveScheduled();
    showToast("נדחה בשעה");
    render();
    return;
  }
  if (act === "dismiss-scheduled") {
    state.scheduled = state.scheduled.filter((s) => s.id !== id);
    saveScheduled();
    render();
    return;
  }
  if (act === "ask-notify") {
    if (typeof Notification !== "undefined") {
      Notification.requestPermission().then(() => render());
    }
    return;
  }

  handleActMore(act, el, id, val);
}


function handleActMore(act, el, id, val) {
  if (act === "ask-delete-group") {
    state.sheet = { type: "confirm", title: "למחוק את הקבוצה?", text: "אנשי הקשר יישארו. השיוך האוטומטי פשוט ישתנה לפי שאר הכללים.", okAct: "delete-group", id, okLabel: "מחיקה", danger: true };
    render();
    return;
  }
  if (act === "delete-group") {
    state.config.groups = state.config.groups.filter((g) => g.id !== id);
    for (const c of state.contacts) if (c.groupOverride === id) c.groupOverride = null;
    saveConfig();
    saveContacts();
    closeSheet();
    showToast("הקבוצה נמחקה");
    return;
  }
  if (act === "add-wording") {
    state.sheet = { type: "wording", id: "new", draft: { name: "", text: "היי {שם},\n\n\n\n{קישור}\n\nאמתי", shabbatRespectful: false } };
    render();
    return;
  }
  if (act === "edit-wording") {
    const w = state.config.wordings.find((x) => x.id === id);
    state.sheet = { type: "wording", id, draft: w ? { ...w } : null };
    render();
    return;
  }
  if (act === "toggle-shabbat-w") {
    if (state.sheet?.draft) {
      state.sheet.draft.shabbatRespectful = !state.sheet.draft.shabbatRespectful;
      render();
    }
    return;
  }
  if (act === "save-wording") {
    const draft = state.sheet?.draft;
    if (!draft || !String(draft.name || "").trim() || !String(draft.text || "").trim()) {
      showToast("צריך שם וטקסט לניסוח");
      return;
    }
    draft.name = draft.name.trim();
    if (state.sheet.id === "new") {
      draft.id = slugify(draft.name);
      state.config.wordings.push(draft);
    } else {
      const i = state.config.wordings.findIndex((w) => w.id === state.sheet.id);
      if (i >= 0) state.config.wordings[i] = { ...state.config.wordings[i], ...draft, id: state.sheet.id };
    }
    saveConfig();
    closeSheet();
    showToast("הניסוח נשמר");
    return;
  }
  if (act === "ask-delete-wording") {
    state.sheet = { type: "confirm", title: "למחוק ניסוח?", text: "הוא יוסר גם מהקבוצות שמשתמשות בו.", okAct: "delete-wording", id, okLabel: "מחיקה", danger: true };
    render();
    return;
  }
  if (act === "delete-wording") {
    state.config.wordings = state.config.wordings.filter((w) => w.id !== id);
    for (const g of state.config.groups) {
      g.wordingIds = (g.wordingIds || []).filter((x) => x !== id);
      if (g.defaultWordingId === id) g.defaultWordingId = g.wordingIds[0] || null;
    }
    saveConfig();
    closeSheet();
    showToast("הניסוח נמחק");
    return;
  }
  if (act === "add-dim") {
    state.sheet = { type: "dim", id: "new", draft: { name: "", options: [{ id: "", label: "" }], locked: false } };
    render();
    return;
  }
  if (act === "edit-dim") {
    const d = state.config.dimensions.find((x) => x.id === id);
    state.sheet = { type: "dim", id, draft: d ? JSON.parse(JSON.stringify(d)) : null };
    render();
    return;
  }
  if (act === "add-opt") {
    state.sheet.draft.options.push({ id: "", label: "" });
    render();
    return;
  }
  if (act === "save-dim") {
    const draft = state.sheet?.draft;
    if (!draft || !String(draft.name || "").trim()) { showToast("צריך שם לממד"); return; }
    draft.options = (draft.options || [])
      .map((o) => ({ id: o.id || slugify(o.label), label: String(o.label || "").trim() }))
      .filter((o) => o.label);
    if (!draft.options.length) { showToast("צריך לפחות אפשרות אחת"); return; }
    draft.name = draft.name.trim();
    if (state.sheet.id === "new") {
      draft.id = slugify(draft.name);
      draft.builtin = false;
      draft.locked = false;
      state.config.dimensions.push(draft);
    } else if (!draft.locked) {
      const i = state.config.dimensions.findIndex((d) => d.id === state.sheet.id);
      if (i >= 0) state.config.dimensions[i] = { ...state.config.dimensions[i], ...draft, id: state.sheet.id };
    }
    saveConfig();
    closeSheet();
    showToast("הממד נשמר");
    return;
  }
  if (act === "ask-delete-dim") {
    state.sheet = { type: "confirm", title: "למחוק ממד?", text: "התגיות של הממד הזה יימחקו מאנשי הקשר ומהכללים.", okAct: "delete-dim", id, okLabel: "מחיקה", danger: true };
    render();
    return;
  }
  if (act === "delete-dim") {
    const dim = state.config.dimensions.find((d) => d.id === id);
    if (!dim || dim.locked) return;
    state.config.dimensions = state.config.dimensions.filter((d) => d.id !== id);
    for (const g of state.config.groups) if (g.rules) delete g.rules[id];
    for (const c of state.contacts) if (c.dims) delete c.dims[id];
    saveConfig();
    saveContacts();
    closeSheet();
    showToast("הממד נמחק");
    return;
  }
  if (act === "ask-delete") {
    const c = findContact(id);
    state.sheet = { type: "confirm", title: "למחוק את איש הקשר?", text: c ? c.name : "", okAct: "delete-contact", id, okLabel: "מחיקה", danger: true };
    render();
    return;
  }
  if (act === "delete-contact") {
    state.contacts = state.contacts.filter((c) => c.id !== id);
    saveContacts();
    rebuildIndex();
    closeSheet();
    showToast("איש הקשר נמחק");
    return;
  }
  if (act === "reset-config") {
    state.sheet = { type: "confirm", title: "לאפס קבוצות וניסוחים?", text: "אנשי הקשר יישארו. הקבוצות, הממדים והניסוחים יחזרו לברירת המחדל.", okAct: "do-reset-config", okLabel: "איפוס", danger: true };
    render();
    return;
  }
  if (act === "do-reset-config") {
    state.config = C.defaultConfig();
    saveConfig();
    closeSheet();
    showToast("ההגדרות אופסו");
    return;
  }
  if (act === "clear-all") {
    state.sheet = { type: "confirm", title: "למחוק את כל הרשימה?", text: "רק במכשיר הזה. אם יש גיבוי אפשר לייבא אותו אחר כך.", okAct: "do-clear-all", okLabel: "מחיקה", danger: true };
    render();
    return;
  }
  if (act === "do-clear-all") {
    state.contacts = [];
    saveContacts();
    rebuildIndex();
    closeSheet();
    showToast("הרשימה נמחקה מהמכשיר");
    return;
  }
  if (act === "remove-tag") {
    const c = findContact(id);
    if (!c) return;
    c.customTags = (c.customTags || []).filter((t) => t !== val);
    saveContacts();
    render();
  }
}

function handleField(field, el) {
  const id = el.dataset.id || "";
  const value = el.value;
  if (field === "quick-search") {
    state.quick.query = value;
    state.quick.highlight = 0;
    paintQuickSuggestions();
    return;
  }
  if (field === "quick-message") {
    state.quick.message = value;
    return;
  }
  if (field === "schedule-at") {
    state.quick.scheduleAt = value;
    return;
  }
  if (field === "tpl-name") {
    if (state.sheet) state.sheet.name = value;
    return;
  }
  if (field === "search") {
    state.ui.search = value;
    const mainPos = document.getElementById("main")?.scrollTop;
    render();
    if (mainPos) document.getElementById("main").scrollTop = mainPos;
    return;
  }
  if (field === "paste-text") { state.sheet.text = value; return; }
  if (field === "videoUrl") {
    state.config.videoUrl = value.trim() || C.VIDEO_URL;
    saveConfig();
    return;
  }
  if (field === "g-name" && state.sheet?.draft) { state.sheet.draft.name = value; return; }
  if (field === "g-priority" && state.sheet?.draft) { state.sheet.draft.priority = value; return; }
  if (field === "w-name" && state.sheet?.draft) { state.sheet.draft.name = value; return; }
  if (field === "w-text" && state.sheet?.draft) {
    state.sheet.draft.text = value;
    const preview = document.querySelector(".sheet .preview");
    if (preview) preview.textContent = C.applyTemplate(value, { name: "שירה", gender: "female" }, state.config.videoUrl);
    return;
  }
  if (field === "d-name" && state.sheet?.draft) { state.sheet.draft.name = value; return; }
  if (field === "d-opt" && state.sheet?.draft) {
    const i = +el.dataset.i;
    if (state.sheet.draft.options[i]) {
      state.sheet.draft.options[i].label = value;
      if (!state.sheet.draft.options[i].id) state.sheet.draft.options[i].id = "";
    }
    return;
  }
  if (field === "merge-src" || field === "newTag") return;
  const c = findContact(id);
  if (!c) return;
  if (field === "relationNote") { c.relationNote = value; saveContacts(); return; }
  if (field === "note") { c.note = value; saveContacts(); return; }
  if (field === "name") { c.name = value; saveContacts(); return; }
  if (field === "messageOverride") { c.messageOverride = value; saveContacts(); return; }
  if (field === "groupOverride") {
    c.groupOverride = value || null;
    saveContacts();
    render();
  }
}

function handleFieldCommit(field, el) {
  if (field === "phone") {
    const c = findContact(el.dataset.id);
    if (!c) return;
    const n = C.normalizePhone(el.value);
    if (n) {
      c.phone = n;
      if (!c.phones.includes(n)) c.phones.unshift(n);
      saveContacts();
    }
    render();
  }
  if (field === "newTag") {
    const c = findContact(el.dataset.id);
    const tag = el.value.trim();
    if (c && tag) {
      c.customTags = [...new Set([...(c.customTags || []), tag])];
      saveContacts();
      render();
    }
  }
  if (field === "videoUrl") render();
}

function bind() {
  const root = document;
  root.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    ev.preventDefault();
    handleAct(el.dataset.act, el, ev);
  });
  root.addEventListener("input", (ev) => {
    const el = ev.target.closest("[data-field]");
    if (!el) return;
    handleField(el.dataset.field, el);
  });
  root.addEventListener("change", (ev) => {
    if (ev.target.matches("[data-act-change=import-file], [data-act-change=import-json]")) {
      const file = ev.target.files?.[0];
      ev.target.value = "";
      if (file) importFile(file);
      return;
    }
    const el = ev.target.closest("[data-field]");
    if (!el) return;
    if (el.dataset.field === "groupOverride") handleField("groupOverride", el);
    if (el.dataset.field === "schedule-at") handleField("schedule-at", el);
  });
  root.addEventListener("keydown", (ev) => {
    const el = ev.target.closest("[data-field]");
    if (el && el.dataset.field === "quick-search") {
      const items = quickSuggestions();
      if (ev.key === "ArrowDown" && items.length) {
        ev.preventDefault();
        state.quick.highlight = Math.min((state.quick.highlight || 0) + 1, items.length - 1);
        paintQuickSuggestions();
      } else if (ev.key === "ArrowUp" && items.length) {
        ev.preventDefault();
        state.quick.highlight = Math.max((state.quick.highlight || 0) - 1, 0);
        paintQuickSuggestions();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        const pick = items[state.quick.highlight] || items[0];
        if (pick) pickQuick(pick);
      } else if (ev.key === "Escape") {
        state.quick.query = "";
        el.value = "";
        paintQuickSuggestions();
      }
    }
    if (el && el.dataset.field === "newTag" && ev.key === "Enter") {
      ev.preventDefault();
      handleFieldCommit("newTag", el);
    }
    if (ev.key === "Escape" && state.sheet && !state.ui.onboarding) closeSheet();
  });
  root.addEventListener("focusout", (ev) => {
    const el = ev.target.closest?.("[data-field]");
    if (el && (el.dataset.field === "phone" || el.dataset.field === "newTag")) handleFieldCommit(el.dataset.field, el);
  });
  let startX = null;
  root.addEventListener("touchstart", (ev) => {
    if (state.sheet?.type !== "quick-tag") return;
    startX = ev.changedTouches[0].clientX;
  }, { passive: true });
  root.addEventListener("touchend", (ev) => {
    if (state.sheet?.type !== "quick-tag" || startX == null) return;
    const dx = ev.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 60) return;
    if (dx < 0) handleAct("quick-next", { dataset: {} }, ev);
    else handleAct("quick-prev", { dataset: {} }, ev);
  }, { passive: true });
}

load();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { bind(); render(); startDueWatch(); });
} else {
  bind();
  render();
  startDueWatch();
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkDue({ notify: true });
});
