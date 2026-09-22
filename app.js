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
  const FACTS = ["La portance naît de la dépression sur l'extrados : l'air accéléré au-dessus de l'aile y crée une pression plus faible qu'à l'intrados, d'où une force vers le haut.", "Quatre forces s'équilibrent en vol stabilisé : la portance compense le poids, la traction compense la traînée.", "Le décrochage survient quand l'angle d'attaque dépasse une valeur critique (~15°) : le flux décolle de l'extrados et la portance s'effondre, quelle que soit la vitesse.", "Un avion peut décrocher à n'importe quelle vitesse et n'importe quelle assiette : seul l'angle d'attaque compte, pas la vitesse seule.", "La traînée induite est le prix de la portance : elle vient des tourbillons marginaux et augmente à basse vitesse et forte incidence.", "La traînée parasite croît avec le carré de la vitesse ; la traînée induite décroît avec la vitesse : leur somme passe par un minimum, la vitesse de traînée mini.", "La finesse (portance/traînée) est maximale à une incidence précise : c'est la vitesse de meilleur plané et de meilleure distance franchissable.", "Les winglets réduisent la traînée induite en limitant l'enroulement de l'air du bord marginal (les tourbillons de bout d'aile).", "Les volets (flaps) augmentent cambrure et surface : plus de portance à basse vitesse pour décoller et atterrir, mais aussi plus de traînée.", "Les becs de bord d'attaque (slats) retardent le décrochage en réénergisant la couche limite, ce qui permet une incidence plus forte.", "Les spoilers détruisent la portance : sortis en vol ils font descendre et ralentir, au sol ils plaquent l'avion pour rendre le freinage efficace.", "Le Mach critique est la vitesse à laquelle l'écoulement devient localement supersonique sur l'extrados : apparition d'ondes de choc et de traînée d'onde.", "En transsonique, l'onde de choc peut décoller la couche limite (buffet) et reculer le centre de poussée, provoquant un abattée (Mach tuck).", "Le facteur de charge augmente la vitesse de décrochage : à 60° d'inclinaison on encaisse 2 g et la vitesse de décrochage est multipliée par 1,41.", "En virage, la portance doit compenser le poids ET fournir la force centripète : il faut plus d'incidence, donc une vitesse de décrochage plus élevée.", "Le dièdre (ailes relevées) donne la stabilité en roulis : en cas de dérapage, l'aile basse prend plus d'incidence, porte plus et redresse l'avion.", "La flèche de l'aile retarde la compressibilité et relève le Mach critique, au prix d'une portance moindre à basse vitesse.", "Le lacet inverse : à la mise en virage, l'aileron abaissé traîne plus et fait partir le nez du mauvais côté ; on le corrige au différentiel et à la gouverne de direction.", "Le roulis hollandais est une oscillation couplée lacet-roulis, amortie automatiquement par le yaw damper.", "L'effet de sol, sous une hauteur d'environ une envergure, réduit la traînée induite : l'avion semble flotter à l'arrondi.", "Le centre de poussée est le point d'application de la portance ; sa position par rapport au centre de gravité détermine la stabilité en tangage.", "Une gouverne trimée annule l'effort au manche : le trim déplace une petite surface pour maintenir l'assiette sans forcer en permanence.", "Le FADEC régule le moteur à pleine autorité numérique : il dose le carburant et protège les limites (régimes, températures) sans action manuelle du pilote.", "L'air prélevé sur les compresseurs (bleed air) alimente la pressurisation, le dégivrage des ailes et le démarrage des autres moteurs.", "La pressurisation maintient une altitude cabine d'environ 8 000 ft maxi grâce à l'outflow valve, qui dose l'air chaud évacué à l'extérieur.", "Le différentiel de pression cabine est limité (~8 à 9 psi) : au-delà, la structure du fuselage serait trop sollicitée.", "L'APU est une petite turbine à l'arrière qui fournit électricité et air au sol, moteurs coupés, et sert au démarrage des réacteurs.", "La RAT est une éolienne de secours qui se déploie dans le flux d'air pour fournir l'énergie hydraulique et électrique vitale en cas de perte totale.", "L'antiskid empêche le blocage des roues au freinage (comme un ABS) : il module la pression pour garder l'adhérence maximale et préserver les pneus.", "L'autobrake applique une décélération constante réglée (LO, MED, MAX, ou RTO au décollage), indépendamment de l'effort au palonnier.", "Les freins carbone équipent les avions de ligne : légers et endurants à haute température, mais peu mordants tant qu'ils sont froids.", "Un bouchon fusible (fuse plug) sur chaque roue fond en cas de surchauffe des freins et dégonfle le pneu pour éviter son éclatement.", "Le circuit hydraulique, souvent en trois réseaux redondants, actionne gouvernes, train, volets et freins ; la PTU transfère la puissance d'un réseau à l'autre sans mélanger les fluides.", "L'énergie électrique vient d'alternateurs entraînés par les moteurs (IDG), relayés par l'APU, les batteries et la RAT en secours.", "Le dégivrage en vol se fait par air chaud prélevé sur les bords d'attaque et entrées d'air, ou par résistances électriques comme sur le 787.", "Le tube Pitot mesure la pression totale et les prises statiques la pression statique : leur différence donne la vitesse indiquée (IAS).", "Une sonde Pitot obstruée (givre, insecte) fausse la vitesse indiquée : d'où le réchauffage Pitot et les procédures « unreliable airspeed ».", "Les sondes d'incidence (AoA) mesurent l'angle d'attaque réel et alimentent l'alarme de décrochage et les protections de vol.", "Le radioaltimètre mesure la hauteur réelle sol par renvoi d'onde, précis dans les derniers centaines de pieds, et déclenche les annonces de hauteur.", "Le transpondeur répond au radar secondaire : il renvoie un code à 4 chiffres, l'altitude (Mode C) et l'identité (Mode S).", "Le fly-by-wire remplace les câbles par des calculateurs : les ordres au manche passent par des ordinateurs qui appliquent des protections d'enveloppe.", "Sur Airbus, la « loi normale » protège des dépassements d'incidence, de vitesse et d'assiette ; après pannes, on passe en loi « alternate » ou « direct », protections réduites.", "Le yaw damper amortit en continu le lacet parasite (roulis hollandais) via la gouverne de direction, sans action du pilote.", "Le stabilisateur (THS) est un plan horizontal mobile qui assure l'équilibrage longitudinal sur toute l'enveloppe de vol.", "Le groupe de conditionnement d'air (pack) refroidit et régule l'air prélevé avant de l'envoyer en cabine.", "L'atmosphère standard (ISA) sert de référence : 15 °C et 1013,25 hPa au niveau de la mer, avec un gradient de -1,98 °C par 1 000 ft jusqu'à la tropopause.", "La tropopause (~36 000 ft aux latitudes moyennes) marque la fin de la baisse de température ; au-dessus, en stratosphère, elle se stabilise vers -56 °C.", "Le givrage est le plus sévère entre 0 et -15 °C dans les nuages : l'eau surfondue gèle au contact de la cellule et déforme le profil de l'aile.", "Le brouillard de rayonnement se forme par nuit claire et vent faible : le sol se refroidit et la température rejoint le point de rosée.", "Un cisaillement de vent (windshear) est un changement brutal de vent sur une courte distance : il fait varier soudainement la vitesse air, dangereux près du sol.", "Le cumulonimbus cumule tous les dangers : turbulence sévère, givrage, grêle, foudre, fortes ascendances et rabattants ; on le contourne largement.", "Le jet-stream est un courant d'ouest très rapide (jusqu'à 200 kt) près de la tropopause ; ses bords engendrent de la turbulence en air clair (CAT), invisible au radar.", "Le radar météo de bord détecte les précipitations (grosses gouttes), pas les nuages secs ni la turbulence en air clair.", "Une onde orographique sous le vent d'un relief peut provoquer de fortes turbulences et des variations d'altitude loin de la montagne.", "Le vent forcit et tourne avec l'altitude : freiné par le frottement au sol, il se rapproche des isobares en altitude (effet de la couche limite).", "L'anticyclone donne de l'air subsident et un temps calme ; la dépression, de l'air ascendant, des nuages et des précipitations.", "Un front chaud amène des nuages étagés et des pluies continues ; un front froid, des averses et orages plus violents mais plus brefs.", "Le QNH est le calage qui donne l'altitude par rapport à la mer ; le QFE donne la hauteur au-dessus du terrain ; le standard 1013 sert aux niveaux de vol.", "Un METAR est une observation, émise en général toutes les demi-heures et représentative environ deux heures ; un TAF est une prévision valable 24 ou 30 heures.", "CAVOK signifie visibilité 10 km ou plus, aucun nuage sous 5 000 ft (ou la MSA) ni cumulonimbus, et aucun phénomène significatif.", "La turbulence en air clair (CAT) est traître car elle survient en ciel dégagé, aux abords du jet-stream, sans écho au radar météo.", "Le point de rosée renseigne sur l'humidité : plus il est proche de la température, plus le risque de brouillard et de givrage est élevé.", "La V1 est la vitesse de décision : avant, on peut interrompre le décollage ; après, on continue même moteur en panne, car s'arrêter deviendrait impossible sur la piste restante.", "La VR est la vitesse de rotation (on cabre) ; la V2 est la vitesse de sécurité au décollage, tenue en montée initiale sur un seul moteur.", "La piste équilibrée (balanced field) est la longueur où, à V1, la distance pour s'arrêter égale la distance pour continuer le décollage.", "Les distances déclarées (TORA, TODA, ASDA, LDA) précisent la longueur réellement utilisable pour rouler, décoller, accélérer-arrêter ou atterrir.", "Le 2e segment de montée impose un gradient minimal (2,4 % en bimoteur), un moteur en panne, train rentré : il limite souvent la masse au décollage.", "La poussée réduite au décollage (flex) se calcule en simulant une température plus chaude : moins d'usure moteur quand la longueur de piste le permet.", "Un décollage interrompu (RTO) à grande vitesse est l'événement le plus exigeant pour les freins : toute l'énergie cinétique se transforme en chaleur.", "L'altitude densité combine chaleur, altitude et basse pression : elle dégrade portance et poussée, allonge le décollage et abaisse la masse maxi.", "En croisière, l'avion monte par paliers (step climb) à mesure qu'il s'allège, pour rester proche de son altitude optimale de consommation.", "Le Cost Index arbitre coût du carburant contre coût du temps : un CI bas privilégie l'autonomie, un CI élevé la vitesse.", "La vitesse de meilleure autonomie (max range) est un peu plus rapide que celle de meilleure endurance : l'une optimise la distance, l'autre le temps en l'air.", "En cas de panne moteur en croisière, l'avion effectue un « drift down » : il descend lentement vers l'altitude tenable sur le moteur restant.", "Sur piste contaminée (eau, neige, slush), l'accélération est réduite et le freinage dégradé : les distances requises augmentent fortement.", "Entre la masse limitée par la structure et celle limitée par les performances du jour, on retient toujours la plus faible.", "Le gradient de montée dépend de l'excédent de poussée : par forte masse ou température élevée, il chute et peut limiter le franchissement d'obstacles.", "Le centre de gravité doit rester dans une enveloppe avant/arrière : trop avant, l'avion est lourd du nez et traîne plus ; trop arrière, il devient instable.", "Un centrage arrière réduit la déportance de compensation de l'empennage, donc la traînée : léger gain de consommation, dans les limites autorisées.", "La masse sans carburant (ZFW) est limitée par la structure : au-delà de la MZFW, la flexion des ailes en vol devient excessive.", "Le devis de masse et centrage vérifie avant chaque vol que masses et CG sont dans les limites, et fixe le calage du trim de décollage.", "Un mauvais centrage se ressent dès la rotation : un mistrim déclenche une alarme de configuration au décollage.", "Les charges sont réparties en soutes pour tenir le centrage ; un index chiffré traduit chaque masse en effet sur la position du CG.", "On distingue masse à vide opérationnelle, masse sans carburant, masse au décollage et à l'atterrissage : chacune a sa limite structurale à respecter.", "À 8 000 ft de cabine, la saturation du sang en oxygène reste vers 90 % ; sans pressurisation à 40 000 ft, le temps utile de conscience n'est que de 15 à 20 secondes.", "L'hypoxie s'installe insidieusement : euphorie, jugement altéré, vision qui se réduit, sans douleur ni essoufflement, d'où le masque immédiat.", "« Mets ton masque avant d'aider les autres » vient du temps de conscience très court : inconscient, on ne peut plus aider personne.", "L'hyperventilation (respiration trop rapide sous stress) et l'hypoxie donnent des symptômes proches : fourmillements, vertiges, vision trouble.", "Le rythme circadien crée un creux de vigilance vers 3 h à 5 h du matin : vols de nuit et décalage horaire augmentent le risque d'erreur.", "Le jet lag est plus dur vers l'est : le corps met environ un jour à se recaler par fuseau horaire franchi.", "La désorientation spatiale survient sans repères visuels : l'oreille interne trompe le pilote, d'où la règle de croire ses instruments.", "L'illusion somatogravique : une forte accélération au décollage crée une fausse sensation de cabré, qui pousse à piquer dangereusement.", "Le CRM (gestion des ressources de l'équipage) organise la répartition des tâches, la communication et la remise en question mutuelle pour barrer les erreurs.", "Le « cockpit stérile » sous 10 000 ft interdit tout échange non essentiel, car c'est la phase où se concentrent la plupart des incidents.", "Le modèle du fromage suisse : un accident survient quand les trous de plusieurs défenses s'alignent, jamais par une seule cause isolée.", "La conscience de la situation se perd vite sous forte charge de travail : checklists et automatismes servent à la préserver.", "La vision nocturne repose sur les bâtonnets périphériques : de nuit, on voit mieux un objet faible en le regardant légèrement à côté.", "L'ILS guide aux instruments par deux faisceaux : le localizer donne l'axe de piste, le glide la pente de descente (environ 3°), jusqu'à des minimums très bas.", "Le localizer (LOC) donne l'alignement horizontal sur l'axe de piste ; utilisé seul, sans guidage vertical, c'est une approche de non-précision.", "Le VOR est une balise au sol qui définit 360 radiaux : l'avion sait sur quelle direction magnétique il se trouve par rapport à elle.", "Le DME mesure en continu la distance oblique à une balise par aller-retour d'un signal ; il est souvent couplé à un VOR ou un ILS.", "Le NDB est une balise non directionnelle vers laquelle l'aiguille de l'ADF pointe à bord, comme une boussole vers l'émetteur.", "La RNAV permet de voler de point en point sans survoler de balise, en combinant GPS, centrale inertielle et calculateur de bord.", "La RNP est une RNAV avec exigence de performance : l'avion surveille lui-même sa précision et alerte s'il sort du couloir requis (par ex. RNP 0,3 NM).", "L'EOSID est la trajectoire de départ de secours, publiée par la compagnie, à suivre en cas de panne moteur au décollage pour franchir les obstacles.", "L'ILS se décline en catégories I, II et III : plus la catégorie est élevée, plus les minimums de visibilité sont bas, jusqu'à l'atterrissage automatique.", "La hauteur de décision est le point où, en approche de précision, il faut voir la piste ou remettre les gaz.", "Le RVSM réduit la séparation verticale à 1 000 ft entre le FL290 et le FL410, ce qui double la capacité, sous réserve d'altimètres très précis à bord.", "IAS, CAS, TAS : la vitesse indiquée corrigée des erreurs donne la CAS ; corrigée de la densité, elle donne la vitesse vraie (TAS), qui grimpe avec l'altitude.", "Le GNSS peut être renforcé (SBAS/EGNOS) pour offrir un guidage vertical là où il n'y a pas d'ILS.", "Un niveau de vol (FL) est une altitude au calage standard 1013 : le FL350 correspond à environ 35 000 ft.", "Le cap magnétique diffère du cap vrai de la déclinaison locale ; les pistes sont numérotées d'après leur orientation magnétique arrondie à la dizaine.", "Le carburant emporté se décompose en roulage, trajet, réserve de route (contingency), dégagement, réserve finale (~30 min) et éventuel extra.", "La réserve finale, environ 30 minutes d'attente à 1 500 ft, est intouchable ; l'entamer conduit à déclarer « MAYDAY FUEL ».", "Un dégagement à destination est requis quand la météo prévue à l'arrivée n'est pas assez sûre, avec de quoi remettre les gaz puis l'atteindre.", "Un dégagement au décollage est exigé si la météo du terrain de départ est sous les minimums d'atterrissage, atteignable un moteur en panne.", "La MEL liste les équipements qui peuvent être en panne au départ (car redondants ou non essentiels), sous conditions et délais de réparation (catégories A, B, C, D).", "L'ETOPS autorise un bimoteur à s'éloigner d'un déroutement de 60, 120, 180 minutes ou plus, selon la fiabilité démontrée et les terrains disponibles.", "Le squawk 7500 signale un détournement, 7600 une panne radio, 7700 une urgence générale.", "Le TCAS surveille les transpondeurs voisins : il émet un « Traffic Advisory » puis un « Resolution Advisory », ordre d'évitement vertical prioritaire sur l'ATC.", "L'EGPWS compare l'avion à une base de données du relief et alerte « TERRAIN, PULL UP » en cas de rapprochement dangereux du sol.", "L'approche doit être stabilisée (axe, plan, vitesse, configuration) avant 1 000 ft en IMC ou 500 ft en VMC, sinon remise de gaz obligatoire.", "Une remise des gaz (go-around) est une manœuvre normale et prévue, jamais un échec.", "Le CVR et le FDR (les boîtes noires, en réalité orange) enregistrent voix et paramètres et résistent au feu comme à l'immersion.", "Un vol IFR se déroule aux instruments sous contrôle de l'ATC ; un vol VFR repose sur le « voir et éviter » et des minima météo.", "Le collationnement (readback) oblige à répéter les instructions clés du contrôle pour vérifier qu'elles ont été bien comprises.", "La séparation radar standard est souvent de 3 NM en approche et 5 NM en route, ajustée selon la turbulence de sillage.", "Les catégories de sillage (léger, moyen, lourd, super) fixent l'espacement : un gros-porteur génère un sillage dangereux pour un avion léger qui suit.", "Le créneau de décollage (slot) imposé par la régulation doit être tenu à quelques minutes près, sinon il faut en redemander un.", "La MSA est l'altitude minimale garantissant une marge (souvent 300 m) au-dessus du relief et des obstacles dans un rayon donné autour d'un point.", "L'anglais aéronautique suit une phraséologie stricte où chaque terme a un sens précis, pour éliminer toute ambiguïté à la radio.", "Un réacteur double flux (turbofan) tire l'essentiel de sa poussée de la grande soufflante avant : le flux froid qui la contourne est plus efficace et moins bruyant que le flux chaud.", "La poussée d'un réacteur chute avec l'altitude car l'air se raréfie : moins de masse d'air avale, moins de poussée disponible.", "L'EPR ou le N1 servent à régler la poussée : l'un mesure le rapport de pression du moteur, l'autre le régime de la soufflante.", "L'EGT (température des gaz d'échappement) est surveillée en permanence : un dépassement signe une surchauffe qui abîme la turbine.", "Le pompage (surge) d'un compresseur est un décollement violent du flux : le moteur crache et perd sa poussée, souvent après ingestion ou forte incidence.", "L'inverseur de poussée redirige le flux vers l'avant après le poser : il complète le freinage, surtout sur piste glissante, et se referme à basse vitesse.", "Le calage variable des aubes de compresseur adapte l'angle du flux au régime pour éviter le pompage.", "Une extinction moteur en vol se traite par un redémarrage en vol (relight), assisté par l'allumage et parfois le prélèvement d'un autre moteur.", "Le réseau électrique de bord fournit du courant alternatif (moteurs) et continu (batteries) ; des transformateurs-redresseurs (TR) convertissent l'un en l'autre.", "Les batteries alimentent les instruments essentiels le temps de déployer la RAT ou de démarrer l'APU en cas de perte des générateurs.", "Le fluide hydraulique est incompressible : c'est ce qui permet de transmettre des efforts énormes aux gouvernes et au train avec de petits vérins.", "La structure est conçue « fail-safe » ou « damage tolerant » : une fissure peut apparaître sans rupture, car les charges se répartissent sur d'autres éléments.", "La pressurisation impose des cycles au fuselage : chaque vol le gonfle puis le dégonfle, d'où le comptage en cycles autant qu'en heures pour la fatigue.", "Les commandes de vol se répartissent en primaires (ailerons, gouverne de profondeur, direction) et secondaires (volets, becs, spoilers, trims).", "Un vérin d'amortisseur de train (oléopneumatique) encaisse le choc à l'atterrissage en comprimant de l'huile à travers un petit orifice.", "L'altimètre est un baromètre gradué en pieds : il faut le caler (QNH ou 1013) car il mesure une pression, non une hauteur absolue.", "Le variomètre indique la vitesse verticale en mesurant la variation de pression statique dans le temps.", "Un blocage des prises statiques fige l'altimètre et fausse le variomètre et l'anémomètre : d'où une source statique de secours.", "La centrale inertielle (IRS) calcule position et attitude à partir de gyroscopes et d'accéléromètres, sans aucun signal extérieur.", "L'horizon artificiel restitue l'assiette en tangage et en roulis, référence vitale quand il n'y a plus d'horizon naturel visible.", "Le badin (anémomètre) affiche la vitesse indiquée, calée sur la pression : à altitude constante elle représente bien les efforts aérodynamiques, pas la vitesse sol.", "L'avertisseur de décrochage se déclenche à l'angle d'attaque, avant le décrochage réel : vibreur de manche (stick shaker) puis parfois pousseur (stick pusher).", "Le survitesse est signalé par une alarme (overspeed) : dépasser la VMO/MMO peut endommager la structure ou provoquer un flottement.", "L'alpha protection (Airbus) empêche de dépasser l'incidence maximale même manche tiré à fond ; l'alpha floor commande alors la pleine poussée.", "Le TAWS ajoute au GPWS une base de données du terrain et des obstacles pour anticiper le relief bien avant l'impact.", "Le predictive windshear utilise le radar météo pour détecter un cisaillement devant l'avion et alerter à temps.", "La configuration de décollage est vérifiée par une alarme (« CONFIG ») si volets, becs, trim ou aérofreins ne sont pas prêts.", "Le vent effectif se décompose en composante de face (aide au décollage et à l'atterrissage) et de travers (limitée selon le type d'avion).", "Par vent de travers, on se présente en crabe puis on aligne l'avion à l'arrondi (décrabé) pour toucher roues dans l'axe.", "La finesse d'un avion de ligne tourne autour de 17 pour 1 : sans moteur, il parcourt environ 17 km en perdant 1 km d'altitude.", "Le point de rosée et la température qui se rejoignent au sol donnent le brouillard ; en altitude, ils délimitent la base des nuages.", "La turbulence de sillage descend et s'écarte derrière l'avion qui la crée : on décale sa trajectoire au-dessus du plan du précédent pour l'éviter.", "Un virage à taux standard tourne à 3° par seconde, soit un demi-tour en une minute : la référence pour les procédures aux instruments.", "Le point de non-retour est l'endroit au-delà duquel il ne reste plus assez de carburant pour revenir au départ : au-delà, on poursuit.", "Le point d'égal temps est celui d'où rejoindre le terrain d'avant ou celui d'après prend exactement le même temps, un moteur en panne.", "Le tankering consiste à emporter plus de carburant pour éviter d'en prendre à une escale plus chère, en pesant le surcoût de masse.", "Le holding (attente) se fait sur un circuit en hippodrome, une minute par branche, en attendant l'autorisation d'approche.", "Le briefing d'approche passe en revue la piste, les minimums, la configuration, le plan et la trajectoire de remise des gaz.", "La vitesse d'approche (Vref majorée du vent) garantit une marge suffisante au-dessus du décrochage jusqu'à l'arrondi.", "Le calcul de perfo à l'atterrissage tient compte de la piste, du vent, de l'état de surface, de la pente et de la masse.", "Le nombre de Mach compare la vitesse de l'avion à celle du son, qui diminue avec la température : à haute altitude, Mach 0,85 correspond à une vitesse vraie plus faible qu'au sol.", "La couche limite est la fine pellicule d'air ralentie au contact de l'aile ; son décollement provoque décrochage et perte de portance.", "Le nombre de Reynolds compare forces d'inertie et de viscosité de l'air : il conditionne le comportement de la couche limite autour du profil.", "La masse volumique de l'air chute avec l'altitude et la chaleur, ce qui réduit à la fois portance, poussée et efficacité des gouvernes.", "L'assiette est l'angle du fuselage par rapport à l'horizon ; l'incidence est l'angle de l'aile par rapport au vent : les deux diffèrent selon la trajectoire.", "Une approche de précision offre un guidage vertical (ILS, GLS, LPV) ; une approche de non-précision n'a que le guidage latéral, avec une altitude minimale de descente (MDA).", "Le PAPI est une rampe de feux au bord de piste : deux blancs deux rouges = bon plan, plus de rouge = trop bas, plus de blanc = trop haut.", "Le point d'approche interrompue (MAPt) marque la limite d'une approche de non-précision : sans visuel de la piste, on remet les gaz.", "Le circling est une manœuvre à vue autour du terrain pour se poser sur une autre piste que celle de l'approche aux instruments.", "La descente continue (CDA) évite les paliers moteurs réduits : moins de carburant, moins de bruit pour les riverains.", "Le glide d'un ILS est un faisceau étroit : le suivre trop tard par en dessous peut faire capturer un faux lobe, d'où l'interception par le dessous à plat.", "La transition altitude/niveau se fait à l'altitude de transition en montée (passage à 1013) et au niveau de transition en descente (retour au QNH).", "Le train d'atterrissage se verrouille en position sortie par des contrefiches ; un dispositif de secours (gravité, azote) le sort si l'hydraulique lâche.", "Les pneus d'avion sont gonflés à l'azote, inerte et stable en température, pour limiter le risque d'incendie en cas de surchauffe des freins.", "Le circuit carburant transfère et équilibre le kérosène entre réservoirs (ailes, central) pour tenir le centrage et alimenter symétriquement les moteurs.", "Une pompe de gavage (booster) maintient la pression carburant vers les moteurs ; en cas de panne, la chute d'altitude permet une alimentation par gravité limitée.", "Le système anti-feu moteur détecte l'incendie par boucles thermiques et permet de couper le moteur puis de décharger des extincteurs.", "L'oxygène équipage vient de bouteilles sous pression ; l'oxygène passagers, souvent de générateurs chimiques qui ne durent qu'une dizaine de minutes.", "Les toilettes et l'eau grise sont en circuit fermé sous vide : rien n'est largué en vol, tout est vidangé à l'escale.", "Le dégivrage des sondes (Pitot, statiques, incidence) est électrique et permanent en vol pour garder des mesures fiables.", "La stabilité de l'air décide du type de nuages : air stable = nuages étalés (stratus) et brouillard ; air instable = nuages de développement vertical (cumulus, Cb).", "L'inversion de température (chaud au-dessus du froid) bloque les mouvements verticaux et piège brume, pollution et turbulence basse.", "Le foehn est un vent chaud et sec qui redescend sous le vent d'un relief après avoir déchargé son humidité au vent.", "Le gradient adiabatique sec (~3 °C/1000 ft) refroidit une bulle d'air sec qui monte ; saturée, elle suit un gradient humide plus faible car la condensation dégage de la chaleur.", "La grêle peut être projetée hors d'un cumulonimbus et tomber en air clair à plusieurs kilomètres du nuage.", "Le brouillard d'advection se forme quand de l'air doux et humide passe sur une surface froide, fréquent sur les côtes.", "La visibilité peut chuter brutalement dans une averse ou de la brume : d'où le suivi du RVR, la portée visuelle mesurée le long de la piste.", "La polaire de l'avion relie portance et traînée à chaque incidence : son point de tangence donne la finesse maximale.", "La vitesse de finesse max donne la meilleure distance sans moteur ; voler plus vite ou plus lentement réduit la portée en plané.", "Le rayon de virage augmente avec le carré de la vitesse : à haute altitude, un avion rapide vire large et manœuvre peu.", "La marge de manœuvre en haute altitude est étroite (« coffin corner ») : la vitesse de décrochage et la limite de Mach s'y rejoignent presque.", "L'assiette de montée optimale se cherche à vitesse constante : trop lent on perd en gradient, trop rapide on grimpe moins vite.", "Le vent arrière au décollage et à l'atterrissage est très pénalisant : il allonge fortement les distances, d'où une limite basse (souvent 10 kt).", "La pente de montée (gradient) et la vitesse ascensionnelle diffèrent : le gradient compte pour franchir un obstacle, la vitesse verticale pour gagner de l'altitude vite.", "La loi de Henry explique les bulles de décompression : à basse pression, l'azote dissous dans le sang forme des bulles, d'où les paliers après plongée avant de voler.", "Les otites baro et les douleurs sinusales viennent de l'écart de pression : on équilibre en déglutissant, surtout en descente.", "La fatigue dégrade jugement et temps de réaction autant qu'un taux d'alcool : d'où les limitations strictes de temps de service et de repos.", "L'effet tunnel sous stress rétrécit l'attention sur un seul paramètre : la répartition des tâches en équipage sert à garder la vue d'ensemble.", "Les illusions visuelles de nuit (piste en pente, largeur inhabituelle) faussent l'estimation du plan : d'où l'appui sur le PAPI et les instruments.", "La déshydratation en cabine (air très sec, 10 à 20 % d'humidité) accroît la fatigue : boire régulièrement est une vraie mesure de sécurité.", "Les minima d'un aérodrome (visibilité, plafond) dépendent des aides disponibles et déterminent si l'approche est autorisée ce jour-là.", "La CDL (liste des écarts de configuration) autorise à voler avec certains éléments externes manquants, avec pénalités de performance.", "Le NOTAM prévient d'un changement temporaire (piste fermée, balise en panne, obstacle, zone active) que l'équipage doit connaître avant le vol.", "Le devis carburant tient compte des vents prévus par tranche de route : un vent de face fort peut imposer un plein plus important ou une escale.", "Le poids maximal au roulage dépasse légèrement la masse au décollage : il inclut le carburant brûlé pendant le roulage jusqu'à la piste.", "La limitation de bruit impose parfois des procédures de départ spécifiques et des créneaux, surtout la nuit près des zones habitées.", "Le report de position en espace non radar donne à l'ATC l'heure de passage, le niveau et l'estimation du point suivant.", "Le calage altimétrique erroné est un piège classique : un QNH trop bas affiché fait voler l'avion plus bas que l'altitude lue."];
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
