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
  for(let i=1;i<=10;i++) CANDIDATES.push('./home-bg-'+i+'.jpg');
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
  function next(){ show(nextSrc()); startProgress(); if(window.homeNextFact) window.homeNextFact(); }
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
  const FACTS = ["ACARS (Aircraft Communications Addressing and Reporting System) : liaison de données texte sol-bord (load sheet, météo, techlog, OOOI).", "Les temps OOOI (Out, Off, On, In) sont les 4 horodatages repoussage/décollage/atterrissage/arrivée au parking, souvent transmis par ACARS.", "CPDLC (Controller-Pilot Data Link Communications) : instructions ATC échangées par texte, pour désengorger la phonie.", "ADS-B (Automatic Dependent Surveillance-Broadcast) : l'avion diffuse en continu sa position GNSS et son identité.", "ADS-C (Contract) : l'avion transmet sa position selon un contrat défini par l'ATC, surtout en zone océanique.", "FANS (Future Air Navigation System) combine CPDLC et ADS-C pour surveiller le trafic hors couverture radar.", "SELCAL : appel sélectif qui fait « sonner » un avion précis en HF/VHF, évitant l'écoute permanente.", "La HF (ondes courtes) reste utilisée pour les liaisons longue distance en océanique.", "Mode S : transpondeur transmettant l'identité et des paramètres ; il sert de base à l'ADS-B.", "CLEARANCE océanique : autorisation d'entrée sur une route Atlantique avec route, niveau et Mach imposés.", "D-ATIS : diffusion de l'ATIS par datalink, en plus de la version vocale.", "VOLMET : diffusion en boucle de la météo aéronautique de plusieurs aérodromes, en route.", "CPDLC logon : l'équipage se connecte au centre ATC (code à 4 lettres) avant d'utiliser le datalink.", "ETOPS (Extended-range Twin-engine OPerationS) autorise un biréacteur à s'éloigner d'un déroutement de 60, 120, 180 min ou plus.", "L'ETOPS 330 permet jusqu'à 330 min de vol vers un aérodrome de déroutement adéquat.", "Un aérodrome ETOPS « adéquat » doit rester exploitable dans la fenêtre de déroutement prévue.", "LROPS : extension du concept ETOPS aux opérations long-courrier au-delà du seul cas bimoteur.", "Le NAT-OTS (Organized Track System) : des routes de l'Atlantique Nord recalculées deux fois par jour selon le jet-stream.", "SLOP (Strategic Lateral Offset Procedure) : léger décalage latéral (souvent 1-2 NM) réduisant le risque de collision en océanique.", "ETP (Equal Time Point) : point où il faut autant de temps pour rejoindre deux aérodromes de déroutement.", "PNR (Point of No Return) : au-delà, l'avion n'a plus l'autonomie de revenir au départ.", "En océanique sans radar, la séparation repose sur des comptes rendus de position et l'ADS-C.", "La technique du Mach constant en océanique maintient l'espacement longitudinal entre avions.", "TCAS (Traffic Collision Avoidance System) surveille les transpondeurs voisins et émet TA puis RA.", "TA (Traffic Advisory) : alerte de trafic ; RA (Resolution Advisory) : ordre d'évitement vertical à suivre immédiatement.", "Un RA TCAS prime sur l'instruction de l'ATC : on suit d'abord la manœuvre, on prévient ensuite.", "ACAS II est la norme OACI dont le TCAS II est l'implémentation.", "Squawk 7500 = intervention illicite (détournement), 7600 = panne radio, 7700 = urgence.", "« Squawk ident » : le pilote appuie sur IDENT pour faire clignoter son plot sur l'écran du contrôleur.", "Le Mode C transmet l'altitude pression de l'avion au radar secondaire.", "PBN (Performance Based Navigation) : navigation définie par une performance requise, non par des balises fixes.", "RNAV = navigation de surface ; RNP ajoute l'exigence de surveillance et d'alerte de performance à bord.", "RNP AR APCH : approches à autorisation spéciale, avec des trajectoires courbes très précises.", "SID / STAR : départs et arrivées normalisés aux instruments, réduisant les échanges radio.", "ILS CAT I / II / III : approches de précision aux minimums décroissants (DH et RVR de plus en plus bas).", "CAT III permet l'atterrissage par RVR très faible, souvent en autoland.", "DH / DA : hauteur / altitude de décision d'une approche de précision.", "MDA / MDH : altitude / hauteur minimale de descente d'une approche classique (sans guidage vertical).", "RVR (Runway Visual Range) : portée visuelle de piste mesurée par des transmissomètres le long de la piste.", "LPV : approche GNSS avec guidage vertical, aux minimums proches d'un ILS CAT I.", "SBAS (EGNOS en Europe, WAAS aux USA) renforce le GNSS pour gagner en précision et en intégrité.", "RAIM : contrôle autonome d'intégrité du récepteur GPS, vérifié avant une approche GNSS.", "Baro-VNAV : guidage vertical calculé à partir de la pression, sensible à la température.", "VOR / DME / NDB / ADF : moyens radio conventionnels, encore utilisés en secours du GNSS.", "PAPI : rampe de feux indiquant le plan d'approche (trop haut = blanc, trop bas = rouge).", "LVP (Low Visibility Procedures) : procédures aéroport activées par faible visibilité, protégeant les aires sensibles ILS.", "Alert height : hauteur en CAT III sous laquelle une panne n'entraîne plus de remise de gaz automatique.", "Fail-operational / fail-passive : comportement du pilote automatique en cas de panne pendant un autoland.", "QNH : calage altimétrique donnant l'altitude par rapport au niveau de la mer.", "QFE : calage donnant la hauteur au-dessus du seuil de piste.", "QNE / 1013,25 hPa : calage standard au-dessus de l'altitude de transition (niveaux de vol).", "Altitude de transition / niveau de transition : bascule entre QNH et 1013 hPa.", "Un FL (Flight Level) est une altitude pression au calage 1013 : FL350 ≈ 35 000 ft.", "ISA (International Standard Atmosphere) : 15 °C et 1013,25 hPa au niveau de la mer, -2 °C par 1000 ft.", "SAT / TAT : température statique de l'air / température totale incluant l'échauffement dynamique.", "RVSM (Reduced Vertical Separation Minimum) : séparation 1000 ft entre FL290 et FL410.", "Le RVSM impose deux systèmes altimétriques, un pilote automatique et une alerte d'altitude.", "IAS / CAS / EAS / TAS / GS : vitesses indiquée / conventionnelle / équivalente / vraie / sol.", "À iso-IAS, la TAS augmente avec l'altitude car l'air se raréfie.", "En montée on vole d'abord à IAS constante, puis à Mach constant après le crossover.", "Coffin corner : à haute altitude, l'écart se resserre entre vitesse de décrochage et survitesse.", "La marge de buffet définit l'altitude maximale exploitable à une masse donnée.", "V1 : vitesse de décision ; au-delà, on poursuit le décollage même moteur en panne.", "VR : vitesse de rotation, à laquelle on tire sur le manche pour décoller.", "V2 : vitesse de sécurité au décollage, tenue en montée initiale sur un seul moteur.", "Vref / Vapp : vitesse de référence et vitesse d'approche à l'atterrissage.", "Vmcg / Vmca : vitesses minimales de contrôle au sol / en vol, moteur critique en panne.", "Balanced field length : longueur où la distance pour s'arrêter égale celle pour décoller après panne à V1.", "TORA / TODA / ASDA / LDA : distances déclarées de roulement, décollage, accélération-arrêt, atterrissage.", "Le 2e segment de montée impose un gradient minimal, un moteur en panne, train rentré.", "EOSID : trajectoire de départ spécifique à suivre en cas de panne moteur pour franchir les obstacles.", "Net vs gross flight path : la trajectoire nette intègre une marge réglementaire sur la trajectoire brute.", "RTOW : masse maximale au décollage limitée par la piste et les obstacles du jour.", "Assumed/Flex temperature : température fictive saisie pour réduire la poussée et ménager les moteurs.", "Derate : poussée maximale certifiée à un niveau réduit, distincte du flex.", "RTO (Rejected Take-Off) : décollage interrompu, l'un des freinages les plus exigeants pour l'avion.", "NADP 1 / 2 : procédures anti-bruit au décollage, priorisant les riverains proches ou éloignés.", "MTOW / MLW / MZFW : masses maximales au décollage / à l'atterrissage / sans carburant.", "DOW (Dry Operating Weight) : masse de l'avion équipé et armé, sans carburant ni charge marchande.", "ZFW : masse sans carburant ; au-delà de la MZFW, la structure des ailes est trop sollicitée.", "Le devis de masse et centrage (load & trim sheet) valide poids et position du CG avant départ.", "Le CG (centre de gravité) doit rester dans une enveloppe avant/arrière définie.", "Un centrage plus arrière réduit la traînée d'équilibrage et fait un peu économiser du carburant.", "LMC (Last Minute Change) : ajustement de charge après édition du devis, dans des limites strictes.", "ULD (Unit Load Device) : conteneurs et palettes normalisés (ex. AKE, PMC).", "NOTOC : notification à l'équipage des marchandises dangereuses et de leur emplacement.", "IATA DGR : réglementation du transport aérien des marchandises dangereuses.", "La répartition de la charge en soute influe directement sur le centrage.", "Index / DOI : valeurs sans dimension facilitant le calcul de centrage sur le trim sheet.", "Tankering : embarquer du carburant en trop pour éviter d'en acheter à une escale plus chère.", "Politique carburant : taxi + trajet + contingency + dégagement + réserve finale + extra.", "Contingency fuel : marge (souvent ~5 % du trajet) contre les aléas de route.", "Réserve finale : de quoi tenir ~30 min d'attente à 1500 ft au-dessus du dégagement.", "MINIMUM FUEL : information à l'ATC indiquant qu'un retard supplémentaire deviendrait critique.", "MAYDAY FUEL : déclaration d'urgence quand la réserve finale risque d'être entamée.", "Fuel jettison : largage de carburant possible sur certains gros-porteurs pour revenir sous la MLW.", "Cross-feed : interconnexion des réservoirs pour alimenter les moteurs de façon symétrique.", "FMS / FMC : calculateur gérant route, performances et prédictions de carburant et d'heures.", "Cost Index : arbitrage entre coût du carburant et coût du temps, qui fixe la vitesse ECON.", "Un Cost Index bas favorise l'autonomie ; un CI élevé favorise la vitesse.", "Step climb : montée par paliers à mesure que l'avion s'allège et gagne en altitude optimale.", "LRC / MRC : Long Range Cruise et Max Range Cruise, régimes de croisière économiques.", "Green dot (Airbus) : vitesse de finesse maximale, utile moteur en panne ou en attente.", "Drift down : descente progressive vers l'altitude tenable sur un seul moteur.", "TOD (Top of Descent) : point calculé par le FMS pour amorcer une descente au ralenti (idle).", "CDO / CDA : descente continue optimisée, sans palier, pour économiser carburant et bruit.", "Managed vs selected (Airbus) : l'avion suit le plan FMS ou une consigne réglée à la main.", "LNAV / VNAV : guidage latéral et vertical automatiques suivant la route du FMS.", "FADEC : régulation numérique pleine autorité qui pilote le moteur et protège ses limites.", "N1 / N2 / EGT / EPR : régimes des corps, température des gaz d'échappement, rapport de pression moteur.", "Bleed air : air chaud prélevé sur les moteurs pour la pressurisation et le dégivrage.", "Pack : groupe de conditionnement d'air qui refroidit et régule l'air prélevé.", "L'outflow valve régule la pression cabine en dosant l'air évacué.", "Le différentiel de pression cabine est limité mécaniquement pour protéger le fuselage.", "APU : groupe auxiliaire fournissant électricité et air au sol et pour le démarrage moteurs.", "GPU : groupe de parc au sol alimentant l'avion en électricité, moteurs et APU coupés.", "RAT (Ram Air Turbine) : éolienne de secours déployée en cas de perte majeure d'énergie.", "IDG : générateur à entraînement constant fournissant un courant à fréquence stable.", "PTU (Power Transfer Unit) : transfère la puissance hydraulique d'un circuit à l'autre sans échange de fluide.", "Airbus code ses circuits hydrauliques par couleurs : vert, bleu, jaune.", "Anti-skid : système empêchant le blocage des roues au freinage, comme un ABS.", "Les freins carbone équipent la plupart des avions de ligne modernes.", "Fusible thermique (fuse plug) : dégonfle un pneu surchauffé pour éviter l'éclatement.", "Le tiller commande la roulette de nez pour les virages serrés au sol.", "Pitot et prises statiques alimentent les instruments de vitesse et d'altitude.", "Un pitot obstrué (givre, insecte) provoque une indication de vitesse erronée.", "Les sondes d'incidence (AoA) mesurent l'angle d'attaque, clé de l'alerte de décrochage.", "AoA (angle d'attaque) : angle entre l'aile et le flux d'air ; le décrochage dépend de lui, pas de la vitesse seule.", "Alpha floor (Airbus) : protection qui applique la pleine poussée si l'incidence devient excessive.", "Les protections d'enveloppe du fly-by-wire empêchent de sortir du domaine de vol.", "Mach tuck : tendance au piqué à l'approche du Mach critique sur certaines cellules.", "Dutch roll : oscillation couplée lacet-roulis amortie par le yaw damper.", "Flutter : vibration aéroélastique destructrice évitée par la conception et des limites de vitesse.", "Effet de sol : surcroît de portance près du sol, ressenti à l'arrondi (flare).", "Les vortex de bout d'aile génèrent la turbulence de sillage.", "Winglets et sharklets réduisent ces vortex et donc la traînée induite.", "Catégories de sillage Light / Medium / Heavy / Super pour espacer les avions.", "« Heavy » après l'indicatif signale un gros-porteur générant un fort sillage.", "RECAT : recatégorisation plus fine du sillage pour optimiser les séparations.", "CAT (Clear Air Turbulence) : turbulence en air clair, invisible au radar météo.", "Le radar météo détecte les précipitations, pas la turbulence sèche.", "Mountain wave : onde orographique pouvant provoquer de fortes turbulences sous le vent des reliefs.", "EGPWS / TAWS : alerte de proximité du sol avec base de données du relief (« TERRAIN, PULL UP »).", "Windshear : cisaillement de vent brutal, particulièrement dangereux en approche et au décollage.", "Predictive windshear : le radar météo anticipe un cisaillement devant l'avion.", "Sterile cockpit : sous 10 000 ft, on limite les échanges à ceux nécessaires au vol.", "CRM (Crew Resource Management) : gestion des ressources et de la communication en équipage.", "Approche stabilisée : critères de vitesse, configuration et taux de descente à respecter avant 1000/500 ft.", "Go-around / remise de gaz : manœuvre normale d'interruption d'approche, pas un échec.", "Runway incursion : présence non autorisée sur une piste, risque majeur au sol.", "Level bust : écart non autorisé au niveau assigné, surveillé de près par l'ATC.", "CVR / FDR : enregistreurs de voix du cockpit et de données de vol (les « boîtes noires » oranges).", "QAR : enregistreur d'accès rapide, dont les données servent au suivi de sécurité.", "FOQA / analyse des vols : exploitation systématique des données pour détecter les tendances à risque.", "ELT 406 MHz : balise de détresse relayée par le système satellitaire Cospas-Sarsat.", "METAR : observation météo régulière d'un aérodrome ; SPECI : observation spéciale hors échéance.", "TAF : prévision d'aérodrome couvrant plusieurs heures.", "CAVOK : visibilité ≥ 10 km, aucun nuage significatif sous 5000 ft (ou MSA) et aucun phénomène notable.", "NOSIG : aucun changement significatif prévu à court terme dans un METAR.", "BECMG / TEMPO : évolution durable / variation temporaire dans un TAF ou une tendance.", "Dans un METAR, le vent se lit direction/vitesse, ex. 24012KT = 240° pour 12 nœuds.", "Q1013 dans un METAR indique le QNH en hectopascals.", "RVR est publiée quand la visibilité descend sous un seuil bas.", "ATIS : information d'aérodrome (piste en service, météo, NOTAM clés) diffusée en boucle.", "NOTAM : avis signalant un changement temporaire (piste fermée, balise en panne, obstacle).", "Turn-around : rotation au sol de l'avion ; le low-cost vise souvent ~25 minutes.", "Block time : temps cales enlevées à cales mises, base de la facturation et des limitations.", "Chocks off / on : mise et retrait des cales, qui bornent le temps de bloc.", "Pushback : repoussage par tracteur ; le « powerback » aux moteurs est interdit sur la plupart des avions.", "Dégivrage Type I : fluide chaud qui enlève le givre déjà présent.", "Antigivrage Type IV : fluide épais qui protège la voilure avant le décollage.", "Holdover time : durée pendant laquelle le fluide antigivrage reste efficace.", "GSE : matériel de piste (tracteurs, GPU, tapis, escaliers, dégivreuses…).", "Marshalling : guidage visuel de l'avion au sol par un placeur.", "« Follow the greens » : guidage au sol par des feux de taxiway commandés.", "Le refueling se fait souvent avec passagers à bord, sous conditions et surveillance.", "Potable water, lav service, catering : prestations de piste standard d'une escale.", "Le NOTOC est remis au commandant avant le départ en présence de marchandises dangereuses.", "Autobrake : freinage automatique réglable (LO / MED / MAX, et RTO au décollage).", "L'inversion de poussée complète le freinage mais l'essentiel vient des freins et spoilers.", "Les ground spoilers se déploient au toucher pour plaquer l'avion et augmenter le freinage.", "Braking action / piste contaminée : l'état de surface est codé pour ajuster les distances.", "Le RCR / code de piste renseigne l'équipage sur l'adhérence disponible.", "Displaced threshold : seuil décalé réduisant la distance d'atterrissage disponible.", "PAPI et rampe d'approche guident visuellement l'alignement et le plan.", "MEL (Minimum Equipment List) : équipements pouvant être inopérants au départ, avec conditions et délais.", "CDL (Configuration Deviation List) : éléments structurels externes tolérés manquants.", "Les items MEL portent un délai de réparation (catégories A, B, C, D).", "EFB : sac de vol électronique (tablette) remplaçant cartes et manuels papier.", "OFP : plan de vol opérationnel détaillant route, carburant, météo et alternates.", "Wet lease / ACMI : location d'un avion avec équipage, maintenance et assurance.", "Dry lease : location de l'avion seul, sans équipage.", "L'immatriculation est unique par avion ; en France elle commence par F.", "MSN : numéro de série constructeur, identifiant l'avion toute sa vie.", "Le cycle (un décollage + un atterrissage) fatigue la structure autant que les heures de vol.", "La maintenance suit des paliers : transit, check journalier, A-check, C-check, D-check.", "Un D-check (grande visite) peut immobiliser l'avion plusieurs semaines.", "AD (Airworthiness Directive) : consigne de navigabilité obligatoire émise par l'autorité.", "SB (Service Bulletin) : recommandation d'évolution émise par le constructeur.", "Le CRM technique (techlog) recense pannes et actions, à disposition de l'équipage.", "CAT II/III exigent des équipements avion et sol certifiés et des équipages qualifiés.", "L'holding standard s'effectue par virages à droite, une minute par branche sous 14 000 ft.", "EAT (Expected Approach Time) : heure d'approche prévue communiquée en cas d'attente.", "Radar vectors : caps donnés par l'ATC pour guider l'avion, hors procédure publiée.", "Slot / CTOT : créneau de décollage imposé par la régulation du trafic (flow control).", "Le slot tolère quelques minutes autour du CTOT, sinon il faut le refaire.", "MSA (Minimum Safe/Sector Altitude) : altitude garantissant la marge sur le relief autour d'un point.", "OCA/OCH : altitude/hauteur de franchissement d'obstacles d'une procédure d'approche.", "Un go-around suit une trajectoire d'approche interrompue (missed approach) publiée.", "Le transpondeur en mode ALT (Mode C/S) est requis dans la plupart des espaces contrôlés.", "Le second officier (relève) permet d'allonger le temps de service sur les très longs vols.", "FTL (Flight Time Limitations) : règles limitant temps de vol, de service et de repos.", "Le commandant peut invoquer son autorité pour dépasser certaines limites en cas de sécurité.", "L'anglais OACI niveau 4 minimum est requis pour la phraséologie radio internationale.", "La phraséologie standard réduit les malentendus : chaque mot a un sens précis.", "« Line up and wait » : s'aligner sur la piste et attendre l'autorisation de décoller.", "« Cleared for the ILS » autorise l'approche, pas encore l'atterrissage.", "Le briefing d'approche couvre piste, minimums, config, remise de gaz et taxi prévu.", "Le calcul de perfo d'atterrissage tient compte de la piste, du vent, de l'état de surface et de la masse.", "Les cartes Jeppesen ou AIP fournissent SID, STAR, approches et minimums.", "La MEA (Minimum En-route Altitude) garantit réception des balises et marge sur le relief en route.", "Un « expect » de l'ATC est une prévision, pas une autorisation.", "Le readback (collationnement) des consignes ATC est obligatoire pour les éléments clés.", "La séparation radar standard en approche est souvent de 3 NM (ou 5 NM en route).", "Le squawk assigné identifie l'avion sur l'écran radar du contrôleur.", "Le transfert entre secteurs ATC se fait par changement de fréquence sur instruction.", "Le vol IFR se déroule selon des règles de vol aux instruments, guidé par l'ATC.", "Le vol VFR repose sur le « voir et éviter » et des conditions météo minimales.", "Le plan de vol déposé réserve la route et le niveau auprès du contrôle.", "L'OACI code chaque aérodrome sur 4 lettres ; Beauvais-Tillé est LFOB.", "En France, les codes OACI commencent par LF.", "Le vent traversier maximal est une limite opérationnelle propre à chaque type d'avion.", "La technique du crabe corrige la dérive due au vent traversier jusqu'au décrabage à l'arrondi.", "Le contaminant (eau, neige, slush) allonge le décollage et dégrade le freinage.", "Le de-icing/anti-icing se note par un code (type de fluide, dilution, heure de début).", "Le point de rosée proche de la température favorise brouillard et givrage.", "Le givrage carburateur ne concerne pas les turbines, mais le givrage cellule oui.", "Le dégivrage moteur/aile utilise l'air chaud prélevé (bleed) ou des résistances électriques (787).", "Le 787 utilise des prélèvements électriques plutôt que de l'air bleed pour de nombreux systèmes.", "Le fly-by-wire remplace les câbles par des commandes électriques et des calculateurs.", "L'autothrust/autothrottle gère la poussée pour tenir une vitesse ou un mode donné.", "Le yaw damper amortit automatiquement le lacet parasite en croisière.", "Le trim de profondeur (stab trim) équilibre l'avion pour relâcher les efforts au manche.", "Un mistrim au décollage déclenche une alerte de configuration (« CONFIG »).", "Le take-off config check vérifie volets, trim et aérofreins avant de s'aligner.", "Le flaps load relief rentre automatiquement les volets si la vitesse devient excessive.", "Le speedbrake en vol augmente la traînée pour descendre ou ralentir plus vite.", "L'alternate law (Airbus) réduit les protections après certaines pannes.", "La direct law relie directement les commandes aux gouvernes, sans protection.", "Le RA (radioaltimètre) mesure la hauteur réelle sol par renvoi radio, précis en approche.", "Les callouts de hauteur (« FIFTY, FORTY… ») en approche viennent du radioaltimètre.", "La MDA/DA n'est atteignable que si les références visuelles requises sont acquises.", "Le missed approach point (MAPt) marque la limite d'une approche classique sans visuel.", "Le circling est une approche à vue autour de l'aérodrome pour se poser sur une autre piste.", "Le baulked landing est une remise de gaz décidée très tard, après l'arrondi.", "L'ETOPS impose la surveillance de l'état des aérodromes de déroutement pendant le vol.", "Le suivi de la MEL peut imposer des restrictions de perfo ou d'ETOPS.", "Le carburant de dégagement couvre une remise de gaz puis la route vers l'alternate.", "L'alternate au décollage est requis si la météo au départ est sous les minimums d'atterrissage.", "Le take-off alternate doit être atteignable en un temps limité, un moteur en panne.", "La masse structurelle et la masse performance retenue est la plus contraignante des deux.", "Le climb gradient minimal d'un SID peut limiter la masse au décollage.", "La MTOW du jour dépend de l'altitude terrain, de la température et du QNH.", "Par forte chaleur ou en altitude, la portance et la poussée baissent : perfo dégradée.", "Le derating/flex réduit l'EGT et allonge la vie des moteurs quand la piste le permet.", "Le reverse est souvent réduit à l'idle sous une certaine vitesse pour limiter l'ingestion.", "Le brake cooling time évite de repartir avec des freins surchauffés.", "Le fuel temperature bas peut imposer une descente ou une accélération pour réchauffer le kéro.", "Le tankering est arbitré selon le prix du carburant et le surcoût de masse transportée.", "Le contingency peut être réduit via des points de redécision (RCF) sur certaines compagnies.", "L'OFP indique aussi les vents prévus par tranche de route et les températures.", "Le SIGMET signale des phénomènes dangereux en route (orages, givrage sévère, cendres).", "Le nuage de cendres volcaniques peut endommager gravement les moteurs : évitement impératif.", "Le AIRMET signale des phénomènes moins sévères que le SIGMET.", "Le PIREP est un compte rendu de conditions rencontrées, transmis par un équipage.", "Le wake vortex encounter est plus critique en approche, avions rapprochés et lents."];
  let bag = [], last = null, factTimer = null;
  const INTERVAL = 10000;

  function reshuffle(){
    bag = FACTS.slice();
    for(let i=bag.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=bag[i]; bag[i]=bag[j]; bag[j]=t; }
    if(bag.length>1 && bag[0]===last){ const t=bag[0]; bag[0]=bag[1]; bag[1]=t; }
  }
  function pick(){
    if(!FACTS.length) return '';
    if(!bag.length) reshuffle();
    const f = bag.shift(); last = f; return f;
  }
  function paint(){
    const box = document.getElementById('homeFact');
    const txt = document.getElementById('homeFactText');
    if(!box || !txt) return;
    box.classList.remove('show');
    setTimeout(function(){ txt.textContent = pick(); box.classList.add('show'); }, 300);
  }
  // Affiche une anecdote et resynchronise le minuteur de secours
  window.homeNextFact = function(){
    paint();
    clearInterval(factTimer);
    factTimer = setInterval(paint, INTERVAL); // secours si le diaporama ne tourne pas
  };

  function start(){ window.homeNextFact(); }
  if(document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
