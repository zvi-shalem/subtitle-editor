import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizePhone,
  parseVCard,
  parseCSV,
  parsePaste,
  applyTemplate,
  guessGender,
  firstNameOf,
  sunTimes,
  shabbatInfo,
  waMeUrl,
  defaultConfig,
  wordingForContact,
  messageForContact,
  groupForContact,
  mergeIncoming,
  incomingToContact,
  normalizeConfig,
  CONFIG_TYPE,
  VIDEO_URL,
  buildSearchIndex,
  searchContacts,
  normalizeSearch,
  scheduledDue,
  scheduledUpcoming,
  buildIcs,
  pushRecent,
  sanitizeRec,
  normalizeRecs,
  mergeRecs,
  sortRecs,
  partitionRecs,
  recIsSent,
  recIsHeld,
  encodeRecsFragment,
  decodeRecsFragment,
  recsHashPayload,
  RECS_TYPE,
} from "./core.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("ok ", name);
  } catch (err) {
    failed++;
    console.error("FAIL", name, err.message);
  }
}

check("phone: Israeli formats", () => {
  const cases = {
    "050-123-4567": "972501234567",
    "0501234567": "972501234567",
    "+972 50-123-4567": "972501234567",
    "972501234567": "972501234567",
    "00972501234567": "972501234567",
    "501234567": "972501234567",
    "02-1234567": "97221234567",
    "  054-111-2222  ": "972541112222",
  };
  for (const [input, want] of Object.entries(cases)) {
    assert.equal(normalizePhone(input), want, input);
  }
});

check("gender guess + prefixes", () => {
  assert.equal(guessGender("יוסי כהן"), "male");
  assert.equal(guessGender("שירה לוי"), "female");
  assert.equal(firstNameOf("הרב דוד כהן"), "דוד");
  assert.equal(guessGender("הרב דוד כהן"), "male");
  assert.equal(guessGender("טל כהן"), "unknown");
  assert.equal(guessGender("מיכל אברהם"), "female");
  assert.equal(guessGender("עמית שלום"), "unknown");
});

check("gendered templates", () => {
  const fem = applyTemplate("היי {שם}, {תראה/תראי} {יקר/יקרה}", { name: "שירה לוי", gender: "female" }, VIDEO_URL);
  assert.match(fem, /^היי שירה, תראי יקרה/);
  assert.ok(fem.includes(VIDEO_URL));
  const male = applyTemplate("{שם} {יקר/יקרה}", { name: "יוסי", gender: "male" }, VIDEO_URL);
  assert.match(male, /^יוסי יקר/);
  const unk = applyTemplate("{תראה/תראי}", { name: "טל", gender: "unknown" }, VIDEO_URL);
  assert.match(unk, /תראה\/תראי/);
});

check("vCard quoted-printable Hebrew", () => {
  const vcf = `BEGIN:VCARD
VERSION:2.1
N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D7=9B=D7=94=D7=9F;=D7=99=D7=95=D7=A1=D7=99;;;
FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D7=99=D7=95=D7=A1=D7=99 =D7=9B=D7=94=D7=9F
TEL;CELL:050-123-4567
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:מיכל לוי
TEL;TYPE=CELL:+972-54-999-1111
END:VCARD
`;
  const cards = parseVCard(vcf);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].name, "יוסי כהן");
  assert.deepEqual(cards[0].phones, ["972501234567"]);
  assert.equal(cards[1].name, "מיכל לוי");
  assert.deepEqual(cards[1].phones, ["972549991111"]);
});

check("Google CSV Hebrew", () => {
  const csv = `Name,Given Name,Family Name,Phone 1 - Value,Phone 2 - Value
"דנה כהן",דנה,כהן,052-333-4444,
"הרב דוד לוי",דוד,לוי,+972 50-111-2222,
`;
  const rows = parseCSV(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "דנה כהן");
  assert.deepEqual(rows[0].phones, ["972523334444"]);
  assert.equal(rows[1].name, "הרב דוד לוי");
  assert.deepEqual(rows[1].phones, ["972501112222"]);
});

check("paste lines", () => {
  const rows = parsePaste("שירה לוי, 053-111-2222\nיוסי כהן 0501234567");
  assert.equal(rows[0].name, "שירה לוי");
  assert.deepEqual(rows[0].phones, ["972531112222"]);
  assert.equal(rows[1].name, "יוסי כהן");
});

check("dedupe by phone on merge", () => {
  const first = mergeIncoming([], parsePaste("יוסי, 050-123-4567"));
  assert.equal(first.added.length, 1);
  const second = mergeIncoming(first.contacts, parsePaste("יוסי כהן, +972501234567"));
  assert.equal(second.added.length, 0);
  assert.equal(second.skipped.length, 1);
  assert.equal(second.contacts.length, 1);
});

check("wa.me URL encoding", () => {
  const text = "היי יוסי\n\nhttps://youtu.be/CodJ6R60w9M";
  const url = waMeUrl("972501234567", text);
  assert.equal(url, "https://wa.me/972501234567?text=" + encodeURIComponent(text));
  assert.ok(url.includes("%D7%94%D7%99%D7%99"));
  assert.ok(url.includes("972501234567"));
});

check("Jerusalem sunset accuracy", () => {
  const june = sunTimes(2024, 6, 21);
  const israel = (d) => d.toLocaleString("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  assert.equal(israel(june.sunset), "19:47");
  const dec = sunTimes(2024, 12, 21);
  assert.equal(israel(dec.sunset), "16:39");
});

check("Shabbat window conservative", () => {
  const fridayNight = shabbatInfo(new Date("2026-11-13T20:40:00+02:00"));
  assert.equal(fridayNight.isShabbat, true);
  const fridayNoon = shabbatInfo(new Date("2026-11-13T12:00:00+02:00"));
  assert.equal(fridayNoon.isShabbat, false);
  assert.equal(fridayNoon.fridayAfternoon, true);
  const sunday = shabbatInfo(new Date("2026-11-15T10:00:00+02:00"));
  assert.equal(sunday.isShabbat, false);
  // start is ~1h before Friday sunset 16:40 → ~15:40
  const startIL = fridayNight.start.toLocaleString("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  assert.equal(startIL, "15:40");
});

check("group matching + shabbat wording", () => {
  const cfg = defaultConfig();
  const familyObs = incomingToContact({ name: "יוסי כהן", phones: ["972501234567"] });
  familyObs.closeness = "family";
  familyObs.shabbat = "observant";
  familyObs.gender = "male";
  assert.equal(groupForContact(familyObs, cfg).id, "family");
  assert.equal(wordingForContact(familyObs, cfg).wording.id, "family-shabbat");
  const msg = messageForContact(familyObs, cfg);
  assert.ok(msg.includes("יוסי"));
  assert.ok(msg.includes("יקר"));
  assert.ok(msg.includes(VIDEO_URL));
  assert.ok(!msg.includes("סטנדאפ"));
  const friend = { ...familyObs, closeness: "friend", shabbat: "not" };
  assert.equal(groupForContact(friend, cfg).id, "friends");
  assert.equal(wordingForContact(friend, cfg).wording.shabbatRespectful, false);
});

check("config import is separate and round-trips", () => {
  const cfg = defaultConfig();
  cfg.groups.push({
    id: "army",
    name: "צבא",
    priority: 70,
    rules: { closeness: ["friend"] },
    wordingIds: ["friend-warm"],
    defaultWordingId: "friend-warm",
  });
  const json = JSON.parse(JSON.stringify({ type: CONFIG_TYPE, ...cfg }));
  const back = normalizeConfig(json);
  assert.ok(back.groups.some((g) => g.id === "army" && g.name === "צבא"));
  assert.equal(back.videoUrl, VIDEO_URL);
});

check("no network APIs in shipped source", () => {
  for (const file of ["core.js", "app.js", "index.html"]) {
    const src = fs.readFileSync(path.join(dir, file), "utf8");
    assert.doesNotMatch(src, /סטנדאפ/);
    assert.doesNotMatch(src, /\bfetch\s*\(/);
    assert.doesNotMatch(src, /XMLHttpRequest/);
    assert.doesNotMatch(src, /sendBeacon/);
    assert.doesNotMatch(src, /supabase/i);
    assert.doesNotMatch(src, /google-analytics|gtag\(|googletagmanager/i);
    assert.doesNotMatch(src, /navigator\.sendBeacon/);
  }
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.match(html, /name="robots" content="noindex/);
  assert.match(html, /connect-src 'none'/);
});


check("Hebrew fuzzy search matches descriptive words and finals", () => {
  const contacts = [
    incomingToContact({ name: "יוסי כהן דוד מצד אמא", phones: ["972501234567"] }),
    incomingToContact({ name: "שירה לוי עבודה", phones: ["972549991111"] }),
    incomingToContact({ name: "מיכל אברהם", phones: ["972523334444"] }),
  ];
  contacts[0].relationNote = "דוד מצד אמא";
  const idx = buildSearchIndex(contacts);
  const byName = (q) => searchContacts(idx, q).map((r) => r.name);
  assert.ok(byName("יוס").some((n) => n.startsWith("יוסי")));
  assert.ok(byName("כהן").some((n) => n.includes("כהן")));
  assert.ok(byName("דוד").some((n) => n.includes("יוסי")));
  assert.ok(byName("אמא").some((n) => n.includes("יוסי")));
  assert.ok(byName("עבודה").some((n) => n.includes("שירה")));
  assert.equal(normalizeSearch("שלום"), normalizeSearch("שלומ")); // ם → מ
  assert.ok(byName("0501234567")[0].includes("יוסי"));
  assert.ok(!byName("zzzz").length);
});

check("vCard import skips PHOTO and stays fast at ~3800 contacts", () => {
  const photo = ("/9j/4AAQ" + "A").repeat(80);
  const foldedPhoto = photo.match(/.{1,70}/g).map((l, i) => (i ? " " + l : l)).join("\n");
  const cards = [];
  for (let i = 0; i < 3800; i++) {
    const n = String(i).padStart(4, "0");
    cards.push(`BEGIN:VCARD
VERSION:3.0
FN:איש קשר ${n} תיאור משפחה
TEL;TYPE=CELL:050${String(1000000 + i).slice(-7)}
PHOTO;ENCODING=b;TYPE=JPEG:
${foldedPhoto}
END:VCARD`);
  }
  const vcf = cards.join("\n");
  const t0 = Date.now();
  const parsed = parseVCard(vcf);
  const parseMs = Date.now() - t0;
  assert.equal(parsed.length, 3800, "all cards with phones");
  assert.equal(parsed[0].name, "איש קשר 0000 תיאור משפחה");
  assert.equal(parsed[0].phones[0], "972501000000");
  assert.ok(parseMs < 1500, "parse 3800 with photos in <1.5s, got " + parseMs);
  const t1 = Date.now();
  const { added } = mergeIncoming([], parsed);
  const mergeMs = Date.now() - t1;
  assert.equal(added.length, 3800);
  assert.ok(mergeMs < 1500, "merge in <1.5s, got " + mergeMs);
  const idx = buildSearchIndex(added);
  const t2 = Date.now();
  for (let i = 0; i < 50; i++) searchContacts(idx, "תיאור");
  const searchMs = Date.now() - t2;
  const hits = searchContacts(idx, "תיאור", 15);
  assert.ok(hits.length > 0 && hits.length <= 15);
  assert.ok(searchMs < 200, "50 searches in <200ms, got " + searchMs);
  console.log("    timing parse", parseMs, "ms merge", mergeMs, "ms 50x search", searchMs, "ms");
});

check("scheduled due + ics contains wa.me and honest text", () => {
  const item = {
    id: "s_test",
    name: "יוסי כהן",
    phone: "972501234567",
    message: "היי, מה קורה?",
    at: new Date(Date.now() - 1000).toISOString(),
  };
  assert.equal(scheduledDue([item]).length, 1);
  assert.equal(scheduledUpcoming([item]).length, 0);
  const future = { ...item, at: new Date(Date.now() + 3600000).toISOString() };
  assert.equal(scheduledDue([future]).length, 0);
  assert.equal(scheduledUpcoming([future]).length, 1);
  const ics = buildIcs(item);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /wa\.me\/972501234567/);
  assert.match(ics, /השליחה עצמה דורשת לחיצה/);
  assert.ok(ics.includes("יוסי") || ics.includes("\\u"));
  const rec = pushRecent([], { name: "יוסי", phone: "050-123-4567" });
  assert.equal(rec[0].phone, "972501234567");
  const rec2 = pushRecent(rec, { name: "יוסי", phone: "972501234567" });
  assert.equal(rec2.length, 1);
});


check("recs: sent boolean is honored", () => {
  const a = sanitizeRec({ id: "1", name: "יוסי", sent: true });
  assert.equal(a.sent, true);
  assert.ok(a.sentAt);
  assert.equal(recIsSent(a), true);
  const b = sanitizeRec({ id: "2", name: "דנה", sentAt: "2026-11-14T07:00:00.000Z" });
  assert.equal(b.sent, true);
  const c = sanitizeRec({ id: "3", name: "מיכל", sent: false, sentAt: "2026-11-14T07:00:00.000Z" });
  assert.equal(c.sent, false);
  assert.equal(c.sentAt, null);
  const d = sanitizeRec({ id: "4", name: "רן" });
  assert.equal(d.sent, false);
  assert.equal(d.sentAt, null);
});

check("recs: sort, partition, shabbat hold", () => {
  const people = normalizeRecs({
    type: RECS_TYPE,
    version: 1,
    people: [
      { id: "low", name: "נמוך", priority: 10 },
      { id: "high", name: "גבוה", priority: 90 },
      { id: "sent", name: "נשלח", priority: 100, sent: true },
      { id: "shab", name: "שבת", priority: 80, shabbat: "observant" },
    ],
  }).people;
  const shabbat = { isShabbat: true };
  const parts = partitionRecs(people, shabbat);
  assert.deepEqual(parts.ready.map((p) => p.id), ["high", "low"]);
  assert.deepEqual(parts.held.map((p) => p.id), ["shab"]);
  assert.equal(parts.sent.length, 1);
  assert.equal(recIsHeld(parts.held[0], shabbat), true);
  const open = partitionRecs(people, { isShabbat: false });
  assert.ok(open.ready.some((p) => p.id === "shab"));
  assert.equal(open.held.length, 0);
});

check("recs: merge keeps local sent and phone", () => {
  const existing = [sanitizeRec({ id: "1", name: "יוסי", phone: "050-111-2222", sent: true, message: "היי" })];
  const incoming = [sanitizeRec({ id: "1", name: "יוסי כהן", message: "שלום", phone: "" })];
  const merged = mergeRecs(existing, incoming);
  assert.equal(merged[0].name, "יוסי כהן");
  assert.equal(merged[0].phone, "972501112222");
  assert.equal(merged[0].sent, true);
  assert.ok(merged[0].sentAt);
  assert.equal(merged[0].message, "שלום");
});

try {
  const data = {
    type: RECS_TYPE,
    version: 1,
    people: [
      { id: "1", name: "יוסי", phone: "050-123-4567", message: "היי\nקישור", priority: 10, sent: false },
    ],
  };
  const gz = await encodeRecsFragment(data, { gzip: true });
  const plain = await encodeRecsFragment(data, { gzip: false });
  assert.equal(recsHashPayload("#recs=" + gz), gz);
  const fromGz = await decodeRecsFragment("#recs=" + gz);
  const fromPlain = await decodeRecsFragment(plain);
  assert.equal(fromGz.people[0].name, "יוסי");
  assert.equal(fromGz.people[0].phone, "972501234567");
  assert.equal(fromPlain.people[0].message.includes("היי"), true);
  assert.equal(fromGz.type, RECS_TYPE);
  console.log("ok ", "recs: fragment gzip and plain roundtrip");
} catch (err) {
  failed++;
  console.error("FAIL", "recs: fragment gzip and plain roundtrip", err.message);
}

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
