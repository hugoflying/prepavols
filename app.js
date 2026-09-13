import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit";

const TEMPLATE_BASE = "https://raw.githubusercontent.com/hugoflying/prepavols/main";
const { PDFDocument, StandardFonts } = PDFLib;

function isoToDDMMYYYY(iso){
  if(!iso) return "";
  const [y,m,d]=iso.split("-");
  return `${d}/${m}/${y}`;
}

function upper(s){ return (s||"").toUpperCase().trim(); }

function getVol(n){
  const g = id => (document.getElementById(`${id}_${n}`)?.value || "").trim();
  const c = id => !!document.getElementById(`${id}_${n}`)?.checked;

  const up = s => (s || "").toUpperCase().trim();

  return {
    arr: {
      date: g("arr_date"),
      flt: up(g("arr_flt")),
      from: up(g("arr_from")),
      reg: up(g("arr_reg")),
      type: up(g("arr_type")),
      hold_search: c("hold_search"),
      max5: c("max5") // checkbox id expected: max5_1 / max5_2
    },
    dep: {
      date: g("dep_date"),
      flt: up(g("dep_flt")),
      to: up(g("dep_to")),
      reg: up(g("dep_reg")),
      type: up(g("dep_type"))
    }
  };
}

function isVolEmpty(v){
  return !v.arr.date&&!v.arr.flt&&!v.dep.date&&!v.dep.flt;
}

function parking(n){ return document.getElementById(`parking_${n}`)?.value||"" }
function rzaName(){ return upper(window._rzaName || ""); }

const DOCS={

/* ========= BINGO ========= */

BINGO_FR:{
 file: `${TEMPLATE_BASE}/templates/BINGO.pdf`,
 fill:({vol1})=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "REGISTRATION": vol1.dep.reg,
   "TO": vol1.dep.to,
   }),
 flatten:true
},

/* ========= LIR RYANAIR ========= */

LIR_RYANAIR:{
  file: `${TEMPLATE_BASE}/templates/LIR RYANAIR BELLOVA 2026.pdf`,
  fill:({vol1}, extra = null)=>{
    const x = lirTypeX(vol1.dep.type);

    const hold = !!extra?.hold_search;
    const max5 = !!extra?.max5;

    return {
      "DATE": isoToDDMMYYYY(vol1.dep.date),
      "REGISTRATION": vol1.dep.reg,
      "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
      "TO": vol1.dep.to,
      "A/C TYPE": vol1.dep.type,

      "B737": x.B737,
      "B738": x.B738,
      "B38M": x.B38M,

      // ✅ SI multiligne
      "SI": extra?.si || "",

      // ✅ MAX 5 (texte)
      "MAX 5": max5 ? "MAX 5" : "",

      // ✅ HOLD conditionnel
      "ARRIVAL FLIGHT NUMBER": hold ? (vol1.arr.flt || "") : "",
     
    };
  },
  flatten:true
},
  
/* ========= LIR LAUDA ========= */

LIR_LAUDA:{
 file: `${TEMPLATE_BASE}/templates/lauda-lir 2026.pdf`,
 fill:({vol1}, extra = null)=>({
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "REGISTRATION": vol1.dep.reg,
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "FROM": "BVA", // forcé
   "TO": vol1.dep.to,
   "SI": extra?.si || ""
 }),
 flatten:true
},

/* ========= BBCG (Wizz) ========= */

BBCG_GATE:{
 file: `${TEMPLATE_BASE}/templates/BBCG_Apr2020_Rev1 - BAGGAGE BINGO CARD_GATE.pdf`,
 fill:({vol1}, extra = null)=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "TO": vol1.dep.to,

   // ✅ Popup fields
   "GATE NUMBER": (extra?.gate || "").toString().toUpperCase().trim(),
   "LOAD COMPARTMENT": (extra?.comp || "").toString().toUpperCase().trim(),
   "Bingo Card": (extra?.bingoCard || "").toString().trim(),
   "Of": (extra?.bingoOf || "").toString().trim(),
 }),
 flatten:true
},

/* ========= WAIF (Wizz) ========= */

WAIF:{
 file: `${TEMPLATE_BASE}/templates/WAIF_Jun2021_Rev1.1_ WALKAROUND INSPECTION FORM.pdf`,
 fill:({vol1})=>({
   "STATION": "BVA", // forcé
   "ARRIVAL FLIGHT NUMBER": vol1.arr.flt,
   "DATE": isoToDDMMYYYY(vol1.arr.date),
   "REGISTRATION": vol1.arr.reg,
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "DATE_2": isoToDDMMYYYY(vol1.dep.date) // si ton 2e champ date s'appelle autrement, remplace DATE_2
 }),
 flatten:true
},

/* ========= RTB (Wizz) ========= */

RTB:{
 file: `${TEMPLATE_BASE}/templates/RTB_Mar2025_Rev3_Ready To Board.pdf`,
 fill:({vol1})=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "ROUTE": `BVA-${vol1.dep.to}`,
   "REGISTRATION": vol1.dep.reg
 }),
 flatten:true
},

/* ========= AUTOCONTROLE ========= */

AUTOCONTROLE:{
  file: `${TEMPLATE_BASE}/templates/Autocontrôle.pdf`,
  fill:({vol1,vol2})=>{
    const o = {};
    const name = rzaName();

    const hasV1 = !isVolEmpty(vol1);
    const hasV2 = !isVolEmpty(vol2);

    // ===== VOL A =====
    if(hasV1){
      o["VOL A - NOM PRENOM"] = name;
      o["FLIGHT A - DEPARTURE FLIGHT NUMBER"] = vol1.dep.flt;
      o["FLIGHT A - DATE"] = isoToDDMMYYYY(vol1.dep.date);
      o["FLIGHT A - TO"] = vol1.dep.to;
    } else {
      o["FLIGHT A - DATE"] = "        /        /        ";
    }

    // ===== VOL B =====
    if(hasV2){
      o["VOL B - NOM PRENOM"] = name;
      o["FLIGHT B - DEPARTURE FLIGHT NUMBER"] = vol2.dep.flt;
      o["FLIGHT B - DATE"] = isoToDDMMYYYY(vol2.dep.date);
      o["FLIGHT B - TO"] = vol2.dep.to;
    } else {
      o["FLIGHT B - DATE"] = "        /        /        ";
    }

    return o;
  },
  flatten:true
},
  
/* ========= PRESTATIONS DÉPART ========= */

PRESTA_DEP:{
 file: `${TEMPLATE_BASE}/templates/suivi-prestations-bases-arrivee-depart.pdf`,
 fill:({vol1,vol2})=>{
   const o={};

   if(!isVolEmpty(vol1)){
     o["FLIGHT A - IMMATRICULATION"] = vol1.dep.reg;
     o["FLIGHT A - DATE"] = isoToDDMMYYYY(vol1.dep.date);
     o["FLIGHT A - STAND"] = parking(1);
     o["FLIGHT A - DEPARTURE FLIGHT NUMBER"] = vol1.dep.flt;
     o["FLIGHT A - TO"] = vol1.dep.to;
   }

   if(!isVolEmpty(vol2)){
     o["FLIGHT B - IMMATRICULATION"] = vol2.dep.reg;
     o["FLIGHT B - DATE"] = isoToDDMMYYYY(vol2.dep.date);
     o["FLIGHT B - STAND"] = parking(2);
     o["FLIGHT B - DEPARTURE FLIGHT NUMBER"] = vol2.dep.flt;
     o["FLIGHT B - TO"] = vol2.dep.to;
   }

   return o;
 },
 flatten:true,
 fontSize: 14
},

/* ========= PRESTATIONS ARRIVÉE ========= */

PRESTA_RET:{
 file: `${TEMPLATE_BASE}/templates/suivi-prestations-bases-arrivee-depart.pdf`,
 fill:({vol1,vol2}, extra = null)=>{
   const o={};

   if(!isVolEmpty(vol1)){
     o["FLIGHT A - IMMATRICULATION"] = vol1.arr.reg;
     o["FLIGHT A - DATE"] = isoToDDMMYYYY(vol1.arr.date);
     o["FLIGHT A - STAND"] = parking(1);
     o["FLIGHT A - ARRIVAL FLIGHT NUMBER"] = vol1.arr.flt;
     o["FLIGHT A - FROM"] = vol1.arr.from;
   }

   if(!isVolEmpty(vol2)){
     o["FLIGHT B - IMMATRICULATION"] = vol2.arr.reg;
     o["FLIGHT B - DATE"] = isoToDDMMYYYY(vol2.arr.date);
     o["FLIGHT B - STAND"] = parking(2);
     o["FLIGHT B - ARRIVAL FLIGHT NUMBER"] = vol2.arr.flt;
     o["FLIGHT B - FROM"] = vol2.arr.from;
   }

   const m1 = (extra?.menage?.["1"] || "");
   const m2 = (extra?.menage?.["2"] || "");

   o["FLIGHT A - MENAGE TIDY"] = (m1 === "TIDY") ? "X" : "";
   o["FLIGHT A - MENAGE FULL"] = (m1 === "FULL") ? "X" : "";
   o["FLIGHT B - MENAGE TIDY"] = (m2 === "TIDY") ? "X" : "";
   o["FLIGHT B - MENAGE FULL"] = (m2 === "FULL") ? "X" : "";

   return o;
 },
 flatten:true,
 fontSize: 14
},

/* ========= PRESTATIONS BASÉ (arrivée-départ combiné) ========= */
// Noms exacts des champs vérifiés via Acrobat :
// - FLIGHT A -  FLIGHT NUMBER  (double espace !)
// - FLIGHT B - FLIGHT NUMBER   (simple espace)
// - FLIGHT A - TOILETTES REMPLISSAGE  vs  FLIGHT B - REMPLISSAGE TOILETTES
// - SENS DEPART / SENS ARRIVEE = groupes radio (pas des checkboxes)

PRESTA_BASE:{
 file: `${TEMPLATE_BASE}/templates/suivi-prestations-bases-arrivee-depart.pdf`,
 fill:({vol1,vol2}, extra = null)=>{
   const o={};
   const mode = extra?.mode || "DEP";

   // Lecture directe du DOM (indépendante du snapshot getVol())
   const domVal = (id) => (document.getElementById(id)?.value || "").trim().toUpperCase();

   const fillVol = (letter, vol, pkn) => {
     const isA = (letter === "A");
     const n   = isA ? 1 : 2;

     // FLIGHT NUMBER : espace simple pour A et B (confirmé Acrobat)
     const fltFieldName = `FLIGHT ${letter} - FLIGHT NUMBER`;

     o[`FLIGHT ${letter} - IMMATRICULATION`] = (mode === "DEP") ? vol.dep.reg : vol.arr.reg;
     o[`FLIGHT ${letter} - DATE`]            = (mode === "DEP") ? isoToDDMMYYYY(vol.dep.date) : isoToDDMMYYYY(vol.arr.date);
     o[`FLIGHT ${letter} - STAND`]           = parking(pkn);
     o[`FLIGHT ${letter} - FROM/TO`]         = (mode === "DEP") ? vol.dep.to : vol.arr.from;

     // FLIGHT NUMBER : lecture directe du DOM + nom exact avec double espace pour A
     const fltDep = domVal(`dep_flt_${n}`);
     const fltArr = domVal(`arr_flt_${n}`);
     const fltNum = (mode === "DEP") ? fltDep : fltArr;
     o[fltFieldName] = fltNum;

     if(mode === "DEP"){
       o[`FLIGHT ${letter} - SENS DEPART`]  = "__SELECT__";
       o[`FLIGHT ${letter} - SENS ARRIVEE`] = "__CLEAR__";

       // ⚠ Noms checkboxes différents A vs B pour TOILETTES REMPLISSAGE
       if(isA){
         o["FLIGHT A - TOILETTES REMPLISSAGE"]   = "X";
         o["FLIGHT A - EAU POTABLE REMPLISSAGE"] = "X";
       } else {
         o["FLIGHT B - TOILETTES REMPLISSAGE"]   = "X";
         o["FLIGHT B - EAU POTABLE REMPLISSAGE"] = "X";
       }
       o[`FLIGHT ${letter} - GPU`] = "X";

     } else {
       const mKey = isA ? "1" : "2";
       const m    = (extra?.menage?.[mKey] || "");

       o[`FLIGHT ${letter} - SENS ARRIVEE`] = "__SELECT__";
       o[`FLIGHT ${letter} - SENS DEPART`]  = "__CLEAR__";

       o[`FLIGHT ${letter} - TOILETTES VIDANGE`]   = "X";
       o[`FLIGHT ${letter} - EAU POTABLE VIDANGE`] = "X";
       o[`FLIGHT ${letter} - GPU`]                  = "X";
       o[`FLIGHT ${letter} - COLLECTE DECHETS`]     = "X";
       o[`FLIGHT ${letter} - MENAGE TIDY`]          = (m === "TIDY") ? "X" : "";
       o[`FLIGHT ${letter} - MENAGE FULL`]          = (m === "FULL") ? "X" : "";

       // Page 2 — HOLD SECURITY SEARCH (noms exacts vus dans la console)
       const holdKey = isA ? "1" : "2";
       const isHold = !!(extra?.hold?.[holdKey]);
       if(isHold){
         o[`FLIGHT ${letter} - ARRIVAL HOLD SECURITY SEARCH`] = "__SELECT__";
         o[`FLIGHT ${letter} - ARRIVAL FLIGHT NUMBER`]        = fltArr;
       } else {
         o[`FLIGHT ${letter} - ARRIVAL HOLD SECURITY SEARCH`] = "__CLEAR__";
       }
     }
   };

   if(!isVolEmpty(vol1)) fillVol("A", vol1, 1);
   if(!isVolEmpty(vol2)) fillVol("B", vol2, 2);

   return o;
 },
 flatten:true,
 fontSize: 14
}

};
;

/* ---------- MOTEUR PDF ---------- */

function sleep(ms){
  return new Promise(r => setTimeout(r, ms));
}

// Détecte une redirection Cloudflare Access → recharge la page (re-auth)
async function fetchArrayBuffer(url, label){
  try{
    const res = await fetch(encodeURI(url), {
      cache: "no-store"
    });

    // Seul cas certain d'une session CF Access expirée : redirect vers cloudflareaccess.com
    if(res.url && res.url.includes("cloudflareaccess.com")){
      console.warn("Session Cloudflare expirée, rechargement...", url);
      window.location.reload();
      return new ArrayBuffer(0);
    }

    if(!res.ok) throw new Error(`${label} HTTP ${res.status} (${url})`);
    return await res.arrayBuffer();
  }catch(e){
    throw new Error(`${label} FETCH ERROR (${url}) → ${e?.message || e}`);
  }
}

// version retry + protection Cloudflare Access
async function fetchArrayBufferRetry(url, label, retries = 3, delayMs = 400){
  let lastErr;
  for(let i = 0; i <= retries; i++){
    try{
      const res = await fetch(encodeURI(url), {
        cache: "no-cache"
      });

      // Seul cas certain CF Access expiré
      if(res.url && res.url.includes("cloudflareaccess.com")){
        console.warn("Session Cloudflare expirée, rechargement...", url);
        window.location.reload();
        return new ArrayBuffer(0);
      }

      if(!res.ok) throw new Error(`${label} HTTP ${res.status} (${url})`);
      return await res.arrayBuffer();

    }catch(e){
      lastErr = e;
      if(i === retries) break;
      await sleep(delayMs * (i + 1));
    }
  }
  throw new Error(`${label} FETCH ERROR (${url}) → ${lastErr?.message || lastErr}`);
}

const _templateCache = new Map();
async function getTemplateBytes(def, docKey) {
  if (_templateCache.has(docKey)) return _templateCache.get(docKey);
  const bytes = await fetchArrayBufferRetry(def.file, "TEMPLATE", 3);
  _templateCache.set(docKey, bytes);
  return bytes;
}

let _robotoCondBoldBytes = null;

async function getFontsBytes(BASE) {
  if (_robotoCondBoldBytes) return { bold: _robotoCondBoldBytes };

  const b = await fetchArrayBufferRetry(
    BASE + "fonts/RobotoCondensed-Bold.ttf",
    "FONT RobotoCondensed-Bold",
    3
  );

  _robotoCondBoldBytes = b;
  return { bold: _robotoCondBoldBytes };
}

// (optionnel) utilitaires de nom de fichier — pas utilisés pour l'impression iframe
function safeFilePart(s){
  return String(s || "")
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_");
}

function ymd(isoDate){
  if(!isoDate) return "";
  const [y,m,d] = String(isoDate).split("-");
  if(!y || !m || !d) return "";
  return `${y}${m}${d}`;
}

function buildPdfFilename(docKey, volTarget, v1, v2){
  if(volTarget === "both"){
    const d1 = ymd(v1?.dep?.date || v1?.arr?.date);
    const d2 = ymd(v2?.dep?.date || v2?.arr?.date);
    return `${safeFilePart(docKey)}_${d1 || "VOL1"}_${d2 || "VOL2"}.pdf`;
  }

  const v    = (volTarget === "2") ? v2 : v1;
  const date = ymd(v?.dep?.date || v?.arr?.date);
  const flt  = safeFilePart(v?.dep?.flt  || v?.arr?.flt  || "");
  const dest = safeFilePart(v?.dep?.to   || v?.arr?.from || "");
  const parts = [safeFilePart(docKey), date || "DATE", flt, dest].filter(Boolean);
  return parts.join("_") + ".pdf";
}

async function fillAndPrint(docKey, volTarget = "1", extra = null) {
  const def = DOCS[docKey];
  if (!def) return;

  const v1 = getVol(1);
  const v2 = getVol(2);

  const vol1 = (volTarget === "2") ? v2 : v1;
  const vol2 = (volTarget === "2") ? v1 : v2;

  const BASE = new URL("./", location.href).toString();

  const templateBytes = await getTemplateBytes(def, docKey);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const form = pdfDoc.getForm();

  // 🔎 DEBUG : liste exacte des champs + types
  const allFields = form.getFields();
  console.group("=== CHAMPS PDF : " + docKey + " ===");
  allFields.forEach(f => {
    const type = f.constructor?.name || "?";
    console.log(`[${f.getName()}] (${type})`);
  });
  console.groupEnd();

  // ✅ Roboto Condensed Bold uniquement
  const { bold } = await getFontsBytes(BASE);
  const fontBold = await pdfDoc.embedFont(bold);

  const fields =
    (volTarget === "both")
      ? def.fill({ vol1: v1, vol2: v2 }, extra)
      : def.fill({ vol1, vol2 }, extra);

  // ⚠️ Avertissement si PRESTA_BASE — champs manquants dans le PDF
  if(docKey === "PRESTA_BASE"){
    const knownNames = new Set(allFields.map(f => f.getName()));
    const missed = Object.keys(fields).filter(k => !knownNames.has(k));
    if(missed.length > 0){
      console.warn("⚠ PRESTA_BASE — champs introuvables dans le PDF:", missed);
      console.info("Champs réels disponibles:", [...knownNames]);
    }
  }

  // 🔎 Trouve automatiquement le vrai champ SI
  let siFieldName = null;
  for (const f of allFields) {
    const n = f.getName();
    const u = n.trim().toUpperCase();
    if (u === "SI" || u.endsWith(".SI") || u.includes("SI")) {
      siFieldName = n;
      break;
    }
  }

  if (siFieldName) console.log("SI détecté sous le nom :", siFieldName);
  else console.warn("⚠ Aucun champ SI détecté dans le PDF");

  for (const [name, raw] of Object.entries(fields)) {
    try {
      // ===== __SELECT__ / __CLEAR__ -> GROUPES RADIO =====
      if (raw === "__SELECT__") {
        try {
          const rg = form.getRadioGroup(name);
          const opts = rg.getOptions();
          if (opts.length > 0) rg.select(opts[0]);
        } catch(e) {
          console.warn("⚠ Radio SELECT échoué:", name, e?.message);
        }
        continue;
      }
      if (raw === "__CLEAR__") {
        try {
          const rg = form.getRadioGroup(name);
          rg.clear();
        } catch {} // ignorer si pas radio ou déjà vide
        continue;
      }

      // ===== BOOLEAN -> CHECKBOX ou TEXT =====
      if (typeof raw === "boolean") {
        let handled = false;
        try {
          const cb = form.getCheckBox(name);
          raw ? cb.check() : cb.uncheck();
          handled = true;
        } catch {}

        if (!handled && raw) {
          try {
            const tf = form.getTextField(name);
            tf.setText("X");
            tf.updateAppearances(fontBold);
            handled = true;
          } catch {}
        }

        if (!handled) {
          console.warn("⚠ Boolean non géré (ni checkbox ni textField):", name);
        }
        continue;
      }

      const rawStr = String(raw ?? "");
      const value = (name === "SI" || name === "SPECIAL INSTRUCTIONS") ? rawStr : rawStr.toUpperCase();

      // ===== CHECKBOX "X" (sauf SI / SPECIAL INSTRUCTIONS / MAX 5) =====
      if (name !== "SI" && name !== "SPECIAL INSTRUCTIONS" && name !== "MAX 5") {
        try {
          const cb = form.getCheckBox(name);
          if (value === "X") cb.check();
          else cb.uncheck();
          continue;
        } catch {}
      }

      // ===== TEXTFIELDS =====
      if (name === "SI") {
        if (!siFieldName) continue;

        const tf = form.getTextField(siFieldName);
        tf.setText(rawStr.replace(/\r\n/g, "\n"));
        tf.setAlignment(PDFLib.TextAlignment.Left);

        if (typeof tf.setFontSize === "function") tf.setFontSize(14);

        tf.updateAppearances(fontBold);
      } else if (name === "SPECIAL INSTRUCTIONS") {
        try {
          const tf = form.getTextField("SPECIAL INSTRUCTIONS");
          tf.setText(rawStr.replace(/\r\n/g, "\n"));
          tf.setAlignment(PDFLib.TextAlignment.Left);
          if (typeof tf.setFontSize === "function") tf.setFontSize(12);
          tf.updateAppearances(fontBold);
        } catch(e) {
          console.warn("Champ SPECIAL INSTRUCTIONS introuvable:", e?.message);
        }
      } else {
        const tf = form.getTextField(name);
        tf.setText(value);

        const isName = name.includes("NOM PRENOM");
        tf.setAlignment(isName ? PDFLib.TextAlignment.Left : PDFLib.TextAlignment.Center);

        if(def.fontSize && typeof tf.setFontSize === "function"){
          tf.setFontSize(def.fontSize);
        }

        tf.updateAppearances(fontBold);
      }

    } catch (e) {
      console.warn("Champ PDF introuvable ou incompatible:", name, e?.message || e);
    }
  }

  // ✅ Force toutes les appearances avant flatten
  form.updateFieldAppearances(fontBold);
  form.flatten();

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    // Nom de fichier pour l'impression / Adobe PDF
    const _prevTitle = document.title;
    const v1 = getVol(1), v2 = getVol(2);
    document.title = buildPdfFilename(docKey, volTarget, v1, v2).replace(/\.pdf$/i, "");
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Restaure le titre après un court délai
    setTimeout(() => { document.title = _prevTitle; }, 2000);
  };
}

// ===== boutons PDF =====
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-doc]");
  if (!b) return;

  const docKey = b.dataset.doc;
  const volTarget = b.dataset.vol || "1";

  if(docKey === "AUTOCONTROLE"){
    openRZAModal({ docKey, volTarget });
    return;
  }

  // ✅ popup SI uniquement pour LIR_RYANAIR (vol 1 ou 2)
  if(docKey === "LIR_RYANAIR" && volTarget !== "both"){
    openSIModal({ docKey, volTarget });
    return;
  }

  // ✅ popup SI + Poussettes pour LIR_LAUDA
  if(docKey === "LIR_LAUDA" && volTarget !== "both"){
    openLaudaModal({ docKey, volTarget });
    return;
  }

  // ✅ popup Ménage uniquement pour PRESTA_RET (Prestations arrivée)
  if(docKey === "PRESTA_RET"){
    openMenageModal({ docKey, volTarget });
    return;
  }

  // ✅ popup Prestations basé (DEP ou ARR)
  if(docKey === "PRESTA_BASE"){
    openPrestaBaseModal({ docKey, volTarget });
    return;
  }

  // ✅ popup BBCG Gate
if(docKey === "BBCG_GATE"){
  openBBCGModal({ docKey, volTarget });
  return;
}

  try {
    await fillAndPrint(docKey, volTarget);
  } catch (err) {
    console.error(err);
    alert(err?.message || String(err));
  }
});

// ===== MENAGE MODAL (Prestations arrivée) =====
let _pendingMenagePrint = null;
window._menageByVol ||= { "1": "", "2": "" }; // "" | "TIDY" | "FULL"

function setMenageUI(vol, value){
  const tidyBtn = document.getElementById(`menage${vol}TidyBtn`);
  const fullBtn = document.getElementById(`menage${vol}FullBtn`);
  if(!tidyBtn || !fullBtn) return;

  tidyBtn.classList.toggle("menage-on", value === "TIDY");
  fullBtn.classList.toggle("menage-on", value === "FULL");
}

function bindMenageButtons(){
  const bind = (vol)=>{
    const tidyBtn = document.getElementById(`menage${vol}TidyBtn`);
    const fullBtn = document.getElementById(`menage${vol}FullBtn`);
    if(!tidyBtn || !fullBtn) return;

    tidyBtn.onclick = ()=>{
      const cur = window._menageByVol[String(vol)] || "";
      window._menageByVol[String(vol)] = (cur === "TIDY") ? "" : "TIDY"; // re-clic = off
      setMenageUI(vol, window._menageByVol[String(vol)]);
    };

    fullBtn.onclick = ()=>{
      const cur = window._menageByVol[String(vol)] || "";
      window._menageByVol[String(vol)] = (cur === "FULL") ? "" : "FULL"; // re-clic = off
      setMenageUI(vol, window._menageByVol[String(vol)]);
    };
  };

  bind(1);
  bind(2);
}

function openMenageModal(pending){
  _pendingMenagePrint = pending;

  const b = document.getElementById("menageBackdrop");
  const m = document.getElementById("menageModal");

  // sync UI from saved values
  setMenageUI(1, window._menageByVol["1"] || "");
  setMenageUI(2, window._menageByVol["2"] || "");

  // Masquer les colonnes des vols vides (comme le modal Hold)
  const v1 = getVol(1);
  const v2 = getVol(2);
  const col1 = document.getElementById("menageCol1");
  const col2 = document.getElementById("menageCol2");
  if(col1) col1.style.display = isVolEmpty(v1) ? "none" : "";
  if(col2) col2.style.display = isVolEmpty(v2) ? "none" : "";

  // bind buttons (idempotent)
  bindMenageButtons();

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeMenageModal(keepPending){
  const b = document.getElementById("menageBackdrop");
  const m = document.getElementById("menageModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  if(!keepPending) _pendingMenagePrint = null;
}

async function submitMenageModal(){
  const p = _pendingMenagePrint;
  if(!p) return;

  closeMenageModal(true);
  _pendingMenagePrint = null;

  const extra = {
    menage: {
      "1": window._menageByVol["1"] || "",
      "2": window._menageByVol["2"] || "",
    }
  };

  // Pour PRESTA_BASE retour, on transmet mode + hold
  if(p.prestaMode) extra.mode = p.prestaMode;
  if(p.hold !== undefined) extra.hold = p.hold;

  await fillAndPrint(p.docKey, p.volTarget, extra);
}

window.openMenageModal = openMenageModal;
window.closeMenageModal = closeMenageModal;
window.submitMenageModal = submitMenageModal;

// ===== PRESTA BASE MODAL (choix Départ / Retour basé) =====
let _pendingPrestaBase = null;

function openPrestaBaseModal(pending){
  _pendingPrestaBase = pending;
  const b = document.getElementById("prestaBaseBackdrop");
  const m = document.getElementById("prestaBaseModal");
  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closePrestaBaseModal(){
  const b = document.getElementById("prestaBaseBackdrop");
  const m = document.getElementById("prestaBaseModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  _pendingPrestaBase = null;
}

async function submitPrestaBaseModal(mode){
  const p = _pendingPrestaBase;
  if(!p) return;
  closePrestaBaseModal();

  if(mode === "DEP"){
    // Départ basé : impression directe
    try{
      await fillAndPrint(p.docKey, p.volTarget, { mode: "DEP" });
    }catch(err){
      console.error(err);
      alert(err?.message || String(err));
    }
  } else {
    // Retour basé : d abord Hold Security Search, puis Ménage
    openHoldModal({ docKey: p.docKey, volTarget: p.volTarget, prestaMode: "ARR" });
  }
}

window.openPrestaBaseModal  = openPrestaBaseModal;
window.closePrestaBaseModal = closePrestaBaseModal;
window.submitPrestaBaseModal = submitPrestaBaseModal;

// ===== HOLD SECURITY SEARCH MODAL (Retour basé) =====
let _pendingHold = null;

function openHoldModal(pending){
  _pendingHold = pending;
  // reset les deux cases
  const cb1 = document.getElementById("holdCheckbox1");
  const cb2 = document.getElementById("holdCheckbox2");
  if(cb1) cb1.checked = false;
  if(cb2) cb2.checked = false;

  // Afficher les lignes vol selon vols remplis
  const v1 = getVol(1);
  const v2 = getVol(2);
  const row1 = document.getElementById("holdRow1");
  const row2 = document.getElementById("holdRow2");
  if(row1) row1.style.display = isVolEmpty(v1) ? "none" : "flex";
  if(row2) row2.style.display = isVolEmpty(v2) ? "none" : "flex";

  const b = document.getElementById("holdBackdrop");
  const m = document.getElementById("holdModal");
  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeHoldModal(){
  const b = document.getElementById("holdBackdrop");
  const m = document.getElementById("holdModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  _pendingHold = null;
}

function submitHoldModal(){
  const p = _pendingHold;
  if(!p) return;
  const hold = {
    "1": !!document.getElementById("holdCheckbox1")?.checked,
    "2": !!document.getElementById("holdCheckbox2")?.checked,
  };
  closeHoldModal();
  // Enchaine sur le modal Ménage, en passant hold (par vol) + prestaMode
  openMenageModal({ docKey: p.docKey, volTarget: p.volTarget, prestaMode: p.prestaMode, hold });
}

window.openHoldModal  = openHoldModal;
window.closeHoldModal = closeHoldModal;
window.submitHoldModal = submitHoldModal;

// ===== BBCG MODAL (Bingo Gate) =====
let _pendingBBCGPrint = null;

// ✅ par défaut: comp vide (le JS mettra CP1/CP3 selon A/C Type si rien choisi)
window._bbcgByVol ||= {
  "1": { gate:"", comp:"", bingoCard:"1", bingoOf:"1" },
  "2": { gate:"", comp:"", bingoCard:"1", bingoOf:"1" },
};

function defaultCompFromAcType(acType){
  const t = (acType || "").toUpperCase().trim();
  if(t === "A320" || t === "A20N") return "CP1";
  if(t === "A321" || t === "A21NY" || t === "A21N") return "CP3";
  return "";
}

function openBBCGModal(pending){
  _pendingBBCGPrint = pending;

  const vol = String(pending?.volTarget || "1");

  // sécurité si jamais la clé n’existe pas
  if(!window._bbcgByVol[vol]){
    window._bbcgByVol[vol] = { gate:"", comp:"", bingoCard:"1", bingoOf:"1" };
  }

  const data = window._bbcgByVol[vol];

  const b = document.getElementById("bbcgBackdrop");
  const m = document.getElementById("bbcgModal");

  const gate = document.getElementById("bbcgGate");
  const comp = document.getElementById("bbcgComp");
  const bc   = document.getElementById("bbcgBingoCard");
  const of   = document.getElementById("bbcgBingoOf");

  // ✅ défaut CP selon A/C type si aucun choix déjà enregistré
  const acType = document.getElementById(`dep_type_${vol}`)?.value || "";
  const compDefault = data.comp && data.comp !== ""
    ? data.comp
    : defaultCompFromAcType(acType);

  if(gate) gate.value = data.gate || "";
  if(comp) comp.value = compDefault || ""; // "" | CP1 | CP3
  if(bc)   bc.value   = data.bingoCard || "1";
  if(of)   of.value   = data.bingoOf || "1";

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";

  setTimeout(() => gate?.focus?.(), 0);
}

function closeBBCGModal(keepPending){
  const b = document.getElementById("bbcgBackdrop");
  const m = document.getElementById("bbcgModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  if(!keepPending) _pendingBBCGPrint = null;
}

async function submitBBCGModal(){
  const p = _pendingBBCGPrint;
  if(!p) return;

  const vol = String(p.volTarget || "1");

  const gate = (document.getElementById("bbcgGate")?.value || "").trim();
  const comp = (document.getElementById("bbcgComp")?.value || "").trim(); // ✅ vide autorisé

  const bingoCard = (document.getElementById("bbcgBingoCard")?.value || "1").trim();
  const bingoOf   = (document.getElementById("bbcgBingoOf")?.value || "1").trim();

  window._bbcgByVol[vol] = { gate, comp, bingoCard, bingoOf };

  closeBBCGModal(true);
  _pendingBBCGPrint = null;

  await fillAndPrint(p.docKey, p.volTarget, { gate, comp, bingoCard, bingoOf });
}

// IMPORTANT (car app.js est en module)
window.openBBCGModal = openBBCGModal;
window.closeBBCGModal = closeBBCGModal;
window.submitBBCGModal = submitBBCGModal;

// ===== SI MODAL (LIR Ryanair) =====
let _pendingSIPrint = null;
window._lirSiByVol      ||= { "1": "", "2": "" };
window._lirPorteByVol   ||= { "1": "", "2": "" };
window._lirCBSByVol     ||= { "1": "", "2": "" };
window._lirManuelByVol  ||= { "1": false, "2": false };
window._lirHoldByVol    ||= { "1": false, "2": false };
// null = "auto" (pas encore touché par l'utilisateur) => défaut selon l'avion (B38M)
window._lirMax5ByVol    ||= { "1": null, "2": null };

function openSIModal(pending){
  _pendingSIPrint = pending;

  const vol = String(pending?.volTarget || "1");
  const v = getVol(Number(vol));

  const b = document.getElementById("siBackdrop");
  const m = document.getElementById("siModal");
  const t = document.getElementById("siModalInput");
  const cbMax5 = document.getElementById("siModalMax5");
  const cbHold = document.getElementById("siModalHold");

  if(t){
    t.value = window._lirSiByVol[vol] || "";
    setTimeout(()=> t.focus(), 0);
  }

  // MAX5 : reprend l'état sauvegardé s'il existe, sinon défaut auto (coché si B38M)
  const isB38M = upper(v?.dep?.type) === "B38M";
  const savedMax5 = window._lirMax5ByVol[vol];
  if(cbMax5) cbMax5.checked = (savedMax5 === null || savedMax5 === undefined) ? isB38M : savedMax5;

  // HOLD : reprend l'état sauvegardé
  if(cbHold) cbHold.checked = window._lirHoldByVol[vol] || false;

  // Poussettes : restaure les valeurs sauvegardées
  const pPorte = document.getElementById("siModalPoussettesPorte");
  const pCBS   = document.getElementById("siModalPoussettesCBS");
  if(pPorte) pPorte.value = window._lirPorteByVol[vol] || "";
  if(pCBS)   pCBS.value   = window._lirCBSByVol[vol]   || "";

  // Restaure le mode poussettes (avec / sans nombre)
  const wasManuel = window._lirManuelByVol[vol] || false;
  applyPoussettesMode(wasManuel);

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

// Sauvegarde l'état courant du formulaire dans les variables persistantes,
// pour le vol en cours d'édition. Appelé à chaque fermeture (Annuler, clic
// extérieur, Échap, Imprimer) => les cases restent cochées si on rouvre.
function snapshotSIModal(){
  const p = _pendingSIPrint;
  if(!p) return;
  const vol = String(p.volTarget || "1");

  window._lirSiByVol[vol]     = document.getElementById("siModalInput")?.value || "";
  window._lirPorteByVol[vol]  = document.getElementById("siModalPoussettesPorte")?.value || "";
  window._lirCBSByVol[vol]    = document.getElementById("siModalPoussettesCBS")?.value   || "";
  window._lirManuelByVol[vol] = !!window._siPoussettesManuel;
  window._lirHoldByVol[vol]   = !!document.getElementById("siModalHold")?.checked;
  window._lirMax5ByVol[vol]   = !!document.getElementById("siModalMax5")?.checked;
}

function closeSIModal(keepPending){
  // On mémorise l'état saisi avant de cacher le popup
  snapshotSIModal();

  const b = document.getElementById("siBackdrop");
  const m = document.getElementById("siModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  if(!keepPending) _pendingSIPrint = null;
}

async function submitSIModal(){
  const t  = document.getElementById("siModalInput");
  const cbMax5 = document.getElementById("siModalMax5");
  const cbHold = document.getElementById("siModalHold");

  const p = _pendingSIPrint;
  if(!p) return;

  const vol = String(p.volTarget || "1");
  const v = getVol(Number(vol)); // gardé si tu t'en sers ailleurs

  const siRaw = (t?.value || "");
  window._lirSiByVol[vol]     = siRaw;
  window._lirPorteByVol[vol]  = document.getElementById("siModalPoussettesPorte")?.value || "";
  window._lirCBSByVol[vol]    = document.getElementById("siModalPoussettesCBS")?.value   || "";
  window._lirManuelByVol[vol] = window._siPoussettesManuel || false;
  window._lirHoldByVol[vol]   = !!cbHold?.checked;
  window._lirMax5ByVol[vol]   = !!cbMax5?.checked;

  // Poussettes
  let prefix = "";
  if(window._siPoussettesManuel){
    prefix = "        poussette(s) porte\n        poussette(s) soute";
  } else {
    const nPorte = parseInt(document.getElementById("siModalPoussettesPorte")?.value || "", 10);
    const nCBS   = parseInt(document.getElementById("siModalPoussettesCBS")?.value   || "", 10);
    const parts  = [];
    if(!isNaN(nPorte) && nPorte > 0)
      parts.push(nPorte === 1 ? "1 poussette porte" : `${nPorte} poussettes porte`);
    if(!isNaN(nCBS) && nCBS > 0)
      parts.push(nCBS === 1 ? "1 poussette soute" : `${nCBS} poussettes soute`);
    prefix = parts.join("\n");
  }
  const si = prefix && siRaw.trim()
    ? prefix + "\n" + siRaw.trim()
    : prefix || siRaw.trim();

  // ✅ MAX 5 = ce que tu coches, point.
  const max5 = !!cbMax5?.checked;

  const hold_search = !!cbHold?.checked;

  closeSIModal(true);
  _pendingSIPrint = null;

  await fillAndPrint(p.docKey, p.volTarget, { si, max5, hold_search });
}

// IMPORTANT (car app.js est en module)
window.openSIModal = openSIModal;
window.closeSIModal = closeSIModal;
window.submitSIModal = submitSIModal;

/* ========= LAUDA MODAL (SI + Poussettes) ========= */

let _pendingLaudaPrint = null;
window._laudaSiByVol = { "1": "", "2": "" };

function openLaudaModal(pending){
  _pendingLaudaPrint = pending;
  const vol = String(pending?.volTarget || "1");

  const b = document.getElementById("laudaBackdrop");
  const m = document.getElementById("laudaModal");
  const t = document.getElementById("laudaModalInput");
  const pPorte = document.getElementById("laudaModalPoussettesPorte");
  const pCBS   = document.getElementById("laudaModalPoussettesCBS");

  if(t){ t.value = window._laudaSiByVol[vol] || ""; setTimeout(()=> t.focus(), 0); }
  if(pPorte) pPorte.value = "";
  if(pCBS)   pCBS.value   = "";

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeLaudaModal(keepPending){
  const b = document.getElementById("laudaBackdrop");
  const m = document.getElementById("laudaModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  if(!keepPending) _pendingLaudaPrint = null;
}

async function submitLaudaModal(){
  const t = document.getElementById("laudaModalInput");
  const p = _pendingLaudaPrint;
  if(!p) return;

  const vol = String(p.volTarget || "1");
  const siRaw = (t?.value || "");
  window._laudaSiByVol[vol] = siRaw;

  const nPorte = parseInt(document.getElementById("laudaModalPoussettesPorte")?.value || "", 10);
  const nCBS   = parseInt(document.getElementById("laudaModalPoussettesCBS")?.value   || "", 10);
  const parts  = [];
  if(!isNaN(nPorte) && nPorte > 0)
    parts.push(nPorte === 1 ? "1 poussette porte" : `${nPorte} poussettes porte`);
  if(!isNaN(nCBS) && nCBS > 0)
    parts.push(nCBS === 1 ? "1 poussette soute" : `${nCBS} poussettes soute`);
  const prefix = parts.join("\n");

  const si = prefix && siRaw.trim()
    ? prefix + "\n" + siRaw.trim()
    : prefix || siRaw.trim();

  closeLaudaModal(true);
  _pendingLaudaPrint = null;

  await fillAndPrint(p.docKey, p.volTarget, { si });
}

window.openLaudaModal  = openLaudaModal;
window.closeLaudaModal = closeLaudaModal;
window.submitLaudaModal = submitLaudaModal;

// ===== POUSSETTES : MODE "avec nombre" / "sans nombre" =====
window._siPoussettesManuel = false;

// Applique l'affichage du mode sans changer l'intention utilisateur.
// manuel = true  => "Sans le nombre" (champs grisés, mention seule)
// manuel = false => "Indiquer le nombre" (champs actifs)
function applyPoussettesMode(manuel){
  const on = !!manuel;
  window._siPoussettesManuel = on;

  const segCount = document.getElementById("siModeCount");
  const segText  = document.getElementById("siModeText");
  if(segCount) segCount.classList.toggle("is-active", !on);
  if(segText)  segText.classList.toggle("is-active",  on);

  const fields = document.getElementById("siPoussettesFields");
  if(fields) fields.style.display = on ? "none" : "flex";

  const pPorte = document.getElementById("siModalPoussettesPorte");
  const pCBS   = document.getElementById("siModalPoussettesCBS");
  if(pPorte){ pPorte.disabled = on; pPorte.style.opacity = on ? ".35" : "1"; }
  if(pCBS)  { pCBS.disabled   = on; pCBS.style.opacity   = on ? ".35" : "1"; }

  const help = document.getElementById("siPoussettesHelp");
  if(help) help.style.display = on ? "block" : "none";
}
window.applyPoussettesMode = applyPoussettesMode;

// Appelé par les boutons du segmented control
window.setPoussettesMode = function setPoussettesMode(manuel){
  applyPoussettesMode(manuel);
};

function lirTypeX(acType){
  const t = upper(acType);

  const isB737 = t === "B737";
  const isB738 = t === "B738";
  const isB38M = t === "B38M";

  return {
    B737: (isB737 ? "" : "X"),
    B738: (isB738 ? "" : "X"),
    B38M: (isB38M ? "" : "X"),
  };
}

// ===== RZA MODAL (Autocontrôle uniquement) =====
let _pendingPrint = null;

function openRZAModal(pending){
  _pendingPrint = pending;

  const b = document.getElementById("rzaBackdrop");
  const m = document.getElementById("rzaModal");
  const i = document.getElementById("rzaModalInput");
  const h = document.getElementById("rzaHelp");

  if(h) h.style.display = "none";
  if(i){
    i.value = window._rzaName || "";
    setTimeout(()=> i.focus(), 0);
  }

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeRZAModal(keepPending){
  const b = document.getElementById("rzaBackdrop");
  const m = document.getElementById("rzaModal");
  const h = document.getElementById("rzaHelp");

  if(h) h.style.display = "none";
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";

  if(!keepPending) _pendingPrint = null;
}

async function submitRZAModal(){
  const i = document.getElementById("rzaModalInput");
  const h = document.getElementById("rzaHelp");
  if(h) h.style.display = "none";

  const v = (i?.value || "").trim();
  window._rzaName = v; // peut être vide

  const p = _pendingPrint;
  closeRZAModal(true);
  _pendingPrint = null;

  if(p){
    await fillAndPrint(p.docKey, p.volTarget);
  }
}

// IMPORTANT (car app.js est en module)
window.openRZAModal = openRZAModal;
window.closeRZAModal = closeRZAModal;
window.submitRZAModal = submitRZAModal;

/* =========================
   AirportKeeper
   - Liste DEP = SOBT
   - Liste ARR = SIBT
   - Association par linkedId (strict)
     * DEP -> ARR : linkedId + même jour obligatoire (SOBT == SIBT), sinon rien
     * ARR -> DEP : linkedId (strict)
   - Badges UI : ARR et DEP indépendants
     * 5–14  => retardé orange
     * >=15  => retardé rouge
     * <5    => à l'heure vert
     * <=-5  => en avance bleu
   ========================= */

const AK_API_URL = "/ak";
// Proxy Cloudflare Pages Function — le token est géré côté serveur
const AK_AIRPORT = "LFOB";

function $(id){ return document.getElementById(id); }

function isoToYYYYMMDD(iso){
  if(!iso) return "";
  const d = new Date(iso);
  if(isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

// ===== temps "moteur" (au cas où) =====
function arrTimeMs(f){
  return Date.parse(f?.aibt || f?.eibt || f?.sibt || f?.aldt || f?.eldt || f?.afat || f?.efat || '') || null;
}
function depTimeMs(f){
  return Date.parse(f?.aobt || f?.eobt || f?.pobt || f?.ctot || f?.etot || f?.sobt || '') || null;
}

// ===== temps "LISTE" (affichage + tri) =====
function depListMs(f){ return Date.parse(f?.sobt || "") || null; } // ✅ SOBT
function arrListMs(f){ return Date.parse(f?.sibt || "") || null; } // ✅ SIBT

async function fetchAK(flow, from, to){
  const url =
    `${AK_API_URL}?airport=${encodeURIComponent(AK_AIRPORT)}` +
    `&flow=${encodeURIComponent(flow)}` +
    `&from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}`;

  const res = await fetch(url);
  if(!res.ok) throw new Error(`AK error ${res.status} (url=${url})`);

  const data = await res.json();
  if(Array.isArray(data)) return data;
  if(Array.isArray(data?.flights)) return data.flights;
  if(Array.isArray(data?.data)) return data.data;

  console.log("AK payload inconnu:", data);
  return [];
}

let _useUTC = false;

// ===== stockage des timestamps SIBT/SOBT pour refresh UTC/LT =====
const _sibtMs = { "1": null, "2": null };
const _sobtMs = { "1": null, "2": null };

function refreshSibtSobtDisplay(){
  for(const n of ["1","2"]){
    const sibtEl = document.getElementById(`sibt_display_${n}`);
    const sobtEl = document.getElementById(`sobt_display_${n}`);
    if(sibtEl) sibtEl.textContent = Number.isFinite(_sibtMs[n]) ? `SIBT ${hhmmFromMs(_sibtMs[n])}` : "";
    if(sobtEl) sobtEl.textContent = Number.isFinite(_sobtMs[n]) ? `SOBT ${hhmmFromMs(_sobtMs[n])}` : "";
  }
}

function hhmmFromMs(ms){
  if(ms == null) return "--:--";
  const d  = new Date(ms);
  const hh = String(_useUTC ? d.getUTCHours()   : d.getHours())  .padStart(2,"0");
  const mm = String(_useUTC ? d.getUTCMinutes()  : d.getMinutes()).padStart(2,"0");
  return `${hh}:${mm}`;
}

const NBSP = "\u00A0";

function padCol(s, w){
  s = String(s ?? "");
  // coupe si trop long
  if(s.length > w) return s.slice(0, w);
  // complète avec espaces insécables
  return s + NBSP.repeat(w - s.length);
}

function getDepDelay(f){
  const sobt = Date.parse(f?.sobt || '');
  const eobt = Date.parse(f?.eobt || '');
  if(!Number.isFinite(sobt) || !Number.isFinite(eobt)) return 0;
  return Math.round((eobt - sobt) / 60000);
}

function getArrDelay(f){
  const sibt = Date.parse(f?.sibt || '');
  const eibt = Date.parse(f?.eibt || '');
  if(!Number.isFinite(sibt) || !Number.isFinite(eibt)) return 0;
  return Math.round((eibt - sibt) / 60000);
}

function getDepStatus(f){
  const lid = String(f?.linkedId || "").trim();
  const arr = lid ? (window._akArrAll || []).find(a => String(a?.id || "") === lid) : null;
  const arrived  = Number.isFinite(Date.parse(arr?.aibt || ""));
  const departed = Number.isFinite(Date.parse(f?.atot || ""));
  if(departed) return "DÉCOLLÉ";
  if(arrived)  return "ARRIVÉ";
  return "";
}

function getArrStatus(f){
  const arrived  = Number.isFinite(Date.parse(f?.aibt || ""));
  const lid = String(f?.linkedId || "").trim();
  const dep = lid ? (window._akDepById?.get(lid) || null) : null;
  const departed = Number.isFinite(Date.parse(dep?.atot || ""));
  if(departed) return "DÉCOLLÉ";
  if(arrived)  return "ARRIVÉ";
  return "";
}

function buildDepLabel(f){
  const t     = hhmmFromMs(depListMs(f));
  const flt   = upper(f?.fullFlightNumber || f?.callsign || "");
  const to    = upper(f?.adesIata || f?.adesIcao || "");
  const regRaw= upper(f?.reg || "");
  const reg   = regRaw || "-----";
  const stand = (f?.pkg || "").toString().replace(/^P/i,"").trim();
  const p     = stand ? `P${stand}` : "";

  // ✅ ARRIVÉ si AIBT connu sur l’arrivée liée
  const lid = String(f?.linkedId || "").trim();
  const arr = lid
    ? (window._akArrAll || []).find(a => String(a?.id || "") === lid)
    : null;
  const arrived = Number.isFinite(Date.parse(arr?.aibt || ""));

  // ✅ DÉCOLLÉ si ATOT connu
  const departed = Number.isFinite(Date.parse(f?.atot || ""));

  // priorité au statut DÉCOLLÉ
  let status = "";
  if(departed){
    status = "DÉCOLLÉ";
  } else if(arrived){
    status = "ARRIVÉ";
  }

  const parts = [t || "--:--", flt || "—", to || "", reg, p].filter(Boolean);
  const base  = parts.join("  ·  ");
  return base + (status ? "  —  " + status : "");
}

function buildArrLabel(f){
  const t     = hhmmFromMs(arrListMs(f));
  const flt   = upper(f?.fullFlightNumber || f?.callsign || "");
  const from  = upper(f?.adepIata || f?.adepIcao || "");
  const regRaw= upper(f?.reg || "");
  const reg   = regRaw || "-----";
  const stand = (f?.pkg || "").toString().replace(/^P/i,"").trim();
  const p     = stand ? `P${stand}` : "";

  // ✅ ARRIVÉ si AIBT connu
  const arrived = Number.isFinite(Date.parse(f?.aibt || ""));

  // ✅ DÉCOLLÉ basé sur le DEP lié
  const lid = String(f?.linkedId || "").trim();
  const dep = lid ? (window._akDepById?.get(lid) || null) : null;
  const departed = Number.isFinite(Date.parse(dep?.atot || ""));

  // priorité au statut DÉCOLLÉ
  let status = "";
  if(departed){
    status = "DÉCOLLÉ";
  } else if(arrived){
    status = "ARRIVÉ";
  }

  const parts = [t || "--:--", flt || "—", from || "", reg, p].filter(Boolean);
  const base  = parts.join("  ·  ");
  return base + (status ? "  —  " + status : "");
}

function setVal(id, v){
  const el = $(id);
  if(!el) return;
  el.value = (v ?? "");
  el.dispatchEvent(new Event("input", {bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
}

/* =========================
   LIENS ARR <-> DEP (linkedId strict)
   ========================= */

function ymdUTC(iso){
  if(!iso) return "";
  const t = Date.parse(iso);
  if(!t) return "";
  return new Date(t).toISOString().slice(0,10); // YYYY-MM-DD (UTC)
}

function sameDayDepArr(dep, arr){
  const depDay = ymdUTC(dep?.sobt || dep?.eobt || dep?.aobt || "");
  const arrDay = ymdUTC(arr?.sibt || arr?.eibt || arr?.aibt || arr?.eldt || "");
  return !!depDay && !!arrDay && depDay === arrDay;
}

// DEP -> ARR via linkedId + même jour obligatoire
function findLinkedArrForDepSameDay(dep, arrAll){
  const lid = String(dep?.linkedId || "").trim();
  if(!lid) return null;

  const arr = (arrAll || []).find(a => String(a?.id || "") === lid) || null;
  if(!arr) return null;

  if(!sameDayDepArr(dep, arr)) return null;
  return arr;
}

// ARR -> DEP via linkedId strict
function findLinkedDepForArr(arr, depAll){
  const lid = String(arr?.linkedId || "").trim();
  if(!lid) return null;
  return (depAll || []).find(d => String(d?.id || "") === lid) || null;
}

function applyArrToVol(n, arr){
  if(!arr) return;

  const arrIso = arr?.sibt || arr?.eibt || arr?.aibt || arr?.aldt || arr?.eldt || arr?.afat || arr?.efat || "";
  setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));
  setVal(`arr_flt_${n}`, upper(arr?.fullFlightNumber || arr?.callsign || ""));
  setVal(`arr_from_${n}`, upper(arr?.adepIata || arr?.adepIcao || ""));
  setVal(`arr_reg_${n}`, upper(arr?.reg || ""));
  setVal(`arr_type_${n}`, akAcType(arr));

  // Meme avion : pre-remplit les champs visibles Registration + A/C Type
  // (seront ecrases si un DEP lie est trouve via applyDepOnlyToVol)
  const regVal  = upper(arr?.reg || "");
  const typeVal = akAcType(arr);
  if(regVal)  setVal(`dep_reg_${n}`,  regVal);
  if(typeVal) setVal(`dep_type_${n}`, typeVal);

  const stand = (arr?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);

  // SIBT
  const sibtMs = Date.parse(arr?.sibt || "");
  _sibtMs[String(n)] = Number.isFinite(sibtMs) ? sibtMs : null;
  const sibtEl = document.getElementById(`sibt_display_${n}`);
  if(sibtEl) sibtEl.textContent = Number.isFinite(sibtMs) ? `SIBT ${hhmmFromMs(sibtMs)}` : "";
}

function applyDepOnlyToVol(n, dep){
  if(!dep) return;

  const depIso = dep?.sobt || dep?.eobt || dep?.aobt || dep?.pobt || dep?.ctot || dep?.etot || dep?.atot || "";
  setVal(`dep_date_${n}`, isoToYYYYMMDD(depIso));
  setVal(`dep_flt_${n}`, upper(dep?.fullFlightNumber || dep?.callsign || ""));
  setVal(`dep_to_${n}`, upper(dep?.adesIata || dep?.adesIcao || ""));
  setVal(`dep_reg_${n}`, upper(dep?.reg || ""));
  setVal(`dep_type_${n}`, akAcType(dep));

  const stand = (dep?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);

  // SOBT
  const sobtMs = Date.parse(dep?.sobt || "");
  _sobtMs[String(n)] = Number.isFinite(sobtMs) ? sobtMs : null;
  const sobtEl = document.getElementById(`sobt_display_${n}`);
  if(sobtEl) sobtEl.textContent = Number.isFinite(sobtMs) ? `SOBT ${hhmmFromMs(sobtMs)}` : "";
}

function applyDepToVol(n, dep, arrAll){
  if(!dep) return;

  // ===== DEPART =====
  const depIso = dep?.sobt || dep?.eobt || dep?.aobt || dep?.pobt || dep?.ctot || dep?.etot || dep?.atot || "";
  setVal(`dep_date_${n}`, isoToYYYYMMDD(depIso));

  setVal(`dep_flt_${n}`, upper(dep?.fullFlightNumber || dep?.callsign || ""));
  setVal(`dep_to_${n}`, upper(dep?.adesIata || dep?.adesIcao || ""));
  setVal(`dep_reg_${n}`, upper(dep?.reg || ""));
  setVal(`dep_type_${n}`, akAcType(dep));

  const stand = (dep?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);

  // SOBT
  const sobtMs = Date.parse(dep?.sobt || "");
  _sobtMs[String(n)] = Number.isFinite(sobtMs) ? sobtMs : null;
  const sobtEl = document.getElementById(`sobt_display_${n}`);
  if(sobtEl) sobtEl.textContent = Number.isFinite(sobtMs) ? `SOBT ${hhmmFromMs(sobtMs)}` : "";

  // ===== ARRIVEE liée (linkedId + même jour obligatoire) =====
  const prevArr = findLinkedArrForDepSameDay(dep, arrAll);

  if(prevArr){
    const arrIso = prevArr?.sibt || prevArr?.eibt || prevArr?.aibt || prevArr?.aldt || prevArr?.eldt || prevArr?.afat || prevArr?.efat || "";
    setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));

    setVal(`arr_flt_${n}`, upper(prevArr?.fullFlightNumber || prevArr?.callsign || ""));
    setVal(`arr_from_${n}`, upper(prevArr?.adepIata || prevArr?.adepIcao || ""));
    setVal(`arr_reg_${n}`, upper(prevArr?.reg || dep?.reg || ""));
    setVal(`arr_type_${n}`, akAcType(prevArr) || akAcType(dep));

    // SIBT de l'arrivée liée
    const sibtMs = Date.parse(prevArr?.sibt || "");
    _sibtMs[String(n)] = Number.isFinite(sibtMs) ? sibtMs : null;
    const sibtEl = document.getElementById(`sibt_display_${n}`);
    if(sibtEl) sibtEl.textContent = Number.isFinite(sibtMs) ? `SIBT ${hhmmFromMs(sibtMs)}` : "";
  } else {
    // si pas de liée (ou pas le même jour), on ne remplit pas l'arrivée
    setVal(`arr_reg_${n}`, "");
    setVal(`arr_type_${n}`, "");
    setVal(`arr_date_${n}`, "");
    setVal(`arr_flt_${n}`, "");
    setVal(`arr_from_${n}`, "");
    const sibtEl = document.getElementById(`sibt_display_${n}`);
    if(sibtEl) sibtEl.textContent = "";
    _sibtMs[String(n)] = null;
  }
}

function akAcType(f){
  return upper(
    f?.acTypeIcao ||
    f?.acTypeIata ||
    f?.aircraftDetails?.acTypeName ||
    ""
  );
}

function resetVolUI(volNum) {
  const ids = [
    `arr_date_${volNum}`,
    `arr_flt_${volNum}`,
    `arr_from_${volNum}`,
    `dep_date_${volNum}`,
    `dep_flt_${volNum}`,
    `dep_to_${volNum}`,
    `parking_${volNum}`,
    `dep_reg_${volNum}`,
    `dep_type_${volNum}`,
    `arr_reg_${volNum}`,
    `arr_type_${volNum}`
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.type === "checkbox") el.checked = false;
    else el.value = "";
  });

  const arrBadges = document.getElementById(`arr_badges_${volNum}`);
  const depBadges = document.getElementById(`dep_badges_${volNum}`);
  if (arrBadges) arrBadges.innerHTML = "";
  if (depBadges) depBadges.innerHTML = "";

  const sibtEl = document.getElementById(`sibt_display_${volNum}`);
  const sobtEl = document.getElementById(`sobt_display_${volNum}`);
  if(sibtEl) sibtEl.textContent = "";
  if(sobtEl) sobtEl.textContent = "";
  _sibtMs[String(volNum)] = null;
  _sobtMs[String(volNum)] = null;
}

/* =========================
   BADGES RETARD (UI)
   ========================= */

const EIBT_CORRECTION_MIN = -4; // ✅ corrige EIBT (souvent ELDT+10) -> on réduit le taxi-in

function addMinutesToIso(iso, minutes){
  const t = Date.parse(iso || "");
  if(!Number.isFinite(t)) return "";
  return new Date(t + minutes * 60000).toISOString();
}

function delayMinFrom(plannedIso, actualIso){
  const p = Date.parse(plannedIso || "");
  const a = Date.parse(actualIso || "");
  if(!Number.isFinite(p) || !Number.isFinite(a)) return null;
  return Math.round((a - p) / 60000);
}

function actualDepIso(f){
  // départ : AOBT > EOBT
  return f?.aobt || f?.eobt || "";
}

function actualArrIso(f){
  // arrivée : on veut DU BLOC
  // AIBT (réel) > EIBT (estimé en vol, corrigé)
  if(f?.aibt) return f.aibt;

  if(f?.eibt){
    // ✅ on réduit l'estimation (taxi-in trop long côté API)
    return addMinutesToIso(f.eibt, EIBT_CORRECTION_MIN);
  }

  return "";
}

function renderDelayBadge(containerEl, mins){
  if(!containerEl || mins == null) return;

  let label = "";
  let color = "";

  if(mins >= 15){
    label = `RETARDÉ +${mins}`;
    color = "is-danger";
  }
  else if(mins >= 6){
    label = `RETARDÉ +${mins}`;
    color = "is-warning";
  }
  else if(mins <= -11){
    label = `EN AVANCE ${mins}`;
    color = "is-info";
  }
  else{
    label = "À L’HEURE";
    color = "is-success";
  }

  const span = document.createElement("span");
  span.className = `tag ${color}`;
  span.style.fontWeight = "900";
  span.textContent = label;
  containerEl.appendChild(span);
}

function updateBadgesFromFlights(n, depFlight, arrFlight){
  const depWrap = $(`dep_badges_${n}`);
  const arrWrap = $(`arr_badges_${n}`);
  if(depWrap) depWrap.innerHTML = "";
  if(arrWrap) arrWrap.innerHTML = "";

  if(depFlight && depWrap){
    const planned = depFlight?.sobt || "";
    const actual  = actualDepIso(depFlight);
    renderDelayBadge(depWrap, delayMinFrom(planned, actual));
  }

  if(arrFlight && arrWrap){
    const planned = arrFlight?.sibt || "";
    const actual  = actualArrIso(arrFlight); // ✅ AIBT ou EIBT corrigé
    renderDelayBadge(arrWrap, delayMinFrom(planned, actual));
  }
}

function clearBadges(n){
  const a = $(`arr_badges_${n}`);
  const d = $(`dep_badges_${n}`);
  if(a) a.innerHTML = "";
  if(d) d.innerHTML = "";
}
/* =========================
   LOAD + DROPDOWNS
   ========================= */

async function loadAKAll(){
  const st1 = $("ak_status_1");
  const st2 = $("ak_status_2");
  if(st1) st1.textContent = "Chargement…";
  if(st2) st2.textContent = "Chargement…";

  const now = new Date();
  const nowMs = now.getTime();

  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
  const endDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);

  // fenêtre large pour récupérer toutes les liaisons
  const linkFromDate = new Date(startDay.getTime() - 12*60*60*1000);
  const linkToDate   = new Date(endDay.getTime()   + 12*60*60*1000);
  const linkFrom = linkFromDate.toISOString().replace(/\.\d{3}Z$/, "Z");
  const linkTo   = linkToDate.toISOString().replace(/\.\d{3}Z$/, "Z");

  try{
    const [arrAll, depAll] = await Promise.all([
      fetchAK("ARR", linkFrom, linkTo),
      fetchAK("DEP", linkFrom, linkTo),
    ]);

    // ✅ index DEP par id (utile pour ARR -> DEP lié)
    const depById = new Map((depAll || []).map(d => [String(d?.id ?? ""), d]));
    window._akDepById = depById;

    const inTodayDep = (f)=>{
      const sobt = Date.parse(f?.sobt || "");
      if(!sobt) return false;
      if(sobt < startDay.getTime() || sobt > endDay.getTime()) return false;

      // ✅ masque si ATOT + 30 min est passé
      const atot = Date.parse(f?.atot || "");
      if(atot && (atot + 30*60*1000) < nowMs) return false;

      return true;
    };
    const depToday = depAll.filter(inTodayDep);

    const inTodayArr = (f)=>{
      const t = Date.parse(f?.sibt || "");
      if(!(t && t >= startDay.getTime() && t <= endDay.getTime())) return false;

      // ✅ si arrivée liée à un DEP qui a ATOT+30 dépassé → on masque l’arrivée
      const lid = String(f?.linkedId || "").trim();
      if(lid){
        const dep = window._akDepById?.get(lid) || null;
        const atot = Date.parse(dep?.atot || "");
        if(Number.isFinite(atot) && (atot + 30*60*1000) < nowMs) return false;
      }

      return true;
    };
    const arrToday = arrAll.filter(inTodayArr);

    depToday.sort((a,b)=> (Date.parse(a?.sobt || "") || 1e18) - (Date.parse(b?.sobt || "") || 1e18));
    arrToday.sort((a,b)=> (Date.parse(a?.sibt || "") || 1e18) - (Date.parse(b?.sibt || "") || 1e18));

    window._akArrAll   = arrAll;
    window._akDepAll   = depAll;
    window._akDepToday = depToday;
    window._akArrToday = arrToday;

    refreshAKDropdown(1);
    refreshAKDropdown(2);

  }catch(e){
    const msg = `Erreur AK (${String(e.message || e)})`;
    if(st1) st1.textContent = msg;
    if(st2) st2.textContent = msg;
  }
}

function startAKAutoRefresh(){
  setInterval(async ()=>{
    try{
      await loadAKAll();
    }catch(e){
      const msg = String(e?.message || e);
      // si réseau / redirect / session cassée → reload = comme F5
      if(/failed to fetch|network error|fetch/i.test(msg)){
        window.location.reload();
        return;
      }
      console.warn("Auto-refresh AK:", e);
    }
  }, 15 * 60 * 1000);
}

function refreshAKDropdown(n){
  const flowSel = $(`ak_flow_${n}`);
  const sel = $(`ak_flight_${n}`);
  const st  = $(`ak_status_${n}`);
  if(!flowSel || !sel) return;

  const flow = flowSel.value; // "DEP" ou "ARR"
  const list = (flow === "DEP") ? (window._akDepToday || []) : (window._akArrToday || []);

  sel.innerHTML = `<option value="">-- Choisir un vol --</option>`;
  for(const f of list){
    const opt = document.createElement("option");
    opt.value = String(f?.id ?? "");
    opt.textContent = (flow === "DEP") ? buildDepLabel(f) : buildArrLabel(f);
    opt.dataset.status = (flow === "DEP") ? getDepStatus(f) : getArrStatus(f);
    const _delay = (flow === "DEP") ? getDepDelay(f) : getArrDelay(f);
    opt.dataset.delay = _delay > 15 ? _delay : 0;
    sel.appendChild(opt);
  }

  if(st) st.textContent = `${list.length} vol(s)`;
  window.syncCustomDrop?.(n);
}


function clearSIModalState(n) {
  const v = String(n);
  if (window._lirSiByVol)     window._lirSiByVol[v]     = "";
  if (window._lirPorteByVol)  window._lirPorteByVol[v]  = "";
  if (window._lirCBSByVol)    window._lirCBSByVol[v]    = "";
  if (window._lirManuelByVol) window._lirManuelByVol[v] = false;
  if (window._lirHoldByVol)   window._lirHoldByVol[v]   = false;
  if (window._lirMax5ByVol)   window._lirMax5ByVol[v]   = null; // retour au défaut auto
  // Même chose pour Lauda si applicable
  if (window._laudaSiByVol)       window._laudaSiByVol[v]       = "";
  if (window._laudaPorteByVol)    window._laudaPorteByVol[v]    = "";
  if (window._laudaCBSByVol)      window._laudaCBSByVol[v]      = "";
}

function bindAK(n){
  const flowSel = $(`ak_flow_${n}`);
  const sel = $(`ak_flight_${n}`);
  if(!flowSel || !sel) return;

  flowSel.addEventListener("change", ()=>{
    refreshAKDropdown(n);
    clearBadges(n);
    resetVolUI(n); // ✅ reset quand tu changes DEP/ARR
  });

  sel.addEventListener("change", ()=>{
    const id = sel.value;
    if(!id){
      clearBadges(n);
      resetVolUI(n); // ✅ reset si tu remets "-- Choisir un vol --"
      clearSIModalState(n);
      return;
    }

    resetVolUI(n); // ✅ reset avant de remplir
    clearSIModalState(n);

    const flow = flowSel.value;

    if(flow === "DEP"){
      const dep = (window._akDepToday || []).find(f => String(f?.id ?? "") === String(id));
      if(!dep) return;

      applyDepToVol(n, dep, window._akArrAll || []);

      const linkedArr = findLinkedArrForDepSameDay(dep, window._akArrAll || []);
      updateBadgesFromFlights(n, dep, linkedArr);

    } else {
      const arr = (window._akArrToday || []).find(f => String(f?.id ?? "") === String(id));
      if(!arr) return;

      applyArrToVol(n, arr);

      const linkedDep = findLinkedDepForArr(arr, window._akDepAll || []);
      if(linkedDep) applyDepOnlyToVol(n, linkedDep);

      updateBadgesFromFlights(n, linkedDep || null, arr);
    }
  });
}

// boot
// Précharge tous les templates PDF en mémoire au démarrage
// => les clics ne font plus jamais de requête réseau
async function preloadAllTemplates(){
  const BASE = new URL("./", location.href).toString();

  // Précharge la font aussi
  try{
    await getFontsBytes(BASE);
  }catch(e){
    console.warn("Préchargement font échoué (réessai au 1er clic):", e?.message);
  }

  for(const [key, def] of Object.entries(DOCS)){
    if(!def.file) continue;
    if(_templateCache.has(key)) continue;
    try{
      const bytes = await fetchArrayBufferRetry(def.file, key, 2, 300);
      if(bytes && bytes.byteLength > 0){
        _templateCache.set(key, bytes);
        console.log("✅ Template en cache :", key);
      }
    }catch(e){
      console.warn("⚠ Préchargement échoué pour", key, "— sera réessayé au clic :", e?.message);
    }
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  bindAK(1);
  bindAK(2);
  loadAKAll();
  startAKAutoRefresh();

  // Précharge tous les PDFs en arrière-plan dès le chargement
  preloadAllTemplates();

  // Fermer les popups avec Échap + valider avec Entrée
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      if(document.getElementById("siBackdrop")?.style.display          !== "none") { closeSIModal(false);        return; }
      if(document.getElementById("laudaBackdrop")?.style.display        !== "none") { closeLaudaModal(false);     return; }
      if(document.getElementById("rzaBackdrop")?.style.display         !== "none") { closeRZAModal(false);       return; }
      if(document.getElementById("bbcgBackdrop")?.style.display        !== "none") { closeBBCGModal(false);      return; }
      if(document.getElementById("menageBackdrop")?.style.display      !== "none") { closeMenageModal(false);    return; }
      if(document.getElementById("prestaBaseBackdrop")?.style.display  !== "none") { closePrestaBaseModal();     return; }
      if(document.getElementById("holdBackdrop")?.style.display        !== "none") { closeHoldModal();           return; }
      if(document.getElementById("akBackdrop")?.style.display          !== "none") { closeAKMenu();              return; }
    }
    if(e.key === "Enter"){
      // Ne pas intercepter si on est dans un textarea
      if(e.target.tagName === "TEXTAREA") return;
      if(document.getElementById("siBackdrop")?.style.display          !== "none") { e.preventDefault(); submitSIModal();        return; }
      if(document.getElementById("laudaBackdrop")?.style.display        !== "none") { e.preventDefault(); submitLaudaModal();     return; }
      if(document.getElementById("rzaBackdrop")?.style.display         !== "none") { e.preventDefault(); submitRZAModal();       return; }
      if(document.getElementById("bbcgBackdrop")?.style.display        !== "none") { e.preventDefault(); submitBBCGModal();      return; }
      if(document.getElementById("menageBackdrop")?.style.display      !== "none") { e.preventDefault(); submitMenageModal();    return; }
      if(document.getElementById("prestaBaseBackdrop")?.style.display  !== "none") { e.preventDefault(); submitPrestaBaseModal(); return; }
      if(document.getElementById("holdBackdrop")?.style.display        !== "none") { e.preventDefault(); submitHoldModal();      return; }
    }
  });

  // Toggle UTC / Local
  const utcBtn = document.getElementById("utcToggle");
  if(utcBtn){
    utcBtn.addEventListener("click", ()=>{
      _useUTC = !_useUTC;
      utcBtn.title = _useUTC ? "Mode UTC — cliquer pour Local" : "Mode Local — cliquer pour UTC";
      const badge = document.getElementById("utcBadge");
      if(badge) badge.textContent = _useUTC ? "UTC" : "LT";
      refreshAKDropdown(1);
      refreshAKDropdown(2);
      refreshSibtSobtDisplay();
    });
  }
});

/* ================================================
   EXPOSITION GLOBALE — clearVolCard
   ================================================ */
window.clearVolCard = function(n) {
  clearBadges(n);
  resetVolUI(n);
  clearSIModalState(n);
  // Reset native select + custom dropdown
  const sel = document.getElementById('ak_flight_' + n);
  if (sel) sel.value = '';
  const valEl = document.getElementById('cvd_val_' + n);
  if (valEl) {
    valEl.textContent = '— Choisir un vol —';
    valEl.classList.add('placeholder');
  }
  // Deselect all options in custom panel
  const panel = document.getElementById('cvd_panel_' + n);
  if (panel) {
    panel.querySelectorAll('.cvd-opt').forEach(o => o.classList.remove('selected'));
  }
};


/* ===== Écran de connexion : horloge LOCALE / ZULU + date en toutes lettres ===== */
(function(){
  function tick(){
    const lt = document.getElementById('homeClockLT');
    const z  = document.getElementById('homeClockZ');
    const dt = document.getElementById('homeDate');
    const d = new Date(), p = n => String(n).padStart(2,'0');
    if(lt) lt.textContent = p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
    if(z)  z.textContent  = p(d.getUTCHours())+':'+p(d.getUTCMinutes())+':'+p(d.getUTCSeconds());
    if(dt){
      // ex. « Lundi 24 août 2026 »
      let s = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
      dt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
    }
  }
  setInterval(tick, 1000); tick();
})();


/* ===== Écran de connexion : diaporama de fond (fondu aléatoire, hors-ligne) =====
   Déposez home-bg-1.jpg … home-bg-10.jpg (ou juste home-bg-1.jpg) à côté de index.html.
   S'il n'y a aucune image, l'écran reste sur un fond sombre uni. */
(function(){
  const CANDIDATES = [];
  for(let i=1;i<=30;i++) CANDIDATES.push('./home-bg-'+i+'.jpg');
  const INTERVAL = 10000;              // 10 s par photo
  let pool = [];
  let bag  = [];                         // sac mélangé : chaque photo une fois par cycle
  let cur = 'A', timer = null, ready = false, activeSrc = null;

  function show(src){
    const a = document.getElementById('homeSlideA'), b = document.getElementById('homeSlideB');
    if(!a || !b || !src || src === activeSrc) return;
    const nextEl = (cur==='A') ? b : a, curEl = (cur==='A') ? a : b;
    nextEl.style.backgroundImage = 'url("' + src + '")';
    nextEl.classList.add('is-active');
    curEl.classList.remove('is-active');
    cur = (cur==='A') ? 'B' : 'A';
    activeSrc = src;
  }
  function reshuffle(){
    bag = pool.slice();
    for(let i=bag.length-1; i>0; i--){        // Fisher-Yates
      const j = Math.floor(Math.random()*(i+1));
      const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
    }
    // évite que la 1re du nouveau cycle soit la dernière déjà affichée
    if(bag.length>1 && bag[0]===activeSrc){ const t=bag[0]; bag[0]=bag[1]; bag[1]=t; }
  }
  function nextSrc(){
    if(pool.length <= 1) return pool[0] || null;
    if(!bag.length) reshuffle();
    return bag.shift();
  }
  function startProgress(){
    const bar  = document.getElementById('homeSlideProgress');
    const fill = document.getElementById('homeSlideFill');
    if(!bar || !fill) return;
    if(pool.length <= 1){ bar.classList.remove('on'); return; }  // pas de barre si une seule photo
    bar.classList.add('on');
    fill.style.transition = 'none';
    fill.style.width = '0%';
    void fill.offsetWidth;                                        // force le reflow
    fill.style.transition = 'width ' + INTERVAL + 'ms linear';
    fill.style.width = '100%';
  }
  function next(){ const src = nextSrc(); show(src); startProgress(); if(window.homeNextFact) window.homeNextFact(src); }
  function schedule(){ clearInterval(timer); if(pool.length > 1) timer = setInterval(next, INTERVAL); }

  window.homeKickSlideshow = function(){
    if(!ready || !pool.length) return;
    next(); schedule();
  };

  function preload(){
    let pending = CANDIDATES.length;
    const loaded = [];
    CANDIDATES.forEach(src => {
      const im = new Image();
      im.onload  = () => { loaded.push(src); if(--pending === 0) done(loaded); };
      im.onerror = () => { if(--pending === 0) done(loaded); };
      im.src = src;
    });
  }
  function done(loaded){
    ready = true;
    // ordre numérique stable (l'ordre d'affichage vient du sac mélangé)
    pool = loaded.sort((x,y)=>x.localeCompare(y, undefined, {numeric:true}));
    bag = [];
    if(pool.length){ next(); schedule(); }
  }
  if(document.readyState !== 'loading') preload();
  else document.addEventListener('DOMContentLoaded', preload);
})();


/* ===== Écran de connexion : météo horaire (modèle AROME de Météo-France, via Open-Meteo) =====
   AROME = modèle haute résolution de Météo-France (courte échéance, horaire).
   Servi par Open-Meteo (models=arome_france), sans clé API, CORS ouvert.
   Repli silencieux si l'appel échoue. Coordonnées : Beauvais-Tillé / BVA. */
(function(){
  const GEO = { lat: 49.4544, lng: 2.1128, name: 'Beauvais' };
  const HOURS_AHEAD = 8;

  // Codes météo WMO -> icône + libellé FR
  function wmo(code){
    const m = {
      0:['☀️','Ciel clair'], 1:['🌤️','Peu nuageux'], 2:['⛅','Nuageux'], 3:['☁️','Couvert'],
      45:['🌫️','Brouillard'], 48:['🌫️','Brouillard givrant'],
      51:['🌦️','Bruine légère'], 53:['🌦️','Bruine'], 55:['🌦️','Bruine forte'],
      56:['🌧️','Bruine verglaçante'], 57:['🌧️','Bruine verglaçante'],
      61:['🌧️','Pluie faible'], 63:['🌧️','Pluie'], 65:['🌧️','Pluie forte'],
      66:['🌧️','Pluie verglaçante'], 67:['🌧️','Pluie verglaçante'],
      71:['🌨️','Neige faible'], 73:['🌨️','Neige'], 75:['❄️','Neige forte'], 77:['🌨️','Grésil'],
      80:['🌦️','Averses'], 81:['🌦️','Averses'], 82:['⛈️','Fortes averses'],
      85:['🌨️','Averses de neige'], 86:['❄️','Averses de neige'],
      95:['⛈️','Orage'], 96:['⛈️','Orage grêle'], 99:['⛈️','Orage grêle']
    };
    return m[code] || ['🌡️','—'];
  }
  // Repli si weather_code absent (selon disponibilité AROME)
  function deriveCode(precip, cloud){
    if(precip != null && precip >= 0.4) return 61;
    if(cloud  != null){
      if(cloud >= 85) return 3;
      if(cloud >= 40) return 2;
      if(cloud >= 15) return 1;
      return 0;
    }
    return 1;
  }

  function el(tag, cls, txt){ const e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }

  function render(hours){
    const hrsBox = document.getElementById('homeWeatherHours');
    if(hrsBox){
      hrsBox.innerHTML = '';
      hours.forEach(h=>{
        const c = el('div','hw-h');
        c.appendChild(el('span','hh-time', h.hour + 'h'));
        c.appendChild(el('span','hh-ic', h.icon));
        c.appendChild(el('span','hh-t', Math.round(h.temp) + '°'));
        hrsBox.appendChild(c);
      });
      hrsBox.style.display = 'flex';
    }
  }

  function hideAll(){
    const e = document.getElementById('homeWeatherHours'); if(e) e.style.display = 'none';
  }
  async function load(){
    const anchor = document.getElementById('homeWeatherHours');
    if(!anchor) return;
    const url = 'https://api.open-meteo.com/v1/meteofrance'
      + '?latitude='  + GEO.lat
      + '&longitude=' + GEO.lng
      + '&models=arome_france'
      + '&hourly=temperature_2m,weather_code,precipitation,cloud_cover'
      + '&forecast_days=2'
      + '&timezone=Europe%2FParis';
    try{
      const r = await fetch(url, { cache:'no-store' });
      if(!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const H = j && j.hourly;
      if(!H || !H.time || !H.time.length) throw new Error('no data');

      const codeOf = (i)=>{
        let c = H.weather_code ? H.weather_code[i] : null;
        if(c == null) c = deriveCode(H.precipitation && H.precipitation[i], H.cloud_cover && H.cloud_cover[i]);
        return c;
      };
      const items = H.time.map((t,i)=>{
        const [ic,desc] = wmo(codeOf(i));
        return { hour: parseInt(t.slice(11,13),10), temp: H.temperature_2m[i], icon: ic, desc: desc };
      });

      // Repère l'heure courante (les données peuvent commencer à minuit)
      const nowD = new Date();
      let idx = H.time.findIndex(t => new Date(t) >= nowD);
      if(idx > 0) idx -= 1;          // inclut l'heure en cours comme "maintenant"
      if(idx < 0) idx = 0;

      const hours = items.slice(idx, idx + HOURS_AHEAD);
      if(hours.length) render(hours);
      else hideAll();
    }catch(e){
      hideAll();   // repli silencieux
    }
  }

  // Charge quand le DOM est prêt, puis rafraîchit toutes les 30 min
  function start(){ load(); setInterval(load, 30*60*1000); }
  if(document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();


/* ===== Écran de connexion : METAR brut de LFOB (API AVWX) =====
   NOTE SÉCURITÉ : ce token est visible dans le code de la page (écran affiché
   avant le mot de passe). Pour le protéger, passer par un proxy serveur.
   L'appel utilise ?token= pour éviter une requête preflight CORS. */
(function(){
  const ICAO  = 'LFOB';
  const TOKEN = 'wWkBCGbZKxdLizF7FgzOgeuQzqrWk_IBIJsTXn-DeoE';

  async function fetchRaw(kind){
    const url = 'https://avwx.rest/api/' + kind + '/' + ICAO
              + '?token=' + encodeURIComponent(TOKEN)
              + '&onfail=cache';
    const r = await fetch(url, { cache:'no-store' });
    if(!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    return (j && (j.raw || j.sanitized)) || '';
  }

  async function load(){
    const box   = document.getElementById('homeMetar');
    if(!box) return;
    const mEl   = document.getElementById('hmMetar');
    const tEl   = document.getElementById('hmTaf');
    const tLbl  = document.getElementById('hmTafLabel');

    // METAR (obligatoire pour afficher la boîte)
    let metar = '';
    try { metar = await fetchRaw('metar'); } catch(e){ metar = ''; }
    if(!metar){ box.style.display = 'none'; return; }
    if(mEl) mEl.textContent = metar;
    box.style.display = 'block';

    // TAF (optionnel)
    try {
      const taf = await fetchRaw('taf');
      if(taf){
        if(tEl)  tEl.textContent = taf;
        if(tLbl) tLbl.style.display = 'block';
      } else {
        if(tEl)  tEl.textContent = '';
        if(tLbl) tLbl.style.display = 'none';
      }
    } catch(e){
      if(tEl)  tEl.textContent = '';
      if(tLbl) tLbl.style.display = 'none';
    }
  }

  function start(){ load(); setInterval(load, 10*60*1000); }  // rafraîchi toutes les 10 min
  if(document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();


/* ===== Écran de connexion : anecdotes aéro (rotation à chaque changement de photo) ===== */
(function(){
  const FACTS = ["L'ACARS est un système de liaison de données qui permet aux avions d'échanger par texte avec le sol (devis de masse, météo, comptes rendus techniques, horaires).", "Les avions transmettent automatiquement quatre horaires clés appelés OOOI : le repoussage, le décollage, l'atterrissage et l'arrivée au parking.", "Grâce au CPDLC, les pilotes reçoivent et confirment les instructions du contrôle par messages texte, ce qui désengorge la fréquence radio.", "Avec l'ADS-B, chaque avion diffuse en continu sa position GPS et son identité, ce qui permet de le suivre même sans radar.", "En zone océanique, l'ADS-C fait envoyer par l'avion sa position au contrôle selon un « contrat » défini à l'avance.", "Au-dessus des océans, là où il n'y a pas de radar, l'avion et le contrôle s'échangent position et instructions par liaison de données : c'est le rôle du système FANS.", "Le SELCAL permet de faire « sonner » un avion précis à la radio, pour que l'équipage n'ait pas à écouter la fréquence en permanence.", "Sur les longues traversées océaniques, les avions communiquent encore souvent en ondes courtes (HF), qui portent très loin.", "Le transpondeur est la petite boîte qui répond au radar : il renvoie un code, l'altitude et l'identité de l'avion pour l'afficher sur l'écran du contrôleur.", "Avant d'entrer sur une route transatlantique, un équipage doit obtenir une autorisation océanique fixant sa route, son niveau et son Mach.", "Certains aéroports diffusent leur information (piste en service, météo) directement par datalink : c'est le D-ATIS.", "En vol, on peut recevoir la météo de plusieurs terrains grâce au VOLMET, diffusé en boucle sur des fréquences dédiées.", "L'ETOPS autorise un biréacteur à s'éloigner d'un terrain de déroutement de 60, 120, 180 minutes, voire davantage selon sa certification.", "Un avion certifié ETOPS 330 peut voler jusqu'à 330 minutes d'un aéroport de secours, ce qui ouvre des routes très isolées.", "Pour rester en ETOPS, l'équipage s'assure que ses aéroports de déroutement resteront ouverts et sous de bonnes conditions météo pendant toute la traversée isolée.", "Au-dessus de l'Atlantique Nord, les avions empruntent des « autoroutes » (le NAT-OTS) recalculées deux fois par jour selon le jet-stream.", "En océanique, les pilotes se décalent volontairement de un ou deux milles (procédure SLOP) pour réduire le risque de collision frontale.", "Le point de non-retour marque l'instant au-delà duquel l'avion n'a plus assez de carburant pour revenir à son point de départ.", "Sans radar au milieu de l'océan, la séparation entre avions repose sur des comptes rendus de position et sur l'ADS-C.", "Le TCAS scrute les transpondeurs des avions voisins et déclenche d'abord une alerte de trafic, puis un ordre d'évitement si nécessaire.", "Quand le TCAS émet un « Resolution Advisory », les pilotes suivent la manœuvre verticale immédiatement, avant même de prévenir le contrôle.", "Un ordre d'évitement du TCAS prime sur l'instruction du contrôleur : on obéit d'abord au système anticollision.", "Le code transpondeur 7500 signale un détournement, 7600 une panne radio et 7700 une urgence générale.", "En appuyant sur « IDENT », un pilote fait clignoter son plot sur l'écran du contrôleur pour se faire repérer.", "La navigation moderne ne suit plus des balises au sol : l'avion se guide au GPS en garantissant lui-même une précision définie.", "Les départs et arrivées aux instruments (SID et STAR) sont des trajectoires publiées qui évitent de tout détailler à la radio.", "Les approches ILS se classent en catégories I, II et III, avec des minimums de visibilité de plus en plus faibles.", "En catégorie III, un avion peut se poser par visibilité quasi nulle, souvent en atterrissage automatique.", "La hauteur de décision est le point où, en approche de précision, le pilote doit voir la piste ou remettre les gaz.", "Le GPS ne sert pas qu'à la route : il permet aussi des approches guidées jusqu'à basse altitude, presque comme un ILS.", "EGNOS est un système européen qui corrige et fiabilise le signal GPS, au point de pouvoir guider un avion jusqu'en approche.", "Le PAPI est cette rampe de feux au bord de la piste qui indique au pilote s'il est trop haut (blanc) ou trop bas (rouge).", "Quand la visibilité chute fortement, l'aéroport passe en « procédures basse visibilité » : on protège certaines zones au sol et on espace davantage les avions.", "Les moyens radio classiques comme le VOR, le DME ou le NDB restent utilisés en secours de la navigation par satellite.", "Réglé sur le QNH, l'altimètre affiche l'altitude réelle par rapport au niveau de la mer ; c'est le calage utilisé pour décoller, approcher et rester à l'écart du relief.", "Au-dessus de l'altitude de transition, tous les avions calent leur altimètre sur la pression standard de 1013 hPa.", "Un niveau de vol comme le FL350 correspond à environ 35 000 pieds mesurés à ce calage standard.", "L'atmosphère standard de référence (ISA) fixe 15 °C et 1013 hPa au niveau de la mer, avec une baisse d'environ 2 °C par 1000 pieds.", "Le RVSM permet d'espacer les avions de seulement 1000 pieds entre le FL290 et le FL410, doublant la capacité de ces niveaux.", "À vitesse indiquée constante, un avion va en réalité de plus en plus vite en montant, car l'air se raréfie.", "En montée, on vole d'abord à vitesse indiquée constante, puis on bascule sur un nombre de Mach constant.", "En très haute altitude, l'air raréfié rapproche la vitesse de décrochage et la vitesse maximale : ce « coffin corner » laisse une marge de manœuvre très étroite au pilote.", "La vitesse V1 est celle au-delà de laquelle on poursuit le décollage même en cas de panne moteur, car s'arrêter deviendrait trop risqué.", "La vitesse VR est celle à laquelle le pilote tire sur le manche pour faire décoller l'avion.", "La vitesse V2 est la vitesse de sécurité tenue en montée initiale : elle garantit une pente et un contrôle suffisants même si un moteur lâche juste après le décollage.", "La longueur de piste « équilibrée » est calculée pour qu'après une panne à V1, s'arrêter ou décoller demande exactement la même distance.", "Les « distances déclarées » d'une piste indiquent la longueur réellement disponible pour accélérer, décoller ou atterrir, dégagements compris.", "La masse maximale au décollage d'un jour donné dépend de la piste, des obstacles, de la température et de la pression.", "Pour ménager les moteurs, les pilotes affichent souvent une température fictive plus élevée (flex) afin de décoller à poussée réduite.", "Un décollage interrompu (RTO) est l'une des sollicitations les plus violentes pour les freins d'un avion.", "Il existe des procédures anti-bruit au décollage (NADP) qui privilégient soit les riverains proches, soit ceux plus éloignés.", "Les avions ont plusieurs masses limites à respecter : au décollage, à l'atterrissage et sans carburant.", "Le devis de masse et centrage, établi avant chaque vol, vérifie que le poids et la position du centre de gravité restent dans les limites.", "Un centrage légèrement arrière réduit la traînée de l'empennage et fait donc un peu économiser de carburant.", "Une modification de charge de dernière minute (LMC) est possible après l'édition du devis, mais seulement dans des limites précises.", "Le fret voyage dans des conteneurs et palettes normalisés (les ULD) qui s'emboîtent parfaitement dans la soute.", "Quand un avion transporte des marchandises dangereuses, le commandant reçoit un document (NOTOC) précisant leur nature et leur emplacement.", "La façon de répartir la charge en soute influence directement l'équilibre et le centrage de l'avion.", "Le « tankering » consiste à embarquer volontairement plus de carburant pour éviter d'en acheter à une escale où il est plus cher.", "Le carburant emporté se décompose toujours en plusieurs parts : roulage, trajet, marge d'aléas, dégagement, réserve finale et éventuel extra.", "La réserve finale correspond à peu près à 30 minutes d'attente au-dessus de l'aéroport de dégagement, un minimum intouchable.", "En déclarant « minimum fuel », un pilote prévient qu'il ne peut plus accepter de retard sans entamer ses réserves ; s'il annonce « mayday fuel », c'est déjà une urgence carburant.", "Certains gros-porteurs peuvent larguer du carburant en vol pour redescendre sous leur masse maximale à l'atterrissage.", "Le calculateur de bord (FMS) gère la route, calcule les performances et prédit en continu le carburant et les heures d'arrivée.", "Un réglage appelé « cost index » indique à l'avion s'il doit plutôt économiser le carburant ou gagner du temps, ce qui fixe sa vitesse de croisière.", "À mesure qu'il s'allège, un avion monte par paliers vers son altitude optimale : ce sont les « step climbs ».", "Le point de descente calculé par le FMS permet à l'avion de descendre moteurs réduits, presque en vol plané.", "Une descente continue, sans palier, économise du carburant et réduit le bruit au sol.", "Le FADEC est le calculateur qui pilote entièrement le moteur en respectant automatiquement ses limites.", "L'air chaud prélevé sur les moteurs (le bleed) sert à pressuriser la cabine et à dégivrer les ailes.", "La pression en cabine est régulée en dosant l'air qui s'échappe par une vanne appelée outflow valve.", "L'APU est un petit moteur à l'arrière de l'avion qui fournit électricité et air au sol et permet de démarrer les réacteurs.", "En cas de perte majeure d'énergie, une petite éolienne de secours (la RAT) se déploie sous l'avion pour fournir l'essentiel.", "Chez Airbus, les trois circuits hydrauliques sont repérés par des couleurs : vert, bleu et jaune.", "Les avions modernes ont un système anti-blocage des roues au freinage, un peu comme l'ABS d'une voiture.", "Un pneu d'avion trop chaud est dégonflé automatiquement par un bouchon fusible, pour éviter qu'il n'éclate.", "Un tube Pitot bouché par du givre ou un insecte peut fausser l'indication de vitesse : c'est un piège classique.", "Les sondes d'incidence mesurent l'angle de l'aile par rapport au vent, donnée essentielle pour anticiper le décrochage.", "Un avion décroche à cause d'un angle d'attaque trop grand, pas simplement parce qu'il vole trop lentement.", "Sur les Airbus, une protection appelée « alpha floor » remet automatiquement pleine poussée si l'incidence devient dangereuse.", "Les commandes électriques (fly-by-wire) empêchent l'avion de sortir de son domaine de vol grâce à des protections intégrées.", "Près du sol, un avion bénéficie d'un surplus de portance appelé effet de sol, bien ressenti à l'arrondi.", "Les tourbillons créés au bout des ailes forment la turbulence de sillage qui suit chaque avion.", "Les winglets, ces ailerons verticaux en bout d'aile, réduisent ces tourbillons et donc la consommation.", "On classe les avions par catégorie de sillage (léger, moyen, lourd, super) pour savoir de combien les espacer.", "Le mot « heavy » accolé à un indicatif prévient que l'avion est un gros-porteur générant un fort sillage.", "La turbulence en air clair est particulièrement traître car le radar météo ne peut pas la détecter.", "Le radar météo d'un avion voit les précipitations, mais pas la turbulence sèche ni les nuages sans eau.", "Sous le vent des montagnes, des ondes orographiques peuvent secouer un avion loin du relief.", "Le système d'alerte de proximité du sol (EGPWS) compare l'avion à une carte du relief et crie « PULL UP » en cas de danger.", "Le cisaillement de vent (windshear) est un changement brutal de vent, redoutable près du sol au décollage comme en approche.", "Sous 10 000 pieds, la règle du « cockpit stérile » interdit toute conversation non essentielle, car c'est la phase où surviennent la plupart des incidents.", "La gestion des ressources de l'équipage (CRM) enseigne la communication et le partage des tâches pour éviter les erreurs.", "Une approche doit être « stabilisée » (bonne vitesse, bonne configuration) avant une certaine hauteur, sinon on remet les gaz.", "Une remise des gaz est une manœuvre parfaitement normale : renoncer à se poser n'a rien d'un échec.", "Les fameuses « boîtes noires » sont en fait deux enregistreurs oranges : l'un pour les données de vol, l'autre pour les voix du cockpit.", "Les compagnies analysent systématiquement les données de vol enregistrées pour repérer les tendances à risque avant l'accident.", "Chaque avion emporte une balise de détresse qui, en cas de crash, est relayée par un réseau de satellites pour localiser l'épave.", "Un METAR est un message d'observation météo d'un aérodrome, émis en général toutes les demi-heures et considéré représentatif environ deux heures après son émission.", "Un TAF est une prévision d'aérodrome, valable le plus souvent 24 ou 30 heures, qui sert surtout à anticiper la météo attendue à l'heure d'arrivée.", "Le code CAVOK résume une situation idéale : plus de 10 km de visibilité, pas de nuage gênant bas et aucun phénomène notable.", "Dans un METAR, la mention NOSIG signifie qu'aucun changement significatif n'est attendu à court terme.", "Dans un METAR, un vent noté 24012KT signifie qu'il souffle du 240° à 12 nœuds.", "Un NOTAM est un avis qui prévient les équipages d'un changement temporaire, comme une piste fermée ou une balise en panne.", "Un SIGMET alerte sur des phénomènes dangereux en route, comme les orages violents, le givrage sévère ou les cendres volcaniques.", "Un nuage de cendres volcaniques peut détruire des moteurs : les avions le contournent systématiquement.", "Dans le low-cost, la rotation au sol (turn-around) vise souvent 25 minutes seulement entre l'arrivée et le départ.", "Le « temps de bloc » se compte du retrait des cales au départ jusqu'à leur remise à l'arrivée, et sert de base aux calculs.", "Un avion est repoussé de son parking par un tracteur : reculer par ses propres moteurs est interdit sur presque tous les appareils.", "Le dégivrage utilise un fluide chaud pour enlever le givre, puis un fluide épais pour protéger l'avion jusqu'au décollage.", "Le fluide antigivrage ne protège l'avion qu'un temps limité, le « holdover time » : au-delà, s'il n'a pas décollé, il faut refaire le traitement.", "Au sol, l'avion est souvent alimenté en électricité par un groupe de parc (GPU), moteurs et APU éteints.", "Le plein de carburant se fait fréquemment avec les passagers à bord, sous conditions strictes de surveillance.", "Le freinage automatique (autobrake) se règle avant l'atterrissage sur différents niveaux selon la longueur de piste disponible.", "À l'atterrissage, l'essentiel du freinage vient des freins et des aérofreins ; l'inversion de poussée n'est qu'un complément.", "Dès le toucher des roues, des volets appelés « ground spoilers » se déploient pour plaquer l'avion et améliorer le freinage.", "Sur une piste mouillée ou enneigée, l'état de surface est codé pour que l'équipage recalcule ses distances d'atterrissage.", "Un seuil de piste décalé réduit la longueur d'atterrissage disponible, souvent pour des raisons d'obstacles.", "La MEL autorise à décoller avec certains équipements en panne, parce qu'ils sont redondants ou non essentiels, mais sous conditions et avec un délai de réparation imposé.", "Les tablettes de vol (EFB) ont remplacé les lourdes sacoches de cartes et de manuels papier des pilotes.", "En location « wet lease » (ACMI), une compagnie loue un avion avec son équipage, sa maintenance et son assurance.", "Chaque avion porte une immatriculation unique ; en France, elle commence toujours par la lettre F.", "Un « cycle » (un décollage suivi d'un atterrissage) fatigue autant la structure d'un avion qu'un certain nombre d'heures de vol.", "La maintenance suit des paliers de plus en plus poussés, du contrôle quotidien jusqu'à la grande visite qui immobilise l'avion des semaines.", "Une consigne de navigabilité (AD) est une réparation ou une vérification rendue obligatoire par l'autorité après un problème identifié.", "Le carnet de route (techlog) recense les pannes et les actions de maintenance, à disposition de chaque équipage.", "Quand le ciel est saturé, la régulation impose un créneau de décollage (slot) à respecter à quelques minutes près, sous peine de devoir attendre le suivant.", "La MSA est l'altitude minimale garantissant une marge de sécurité (souvent 300 m) au-dessus du relief et des obstacles dans un rayon donné autour d'un point.", "Quand l'ATC donne un « expect », il s'agit d'une prévision, surtout pas d'une autorisation.", "Le pilote doit toujours répéter (collationner) les instructions importantes du contrôle pour éviter tout malentendu.", "En approche, la séparation radar minimale entre deux avions est souvent de 3 milles nautiques.", "Un vol IFR se déroule aux instruments sous le contrôle de l'ATC, alors qu'un vol VFR repose sur le fait de voir et d'éviter.", "Le plan de vol déposé avant le départ réserve auprès du contrôle la route et le niveau que l'avion compte suivre.", "L'OACI attribue à chaque aérodrome un code de quatre lettres : Beauvais-Tillé est ainsi LFOB.", "En France, tous les codes OACI d'aérodrome commencent par les lettres LF.", "Chaque type d'avion a une limite de vent traversier au-delà de laquelle décoller ou atterrir n'est plus autorisé.", "Par vent de travers, le pilote se présente en crabe puis « décrabe » juste avant de toucher la piste.", "Une piste contaminée par de l'eau, de la neige ou de la gadoue allonge le décollage et dégrade fortement le freinage.", "Quand la température est proche du point de rosée, le brouillard et le givrage deviennent probables.", "Le Boeing 787 se distingue en utilisant beaucoup d'électricité là où les autres avions prélèvent de l'air sur les moteurs.", "Le fly-by-wire a remplacé les câbles reliant le manche aux gouvernes par des commandes électriques et des calculateurs.", "La poussée est gérée automatiquement par l'autothrust, qui ajuste les moteurs pour tenir une vitesse ou un mode donné.", "Un amortisseur de lacet (yaw damper) corrige automatiquement les petits mouvements parasites en croisière.", "Le trim de profondeur équilibre l'avion pour que le pilote n'ait plus à forcer en permanence sur le manche.", "Avant de s'aligner, l'équipage vérifie la configuration de décollage : volets, trim et aérofreins, sous peine d'alarme.", "L'aérofrein sorti en vol augmente la traînée pour descendre ou ralentir plus rapidement.", "Sur les Airbus, l'ordinateur assiste en permanence le pilote ; après certaines pannes, ces protections automatiques se réduisent et le pilotage redevient plus direct.", "Le radioaltimètre mesure la vraie hauteur au-dessus du sol par renvoi radio, très précis dans les derniers pieds.", "Les annonces de hauteur en approche (« FIFTY, FORTY… ») proviennent justement du radioaltimètre.", "Le carburant de dégagement sert, si l'atterrissage à destination devient impossible, à remettre les gaz puis à rejoindre un aéroport de secours prévu à l'avance.", "On prévoit un dégagement au décollage quand la météo du terrain de départ est sous les minimums d'atterrissage : si l'avion devait faire demi-tour, souvent avec un moteur en panne, il ne pourrait pas s'y reposer, d'où un terrain proche et vite atteignable.", "Par forte chaleur ou en altitude, l'air moins dense réduit portance et poussée : les performances chutent.", "Réduire la poussée au décollage quand la piste le permet allonge nettement la durée de vie des moteurs.", "L'inversion de poussée est souvent ramenée au ralenti en dessous d'une certaine vitesse pour éviter d'aspirer des débris.", "Après un freinage énergique, on respecte un temps de refroidissement des freins avant de repartir.", "Un SIGMET de cendres volcaniques peut fermer des routes entières, comme lors de l'éruption islandaise de 2010.", "Un compte rendu de pilote (PIREP) partage aux autres équipages les conditions réellement rencontrées en vol.", "La rencontre du sillage d'un gros-porteur est plus dangereuse en approche, quand les avions sont lents et rapprochés.", "Le nombre de Mach exprime la vitesse d'un avion par rapport à celle du son, qui varie avec la température.", "Le jet-stream, ce courant d'air très rapide en altitude, peut faire gagner ou perdre beaucoup de temps selon le sens du vol.", "Un avion de ligne, même sans moteur, plane sur une longue distance : environ 15 km pour chaque kilomètre d'altitude perdu.", "Le radar météo se règle en inclinaison et en gain, car mal orienté il peut masquer un orage au lieu de le montrer.", "Un ordre de montée ou de descente non respecté (level bust) est une erreur prise très au sérieux par le contrôle.", "L'anglais aéronautique répond à une phraséologie stricte où chaque mot a un sens précis pour éviter toute ambiguïté.", "« Line up and wait » demande de s'aligner sur la piste et d'attendre, ce n'est pas encore l'autorisation de décoller.", "Être « cleared for the approach » autorise à commencer l'approche, mais pas encore à se poser.", "Le briefing d'approche passe en revue la piste, les minimums, la configuration et la trajectoire de remise des gaz.", "Le premier vol motorisé des frères Wright, en 1903, n'a duré que douze secondes et parcouru moins de quarante mètres.", "Le mot « avion » vient de Clément Ader, qui baptisa ainsi son appareil à la fin du XIXe siècle.", "En 1919 s'ouvrait la première ligne aérienne régulière internationale, entre Londres et Paris.", "Saint-Exupéry, l'auteur du Petit Prince, était pilote de l'Aéropostale et connaissait bien les vols de nuit sur l'Afrique.", "Le mur du son a été franchi pour la première fois en 1947 par Chuck Yeager à bord du Bell X-1.", "Le Concorde s'allongeait de quinze à vingt-cinq centimètres en croisière, sous l'effet de l'échauffement de l'air.", "À bord du Concorde, à la limite de l'espace, on pouvait distinguer la courbure de la Terre.", "Le plus grand avion jamais construit, l'Antonov An-225, possédait six moteurs et trente-deux roues.", "Le SR-71 Blackbird fuyait légèrement au sol : il ne devenait étanche qu'une fois dilaté par la chaleur en vol.", "Un Boeing 747 est assemblé à partir d'environ six millions de pièces.", "L'aéroport le plus haut desservi par des lignes régulières se situe au Tibet, à plus de 4 400 mètres d'altitude.", "Le célèbre « amerrissage sur l'Hudson » de 2009 a vu un A320 se poser sur le fleuve sans aucune victime, les deux moteurs détruits par des oiseaux.", "Le « Gimli Glider », un 767 tombé en panne sèche en 1983, a plané jusqu'à un atterrissage réussi sur une ancienne piste.", "Amerrir, c'est se poser sur l'eau ; atterrir, sur la terre : deux mots distincts et deux techniques différentes.", "Les premières hôtesses de l'air, dans les années 1930, étaient souvent recrutées parmi les infirmières.", "Le badge en forme d'ailes porté par les pilotes est un héritage direct des traditions militaires.", "La fréquence 121,5 MHz est réservée dans le monde entier aux appels de détresse et reste écoutée en permanence.", "Un avion en détresse devient prioritaire sur tout le reste du trafic aérien.", "Le vol vers l'est est souvent plus court qu'à l'aller, car l'avion profite du jet-stream qui souffle d'ouest en est.", "Les routes transatlantiques changent chaque jour pour coller au mieux aux vents d'altitude.", "On mesure les altitudes en pieds et les vitesses en nœuds, unités universelles de l'aviation.", "Un nœud correspond à un mille marin par heure, soit environ 1,85 km/h.", "La couleur blanche domine sur les avions car elle reflète la chaleur et fait mieux ressortir les fissures ou les fuites.", "Repeindre entièrement un gros-porteur peut lui ajouter plusieurs centaines de kilos.", "Les feux de position sont rouges à gauche et verts à droite, ce qui permet de deviner le sens de déplacement d'un avion la nuit.", "Le feu anticollision rouge qui clignote rend l'avion visible de loin, de jour comme de nuit.", "Les hublots sont ovales plutôt que carrés, car les angles vifs concentreraient dangereusement les contraintes.", "Le minuscule trou percé dans les hublots équilibre la pression entre les épaisseurs de la vitre et évite la buée.", "Les pneus d'avion sont gonflés à l'azote, qui réagit moins que l'air aux écarts extrêmes de température.", "La cabine est pressurisée pour simuler une altitude d'environ 1 800 à 2 400 mètres, bien plus basse que l'altitude réelle.", "C'est cette faible pression, plus l'air sec, qui rend les plats fades et pousse à saler et sucrer davantage la nourriture à bord.", "Le taux de renouvellement de l'air en cabine est élevé, l'air étant en partie recyclé à travers des filtres très fins.", "Beaucoup de compagnies sautent le rang numéro 13 dans leurs cabines, par simple superstition.", "Les gilets de sauvetage sont rangés sous les sièges plutôt que dans les coffres pour rester accessibles en cas d'urgence.", "On tamise l'éclairage en cabine pour un atterrissage de nuit afin d'habituer les yeux à l'obscurité en cas d'évacuation.", "La réglementation impose qu'un avion puisse être totalement évacué en quatre-vingt-dix secondes.", "Les toboggans d'évacuation se gonflent en quelques secondes seulement une fois la porte ouverte en mode « armé ».", "En cas de dépressurisation, les masques tombent automatiquement et il faut mettre le sien avant d'aider les autres.", "La foudre frappe régulièrement les avions, mais la carlingue métallique agit comme une cage de Faraday et protège l'intérieur.", "Les traînées blanches derrière les avions sont de la vapeur d'eau qui gèle instantanément dans l'air glacial d'altitude.", "En croisière, il fait souvent autour de -50 °C à l'extérieur de l'avion.", "Le carburant d'aviation est formulé pour rester liquide malgré ces températures extrêmes.", "Un avion de ligne stocke la majeure partie de son carburant dans les ailes.", "Les ailes d'un Boeing 787 peuvent se courber de plusieurs mètres vers le haut sans le moindre problème : c'est voulu.", "Lors des essais, on plie délibérément les ailes d'un prototype jusqu'à la rupture pour vérifier les marges de sécurité.", "La certification d'un tout nouveau modèle d'avion s'étale généralement sur plusieurs années d'essais.", "Un avion ne rapporte de l'argent que lorsqu'il vole ; au sol, il ne fait que coûter.", "Le modèle low-cost repose souvent sur un seul type d'avion, ce qui simplifie maintenance et formation des équipages.", "La turbulence secoue surtout les passagers non attachés : la ceinture reste la meilleure des protections.", "Les nuages gênent peu la croisière, qui se déroule le plus souvent bien au-dessus d'eux.", "Le contrôle aérien fonctionne sans interruption : un avion est toujours en contact avec une tour ou un centre.", "Le transfert d'un avion d'un secteur de contrôle au suivant se fait par un simple changement de fréquence, sur instruction.", "Le radar dit « secondaire » ne détecte pas l'avion passivement : il interroge son transpondeur, qui répond.", "Des sites publics permettent aujourd'hui de suivre en temps réel presque tous les avions, grâce à l'ADS-B qu'ils diffusent.", "Le givre sur une aile en dégrade fortement la portance : c'est pourquoi le dégivrage avant décollage est vital.", "Le fluide de dégivrage est coloré (souvent orange ou vert) pour qu'on voie bien où il a été appliqué et qu'aucune zone de l'aile ne soit oubliée.", "Un hélicoptère peut rester en vol stationnaire, ce qu'un avion classique est incapable de faire.", "Le rotor d'un hélicoptère se comporte comme une aile qui tourne pour créer sa portance.", "Les montgolfières furent les premiers engins à emporter des humains dans les airs, dès 1783.", "Les tout premiers passagers d'un vol en montgolfière furent un mouton, un canard et un coq.", "L'avion solaire Solar Impulse a bouclé un tour du monde sans une goutte de carburant.", "Les carburants durables d'aviation (SAF) visent à réduire fortement l'empreinte carbone des vols sans changer les avions.", "Rapporté à chaque passager, un avion moderne consomme bien moins de carburant qu'un appareil équivalent d'il y a cinquante ans.", "L'un des plus petits aéroports commerciaux au monde, à Saba dans les Caraïbes, n'a qu'environ 400 mètres de piste bordée de falaises.", "La tour de contrôle la plus haute du monde, à Bangkok, dépasse les 130 mètres.", "Un avion se gare presque toujours nez vers l'extérieur, car il ne peut pas reculer efficacement seul.", "Le duty-free est né de l'exonération de certaines taxes sur les ventes réalisées en zone internationale.", "Passer la ligne de changement de date peut donner l'impression de « voyager dans le temps » d'un jour entier.", "Selon les fuseaux traversés, un vol peut afficher une arrivée à une heure locale antérieure à son départ.", "Le décalage horaire vient de la désynchronisation entre l'horloge interne du corps et l'heure locale d'arrivée.", "Sur les vols très longs, un équipage de renfort permet d'allonger la durée totale de service en se relayant.", "Le commandant de bord détient l'autorité finale sur la sécurité et peut, si besoin, déroger à certaines règles.", "Le niveau d'anglais des pilotes est évalué régulièrement, un minimum étant exigé pour la radio internationale.", "Louis Blériot fut le premier à traverser la Manche en avion, en 1909, en une trentaine de minutes.", "En 1927, Charles Lindbergh relia New York à Paris en solitaire et sans escale à bord du Spirit of St. Louis.", "Le Spirit of St. Louis n'avait pas de pare-brise avant : Lindbergh regardait sur les côtés ou utilisait un petit périscope.", "Amelia Earhart fut la première femme à traverser l'Atlantique en solo, avant de disparaître au-dessus du Pacifique en 1937.", "Bessie Coleman, première femme afro-américaine brevetée pilote, a dû venir en France en 1921 pour obtenir sa licence.", "Le premier vol commercial payant de l'histoire eut lieu en 1914 en Floride, avec un unique passager à bord.", "Le premier repas servi en vol, en 1919, se résumait à une simple boîte-repas froide.", "La première hôtesse de l'air, l'Américaine Ellen Church, prit son service en 1930 ; elle était infirmière.", "La Convention de Chicago, en 1944, a posé les bases de l'aviation civile mondiale et créé l'OACI.", "Le dirigeable Hindenburg, détruit par les flammes en 1937, marqua la fin de l'âge d'or des zeppelins.", "« Wrong Way » Corrigan traversa l'Atlantique en 1938 en prétendant s'être trompé de direction.", "Le premier tour du monde en avion sans escale ni ravitaillement fut réalisé en 1986 par le Voyager.", "Le premier tour du monde en ballon sans escale date de 1999.", "L'avion-fusée X-15 a atteint la limite de l'espace et reste l'avion habité le plus rapide, à près de Mach 6,7.", "L'avion espion U-2 vole si haut que ses pilotes portent une combinaison proche de celle des astronautes.", "La ligne de Kármán, à 100 km d'altitude, est la frontière conventionnelle entre l'atmosphère et l'espace.", "La checklist du pilote est née après le crash d'un prototype de bombardier en 1935, trop complexe à gérer de mémoire.", "La gestion de l'équipage moderne (CRM) s'est développée après des accidents où les erreurs humaines et de communication étaient en cause.", "Le Concorde volait à Mach 2, soit deux fois la vitesse du son.", "Le Concorde reliait New York à Londres en moins de trois heures et demie.", "Seuls vingt Concorde furent construits, dont quatorze exploités en ligne.", "Le Tupolev Tu-144 soviétique, rival du Concorde, fut surnommé le « Concordski ».", "Le premier avion de ligne à réaction, le Comet, subit des accidents dus à la fatigue autour de ses hublots carrés : on les a depuis arrondis.", "Le franchissement du mur du son crée une onde de choc que l'on entend au sol comme un « bang » supersonique.", "L'aéroport le plus fréquenté du monde est le plus souvent celui d'Atlanta, aux États-Unis.", "Le plus grand aéroport du monde par sa superficie, en Arabie saoudite, est plus vaste que certains pays.", "L'usine Boeing d'Everett, où l'on assemble les gros-porteurs, est l'un des plus grands bâtiments du monde en volume.", "Le vol régulier le plus court du monde, entre deux îles écossaises, dure moins de deux minutes.", "Le plus long vol commercial sans escale dépasse dix-huit heures.", "Le Cessna 172 est l'avion le plus produit de toute l'histoire.", "Le Boeing 737 est l'avion de ligne le plus vendu de tous les temps.", "Le DC-3, conçu dans les années 1930, vole encore dans quelques compagnies à travers le monde.", "Le B-52, surnommé BUFF, est entré en service dans les années 1950 et pourrait voler jusqu'aux années 2050.", "Le Spruce Goose d'Howard Hughes, longtemps recordman d'envergure, n'a volé qu'une seule fois, en 1947.", "Le Boeing 747 est surnommé « Jumbo Jet » et « Queen of the Skies ».", "À ses débuts, le pont supérieur du 747 abritait souvent un salon ou un bar pour les passagers de première.", "Le Beluga d'Airbus, à la silhouette de baleine, sert à transporter des morceaux d'avion entre les usines.", "« Air Force One » n'est pas un avion précis, mais l'indicatif radio de tout appareil transportant le président des États-Unis.", "L'avion « jour du Jugement » (E-4B) est un poste de commandement volant conçu pour résister à une crise majeure.", "L'A380 est le plus gros avion de ligne, avec deux ponts complets et jusqu'à plus de 800 passagers.", "L'aéroport de Schiphol, à Amsterdam, est situé sous le niveau de la mer.", "À Gibraltar, une route traverse la piste et la circulation est stoppée à chaque décollage.", "L'aéroport de Barra, en Écosse, possède une piste sur la plage, recouverte par la mer à marée haute.", "L'altiport de Courchevel a une piste très courte et fortement inclinée, réservée aux pilotes qualifiés.", "À Saint-Martin, les avions passent à quelques mètres au-dessus de la plage de Maho avant de se poser.", "L'aéroport de Paro, au Bhoutan, est réputé si difficile que seule une poignée de pilotes est autorisée à s'y poser.", "L'ancien aéroport de Kai Tak, à Hong Kong, était célèbre pour son virage serré entre les immeubles à l'atterrissage.", "La tour de contrôle la plus haute du monde, à l'aéroport de Bangkok, dépasse 130 mètres.", "KLM, fondée en 1919, est la plus ancienne compagnie aérienne encore active sous son nom d'origine.", "Le nom Qantas est l'abréviation de « Queensland and Northern Territory Aerial Services ».", "Le programme de fidélité aérien tel qu'on le connaît a été lancé par American Airlines au début des années 1980.", "La compagnie Pan Am, disparue en 1991, reste une icône de l'âge d'or de l'aviation.", "Dans les années 1960-70, la compagnie Braniff faisait peindre ses avions dans des couleurs vives et variées.", "Le mot « avion » a été forgé par le pionnier français Clément Ader.", "Le mot « cockpit » viendrait de l'univers des combats de coqs, désignant un espace exigu et agité.", "« Mayday », le signal de détresse international, vient du français « m'aidez ».", "« Pan-Pan », signal d'urgence moins grave que Mayday, vient du mot français « panne ».", "L'alphabet radio va d'Alpha à Zulu pour éviter toute confusion entre lettres qui se ressemblent.", "En aviation, « Zulu » désigne l'heure universelle (UTC), la même pour tous les équipages du monde.", "« Roger » signifie simplement « bien reçu » à la radio.", "On embarque traditionnellement par le côté gauche de l'avion, un héritage du monde maritime où l'on accostait par bâbord.", "En anglais aéronautique comme en marine, le côté gauche se dit « port » et le droit « starboard ».", "Le mot « tarmac » vient du « tarmacadam », un revêtement de route inventé au début du XXe siècle.", "L'anglais est la langue officielle des communications de l'aviation civile dans le monde entier.", "La « boîte noire » est en réalité peinte en orange vif pour être retrouvée plus facilement.", "L'enregistreur de vol a été inventé dans les années 1950 par l'Australien David Warren.", "Une boîte noire est conçue pour survivre à un incendie intense et à une immersion profonde, et émet un signal sonore sous l'eau.", "Même sur les vols non-fumeurs, la réglementation impose toujours un cendrier sur la porte des toilettes, au cas où.", "Les toilettes d'avion fonctionnent par aspiration, et leur contenu n'est jamais largué en vol, contrairement à la légende.", "On tamise l'éclairage de la cabine à l'atterrissage de nuit pour habituer les yeux en cas d'évacuation.", "Les masques à oxygène ne fournissent qu'une dizaine de minutes d'air, largement assez pour redescendre à basse altitude.", "La position de sécurité (« brace ») vise à limiter les mouvements du corps lors d'un impact.", "Le sifflet et la petite lampe du gilet de sauvetage servent à se signaler une fois dans l'eau.", "Le fameux dilemme « poulet ou bœuf » est devenu le symbole du repas en avion.", "Pilote et copilote mangent souvent des plats différents pour éviter d'être malades tous les deux en même temps.", "On demande de relever les stores au décollage et à l'atterrissage pour pouvoir voir dehors en cas d'urgence.", "À cause de la faible pression et de l'air sec en cabine, les plats paraissent fades : on les assaisonne donc davantage.", "L'air en cabine est renouvelé très régulièrement et filtré finement, en partie recyclé.", "L'humidité en cabine est très basse, souvent autour de 10 à 20 %, d'où la sensation de bouche sèche.", "La couleur blanche des avions reflète la chaleur et fait mieux ressortir les fissures et les fuites lors des inspections.", "Les feux de position sont rouges à gauche et verts à droite, ce qui aide à deviner le sens d'un avion la nuit.", "Les hublots sont arrondis car des angles vifs concentreraient les contraintes et risqueraient de fissurer.", "Le petit trou percé dans les hublots équilibre la pression entre les vitres et évite la formation de buée.", "La foudre frappe régulièrement les avions sans danger, la carlingue agissant comme une cage de Faraday.", "Les traînées blanches derrière les avions sont de la vapeur d'eau qui gèle dans l'air glacial de haute altitude.", "Un avion de ligne, même sans moteur, plane longtemps : environ 15 km pour chaque kilomètre d'altitude perdu.", "Sur une carte plate, les routes aériennes semblent courbes, car le plus court chemin sur le globe suit un « grand cercle ».", "Les vols entre l'Europe et l'Asie de l'Est passent souvent au-dessus des régions polaires, plus courtes à vol d'oiseau.", "Parce que le pôle magnétique se déplace, certains aéroports doivent renuméroter leurs pistes au fil des années.", "Franchir la ligne de changement de date peut donner l'impression de voyager dans le temps d'un jour entier.", "Selon les fuseaux traversés, un vol peut afficher une heure d'arrivée locale antérieure à son heure de départ.", "Le décalage horaire vient du déphasage entre l'horloge interne du corps et l'heure locale à l'arrivée.", "Chaque aéroport possède un code de trois lettres : CDG pour Roissy, ORY pour Orly, BVA pour Beauvais.", "Les grandes plateformes fonctionnent en « hub » : les vols convergent puis repartent pour multiplier les correspondances.", "Beaucoup de compagnies évitent le rang numéro 13 dans leurs cabines, par simple superstition.", "Le « mile-high club » est une expression humoristique désignant ceux qui prétendent avoir eu une aventure en plein vol.", "Les premières projections de films à bord remontent aux années 1920.", "Le champagne servi en vol pétille différemment à cause de la pression réduite en cabine.", "Fumer est interdit à bord depuis des décennies, mais les consignes lumineuses « no smoking » sont restées longtemps par habitude.", "Un membre d'équipage voyageant comme passager pour rejoindre son avion est dit en « deadhead ».", "Un vol de nuit très matinal est surnommé un « red-eye » en anglais, à cause de la fatigue qu'il provoque.", "Le siège au hublot se dispute souvent pour la vue, celui côté couloir pour la liberté de mouvement.", "Les passagers assis aux issues de secours acceptent une responsabilité : aider à ouvrir la porte en cas d'évacuation.", "Autour des aéroports, on utilise parfois des rapaces dressés pour éloigner les oiseaux des pistes.", "Les tout premiers passagers d'un vol en montgolfière, en 1783, furent un mouton, un canard et un coq.", "Le feu de Saint-Elme est une lueur électrique bleutée parfois visible sur le nez ou les ailes d'un avion.", "En croisière, la température extérieure descend souvent autour de -50 °C.", "Depuis un avion de haute altitude, comme le Concorde, on peut percevoir la courbure de la Terre.", "Un avion ne rapporte de l'argent que lorsqu'il vole ; immobilisé au sol, il ne fait que coûter.", "Dans le low-cost, la rotation au sol vise souvent 25 minutes seulement entre l'arrivée et le départ.", "Un avion se gare presque toujours nez vers l'extérieur, car il ne peut pas reculer efficacement par ses propres moyens.", "Le repoussage du parking se fait à l'aide d'un tracteur, jamais en marche arrière avec les moteurs.", "Le contrôle aérien fonctionne sans interruption, de jour comme de nuit, partout dans le monde.", "Des sites publics permettent aujourd'hui de suivre presque tous les avions en temps réel.", "Sur les vols très longs, un équipage de renfort se relaie pour respecter les temps de repos.", "Le commandant de bord détient l'autorité finale sur la sécurité du vol.", "En 1919, Alcock et Brown réalisèrent la première traversée de l'Atlantique sans escale, seize ans avant Lindbergh en solo.", "Otto Lilienthal, pionnier allemand du vol plané, inspira directement les frères Wright.", "Pilâtre de Rozier fut le premier homme à s'élever dans les airs en montgolfière, en 1783.", "Roland Garros, dont le stade de tennis porte le nom, fut un aviateur : il traversa la Méditerranée en avion en 1913.", "Le Baron Rouge, Manfred von Richthofen, reste l'as le plus célèbre de la Première Guerre mondiale.", "En 1914, Lawrence Sperry démontra le pilote automatique en lâchant les commandes, debout sur l'aile de son avion.", "Le premier ravitaillement en vol entre deux avions fut réalisé dès les années 1920.", "Le premier hélicoptère réellement pratique fut mis au point par Igor Sikorsky à la fin des années 1930.", "Le tout premier aéroport du monde encore en activité se trouve aux États-Unis et date de 1909.", "L'accident de Tenerife en 1977 a conduit à durcir la phraséologie radio pour éviter les malentendus entre pilotes et contrôleurs.", "En 1991, un Boeing 747 a évacué plus de mille personnes en un seul vol lors d'une opération humanitaire.", "Le plus grand hélicoptère de série au monde est le russe Mil Mi-26.", "Monaco n'a pas d'aéroport : on y accède par hélicoptère depuis Nice.", "Les États-Unis comptent à eux seuls des dizaines de milliers d'aérodromes, de loin le plus grand nombre au monde.", "À tout instant, plusieurs milliers d'avions et parfois plus d'un million de personnes se trouvent en vol au-dessus de la planète.", "La plus grande compagnie du monde par la taille de sa flotte est américaine.", "Le nez du Concorde pouvait s'abaisser à l'atterrissage pour dégager la vue de l'équipage.", "Le Dreamlifter, un 747 profondément modifié, transporte des morceaux entiers de Boeing 787.", "Les avions d'entraînement à l'apesanteur volent en paraboles, ce qui leur vaut le surnom de « Vomit Comet ».", "Certains A380 d'Emirates proposent à bord un bar et même des douches en première classe.", "Airbus est basé à Toulouse, tandis que Boeing assemble ses gros-porteurs près de Seattle.", "Airbus appelle « sharklets » ses ailerons de bout d'aile, là où Boeing parle de « winglets ».", "Le nez de l'avion, appelé radôme, est transparent aux ondes pour abriter le radar météo.", "Le pare-brise du cockpit est chauffé, très épais et conçu pour résister à l'impact d'un oiseau ; il coûte une fortune.", "Le cockpit a de vrais essuie-glaces pour la pluie, comme une voiture.", "Les zones de repos de l'équipage sont parfois cachées au-dessus de la cabine sur les long-courriers.", "Les quatre galons du commandant et les trois du copilote indiquent leur fonction à bord.", "Le balisage lumineux des pistes et taxiways permet de circuler et se poser de nuit ou par mauvaise visibilité.", "Depuis un hublot, on peut apercevoir la « gloire » : un halo coloré autour de l'ombre de l'avion sur les nuages.", "Sur les vols polaires, il arrive d'admirer les aurores boréales depuis son hublot.", "En montant vers l'ouest au coucher du soleil, on peut voir l'astre se recoucher une seconde fois.", "Le feu de Saint-Elme peut faire danser une lueur bleutée sur le nez de l'avion pendant un orage.", "Vu de très haut, le ciel paraît plus sombre, presque noir au zénith.", "En 1982, un 747 traversa un nuage de cendres volcaniques : ses quatre moteurs s'éteignirent avant de redémarrer plus bas.", "En 2001, un Airbus A330 à court de carburant plana jusqu'aux Açores et se posa sans moteur.", "La position de sécurité et les consignes avant décollage existent car décollage et atterrissage concentrent la plupart des incidents.", "Les cartes de sécurité illustrées, présentes dans chaque siège, sont devenues des objets de collection.", "Les compagnies rivalisent aujourd'hui d'imagination pour leurs vidéos de sécurité, parfois plus divertissantes qu'un clip.", "Le siège au hublot offre la vue et un appui pour dormir, celui côté couloir la liberté d'aller et venir.", "Sur les vols long-courriers, la première classe propose parfois de véritables suites fermées.", "Les repas servis en vol sont mis au point et goûtés au sol, en tenant compte de la perte de goût en altitude.", "On peut réserver des repas spéciaux (végétarien, sans gluten, halal, casher) sur la plupart des compagnies.", "Le programme de fidélité récompense les voyageurs réguliers avec des miles échangeables contre des billets.", "Les salons d'aéroport offrent aux voyageurs fréquents calme, confort et restauration avant l'embarquement.", "Un membre d'équipage qui voyage comme passager pour rejoindre son avion est dit en « deadhead ».", "Un vol de nuit très matinal est surnommé « red-eye » à cause de la fatigue qu'il provoque.", "Le café et le thé servis en vol ont un goût particulier, en partie à cause de l'altitude et de l'eau utilisée.", "L'eau des toilettes et l'eau potable de l'avion proviennent de réservoirs distincts, remplis à l'escale.", "Le petit « ding » entendu en cabine sert à l'équipage à repérer les changements de phase du vol.", "On garde traditionnellement les tablettes relevées et les sièges droits au décollage pour faciliter une évacuation.", "Les hôtesses et stewards parlent souvent plusieurs langues, un atout précieux sur les vols internationaux.", "La roulette de nez d'un avion se dirige au sol grâce à une petite manette latérale appelée « tiller ».", "Un avion de ligne peut rester en service plusieurs décennies, sa cabine étant rénovée plusieurs fois.", "Chaque avion porte une immatriculation unique ; en France elle commence par F, aux États-Unis par N.", "Le plus court chemin entre deux villes suit un « grand cercle », ce qui explique les trajectoires courbes sur les cartes.", "Les vols entre l'Europe et l'Amérique du Nord frôlent souvent le Groenland et le Canada, plus au nord qu'on ne l'imagine.", "La France vit à l'heure UTC+1 en hiver et UTC+2 en été, un décalage que les équipages jonglent avec l'heure Zulu.", "Le méridien de référence passe par Greenwich, près de Londres, base de l'heure universelle.", "Le contrôleur aérien peut gérer plusieurs dizaines d'avions à la fois dans son secteur.", "Le plan de vol déposé avant le départ réserve la route et l'altitude que l'avion compte suivre.", "Un créneau horaire imposé au décollage sert à lisser le trafic quand le ciel est saturé.", "Le personnel de piste guide parfois l'avion jusqu'à sa place à l'aide de gestes normalisés ou de feux.", "Le plein de carburant, le nettoyage, le catering et le chargement des bagages se font souvent en parallèle pour gagner du temps.", "Le dégivrage des avions par temps froid peut fortement ralentir les départs d'un aéroport.", "Jean Mermoz, héros de l'Aéropostale, disparut au-dessus de l'Atlantique Sud en 1936.", "Henri Guillaumet survécut à un crash dans les Andes en marchant plusieurs jours dans la neige.", "Le pont aérien de Berlin, en 1948-49, ravitailla une ville entière uniquement par avion pendant près d'un an.", "En 1933, des aviateurs survolèrent l'Everest pour la première fois.", "Le Boeing 307 Stratoliner fut, dès 1940, le premier avion de ligne à cabine pressurisée.", "Le F-117 fut le premier avion furtif opérationnel, presque invisible au radar.", "Le SR-71 Blackbird détient toujours des records de vitesse et d'altitude pour un avion habité.", "Le DC-3 fut le premier avion à rendre le transport de passagers réellement rentable.", "Le Boeing 787 est construit en grande partie en fibre de carbone plutôt qu'en aluminium.", "Roissy-Charles-de-Gaulle est le plus grand aéroport de France.", "Beauvais, à environ 80 km de Paris, est une base majeure des compagnies à bas coût.", "L'aéroport du Bourget, premier aéroport parisien historique, accueille aujourd'hui l'aviation d'affaires.", "Le Bourget accueille tous les deux ans le plus grand salon aéronautique du monde.", "Toulouse-Blagnac est le berceau industriel d'Airbus.", "La piste la plus longue du monde se trouve au Tibet et dépasse cinq kilomètres.", "L'aéroport d'Ushuaia, en Argentine, est l'un des plus austraux du monde.", "Un avion de ligne croise généralement entre 10 000 et 12 000 mètres d'altitude.", "La vitesse de croisière d'un avion de ligne tourne autour de 900 km/h.", "Les animaux de compagnie voyagent soit en cabine s'ils sont petits, soit en soute pressurisée et chauffée.", "À la radio, on dit « affirm » et non « affirmative », pour éviter toute confusion avec « negative ».", "Le chiffre 9 se prononce « niner » à la radio pour ne pas le confondre avec « no » ou « nine ».", "Les chiffres 3 et 5 se prononcent « tree » et « fife » pour rester compréhensibles malgré les parasites.", "« Wilco » veut dire « bien reçu, je m'exécute » (will comply).", "Chaque compagnie a un indicatif radio distinct de son nom : celui de British Airways est « Speedbird ».", "L'équipage de l'Airbus posé sur l'Hudson volait sous l'indicatif « Cactus ».", "Un atterrissage tout en douceur est appelé un « greaser » par les pilotes.", "Sur piste mouillée, les pilotes se posent parfois volontairement plus fermement pour mieux accrocher.", "Le moindre débris sur une piste, un boulon ou un caillou, peut endommager un moteur : on parle de « FOD ».", "Le personnel de piste porte des protections auditives, car le bruit des réacteurs peut être dangereux.", "Les moteurs neufs sont testés en avalant des blocs de glace et des carcasses d'oiseaux factices.", "Le placeur qui guide l'avion à son point de stationnement utilise des gestes normalisés dans le monde entier.", "Un avion de ligne emporte des gilets de sauvetage, des radeaux et des balises pour les survols maritimes.", "La plupart des avions ne peuvent pas reculer seuls : c'est un tracteur qui les repousse du parking.", "Le décalage horaire se ressent davantage vers l'est, où l'on « perd » des heures.", "Certaines compagnies diffusent une musique d'ambiance à l'embarquement pour détendre les passagers.", "Les repas de première classe d'antan comprenaient parfois du champagne et des plats préparés à bord.", "Sur les vols non-fumeurs, un cendrier reste exigé sur la porte des toilettes, au cas où quelqu'un enfreindrait l'interdiction.", "Le programme de fidélité le plus ancien récompense les voyageurs en miles depuis le début des années 1980.", "Les salons d'aéroport permettent aux voyageurs fréquents de patienter au calme avant l'embarquement.", "Depuis un hublot orienté à l'opposé du soleil, on aperçoit parfois un arc-en-ciel circulaire complet.", "Le lever ou le coucher du soleil vu d'altitude s'étire bien plus longtemps qu'au sol.", "Les traînées de condensation ne durent que si l'air en altitude est suffisamment humide.", "En vol de nuit au-dessus des océans, l'obscurité peut être totale, sans le moindre repère lumineux.", "Beaucoup de compagnies sautent aussi le rang 17, considéré comme malchanceux dans certains pays.", "La superstition est tenace dans l'aviation : certains équipages ont leurs petits rituels avant un vol.", "On dit rarement le mot « dernier » à bord : on préfère « final » pour ne pas porter malheur.", "Un même vol peut changer de numéro selon le sens du trajet, aller et retour portant souvent des numéros voisins.", "Le numéro de vol d'un accident marquant est parfois retiré définitivement par respect.", "Les avions long-courriers embarquent des dizaines de milliers de litres de carburant, surtout logés dans les ailes.", "Un gros-porteur peut peser plusieurs centaines de tonnes au décollage.", "Le train d'atterrissage d'un gros avion compte de nombreuses roues pour répartir cette énorme masse.", "Les phares d'atterrissage d'un avion sont si puissants qu'on les voit à des dizaines de kilomètres.", "Le carburant représente une part majeure du coût d'exploitation d'un vol.", "L'EOSID est une trajectoire de secours, fournie par la compagnie, que l'avion suit s'il perd un moteur au décollage pour éviter les obstacles et revenir se poser en sécurité.", "Après une panne moteur juste au décollage, l'avion doit encore garantir une pente de montée minimale : c'est le « deuxième segment », la phase la plus critique.", "L'ILS est le système d'atterrissage aux instruments : deux faisceaux radio guident l'avion dans l'axe de la piste et sur le bon plan de descente, même sans visibilité.", "Le LOC (localizer) est la partie de l'ILS qui donne l'alignement horizontal sur l'axe de la piste ; le glide en donne la pente de descente.", "Le glide (glideslope) est la partie de l'ILS qui indique à l'avion la bonne pente de descente vers la piste, en général 3°.", "Le VOR est une balise radio au sol qui indique à l'avion sur quel cap radial il se trouve par rapport à elle : un des plus anciens repères de navigation.", "Le NDB est une balise radio simple et ancienne vers laquelle une aiguille du tableau de bord pointe, comme une boussole vers un émetteur.", "Le DME est un équipement qui mesure en continu la distance entre l'avion et une balise au sol, complément fréquent du VOR ou de l'ILS.", "La RNP est un type de navigation où l'avion se guide au GPS en garantissant de rester dans un couloir de précision donné, sans balise au sol.", "Une approche RNAV/GPS permet à l'avion de descendre vers la piste guidé par satellite, là où il n'y a pas d'ILS.", "L'approche LPV utilise le GPS renforcé pour offrir un guidage vertical précis, presque aussi fin qu'un ILS, même sur de petits terrains.", "Le marqueur (marker) est une ancienne balise qui bipait dans le cockpit au passage de points précis de l'approche ILS.", "L'ADF est l'instrument de bord dont l'aiguille pointe vers une balise NDB, pour se diriger vers elle.", "La différence entre RNAV et RNP : le RNP oblige en plus l'avion à surveiller lui-même sa précision et à alerter s'il sort du couloir prévu.", "Le RAIM est la fonction qui vérifie, avant une approche GPS, que le signal satellite est assez fiable pour être utilisé.", "Le point d'égal temps, sur une longue traversée, est l'endroit d'où rejoindre l'aéroport de secours d'avant ou celui d'après prend exactement le même temps.", "La vitesse « green dot » d'un Airbus est celle où l'avion plane le mieux : la plus économe en attente ou en cas de panne moteur.", "Le transpondeur est la boîte qui répond au radar en renvoyant un code à quatre chiffres, l'altitude et l'identité de l'avion.", "Le calage QNH sert à afficher l'altitude vraie ; au-dessus d'une certaine altitude, tous les avions passent au calage standard 1013 pour parler en « niveaux de vol ».", "Un « radial » est une direction issue d'un VOR, un peu comme un rayon partant de la balise, que l'avion peut suivre pour naviguer.", "Le glide et le localizer réunis forment l'ILS : ensemble, ils amènent l'avion pile dans l'axe et sur la bonne pente jusqu'au seuil de piste."];
  let bag = [], last = null, factTimer = null;
  const INTERVAL = 10000;
  const LS_KEY = 'pv_factbag';

  function saveBag(){
    try { localStorage.setItem(LS_KEY, JSON.stringify({ bag: bag, last: last })); } catch(e){}
  }
  function loadBag(){
    try {
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return;
      const obj = JSON.parse(raw);
      if(obj && typeof obj.last === 'string') last = obj.last;
      if(obj && Array.isArray(obj.bag)){
        const set = new Set(FACTS);                 // ne garder que les anecdotes encore existantes
        bag = obj.bag.filter(function(f){ return set.has(f); });
      }
    } catch(e){}
  }

  function reshuffle(){
    bag = FACTS.slice();
    for(let i=bag.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=bag[i]; bag[i]=bag[j]; bag[j]=t; }
    if(bag.length>1 && bag[0]===last){ const t=bag[0]; bag[0]=bag[1]; bag[1]=t; }
  }
  function pick(){
    if(!FACTS.length) return '';
    if(!bag.length) reshuffle();
    const f = bag.shift(); last = f; saveBag(); return f;
  }
  loadBag();   // reprend le cycle en cours d'une session à l'autre
  // Photos sur lesquelles on n'affiche PAS d'anecdote (fond trop chargé, etc.)
  const NO_FACT_BG = ['home-bg-7.jpg'];

  function paint(){
    const box = document.getElementById('homeFact');
    const txt = document.getElementById('homeFactText');
    if(!box || !txt) return;
    box.classList.remove('show');
    setTimeout(function(){ txt.textContent = pick(); box.classList.add('show'); }, 300);
  }
  function hideFact(){ const box = document.getElementById('homeFact'); if(box) box.classList.remove('show'); }

  // Affiche une anecdote (sauf sur les photos exclues) et resynchronise le minuteur de secours
  window.homeNextFact = function(src){
    clearInterval(factTimer);
    factTimer = setInterval(function(){ paint(); }, INTERVAL); // secours si le diaporama ne tourne pas
    if(src && NO_FACT_BG.some(function(b){ return src.indexOf(b) !== -1; })){ hideFact(); return; }
    paint();
  };

  function start(){ window.homeNextFact(); }
  if(document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
