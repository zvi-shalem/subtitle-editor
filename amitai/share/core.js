/**
 * Amitai share-app core: contacts, phones, templates, Shabbat, groups.
 * Pure functions — no network, no DOM. Usable in the browser and in Node tests.
 */

export const VIDEO_URL = "https://youtu.be/CodJ6R60w9M";
export const VIDEO_TITLE = "הנה הם";

export const STORAGE = {
  contacts: "amitai-share.contacts.v1",
  config: "amitai-share.config.v1",
  ui: "amitai-share.ui.v1",
  scheduled: "amitai-share.scheduled.v1",
  recents: "amitai-share.recents.v1",
  recs: "amitai-share.recs.v1",
};

export const CONFIG_TYPE = "amitai-share-config";
export const CONTACTS_TYPE = "amitai-share-contacts";
export const BACKUP_TYPE = "amitai-share-backup";
export const VERSION = 1;

const JERUSALEM = { lat: 31.7683, lon: 35.2137 };

export const NAME_PREFIXES = new Set([
  "הרב", "הרבנית", "ד״ר", "ד\"ר", "דר", "דר.", "עו״ד", "עו\"ד", "עוד",
  "פרופ", "פרופ׳", "פרופ'", "פרופסור", "מר", "גברת", "גב׳", "גב'",
  "הר'", "הר׳", "ר'", "ר׳", "הגאון", "הרה״ג", "הרה\"ג", "mr", "mrs", "ms",
  "dr", "dr.", "prof", "prof.", "mr.", "mrs.",
]);

/** Unisex names are omitted so we don't guess wrongly. */
export const MALE_NAMES = new Set([
  "אבי","אביאור","אביב","אביגדור","אביחי","אביעד","אבירם","אביתר","אברהם","אבשלום",
  "אדם","אהוד","אהרן","אהרון","אוהד","אודי","אופיר","אורי","אוריה","אוריאל","אורן",
  "אחיה","אייל","איל","אילון","אילן","אילתך","איתי","איתם","איתמר","איתן","אלון",
  "אלי","אליאב","אליאור","אליהו","אליעזר","אלירן","אלישיב","אלחנן","אלעד","אלעזר",
  "אלקנה","אמיר","אמיתי","אמתי","אמנון","אסף","ארז","ארי","אריק","אריה","ארנון",
  "ארתור","אשר","בועז","בן","בני","בניה","בנימין","בצלאל","ברוך","ברי","גד","גדעון",
  "גיא","גיל","גילי","גלעד","דב","דוד","דודי","דולב","דור","דורון","דותן","דן","דני",
  "דרור","הלל","זאב","זבולון","זיו","חגי","חיים","חנן","חנוך","טבעון","יאיר",
  "יגאל","ידיד","ידידיה","יהודה","יהונתן","יהושע","יהל","יואב","יואל","יוחאי","יוחנן",
  "יונתן","יוני","יוסף","יוסי","יחזקאל","יעקב","יעקב","יפתח","יצחק","יקיר","ירון",
  "יריב","ירין","ישראל","ישאיהו","ישעיהו","ישי","כפיר","לב","לוי","ליאם","מאיר",
  "מאור","מוטי","מורדי","מיכאל","מיקי","מנחם","מנשה","משה","מתן","נבו",
  "נדב","נהוראי","נח","נחמיה","נחום","ניר","ניצן","ניסים","ניסים","נפתלי","נתן",
  "נתנאל","סער","עדו","עידו","עובדיה","עודד","עוז","עוזיה","עומר","עומרי","עילי",
  "עלי","עמוס","עמנואל","עמיתי","עקיבא","ערן","פנחס","צבי","צחי","קובי","קאי",
  "ראובן","רועי","רועי","רון","רז","רפאל","שאול","שייע","שלום","שלמה","שמואל",
  "שמעון","שמחי","שחר","תומר","תמיר","הראל","עברי","לביא","סהר","אבישי","נאור",
  "עופרי","ינאי","איתן","גבע","תום","אמיר","דביר","יונק","כרמל",
]);

export const FEMALE_NAMES = new Set([
  "אביגיל","אגם","אדל","אהובה","אורה","אוריאן","אורית","אורלי","אורנה","איילה",
  "אילנה","אילת","אלונה","אליה","אלין","אליענה","אלישבע","אמונה","אמונה","אנאל",
  "אסנת","אסתר","אפרת","אראלה","בארי","בלה","בת","בתאל","בתיה","בתשבע","גאיה",
  "גולדה","גילה","גלי","גליה","דנה","דניאלה","דפנה","דבורה","הגר","הדס","הדסה",
  "הילה","הילי","הלני","ויויאן","ורד","חגית","חוה","חיה","חנה","טובה","טלי","טליה",
  "טליה","יאנה","יארה","יהודית","יהלי","יוכבד","יונית","ימית","יסמין","יעל","יעל",
  "יפעת","יפה","כרמית","ליאן","ליאה","ליאורה","ליבי","ליטל","לילי","לילך","לינוי",
  "ליה","ליהי","מאיה","מאי","מורן","מוריה","מיכל","מיקה","מירב","מירי","מלכה",
  "מעין","מרים","מתנה","נגה","נועה","נויה","נוית","נטלי","נילי","ניצן","נעמה",
  "נעמי","נעמי","נתנאלה","סיגל","סיון","ספיר","עדה","עדינה","עטרה","עירית","עליזה",
  "ענבל","ענת","ענבר","פז","פנינה","צפורה","ציונה","קבלה","קרן","רבקה","רויטל",
  "רומי","רונה","רות","רותי","רחל","רחלי","רננה","שגית","שובל","שולמית","שושנה",
  "שיר","שירה","שירי","שירלי","שלי","שני","שקד","שרה","שרית","תהל","תהילה","תמר",
  "תמרה","תנא","הודיה","הלל","אבישג","ברכה","גאולה","ירין","כרמלה","נטעלי",
  "אוריה","אלה","אלמה","רינת","ענאם","נטע","ימית",
]);

/** Names used for both, so we leave gender unknown. */
export const UNISEX_NAMES = new Set([
  "אור","אופיר","אריאל","בר","גל","דניאל","הדר","טל","יובל","יהלי","ירדן",
  "ליאור","לי","מור","נועם","סתיו","עדן","עדי","עמית","עפרי","עופרי","רותם",
  "רון","רוני","שי","שחר","תום","שרון","חן","נגה","פז","שקד","הראל","סהר",
  "כרמל","דור","זיו","ניצן",
]);

export const DEFAULT_DIMENSIONS = [
  {
    id: "shabbat",
    name: "שמירת שבת",
    builtin: true,
    locked: true,
    options: [
      { id: "observant", label: "שומר שבת" },
      { id: "not", label: "לא שומר שבת" },
      { id: "unknown", label: "לא ידוע" },
    ],
  },
  {
    id: "gender",
    name: "מין",
    builtin: true,
    locked: true,
    options: [
      { id: "male", label: "זכר" },
      { id: "female", label: "נקבה" },
      { id: "unknown", label: "לא ידוע" },
    ],
  },
  {
    id: "closeness",
    name: "קרבה",
    builtin: true,
    locked: false,
    options: [
      { id: "family", label: "משפחה" },
      { id: "close-friend", label: "חבר קרוב" },
      { id: "friend", label: "חבר" },
      { id: "acquaintance", label: "מכר" },
      { id: "work", label: "עבודה" },
    ],
  },
];

export const DEFAULT_WORDINGS = [
  {
    id: "family-warm",
    name: "חם למשפחה",
    shabbatRespectful: false,
    text:
      "{שם} {יקר/יקרה},\n\n" +
      "יצא לי עכשיו משהו חדש מהלב — קטע ספוקן בשם \"הנה הם\".\n" +
      "חשבתי עליך כשסיימתי אותו, ואשמח אם {תקדיש/תקדישי} לזה כמה דקות.\n\n" +
      "{קישור}\n\n" +
      "אוהב,\n" +
      "אמתי",
  },
  {
    id: "family-shabbat",
    name: "למשפחה, בנימוס",
    shabbatRespectful: true,
    text:
      "{שם} {יקר/יקרה},\n\n" +
      "רציתי לשתף אותך במשהו חדש שיצא לי מהלב — קטע ספוקן בשם \"הנה הם\".\n" +
      "אשמח אם תצפה בזה בזמן שנוח לך.\n\n" +
      "{קישור}\n\n" +
      "באהבה,\n" +
      "אמתי",
  },
  {
    id: "close-personal",
    name: "אישי לחבר קרוב",
    shabbatRespectful: false,
    text:
      "{שם},\n\n" +
      "יש לי משהו חדש שאני רוצה ש{תראה/תראי} — \"הנה הם\". ספוקן, מהמקום הכי כנה שלי.\n" +
      "אם יש לך רגע, זה כאן. ואם {תרצה/תרצי} להגיד לי מה זה עשה לך, אני כאן.\n\n" +
      "{קישור}\n\n" +
      "אמתי",
  },
  {
    id: "close-short",
    name: "קצר וקרוב",
    shabbatRespectful: false,
    text:
      "{שם},\n\n" +
      "זה יצא לי עכשיו ואני מתרגש לשתף. \"הנה הם\", ביוטיוב.\n" +
      "{תראה/תראי} אם יש לך רגע, ואשמח לשמוע מה דעתך.\n\n" +
      "{קישור}\n\n" +
      "אמתי",
  },
  {
    id: "close-shabbat",
    name: "לחבר קרוב, בנימוס",
    shabbatRespectful: true,
    text:
      "{שם} {יקר/יקרה},\n\n" +
      "רציתי לשתף אותך בקטע ספוקן חדש שלי, \"הנה הם\".\n" +
      "אשמח אם תצפה בזה בזמן שנוח לך, ואם בא לך לשתף אותי אחר כך — אני כאן.\n\n" +
      "{קישור}\n\n" +
      "שלך,\n" +
      "אמתי",
  },
  {
    id: "friend-warm",
    name: "חם לחברים",
    shabbatRespectful: false,
    text:
      "היי {שם},\n\n" +
      "עלה לי סרטון חדש ביוטיוב — קטע ספוקן בשם \"הנה הם\".\n" +
      "אם בא לך להציץ, אשמח מאוד.\n\n" +
      "{קישור}\n\n" +
      "אמתי שלם",
  },
  {
    id: "friend-alt",
    name: "ישיר לחברים",
    shabbatRespectful: false,
    text:
      "היי {שם},\n\n" +
      "יש לי קטע חדש ביוטיוב, \"הנה הם\". ספוקן, מהלב.\n" +
      "אם יש לך כמה דקות, אשמח ש{תראה/תראי}.\n\n" +
      "{קישור}\n\n" +
      "אמתי",
  },
  {
    id: "friend-shabbat",
    name: "לחברים, בנימוס",
    shabbatRespectful: true,
    text:
      "שלום {שם},\n\n" +
      "רציתי לשתף אותך בקטע ספוקן חדש שלי, \"הנה הם\".\n" +
      "אפשר לצפות בזה ביוטיוב בזמן שנוח לך, ואשמח אם זה ידבר אליך.\n\n" +
      "{קישור}\n\n" +
      "בברכה,\n" +
      "אמתי שלם",
  },
  {
    id: "acq-reserved",
    name: "מאופק למכרים",
    shabbatRespectful: false,
    text:
      "שלום {שם},\n\n" +
      "רציתי לשתף אותך בקטע ספוקן חדש שלי, \"הנה הם\", שעודכן עכשיו ליוטיוב.\n" +
      "אשמח אם זה ידבר אליך.\n\n" +
      "{קישור}\n\n" +
      "אמתי שלם",
  },
  {
    id: "acq-shabbat",
    name: "למכרים, בנימוס",
    shabbatRespectful: true,
    text:
      "שלום {שם},\n\n" +
      "רציתי לשתף אותך בקטע ספוקן חדש שלי שעודכן ליוטיוב, \"הנה הם\".\n" +
      "אשמח אם תצפה בזה בזמן שנוח לך.\n\n" +
      "{קישור}\n\n" +
      "בברכה,\n" +
      "אמתי שלם",
  },
  {
    id: "work-polite",
    name: "מקצועי-אישי",
    shabbatRespectful: false,
    text:
      "שלום {שם},\n\n" +
      "אני משתף במשהו אישי שלי — קטע ספוקן חדש בשם \"הנה הם\".\n" +
      "אם יימצא לך רגע פנוי, אשמח ש{תראה/תראי}.\n\n" +
      "{קישור}\n\n" +
      "אמתי שלם",
  },
  {
    id: "work-shabbat",
    name: "לעבודה, בנימוס",
    shabbatRespectful: true,
    text:
      "שלום {שם},\n\n" +
      "רציתי לשתף במשהו אישי שלי — קטע ספוקן חדש בשם \"הנה הם\".\n" +
      "אשמח אם תצפה בזה בזמן שנוח לך.\n\n" +
      "{קישור}\n\n" +
      "בברכה,\n" +
      "אמתי שלם",
  },
  {
    id: "general",
    name: "כללי",
    shabbatRespectful: false,
    text:
      "היי {שם},\n\n" +
      "רציתי לשתף אותך בקטע ספוקן חדש שלי, \"הנה הם\".\n" +
      "אשמח אם זה ידבר אליך.\n\n" +
      "{קישור}\n\n" +
      "אמתי שלם",
  },
  {
    id: "general-shabbat",
    name: "כללי, בנימוס",
    shabbatRespectful: true,
    text:
      "שלום {שם},\n\n" +
      "רציתי לשתף אותך בקטע ספוקן חדש שלי, \"הנה הם\".\n" +
      "אשמח אם תצפה בזה בזמן שנוח לך.\n\n" +
      "{קישור}\n\n" +
      "בברכה,\n" +
      "אמתי שלם",
  },
];

export const DEFAULT_GROUPS = [
  {
    id: "family",
    name: "משפחה",
    priority: 100,
    rules: { closeness: ["family"] },
    wordingIds: ["family-warm", "family-shabbat"],
    defaultWordingId: "family-warm",
  },
  {
    id: "close-friends",
    name: "חברים קרובים",
    priority: 80,
    rules: { closeness: ["close-friend"] },
    wordingIds: ["close-personal", "close-short", "close-shabbat"],
    defaultWordingId: "close-personal",
  },
  {
    id: "friends",
    name: "חברים",
    priority: 60,
    rules: { closeness: ["friend"] },
    wordingIds: ["friend-warm", "friend-alt", "friend-shabbat"],
    defaultWordingId: "friend-warm",
  },
  {
    id: "work",
    name: "עבודה",
    priority: 50,
    rules: { closeness: ["work"] },
    wordingIds: ["work-polite", "work-shabbat"],
    defaultWordingId: "work-polite",
  },
  {
    id: "acquaintances",
    name: "מכרים",
    priority: 40,
    rules: { closeness: ["acquaintance"] },
    wordingIds: ["acq-reserved", "acq-shabbat"],
    defaultWordingId: "acq-reserved",
  },
];

export function defaultConfig() {
  return {
    type: CONFIG_TYPE,
    version: VERSION,
    videoUrl: VIDEO_URL,
    dimensions: structuredClone(DEFAULT_DIMENSIONS),
    groups: structuredClone(DEFAULT_GROUPS),
    wordings: structuredClone(DEFAULT_WORDINGS),
    quickTemplates: [],
  };
}

export function uid(prefix = "id") {
  const rnd = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rnd}`;
}

/* ----------------------------- phones ----------------------------- */

export function normalizePhone(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[^\d+]/g, "");
  if (!s) return null;
  if (s.startsWith("+")) s = s.slice(1);
  if (s.startsWith("00")) s = s.slice(2);
  // accidentally doubled 972
  if (s.startsWith("972972")) s = s.slice(3);
  if (s.startsWith("972")) {
    const rest = s.slice(3);
    if (rest.length >= 8 && rest.length <= 10 && /^\d+$/.test(rest)) return "972" + rest;
    return null;
  }
  if (s.startsWith("0")) {
    const rest = s.slice(1);
    if (rest.length >= 8 && rest.length <= 9 && /^\d+$/.test(rest)) return "972" + rest;
    return null;
  }
  // 9 digits, Israeli national without leading 0 (mobile 5xxxxxxxx, landline 2-9)
  if (/^[2-9]\d{8}$/.test(s)) return "972" + s;
  // 8-digit landline without area? too ambiguous, reject
  return null;
}

export function formatPhoneDisplay(e164) {
  if (!e164) return "";
  const s = String(e164);
  if (s.startsWith("972") && s.length >= 12) {
    const rest = s.slice(3);
    if (rest.startsWith("5") && rest.length === 9) {
      return `0${rest.slice(0, 2)}-${rest.slice(2, 5)}-${rest.slice(5)}`;
    }
    return `0${rest.slice(0, 1)}-${rest.slice(1, 4)}-${rest.slice(4)}`;
  }
  return "+" + s;
}

export function waMeUrl(phone, text) {
  const num = String(phone).replace(/[^\d]/g, "");
  const q = encodeURIComponent(text ?? "");
  return `https://wa.me/${num}?text=${q}`;
}

/* ----------------------------- names / gender ----------------------------- */

export function firstNameOf(name) {
  if (!name) return "";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < parts.length && NAME_PREFIXES.has(parts[i].replace(/[.,]/g, ""))) i++;
  return parts[i] || parts[0] || "";
}

export function guessGender(name) {
  const first = firstNameOf(name).replace(/[\"'״׳.,]/g, "");
  if (!first) return "unknown";
  if (UNISEX_NAMES.has(first) || UNISEX_NAMES.has(first.toLowerCase())) return "unknown";
  if (MALE_NAMES.has(first)) return "male";
  if (FEMALE_NAMES.has(first)) return "female";
  // English lowercase fallback
  const lower = first.toLowerCase();
  if (MALE_NAMES.has(lower)) return "male";
  if (FEMALE_NAMES.has(lower)) return "female";
  return "unknown";
}

/* ----------------------------- templates ----------------------------- */

export function applyTemplate(text, contact, videoUrl = VIDEO_URL) {
  const name = firstNameOf(contact?.name) || contact?.name || "";
  const gender = contact?.gender || "unknown";
  const url = videoUrl || VIDEO_URL;
  let out = String(text ?? "").replace(/\{שם\}/g, name);
  out = out.replace(/\{קישור\}/g, url);
  out = out.replace(/\{([^}/|\n]+?)\/([^}]+?)\}/g, (_, male, female) => {
    if (gender === "female") return female;
    if (gender === "male") return male;
    return `${male}/${female}`;
  });
  if (url && !out.includes(url)) {
    out = out.replace(/\s*$/, "") + "\n\n" + url;
  }
  return out;
}

export function wordingForContact(contact, config) {
  const group = groupForContact(contact, config);
  const wordings = config.wordings || [];
  const byId = Object.fromEntries(wordings.map((w) => [w.id, w]));
  const ids = (group?.wordingIds || []).filter((id) => byId[id]);
  const list = ids.map((id) => byId[id]);
  const preferShabbat = contact?.shabbat === "observant";
  if (!list.length) {
    const fallback = wordings.filter((w) => w.id === "general" || w.id === "general-shabbat");
    const pool = fallback.length ? fallback : wordings;
    const wording = preferShabbat
      ? (pool.find((w) => w.shabbatRespectful) || pool[0] || null)
      : (pool.find((w) => !w.shabbatRespectful) || pool[0] || null);
    return { group, wording, alternatives: pool };
  }
  if (contact?.wordingId && byId[contact.wordingId] && ids.includes(contact.wordingId)) {
    return { group, wording: byId[contact.wordingId], alternatives: list };
  }
  if (preferShabbat) {
    const respectful = list.find((w) => w.shabbatRespectful);
    if (respectful) return { group, wording: respectful, alternatives: list };
  }
  const def = group?.defaultWordingId && byId[group.defaultWordingId] && ids.includes(group.defaultWordingId)
    ? byId[group.defaultWordingId]
    : list.find((w) => !w.shabbatRespectful) || list[0];
  return { group, wording: def, alternatives: list };
}

export function messageForContact(contact, config) {
  if (contact?.messageOverride != null && contact.messageOverride !== "") {
    return contact.messageOverride;
  }
  const { wording } = wordingForContact(contact, config);
  return applyTemplate(wording?.text || "", contact, config.videoUrl || VIDEO_URL);
}

/* ----------------------------- groups ----------------------------- */

export function contactDim(contact, dimId) {
  if (!contact) return "unknown";
  if (dimId === "shabbat") return contact.shabbat || "unknown";
  if (dimId === "gender") return contact.gender || "unknown";
  if (dimId === "closeness") return contact.closeness || "";
  const extra = contact.dims || {};
  return extra[dimId] || "";
}

export function rulesMatch(contact, rules) {
  if (!rules || typeof rules !== "object") return false;
  const keys = Object.keys(rules).filter((k) => Array.isArray(rules[k]) && rules[k].length);
  if (!keys.length) return false;
  return keys.every((k) => rules[k].includes(contactDim(contact, k)));
}

export function groupForContact(contact, config) {
  const groups = [...(config?.groups || [])].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  if (contact?.groupOverride) {
    const forced = groups.find((g) => g.id === contact.groupOverride);
    if (forced) return forced;
  }
  for (const g of groups) {
    if (rulesMatch(contact, g.rules)) return g;
  }
  return null;
}

const CLOSENESS_WEIGHT = {
  family: 100,
  "close-friend": 80,
  friend: 60,
  work: 50,
  acquaintance: 40,
};

export function priorityScore(contact, config, shabbat) {
  const group = groupForContact(contact, config);
  let score = 0;
  score += (group?.priority ?? 10);
  score += (CLOSENESS_WEIGHT[contact?.closeness] ?? 15);
  if (contact?.relationNote) score += 8;
  if (contact?.note) score += 3;
  if (contact?.gender && contact.gender !== "unknown") score += 2;
  if (contact?.shabbat && contact.shabbat !== "unknown") score += 2;
  if (contact?.sentAt) score -= 1000;
  if (shabbat?.isShabbat && contact?.shabbat === "observant") score -= 5000;
  return score;
}

export function sortQueue(contacts, config, shabbat) {
  return [...contacts].sort((a, b) => {
    const sa = priorityScore(a, config, shabbat);
    const sb = priorityScore(b, config, shabbat);
    if (sb !== sa) return sb - sa;
    return (a.name || "").localeCompare(b.name || "", "he");
  });
}

/* ----------------------------- Shabbat (Jerusalem) ----------------------------- */

function sind(d) { return Math.sin((d * Math.PI) / 180); }
function cosd(d) { return Math.cos((d * Math.PI) / 180); }

function julianDateUTC(y, m, d, hour = 0) {
  return Date.UTC(y, m - 1, d, 0, 0, 0) / 86400000 + 2440587.5 + hour / 24;
}

function julianToDate(j) {
  return new Date((j - 2440587.5) * 86400000);
}

/**
 * Official sunrise/sunset (zenith 90.833°) after NOAA solar calculator.
 * lat/lon in degrees, lon east-positive. Returns UTC Date objects.
 */
export function sunTimes(year, month, day, lat = JERUSALEM.lat, lon = JERUSALEM.lon) {
  const jd0 = julianDateUTC(year, month, day, 0);

  function eqTimeAndDecl(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    let L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    if (L0 < 0) L0 += 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C =
      (1.914602 - T * (0.004817 + 0.000014 * T)) * sind(M) +
      (0.019993 - 0.000101 * T) * sind(2 * M) +
      0.000289 * sind(3 * M);
    const trueLong = L0 + C;
    const omega = 125.04 - 1934.136 * T;
    const lambda = trueLong - 0.00569 - 0.00478 * sind(omega);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * cosd(omega);
    const decl = Math.asin(sind(eps) * sind(lambda));
    const y = Math.tan(((eps * Math.PI) / 180) / 2) ** 2;
    const eqTime =
      4 * (180 / Math.PI) * (
        y * Math.sin((2 * L0 * Math.PI) / 180) -
        2 * e * sind(M) +
        4 * e * y * sind(M) * Math.cos((2 * L0 * Math.PI) / 180) -
        0.5 * y * y * Math.sin((4 * L0 * Math.PI) / 180) -
        1.25 * e * e * sind(2 * M)
      );
    return { eqTime, decl };
  }

  function hourAngle(decl) {
    const latR = (lat * Math.PI) / 180;
    const zenith = (90.833 * Math.PI) / 180;
    const cosH =
      (Math.cos(zenith) - Math.sin(latR) * Math.sin(decl)) /
      (Math.cos(latR) * Math.cos(decl));
    return Math.acos(Math.min(1, Math.max(-1, cosH))) * (180 / Math.PI);
  }

  function compute(offsetDays, kind) {
    const { eqTime, decl } = eqTimeAndDecl(jd0 + offsetDays);
    const ha = hourAngle(decl);
    // minutes from 00:00 UTC. lon east-positive.
    const minutes = kind === "set"
      ? 720 - 4 * (lon - ha) - eqTime
      : 720 - 4 * (lon + ha) - eqTime;
    return minutes / 1440; // fraction of day
  }

  let setFrac = compute(0.5, "set");
  let riseFrac = compute(0.5, "rise");
  setFrac = compute(setFrac, "set");
  riseFrac = compute(riseFrac, "rise");

  return {
    sunrise: julianToDate(jd0 + riseFrac),
    sunset: julianToDate(jd0 + setFrac),
    transit: julianToDate(jd0 + (riseFrac + setFrac) / 2),
  };
}

export function israelParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const map = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: +map.year,
    month: +map.month,
    day: +map.day,
    hour: +map.hour,
    minute: +map.minute,
    second: +map.second,
    weekday: weekdayMap[map.weekday] ?? 0,
  };
}

function israelWallToUtcGuess(y, m, d, hh, mm) {
  // Interpret a Jerusalem wall-clock time as a UTC instant via the offset that day.
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = israelParts(probe);
  // offset hours: when UTC is 12:00, Israel shows parts.hour
  const offsetH = parts.hour - 12;
  // careful around midnight, but 12:00 UTC is 14:00 or 15:00 in Israel always
  return new Date(Date.UTC(y, m - 1, d, hh - offsetH, mm, 0));
}

export function shabbatInfo(now = new Date()) {
  const p = israelParts(now);
  // Friday sunset (start) and Saturday sunset (end) for the relevant weekend.
  // If Sunday–Thursday, the upcoming Friday; if Fri/Sat, this weekend.
  let friY = p.year, friM = p.month, friD = p.day;
  const daysToFri = (5 - p.weekday + 7) % 7;
  const daysFromFri = (p.weekday - 5 + 7) % 7;
  // On Fri/Sat use this week's Friday; otherwise upcoming.
  const shift = (p.weekday === 5 || p.weekday === 6) ? -daysFromFri : daysToFri;
  const friUtcNoon = Date.UTC(p.year, p.month - 1, p.day, 12) + shift * 86400000;
  const fri = new Date(friUtcNoon);
  const fp = israelParts(fri);
  friY = fp.year; friM = fp.month; friD = fp.day;
  const satDate = new Date(Date.UTC(fp.year, fp.month - 1, fp.day, 12) + 86400000);
  const sp = israelParts(satDate);

  const friSun = sunTimes(friY, friM, friD);
  const satSun = sunTimes(sp.year, sp.month, sp.day);

  const START_BEFORE_MS = 60 * 60 * 1000; // 1 hour before sunset Friday
  const END_AFTER_MS = 45 * 60 * 1000; // 45 min after sunset Saturday
  const start = new Date(friSun.sunset.getTime() - START_BEFORE_MS);
  const end = new Date(satSun.sunset.getTime() + END_AFTER_MS);
  const isShabbat = now >= start && now < end;

  // Friday afternoon warning: Friday from 12:00 Israel until Shabbat start
  const fridayNoon = israelWallToUtcGuess(friY, friM, friD, 12, 0);
  const fridayAfternoon = now >= fridayNoon && now < start;

  return {
    isShabbat,
    fridayAfternoon,
    start,
    end,
    fridaySunset: friSun.sunset,
    saturdaySunset: satSun.sunset,
    nowParts: p,
  };
}

export function formatIsraelTime(date) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "numeric",
  }).format(date);
}

/* ----------------------------- vCard / CSV / paste ----------------------------- */

export function decodeQuotedPrintable(raw) {
  const soft = String(raw).replace(/=\r?\n/g, "");
  const bytes = [];
  for (let i = 0; i < soft.length; i++) {
    if (soft[i] === "=" && /[0-9A-Fa-f]{2}/.test(soft.slice(i + 1, i + 3))) {
      bytes.push(parseInt(soft.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(soft.charCodeAt(i) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

function decodeCharset(uint8, charset) {
  const cs = String(charset || "utf-8").toLowerCase().replace(/['"]/g, "");
  const map = {
    "utf-8": "utf-8",
    utf8: "utf-8",
    "windows-1255": "windows-1255",
    "iso-8859-8": "iso-8859-8",
    "iso-8859-8-i": "iso-8859-8",
    "iso-8859-1": "iso-8859-1",
    "windows-1252": "windows-1252",
  };
  const label = map[cs] || "utf-8";
  try {
    return new TextDecoder(label).decode(uint8);
  } catch {
    return new TextDecoder("utf-8").decode(uint8);
  }
}

function unfoldVcard(text) {
  // RFC 2425 line folding: CRLF + space/tab. Also QP soft breaks already handled later.
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "");
}

function parseVcardParams(raw) {
  const params = {};
  const parts = raw.split(";");
  const namePart = parts[0];
  const name = namePart.includes(".") ? namePart.slice(namePart.indexOf(".") + 1) : namePart;
  for (const p of parts.slice(1)) {
    if (!p) continue;
    const eq = p.indexOf("=");
    if (eq === -1) {
      const key = p.toUpperCase();
      params[key] = params[key] ? params[key] + "," + "TRUE" : "TRUE";
      // TYPE sometimes bare: TEL;CELL:
      if (!params.TYPE) params.TYPE = p;
      else params.TYPE += "," + p;
    } else {
      const k = p.slice(0, eq).toUpperCase();
      const v = p.slice(eq + 1).replace(/^"|"$/g, "");
      params[k] = params[k] ? params[k] + "," + v : v;
    }
  }
  return { name: name.toUpperCase(), params };
}

function decodeVcardValue(value, params) {
  const enc = (params.ENCODING || "").toUpperCase();
  const charset = params.CHARSET || "utf-8";
  if (enc.includes("QUOTED-PRINTABLE")) {
    return decodeCharset(decodeQuotedPrintable(value), charset);
  }
  if (enc.includes("BASE64") || enc.includes("B")) {
    try {
      const bin = atob(value.replace(/\s+/g, ""));
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return decodeCharset(bytes, charset);
    } catch {
      return value;
    }
  }
  // Some exporters set CHARSET without encoding; value is already Unicode text.
  return value;
}

export function parseVCard(text) {
  // Split only; do not unfold the whole file first — phone exports often
  // contain huge folded PHOTO lines that would freeze a 3,000+ contact list.
  const lines = String(text).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const cards = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (!line) continue;
    const colon0 = line.indexOf(":");
    const head0 = colon0 === -1 ? line : line.slice(0, colon0);
    const bare = (head0.includes(".") ? head0.slice(head0.indexOf(".") + 1) : head0);
    const propName = (bare.split(";")[0] || "").toUpperCase();
    if (propName === "PHOTO" || propName === "LOGO" || propName === "SOUND" || propName === "KEY") {
      while (i + 1 < lines.length && (lines[i + 1].startsWith(" ") || lines[i + 1].startsWith("\t"))) i++;
      continue;
    }
    while (i + 1 < lines.length && (lines[i + 1].startsWith(" ") || lines[i + 1].startsWith("\t"))) {
      line += lines[++i].slice(1);
    }
    const trimmed = line.trim();
    if (!trimmed) continue;
    const up = trimmed.toUpperCase();
    if (up === "BEGIN:VCARD") {
      current = { name: "", phones: [] };
      continue;
    }
    if (!current) continue;
    if (up === "END:VCARD") {
      if (current.phones.length || current.name) cards.push(current);
      current = null;
      continue;
    }
    if (propName !== "FN" && propName !== "N" && propName !== "TEL" && propName !== "NICKNAME") continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const { name, params } = parseVcardParams(line.slice(0, colon));
    const value = decodeVcardValue(line.slice(colon + 1), params);
    if (name === "FN") current.name = value.trim();
    else if (name === "NICKNAME" && !current.name) current.name = value.trim();
    else if (name === "N" && !current.name) {
      const bits = value.split(";");
      const given = (bits[1] || "").trim();
      const family = (bits[0] || "").trim();
      current.name = [given, family].filter(Boolean).join(" ").trim();
    } else if (name === "TEL") {
      const candidates = value.split(/[;,]/);
      for (const c of candidates) {
        const n = normalizePhone(c);
        if (n && !current.phones.includes(n)) current.phones.push(n);
      }
    }
  }
  return cards.map((c) => ({
    name: c.name || c.phones[0] || "",
    phones: c.phones,
  })).filter((c) => c.phones.length);
}

export function parseCSV(text) {
  const rows = parseCsvRows(String(text).replace(/^\uFEFF/, ""));
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  const lower = header.map((h) => h.toLowerCase());
  const nameIdx = findColumn(lower, [
    "name", "full name", "full name", "שם", "שם מלא", "display name",
  ]);
  const givenIdx = findColumn(lower, [
    "given name", "first name", "first", "שם פרטי",
  ]);
  const familyIdx = findColumn(lower, [
    "family name", "last name", "last", "שם משפחה",
  ]);
  const phoneIdxs = header
    .map((h, i) => ({ h: h.toLowerCase(), i }))
    .filter(({ h }) =>
      /phone|mobile|tel|cell|טלפון|נייד|פלאפון|whatsapp/.test(h) &&
      !/type|label|סוג|notes|note/.test(h)
    )
    .map(({ i }) => i);
  // Generic last-resort: any header containing "value" next to phone already caught.
  const out = [];
  for (const row of rows.slice(1)) {
    if (row.every((c) => !c || !c.trim())) continue;
    let name = "";
    if (nameIdx >= 0) name = (row[nameIdx] || "").trim();
    if (!name) {
      const g = givenIdx >= 0 ? (row[givenIdx] || "").trim() : "";
      const f = familyIdx >= 0 ? (row[familyIdx] || "").trim() : "";
      name = [g, f].filter(Boolean).join(" ");
    }
    const phones = [];
    for (const i of phoneIdxs) {
      const raw = row[i] || "";
      for (const piece of String(raw).split(/[|,;/]/)) {
        const n = normalizePhone(piece);
        if (n && !phones.includes(n)) phones.push(n);
      }
    }
    // If no phone columns matched, scan every cell
    if (!phones.length) {
      for (const cell of row) {
        const n = normalizePhone(cell);
        if (n && !phones.includes(n)) phones.push(n);
      }
    }
    if (phones.length) out.push({ name: name || phones[0], phones });
  }
  return out;
}

function findColumn(lowerHeaders, aliases) {
  for (const a of aliases) {
    const i = lowerHeaders.indexOf(a);
    if (i >= 0) return i;
  }
  return -1;
}

export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;
  const s = text;
  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
      i++;
      continue;
    }
    cell += ch;
    i++;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function parsePaste(text) {
  const lines = String(text).replace(/^\uFEFF/, "").split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^name\s*[,;\t]/i.test(t) || t === "שם,טלפון") continue;
    let name = "";
    let phoneRaw = "";
    if (t.includes("\t")) {
      const [a, b] = t.split("\t");
      name = a.trim();
      phoneRaw = (b || "").trim();
    } else if (t.includes(",")) {
      // split on last comma-ish group: "שם, 050-..." or "Last, First, 050"
      const m = t.match(/^(.*?)[ ,;]+([+0-9][+0-9\s\-().]{7,})$/);
      if (m) {
        name = m[1].replace(/[,"]+$/g, "").trim();
        phoneRaw = m[2];
      } else {
        const parts = t.split(",");
        phoneRaw = parts.pop();
        name = parts.join(",").trim();
      }
    } else {
      const m = t.match(/^(.*?)[\s]+([+0-9][+0-9\s\-().]{7,})$/);
      if (m) {
        name = m[1].trim();
        phoneRaw = m[2];
      } else {
        // maybe just a phone
        phoneRaw = t;
      }
    }
    const n = normalizePhone(phoneRaw);
    if (n) out.push({ name: name || n, phones: [n] });
  }
  return out;
}

export function detectAndParse(filename, text) {
  const lower = (filename || "").toLowerCase();
  if (lower.endsWith(".vcf") || lower.endsWith(".vcard") || /^\s*BEGIN:VCARD/im.test(text)) {
    return { kind: "vcf", contacts: parseVCard(text) };
  }
  if (lower.endsWith(".csv") || looksLikeCsv(text)) {
    return { kind: "csv", contacts: parseCSV(text) };
  }
  return { kind: "paste", contacts: parsePaste(text) };
}

function looksLikeCsv(text) {
  const first = text.split(/\r?\n/).find((l) => l.trim());
  if (!first) return false;
  return /name|given|phone|tel|שם|טלפון/i.test(first) && first.includes(",");
}

export function incomingToContact(raw, now = new Date().toISOString()) {
  const phone = raw.phones[0];
  const name = (raw.name || "").trim() || phone;
  const gender = guessGender(name);
  return {
    id: uid("c"),
    name,
    phone,
    phones: [...raw.phones],
    shabbat: "unknown",
    gender,
    genderSource: gender === "unknown" ? "none" : "guess",
    closeness: "",
    relationNote: "",
    note: "",
    customTags: [],
    dims: {},
    groupOverride: null,
    wordingId: null,
    messageOverride: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function mergeIncoming(existing, incoming) {
  const now = new Date().toISOString();
  const byPhone = new Map();
  for (const c of existing) {
    for (const p of c.phones || [c.phone]) byPhone.set(p, c);
  }
  const added = [];
  const skipped = [];
  for (const raw of incoming) {
    const phones = raw.phones || [];
    const hit = phones.map((p) => byPhone.get(p)).find(Boolean);
    if (hit) {
      const set = new Set([...(hit.phones || [hit.phone]), ...phones]);
      hit.phones = [...set];
      if (!hit.phone) hit.phone = phones[0];
      if (raw.name && raw.name !== hit.name && !hit.note?.includes(raw.name)) {
        if (!hit.name || hit.name === hit.phone) hit.name = raw.name;
      }
      hit.updatedAt = now;
      skipped.push({ name: raw.name, phone: phones[0], reason: "duplicate" });
    } else {
      const c = incomingToContact(raw, now);
      existing.push(c);
      for (const p of c.phones) byPhone.set(p, c);
      added.push(c);
    }
  }
  return { contacts: existing, added, skipped };
}

/* ----------------------------- config import ----------------------------- */

export function normalizeConfig(input) {
  const base = defaultConfig();
  if (!input || typeof input !== "object") return base;
  const src = input.config && input.type === BACKUP_TYPE ? input.config : input;
  if (src.videoUrl && typeof src.videoUrl === "string") base.videoUrl = src.videoUrl.trim() || VIDEO_URL;
  if (Array.isArray(src.dimensions) && src.dimensions.length) {
    const builtins = new Set(DEFAULT_DIMENSIONS.map((d) => d.id));
    const seen = new Set();
    const dims = [];
    for (const d of src.dimensions) {
      if (!d || !d.id || seen.has(d.id)) continue;
      seen.add(d.id);
      const options = Array.isArray(d.options)
        ? d.options.filter((o) => o && o.id && o.label)
        : [];
      if (!options.length) continue;
      dims.push({
        id: String(d.id),
        name: String(d.name || d.id),
        builtin: builtins.has(d.id) || !!d.builtin,
        locked: !!d.locked || d.id === "shabbat" || d.id === "gender",
        options,
      });
    }
    // Ensure builtin dimensions exist
    for (const b of DEFAULT_DIMENSIONS) {
      if (!dims.some((d) => d.id === b.id)) dims.unshift(structuredClone(b));
    }
    base.dimensions = dims;
  }
  if (Array.isArray(src.wordings) && src.wordings.length) {
    const wordings = [];
    const seen = new Set();
    for (const w of src.wordings) {
      if (!w || !w.id || seen.has(w.id) || typeof w.text !== "string") continue;
      seen.add(w.id);
      wordings.push({
        id: String(w.id),
        name: String(w.name || "ניסוח"),
        shabbatRespectful: !!w.shabbatRespectful,
        text: w.text,
      });
    }
    if (wordings.length) base.wordings = wordings;
  }
  if (Array.isArray(src.groups) && src.groups.length) {
    const groups = [];
    const seen = new Set();
    const wordingIds = new Set(base.wordings.map((w) => w.id));
    for (const g of src.groups) {
      if (!g || !g.id || seen.has(g.id)) continue;
      seen.add(g.id);
      const rules = {};
      if (g.rules && typeof g.rules === "object") {
        for (const [k, v] of Object.entries(g.rules)) {
          if (Array.isArray(v) && v.length) rules[k] = v.map(String);
        }
      }
      groups.push({
        id: String(g.id),
        name: String(g.name || "קבוצה"),
        priority: Number.isFinite(+g.priority) ? +g.priority : 10,
        rules,
        wordingIds: (Array.isArray(g.wordingIds) ? g.wordingIds : []).filter((id) => wordingIds.has(id)),
        defaultWordingId: g.defaultWordingId && wordingIds.has(g.defaultWordingId) ? g.defaultWordingId : null,
      });
    }
    if (groups.length) base.groups = groups;
  }
  if (Array.isArray(src.quickTemplates)) {
    const tpls = [];
    const seen = new Set();
    for (const raw of src.quickTemplates) {
      const t = sanitizeQuickTemplate(raw);
      if (!t || seen.has(t.id)) continue;
      seen.add(t.id);
      tpls.push(t);
    }
    base.quickTemplates = tpls;
  }
  return base;
}

export function extractContactsPayload(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.contacts)) return input.contacts;
  return [];
}

export function sanitizeContact(c) {
  if (!c || typeof c !== "object") return null;
  const phones = [];
  const rawPhones = Array.isArray(c.phones) ? c.phones : (c.phone ? [c.phone] : []);
  for (const p of rawPhones) {
    const n = normalizePhone(p) || (typeof p === "string" && p.startsWith("972") ? p : null);
    if (n && !phones.includes(n)) phones.push(n);
  }
  if (!phones.length) return null;
  const name = String(c.name || phones[0]).trim();
  const gender = ["male", "female", "unknown"].includes(c.gender) ? c.gender : guessGender(name);
  const shabbat = ["observant", "not", "unknown"].includes(c.shabbat) ? c.shabbat : "unknown";
  return {
    id: typeof c.id === "string" && c.id ? c.id : uid("c"),
    name,
    phone: phones[0],
    phones,
    shabbat,
    gender,
    genderSource: c.genderSource === "manual" ? "manual" : (gender === "unknown" ? "none" : (c.genderSource || "guess")),
    closeness: typeof c.closeness === "string" ? c.closeness : "",
    relationNote: typeof c.relationNote === "string" ? c.relationNote : "",
    note: typeof c.note === "string" ? c.note : "",
    customTags: Array.isArray(c.customTags) ? c.customTags.map(String).filter(Boolean) : [],
    dims: c.dims && typeof c.dims === "object" ? { ...c.dims } : {},
    groupOverride: c.groupOverride || null,
    wordingId: c.wordingId || null,
    messageOverride: typeof c.messageOverride === "string" ? c.messageOverride : null,
    sentAt: c.sentAt || null,
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString(),
  };
}

export function mergeConfigWordings(config, incoming) {
  return normalizeConfig({ ...config, ...incoming, type: CONFIG_TYPE });
}


/* ----------------------------- search (Hebrew, fuzzy, fast) ----------------------------- */

const FINAL_LETTERS = { "ם": "מ", "ן": "נ", "ץ": "צ", "ף": "פ", "ך": "כ" };

export function normalizeSearch(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[םןץףך]/g, (c) => FINAL_LETTERS[c] || c)
    .replace(/[״"׳'`]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function buildSearchIndex(contacts) {
  return (contacts || []).map((c) => {
    const phones = (c.phones || [c.phone]).filter(Boolean).map(String);
    const extra = [c.relationNote, c.note, ...(c.customTags || [])].filter(Boolean).join(" ");
    const displayPhones = phones.map((p) => formatPhoneDisplay(p));
    const digitForms = [];
    for (const p of phones) {
      const d = String(p).replace(/\D/g, "");
      digitForms.push(d);
      if (d.startsWith("972")) {
        digitForms.push("0" + d.slice(3), d.slice(3));
      }
    }
    const hay = normalizeSearch([c.name, extra, ...displayPhones, ...digitForms].join(" "));
    return {
      id: c.id,
      name: c.name || "",
      phone: c.phone,
      phones,
      displayPhone: formatPhoneDisplay(c.phone),
      hay,
      tokens: hay.split(" ").filter(Boolean),
      nameNorm: normalizeSearch(c.name || ""),
      digits: digitForms.join(" "),
    };
  });
}

function compactSubsequence(hay, q) {
  // true if q's chars appear in order with a reasonably tight span
  let j = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < hay.length && j < q.length; i++) {
    if (hay[i] === q[j]) {
      if (first < 0) first = i;
      last = i;
      j++;
    }
  }
  if (j < q.length) return false;
  return (last - first + 1) <= q.length + 2;
}

export function searchContacts(index, query, limit = 15) {
  const raw = String(query ?? "").trim();
  if (!raw || !index?.length) return [];
  const qNorm = normalizeSearch(raw);
  const qDigits = raw.replace(/\D/g, "");
  const qTokens = qNorm.split(" ").filter(Boolean);
  const out = [];
  for (const e of index) {
    let score = 0;
    if (qDigits.length >= 3 && e.digits.includes(qDigits)) {
      score = Math.max(score, e.digits.endsWith(qDigits) ? 90 : 75);
    }
    if (qNorm) {
      if (e.nameNorm === qNorm) score = Math.max(score, 220);
      else if (e.nameNorm.startsWith(qNorm)) score = Math.max(score, 200);
      else if (e.tokens.some((t) => t.startsWith(qNorm))) score = Math.max(score, 170);
      else if (e.hay.startsWith(qNorm) || e.hay.includes(" " + qNorm)) score = Math.max(score, 140);
      else if (e.hay.includes(qNorm)) score = Math.max(score, 120);
      else if (qTokens.length > 1 && qTokens.every((qt) => e.tokens.some((t) => t.startsWith(qt) || t.includes(qt)))) {
        score = Math.max(score, 150);
      } else if (qNorm.length >= 3 && compactSubsequence(e.nameNorm, qNorm)) {
        score = Math.max(score, 60);
      }
    }
    if (score > 0) out.push({ entry: e, score });
  }
  out.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name, "he"));
  return out.slice(0, limit).map((r) => ({ ...r.entry, score: r.score }));
}

/* ----------------------------- scheduled messages / calendar ----------------------------- */

export function sanitizeScheduled(item) {
  if (!item || typeof item !== "object") return null;
  const phone = normalizePhone(item.phone) || (typeof item.phone === "string" && item.phone.startsWith("972") ? item.phone : null);
  if (!phone) return null;
  const at = Date.parse(item.at);
  if (!Number.isFinite(at)) return null;
  return {
    id: typeof item.id === "string" && item.id ? item.id : uid("s"),
    contactId: item.contactId || null,
    name: String(item.name || formatPhoneDisplay(phone)),
    phone,
    message: String(item.message || ""),
    at: new Date(at).toISOString(),
    createdAt: item.createdAt || new Date().toISOString(),
    notified: !!item.notified,
    sentAt: item.sentAt || null,
  };
}

export function scheduledDue(items, now = new Date()) {
  const t = now.getTime();
  return (items || []).filter((s) => !s.sentAt && Date.parse(s.at) <= t);
}

export function scheduledUpcoming(items, now = new Date()) {
  const t = now.getTime();
  return (items || [])
    .filter((s) => !s.sentAt && Date.parse(s.at) > t)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

function icsEscape(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsStamp(date) {
  return new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildIcs(item) {
  const start = new Date(item.at);
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  const url = waMeUrl(item.phone, item.message || "");
  const summary = `לשלוח הודעה ל${item.name || formatPhoneDisplay(item.phone)}`;
  const desc = [
    "השליחה עצמה דורשת לחיצה שלך — פתח את הקישור כדי לפתוח וואטסאפ עם ההודעה.",
    "",
    item.message || "",
    "",
    url,
  ].join("\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amitai Share//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${(item.id || uid("s")).replace(/[^A-Za-z0-9_.-]/g, "")}@amitai-share`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return ics;
}

export function sanitizeRecent(item) {
  if (!item || typeof item !== "object") return null;
  const phone = normalizePhone(item.phone) || (typeof item.phone === "string" && item.phone.startsWith("972") ? item.phone : null);
  if (!phone) return null;
  return {
    id: item.id || null,
    name: String(item.name || formatPhoneDisplay(phone)),
    phone,
    at: item.at || new Date().toISOString(),
  };
}

export function pushRecent(list, entry, limit = 12) {
  const item = sanitizeRecent(entry);
  if (!item) return list || [];
  const rest = (list || []).filter((r) => r.phone !== item.phone);
  return [item, ...rest].slice(0, limit);
}

export function sanitizeQuickTemplate(t) {
  if (!t || typeof t !== "object" || typeof t.text !== "string" || !t.text.trim()) return null;
  return {
    id: typeof t.id === "string" && t.id ? t.id : uid("t"),
    name: String(t.name || "תבנית").trim() || "תבנית",
    text: t.text,
  };
}

/* ----------------------------- recommendations ----------------------------- */

export const RECS_TYPE = "amitai-recs";

export const LEVEL_LABELS = {
  "א": "משפחה",
  "ב": "הכי קרובים",
  "ג": "חברים טובים",
  "ד": "חברים",
  "ה": "מכרים",
  "ו": "מכבדים",
};

export function recIsSent(person) {
  return !!(person && (person.sentAt || person.sent === true));
}

export function sanitizeRec(item) {
  if (!item || typeof item !== "object") return null;
  const name = String(item.name || "").trim();
  if (!name) return null;
  const phone = normalizePhone(item.phone) || "";
  const shabbat = ["observant", "not", "unknown"].includes(item.shabbat) ? item.shabbat : "unknown";
  const gender = ["male", "female", "unknown"].includes(item.gender) ? item.gender : "unknown";
  const priority = Number.isFinite(Number(item.priority)) ? Number(item.priority) : 0;
  const parsedAt = item.sentAt && Number.isFinite(Date.parse(item.sentAt)) ? item.sentAt : null;
  const explicitSent = item.sent === true || item.sent === "true" || item.sent === 1;
  const explicitUnsent = item.sent === false || item.sent === "false" || item.sent === 0;
  let sentAt = parsedAt;
  if (explicitUnsent) sentAt = null;
  else if (explicitSent && !sentAt) sentAt = new Date().toISOString();
  return {
    id: typeof item.id === "string" && item.id ? item.id : uid("rec"),
    name,
    phone,
    priority,
    level: String(item.level || "").trim(),
    circle: String(item.circle || "").trim(),
    notes: String(item.notes || "").trim(),
    message: String(item.message ?? ""),
    gender,
    shabbat,
    sent: !!sentAt,
    sentAt,
  };
}

export function extractRecsPayload(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.people)) return input.people;
  return [];
}

export function normalizeRecs(input) {
  const people = extractRecsPayload(input).map(sanitizeRec).filter(Boolean);
  return { type: RECS_TYPE, version: 1, people };
}

export function mergeRecs(existing, incoming) {
  const byId = new Map((existing || []).map((p) => [p.id, p]));
  return (incoming || []).map((raw) => {
    const p = sanitizeRec(raw);
    if (!p) return null;
    const old = byId.get(p.id);
    if (!old) return p;
    return {
      ...p,
      phone: p.phone || old.phone || "",
      message: p.message || old.message || "",
      sentAt: old.sentAt || p.sentAt || null,
      sent: !!(old.sentAt || p.sentAt),
      shabbat: p.shabbat !== "unknown" ? p.shabbat : (old.shabbat || "unknown"),
      gender: p.gender !== "unknown" ? p.gender : (old.gender || "unknown"),
    };
  }).filter(Boolean);
}

export function recIsHeld(person, shabbat) {
  return !!(shabbat?.isShabbat && person?.shabbat === "observant" && !recIsSent(person));
}

export function sortRecs(people, shabbat) {
  return [...(people || [])].sort((a, b) => {
    const aSent = recIsSent(a);
    const bSent = recIsSent(b);
    if (aSent !== bSent) return aSent ? 1 : -1;
    const aHold = recIsHeld(a, shabbat);
    const bHold = recIsHeld(b, shabbat);
    if (aHold !== bHold) return aHold ? 1 : -1;
    if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
    return (a.name || "").localeCompare(b.name || "", "he");
  });
}

export function partitionRecs(people, shabbat) {
  const ready = [];
  const held = [];
  const sent = [];
  for (const p of sortRecs(people, shabbat)) {
    if (recIsSent(p)) sent.push(p);
    else if (recIsHeld(p, shabbat)) held.push(p);
    else ready.push(p);
  }
  return { ready, held, sent };
}

export function recLevelLabel(person) {
  return LEVEL_LABELS[person?.level] || String(person?.level || "").trim() || "";
}

export function recReasonTags(person) {
  const tags = [];
  const circle = String(person?.circle || "").trim();
  const level = recLevelLabel(person);
  if (circle) tags.push(circle);
  if (level && level !== circle) tags.push(level);
  return tags;
}

export function recPrimaryTag(person) {
  return recReasonTags(person)[0] || "";
}

export function recPreview(message) {
  return String(message || "").replace(/\s+/g, " ").trim();
}

export function resolveRecPhone(person, index) {
  if (person?.phone) return person.phone;
  if (!person?.name || !index?.length) return "";
  const hits = searchContacts(index, person.name, 6);
  const strong = hits.filter((h) => h.score >= 170 && h.phone);
  if (strong.length === 1) return strong[0].phone;
  return "";
}

export function bytesToBase64url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let b64;
  if (typeof Buffer !== "undefined") {
    b64 = Buffer.from(arr).toString("base64");
  } else {
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < arr.length; i += chunk) {
      bin += String.fromCharCode(...arr.subarray(i, i + chunk));
    }
    b64 = btoa(bin);
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64urlToBytes(s) {
  const str = String(s || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!str) return new Uint8Array();
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzipBytes(bytes) {
  if (typeof CompressionStream === "function") {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const { gzipSync } = await import("node:zlib");
  return new Uint8Array(gzipSync(bytes));
}

async function gunzipBytes(bytes) {
  if (typeof DecompressionStream === "function") {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const { gunzipSync } = await import("node:zlib");
  return new Uint8Array(gunzipSync(bytes));
}

export function recsHashPayload(hash) {
  const raw = String(hash || "");
  const trimmed = raw.startsWith("#") ? raw.slice(1) : raw;
  if (!trimmed) return "";
  const parts = trimmed.split("&");
  for (const part of parts) {
    const i = part.indexOf("=");
    const key = i < 0 ? part : part.slice(0, i);
    if (key === "recs") return decodeURIComponent((i < 0 ? "" : part.slice(i + 1)).replace(/\+/g, "%20"));
  }
  return "";
}

export async function encodeRecsFragment(data, { gzip = true } = {}) {
  const payload = normalizeRecs(data);
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const out = gzip ? await gzipBytes(bytes) : bytes;
  return bytesToBase64url(out);
}

export async function decodeRecsFragment(hashOrPayload) {
  const raw = recsHashPayload(hashOrPayload) || String(hashOrPayload || "").replace(/^#/, "");
  if (!raw) return null;
  const bytes = base64urlToBytes(raw);
  if (!bytes.length) return null;
  let textBytes = bytes;
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    textBytes = await gunzipBytes(bytes);
  }
  const text = new TextDecoder().decode(textBytes);
  const data = JSON.parse(text);
  if (data && typeof data === "object" && data.type && data.type !== RECS_TYPE) {
    throw new Error("unexpected recs type");
  }
  return normalizeRecs(data);
}
