// Génère le site statique kumak.fr dans dist/
// Usage : node build.mjs            -> production (brouillons exclus)
//         node build.mjs --drafts   -> aperçu local, brouillons inclus
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

const DRAFTS = process.argv.includes("--drafts");
import { createHash } from "node:crypto";
const ASSET_V = createHash("md5").update(readFileSync("static/style.css")).update(readFileSync("static/signup.js")).update(readFileSync("static/verif.js")).digest("hex").slice(0, 8);
const cfg = JSON.parse(readFileSync("site.config.json", "utf8"));
const OUT = "dist";
rmSync(OUT, { recursive: true, force: true });

// ---------- utilitaires ----------
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dateFr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`; };
// Typographie française : espace insécable avant « : ; ? ! » et à l'intérieur des guillemets
const typo = (html) => html.replace(/« /g, "«\u00a0").replace(/ »/g, "\u00a0»").replace(/ ([:;?!])(?=[\s<])/g, "\u00a0$1").replace(/(\d) (%|€|TWhc|GWh|kWh|m³)/g, "$1\u00a0$2");
const write = (path, html) => { const full = join(OUT, path); mkdirSync(full.replace(/\/[^/]+$/, ""), { recursive: true }); writeFileSync(full, path.endsWith(".html") ? typo(html) : html); };

const IMPACT = {
  "ACTION": { cls: "crit", label: "Action" },
  "SURVEILLER": { cls: "warn", label: "Surveiller" },
  "À LIRE": { cls: "ok", label: "À lire" },
};
const badge = (k) => `<span class="imp ${IMPACT[k].cls}">${IMPACT[k].label}</span>`;

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error("Frontmatter manquant");
  const data = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v === "true") v = true; else if (v === "false") v = false; else if (/^\d+$/.test(v)) v = Number(v);
    data[k] = v;
  }
  return { data, body: m[2] };
}

// ---------- fiches CEE ----------
const FICHE_RE = /\b(BAR|BAT|IND|RES|TRA|AGRI)-[A-Z]{2,3}-\d{3}\b(?!-)/g;
const ficheSlug = (c) => c.toLowerCase();
// Liens automatiques vers /fiches/<code>/, hors balises et hors liens existants
const linkFiches = (html) => html.split(/(<a\b[\s\S]*?<\/a>|<[^>]+>)/).map((seg) =>
  seg.startsWith("<") ? seg : seg.replace(FICHE_RE, (c) => `<a class="fiche-link" href="/fiches/${ficheSlug(c)}/">${c}</a>`)).join("");

// ---------- éditions ----------
const loadSeries = (dir, required) => (existsSync(dir) ? readdirSync(dir) : [])
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { data, body } = parseFrontmatter(readFileSync(join(dir, f), "utf8"));
    const slug = f.replace(/\.md$/, "");
    for (const k of required) if (!data[k]) throw new Error(`${f} : champ « ${k} » manquant`);
    const todo = /À COMPLÉTER/i.test(body);
    if (!data.brouillon && todo) throw new Error(`${f} : il reste des « À COMPLÉTER ». Complétez-les ou remettez « brouillon: true ».`);
    let html = marked.parse(body);
    const items = [];
    html = html.replace(/<h3>\[(ACTION|SURVEILLER|À LIRE)\]\s*(.*?)<\/h3>/g, (_, k, t) => { items.push({ k, t }); const id = `t${items.length}`; return `<h3 id="${id}">${badge(k)} <span>${t}</span></h3>`; });
    // Rubrique « Concrètement, pour vous » : une carte par profil
    // Markdown attendu : - **Vous êtes…** puis sous-liste « Ce qui change : … », « Exemple : … », « À faire : … »
    html = html.replace(/<h2>Concrètement, pour vous<\/h2>\s*([\s\S]*?)(?=<h2|<h3|$)/, (_, lis) => {
      const cards = lis.split(/<li>(?=\s*<strong>)/).slice(1).map((li) => {
        const who = (li.match(/<strong>(.*?)<\/strong>/) || [, ""])[1];
        const rows = [...li.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, r]) => {
          const m = r.trim().match(/^([^:<]{2,20})\s*:\s*([\s\S]*)$/);
          return m ? `<p><span class="lbl">${m[1]}</span>${m[2].replace(/^./, (c) => c.toUpperCase())}</p>` : `<p>${r}</p>`;
        }).join("");
        return `<div class="profile"><h3>${who}</h3>${rows}</div>`;
      }).join("");
      return `<section class="profiles" aria-label="Concrètement, pour vous"><h2>Concrètement, pour vous</h2><div class="profile-grid">${cards}</div></section>`;
    });
    // Section « Impact sur vos outils » : extraite vers sa propre page /impact-outils/<slug>/ ; l'édition garde une carte de renvoi
    let cahier = null;
    html = html.replace(/<h2>Impact sur vos outils<\/h2>([\s\S]*?)(?=<h2|$)/, (_, inner) => {
      const sujets = [...inner.matchAll(/<h3>(.*?)<\/h3>/g)].map((m) => m[1].replace(/<[^>]+>/g, ""));
      cahier = { url: `/impact-outils/${slug}/`, sujets, html: linkFiches(inner.replace(/<h3>/g, "<h2>").replace(/<\/h3>/g, "</h2>")) };
      return `<a class="it-card" id="outils-si" href="${cahier.url}"><span class="eyebrow">Impact sur vos outils</span><strong>${sujets[0] || "Ce qu'il faut adapter"}</strong>${sujets.length > 1 ? `<span>${sujets.slice(1).join(" · ")}</span>` : ""}<em>Lire le cahier : champs, règles, cas de test →</em></a>`;
    });
    html = linkFiches(html);
    // Garde-fou : aucune section ni vignette du Markdown ne doit disparaître au rendu
    const nSec = (body.match(/^### \[(ACTION|SURVEILLER|À LIRE)\]/gm) || []).length, nSecHtml = (html.match(/<h3 id="t\d+">/g) || []).length;
    const nCard = (body.match(/^- \*\*Vous /gm) || []).length, nCardHtml = (html.match(/<div class="profile">/g) || []).length;
    if (nSec !== nSecHtml || nCard !== nCardHtml) throw new Error(`${f} : rendu incomplet (sections ${nSecHtml}/${nSec}, vignettes ${nCardHtml}/${nCard}). Publication bloquée.`);
    return { ...data, date: String(data.date), slug, html, body, items, todo, cahier };
  })
  .filter((e) => DRAFTS || !e.brouillon);

const editions = loadSeries("content/editions", ["numero", "date", "titre", "accroche"])
  .sort((a, b) => b.date.localeCompare(a.date));

// Rétrospective 2026 : numéros mis en ligne après coup, chacun couvrant une période passée
const retros = loadSeries("content/retro-2026", ["numero", "date", "periode", "titre", "accroche"])
  .sort((a, b) => a.numero - b.numero);

// ---------- gabarits ----------
const toc = (items, cahier) => items.length + (cahier ? 1 : 0) < 2 ? "" : `<nav class="toc" aria-label="Dans ce numéro"><div class="eyebrow">Dans ce numéro</div><ol>${items.map((it, i) => `<li><a href="#t${i + 1}">${badge(it.k)}<span>${it.t}</span></a></li>`).join("")}${cahier ? `<li><a href="#outils-si"><span class="badge b-outils">OUTILS</span><span>Impact sur vos outils : ${cahier.sujets[0] || ""}</span></a></li>` : ""}</ol></nav>`;

const ladder = `<div class="ladder" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>`;

function signupForm(id, label = "Recevoir l'édition gratuite du lundi") {
  return `<form class="signup" data-signup data-action="${esc(cfg.brevoFormAction)}" novalidate>
  <label for="${id}" class="eyebrow">${label}</label>
  <input id="${id}" name="EMAIL" type="email" placeholder="prenom@entreprise.fr" autocomplete="email" required>
  <input class="hp" type="text" name="email_address_check" value="" tabindex="-1" autocomplete="off" aria-hidden="true">
  <input type="hidden" name="locale" value="fr">
  <button class="btn" type="submit">S'inscrire</button>
  <div class="thanks" role="status" hidden></div>
  <p class="note">Gratuit, un e-mail le lundi. Désinscription en un clic. <a href="/confidentialite/">Données personnelles</a></p>
</form>`;
}

const navLink = (href, label, path, also = []) => {
  const on = path === href || also.some((a) => path.startsWith(a));
  return `<a href="${href}"${on ? ' aria-current="page"' : ""}>${label}</a>`;
};
function page({ title, description = cfg.description, path = "/", body, type = "website", noindex = false }) {
  const fullTitle = title ? `${title} · ${cfg.name}` : `${cfg.name} · ${cfg.tagline}`;
  const url = cfg.url + path;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">${noindex ? '\n<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${cfg.name}">
<meta property="og:title" content="${esc(title || cfg.tagline)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="fr_FR">
<meta property="og:image" content="${cfg.url}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="627">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B6E4F">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${cfg.name}" href="/feed.xml">
<link rel="preload" href="/fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css?v=${ASSET_V}">
</head>
<body>
${ladder}
<div class="wrap">
<header class="nav">
  <a class="logo" href="/">KUMAK <small>VEILLE CEE</small></a>
  <nav class="main-links" aria-label="Navigation principale">
    ${navLink("/veille/", "Veille", path, ["/editions/", "/retro-2026/"])}
    ${navLink("/calendrier/", "Échéances", path)}
    ${navLink("/impact-outils/", 'Impact <span class="nl">sur vos </span>outils', path)}
    ${navLink("/fiches/", "Fiches", path)}
  </nav>
  <a class="btn-sm nav-cta" href="/#inscription">S'inscrire</a>
</header>
${body}
<footer>
  <span>${cfg.name} · kumak.fr · veille des certificats d'économies d'énergie. Information, pas de conseil juridique.</span>
  <nav aria-label="Pied de page">
    <a href="/veille/">Veille</a>
    <a href="/calendrier/">Échéances</a>
    <a href="/impact-outils/">Impact sur vos outils</a>
    <a href="/fiches/">Fiches</a>
    <a href="/feed.xml">RSS</a>
    <a href="/mentions-legales/">Mentions légales</a>
    <a href="/confidentialite/">Confidentialité</a>
    <a href="mailto:${cfg.contactEmail}">Contact</a>
  </nav>
</footer>
</div>
<script src="/signup.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

// ---------- accueil ----------
const latest = editions[0];
const sample = latest
  ? `<aside class="edition" aria-label="Dernière édition">
  <div class="ed-head"><strong>Édition nº ${latest.numero}</strong><span>${dateFr(latest.date)}</span></div>
  ${latest.items.slice(0, 4).map((it) => `<div class="item">${badge(it.k)}<h3>${it.t}</h3></div>`).join("\n  ")}
  <a class="ed-foot" href="/editions/${latest.slug}/">Lire l'édition : ${esc(latest.titre)} →</a>
</aside>`
  : `<aside class="edition" aria-label="Exemple d'édition">
  <div class="ed-head"><strong>Chaque lundi</strong><span>3 niveaux d'impact</span></div>
  <div class="item">${badge("ACTION")}<h3>Il faut modifier vos dossiers ou vos process avant une date donnée.</h3></div>
  <div class="item">${badge("SURVEILLER")}<h3>Un changement arrive : il faut l'anticiper dans vos contrats ou vos outils.</h3></div>
  <div class="item">${badge("À LIRE")}<h3>C'est bon à savoir, sans action immédiate.</h3></div>
</aside>`;



// ---------- éditions : pages ----------
for (const e of editions) {
  write(`editions/${e.slug}/index.html`, page({
    title: `Nº ${e.numero} · ${e.titre}`,
    description: e.accroche,
    path: `/editions/${e.slug}/`,
    type: "article",
    body: `<main class="article narrow">
  <p class="meta"><a href="/veille/">Veille</a> · Nº ${e.numero} · ${dateFr(e.date)}${e.brouillon ? '<span class="draft-flag">BROUILLON</span>' : ""}</p>
  <h1>${esc(e.titre)}</h1>
  <p class="lede">${esc(e.accroche)}</p>
  ${toc(e.items, e.cahier)}<div class="prose">${e.html}</div>
  <p class="disclaimer">KUMAK est une veille d'information. Elle ne constitue pas un conseil juridique : vérifiez toujours le texte officiel, et consultez un avocat pour une situation particulière.</p>
  <div class="cta-box" id="inscription">
    <h2>Recevez la prochaine édition.</h2>
    <p>Un e-mail le lundi matin, 5 minutes de lecture.</p>
    ${signupForm("email-ed", "Votre adresse e-mail")}
  </div>
</main>`,
  }));
}

const veilleBody = `<main class="article narrow">
  <div class="eyebrow">Veille</div>
  <h1>Toute la veille CEE</h1>
  <p class="lede">Les textes CEE décodés : ce qui change, pour qui, et ce qu'il faut faire.</p>
  <h2 class="list-title">Éditions hebdo</h2>
  ${editions.length
    ? `<ul class="archive">${editions.map((e) => `<li><a href="/editions/${e.slug}/"><span class="num">Nº ${e.numero}<br>${dateFr(e.date)}</span><span><strong>${esc(e.titre)}${e.brouillon ? '<span class="draft-flag">BROUILLON</span>' : ""}</strong><span class="acc">${esc(e.accroche)}</span></span></a></li>`).join("")}</ul>`
    : `<p>La première édition paraît bientôt. Inscrivez-vous pour la recevoir.</p>`}
  ${retros.length ? `<h2 class="list-title">Rétrospective 2026</h2>
  <p class="list-intro">KUMAK a été lancé en octobre 2026. Cette série reprend, mois par mois, les textes parus depuis le début de la sixième période.</p>
  <ul class="archive">${retros.map((r) => `<li><a href="/retro-2026/${r.slug}/"><span class="num">${esc(r.periode)}</span><span><strong>${esc(r.titre)}${r.brouillon ? '<span class="draft-flag">BROUILLON</span>' : ""}</strong><span class="acc">${esc(r.accroche)}</span></span></a></li>`).join("")}</ul>` : ""}
  <div class="cta-box" id="inscription">
    <h2>Ne ratez pas la prochaine.</h2>
    ${signupForm("email-arch", "Votre adresse e-mail")}
  </div>
</main>`;
for (const path of ["veille", "editions"]) write(`${path}/index.html`, page({
  title: "Veille",
  description: "Toutes les éditions de KUMAK, la veille réglementaire CEE, et la Rétrospective 2026.",
  path: "/veille/",
  body: veilleBody,
}));

// ---------- rétrospective 2026 ----------
const retroMeta = (r) => `Rétro 2026 · Nº ${r.numero} · Période couverte : ${esc(r.periode)}`;
for (const [i, r] of retros.entries()) {
  const prev = retros[i - 1], next = retros[i + 1];
  write(`retro-2026/${r.slug}/index.html`, page({
    title: `Rétro 2026 · ${r.periode} · ${r.titre}`,
    description: r.accroche,
    path: `/retro-2026/${r.slug}/`,
    type: "article",
    body: `<main class="article narrow">
  <p class="meta"><a href="/veille/">Veille</a> · <a href="/retro-2026/">Rétrospective 2026</a> · Nº ${r.numero} · <strong>Période couverte : ${esc(r.periode)}</strong>${r.brouillon ? '<span class="draft-flag">BROUILLON</span>' : ""}</p>
  <h1>${esc(r.titre)}</h1>
  <p class="lede">${esc(r.accroche)}</p>
  <p class="retro-note">Numéro de la rétrospective 2026, mis en ligne le ${dateFr(r.date)}. Il reprend l'actualité de la période couverte ; certaines règles ont pu évoluer depuis.</p>
  ${toc(r.items, r.cahier)}<div class="prose">${r.html}</div>
  <nav class="retro-nav" aria-label="Numéros de la rétrospective">
    ${prev ? `<a href="/retro-2026/${prev.slug}/">← ${esc(prev.periode)}</a>` : "<span></span>"}
    ${next ? `<a href="/retro-2026/${next.slug}/">${esc(next.periode)} →</a>` : `<a href="/veille/">Toute la veille →</a>`}
  </nav>
  <p class="disclaimer">KUMAK est une veille d'information. Elle ne constitue pas un conseil juridique : vérifiez toujours le texte officiel, et consultez un avocat pour une situation particulière.</p>
  <div class="cta-box" id="inscription">
    <h2>La suite, chaque lundi.</h2>
    <p>Recevez les prochains textes CEE décodés, au fil de l'eau.</p>
    ${signupForm("email-retro", "Votre adresse e-mail")}
  </div>
</main>`,
  }));
}

if (retros.length) write("retro-2026/index.html", page({
  title: "Rétrospective 2026",
  description: "L'actualité réglementaire CEE de janvier à octobre 2026, mois par mois, classée par impact et sourcée.",
  path: "/retro-2026/",
  body: `<main class="article narrow">
  <div class="eyebrow">Rétrospective 2026</div>
  <h1>10 mois de P6, mois par mois</h1>
  <p class="lede">KUMAK a été lancé en octobre 2026. Cette série reprend, mois par mois, les textes CEE parus depuis le début de la sixième période. Chaque numéro indique la période qu'il couvre et sa date de mise en ligne.</p>
  <ul class="archive">${retros.map((r) => `<li><a href="/retro-2026/${r.slug}/"><span class="num">Nº ${r.numero}<br>${esc(r.periode)}</span><span><strong>${esc(r.titre)}${r.brouillon ? '<span class="draft-flag">BROUILLON</span>' : ""}</strong><span class="acc">${esc(r.accroche)}</span></span></a></li>`).join("")}</ul>
  <div class="cta-box" id="inscription">
    <h2>La suite, chaque lundi.</h2>
    ${signupForm("email-retroidx", "Votre adresse e-mail")}
  </div>
</main>`,
}));

// ---------- index des fiches ----------
// Intitulés repris des numéros publiés (et vérifiés) ; vide si l'intitulé officiel n'a pas été vérifié.
const FICHE_NOMS = {
  "BAR-TH-101": "Chauffe-eau solaire individuel", "BAR-TH-143": "Système solaire combiné",
  "BAR-TH-148": "Chauffe-eau thermodynamique à accumulation", "BAR-TH-162": "Système photovoltaïque et thermique à circulation d'eau",
  "BAR-TH-166": "Pompe à chaleur collective (supprimée)", "BAR-TH-168": "Dispositif solaire thermique",
  "BAR-TH-171": "Pompe à chaleur air/eau", "BAR-TH-172": "Pompe à chaleur eau/eau ou eau glycolée/eau",
  "BAR-TH-174": "Rénovation d'ampleur d'une maison individuelle", "BAR-TH-175": "Rénovation d'ampleur d'un appartement",
  "BAR-TH-177": "Rénovation globale d'un bâtiment résidentiel collectif",
  "BAR-TH-178": "Système géothermique (résidentiel collectif)", "BAR-TH-179": "Pompe à chaleur collective air/eau",
  "BAR-TH-180": "Pompe à chaleur collective eau/eau ou eau glycolée/eau",
  "BAR-SE-109": "Désembouage d'un réseau de chauffage collectif", "BAR-EQ-110": "Luminaire LED pour parties communes",
  "BAT-EQ-127": "Luminaires LED (tertiaire)", "BAT-TH-113": "Pompe à chaleur (tertiaire, supprimée)",
  "BAT-TH-162": "Système géothermique (tertiaire)", "BAT-TH-163": "Pompe à chaleur air/eau (tertiaire)",
  "BAT-TH-164": "Pompe à chaleur eau/eau ou eau glycolée/eau (tertiaire)", "IND-BA-116": "Luminaires à modules LED (industrie)",
  "TRA-SE-104": "Station de gonflage des pneumatiques", "AGRI-EQ-108": "Stockage d'eau pour une serre bioclimatique",
  "AGRI-EQ-110": "Séchage solaire par insufflation", "AGRI-EQ-112": "Double paroi gonflable sur serres",
  "AGRI-TH-108": "Pompe à chaleur air/eau ou eau/eau (agriculture)", "AGRI-TH-117": "Déshumidification thermodynamique pour serres",
  "AGRI-TH-119": "Déshumidification avec air extérieur",
  "BAR-TH-106": "Chaudière individuelle à haute performance énergétique (supprimée en 2024)",
  "BAR-TH-107": "Chaudière collective à haute performance énergétique", "BAR-TH-113": "Chaudière biomasse individuelle",
  "BAR-TH-164": "Rénovation globale d'une maison individuelle",
};
// Thèmes en langage chantier + mots-clés de recherche (synonymes utilisés par les installateurs)
const THEMES = [
  { id: "pac", nom: "Pompes à chaleur", kw: "pompe a chaleur pompes pac chauffage chauffagiste air eau aerothermie aerothermique geothermie radiateur plancher chauffant climatisation",
    codes: ["BAR-TH-171", "BAR-TH-172", "BAR-TH-166", "BAR-TH-179", "BAR-TH-180", "BAT-TH-113", "BAT-TH-163", "BAT-TH-164", "AGRI-TH-108"] },
  { id: "chaud", nom: "Chaudières et géothermie", kw: "chaudiere chaudieres gaz fioul bois granules pellets biomasse buches chauffage chauffagiste geothermie geothermique forage sonde",
    codes: ["BAR-TH-106", "BAR-TH-107", "BAR-TH-113", "BAR-TH-178", "BAT-TH-162", "BAT-TH-102"] },
  { id: "ecs", nom: "Eau chaude et solaire", kw: "chauffe-eau chauffe eau ballon cumulus thermodynamique cet cesi solaire panneau panneaux capteur capteurs eau chaude sanitaire ecs plombier plomberie photovoltaique pvt",
    codes: ["BAR-TH-101", "BAR-TH-143", "BAR-TH-148", "BAR-TH-162", "BAR-TH-168"] },
  { id: "reno", nom: "Rénovation globale", kw: "renovation ampleur globale isolation isolant isoler combles murs toiture fenetres menuiserie dpe audit energetique maison appartement copropriete logement",
    codes: ["BAR-TH-164", "BAR-TH-174", "BAR-TH-175", "BAR-TH-177"] },
  { id: "reseau", nom: "Réseaux de chauffage", kw: "desembouage embouage reseau circuit chauffage collectif copropriete entretien",
    codes: ["BAR-SE-109"] },
  { id: "led", nom: "Éclairage", kw: "led eclairage luminaire luminaires lampe lampes electricien electricite parties communes bureaux",
    codes: ["BAR-EQ-110", "BAT-EQ-127", "IND-BA-116"] },
  { id: "agri", nom: "Agriculture et serres", kw: "serre serres agriculture agricole maraicher horticole sechage deshumidification exploitation",
    codes: ["AGRI-EQ-108", "AGRI-EQ-110", "AGRI-EQ-112", "AGRI-TH-117", "AGRI-TH-119"] },
  { id: "transp", nom: "Transport", kw: "pneu pneus pneumatiques gonflage garage station vehicule",
    codes: ["TRA-SE-104"] },
];
const themeOf = (c) => THEMES.find((t) => t.codes.includes(c)) || { id: "autre", nom: "Autres", kw: "" };
const norm = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const SECTEURS = { BAR: "Résidentiel", BAT: "Tertiaire", IND: "Industrie", RES: "Réseaux", TRA: "Transport", AGRI: "Agriculture" };
const VERIF_FICHES = ["BAR-TH-171", "BAR-TH-172", "BAR-TH-148", "BAR-TH-101", "BAR-TH-143"];
const cleanMd = (l) => l.replace(/^\s*[-*]\s+/, "").replace(/^\|\s*|\s*\|\s*$/g, "").replace(/\s*\|\s*/g, " · ")
  .replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^#+\s*/, "").replace(/\[(ACTION|SURVEILLER|À LIRE)\]\s*/, "").trim();

const fiches = {};
const sources = [
  ...editions.filter((e) => !e.brouillon).map((e) => ({ url: `/editions/${e.slug}/`, label: `Édition nº ${e.numero} · ${dateFr(e.date)}`, titre: e.titre, tri: e.date + "-z", body: e.body, cahier: e.cahier, slug: e.slug })),
  ...retros.filter((r) => !r.brouillon).map((r) => ({ url: `/retro-2026/${r.slug}/`, label: `Rétrospective · ${r.periode}`, titre: r.titre, tri: `2026-${String(r.numero).padStart(2, "0")}`, body: r.body, cahier: r.cahier, slug: r.slug })),
];
for (const src of sources) {
  let h2 = "", impact = null, inCode = false;
  const found = {};
  for (const line of src.body.split("\n")) {
    if (line.startsWith("```")) { inCode = !inCode; continue; }
    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) { if (h[1] === "##") h2 = h[2]; const m = h[2].match(/^\[(ACTION|SURVEILLER|À LIRE)\]/); impact = h[1] === "###" ? (m ? m[1] : null) : null; }
    if (inCode || /^(Sources|Impact sur vos outils)$/i.test(h2) || /^\|[\s|:-]+\|$/.test(line)) continue;
    const codes = [...new Set(line.match(FICHE_RE) || [])];
    if (!codes.length) continue;
    const txt = cleanMd(line);
    if (txt.length < 12) continue;
    for (const c of codes) {
      const f = (found[c] ||= { impact: null, snippets: [] });
      if (impact && !f.impact) f.impact = impact;
      if (!f.snippets.includes(txt) && f.snippets.length < 3) f.snippets.push(txt);
    }
  }
  for (const [c, f] of Object.entries(found)) (fiches[c] ||= []).push({ ...src, ...f });
}
const codes = Object.keys(fiches).sort();
const ficheTitle = (c) => FICHE_NOMS[c] ? `${FICHE_NOMS[c].replace(/ \(supprimée.*\)$/, "")} (${c})` : c;
const CATALOGUE = "https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie";

for (const c of codes) {
  const refs = fiches[c].sort((a, b) => b.tri.localeCompare(a.tri));
  write(`fiches/${ficheSlug(c)}/index.html`, page({
    title: ficheTitle(c),
    description: `Fiche CEE ${c}${FICHE_NOMS[c] ? ` (${FICHE_NOMS[c]})` : ""} : tous les changements réglementaires de 2026 décodés par KUMAK.`,
    path: `/fiches/${ficheSlug(c)}/`,
    body: `<main class="article narrow">
  <p class="meta"><a href="/fiches/">Fiches</a> · ${esc(themeOf(c).nom)}</p>
  <div class="eyebrow fiche-code">Fiche ${c} · ${SECTEURS[c.split("-")[0]]}</div>
  <h1>${esc(FICHE_NOMS[c] || c)}</h1>
  <h2 class="list-title">Ce que KUMAK en a dit (${refs.length})</h2>
  <ul class="fiche-refs">${refs.map((r) => `<li>
    <p class="meta">${r.impact ? badge(r.impact) + " " : ""}${esc(r.label)}</p>
    <a class="fr-title" href="${r.url}">${esc(r.titre)}</a>
    <ul>${r.snippets.map((t) => `<li>${linkFiches(marked.parseInline(esc(t)))}</li>`).join("")}</ul>
  </li>`).join("")}</ul>
  <p class="disclaimer">Cette page rassemble les passages de KUMAK qui citent la fiche ${c}. Ce n'est pas l'historique officiel complet : le texte de la fiche en vigueur figure dans le <a href="${CATALOGUE}" target="_blank" rel="noopener">catalogue des opérations standardisées du ministère</a>.</p>
  <div class="cta-box" id="inscription">
    <h2>Soyez prévenu au prochain changement.</h2>
    ${signupForm("email-fiche", "Votre adresse e-mail")}
  </div>
</main>`,
  }));
}

const themesUsed = [...THEMES, { id: "autre", nom: "Autres", kw: "", codes: [] }].map((t) => ({ ...t, list: codes.filter((c) => themeOf(c).id === t.id) })).filter((t) => t.list.length);
const hayClean = (t) => " " + norm(t).replace(/[^a-z0-9]+/g, " ").trim() + " ";
const ficheHay = (c) => hayClean([c, c.replace(/-/g, ""), FICHE_NOMS[c] || "", themeOf(c).nom, themeOf(c).kw].join(" "));
const ficheHay2 = (c) => hayClean(fiches[c].flatMap((r) => r.snippets).join(" "));
write("fiches/index.html", page({
  title: "Les fiches CEE, une par une",
  description: "Pompe à chaleur, chaudière, chauffe-eau, isolation, LED : retrouvez les fiches CEE par équipement et tout ce qui a changé en 2026.",
  path: "/fiches/",
  body: `<main class="article narrow">
  <p class="meta">Fiches</p>
  <h1>Ce qui a changé, fiche par fiche</h1>
  <p class="lede">Retrouvez chaque fiche d'opération standardisée citée par KUMAK et tout ce qui a changé en 2026. Cherchez par code ou par équipement.</p>
  <div class="fsearch">
    <label for="fq" class="sr-only">Rechercher un équipement</label>
    <input id="fq" type="search" placeholder="Ex. BAR-TH-171, pompe à chaleur, rénovation d'ampleur…" autocomplete="off">
    <div class="fchips">${["Pompe à chaleur", "Chaudière", "Chauffe-eau", "Solaire", "Isolation", "LED", "Désembouage"].map((k) => `<button type="button" data-q="${k}">${k}</button>`).join("")}</div>
  </div>
  <p id="fnone" class="fnone" hidden></p>
  ${themesUsed.map((t) => `<section class="ftheme" data-theme="${t.id}">
  <h2 class="list-title">${t.nom}</h2>
  <ul class="fiche-index">${t.list.map((c) => `<li data-hay="${esc(ficheHay(c))}" data-hay2="${esc(ficheHay2(c))}"><a href="/fiches/${ficheSlug(c)}/"><span class="fname">${esc(FICHE_NOMS[c] || "Fiche " + c)}</span><strong>${c}</strong><em>${fiches[c].length} numéro${fiches[c].length > 1 ? "s" : ""}</em></a></li>`).join("")}</ul></section>`).join("")}
  <p class="disclaimer">Seules les fiches qui ont fait l'objet d'un texte décodé par KUMAK figurent ici. Le catalogue complet est publié par le <a href="${CATALOGUE}" target="_blank" rel="noopener">ministère de la Transition écologique</a>.</p>
</main>
<script>
(function () {
  var q = document.getElementById("fq"), none = document.getElementById("fnone");
  var norm = function (t) { return t.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase(); };
  var STOP = " de du des la le les un une et a au aux en pour sur eau air ";
  function match(h, phrase, words) {
    if (words === null) return h.indexOf(" " + phrase) >= 0;
    return words.length > 0 && words.every(function (w) { return h.indexOf(" " + w) >= 0 || (w.length > 4 && h.indexOf(" " + w.slice(0, -1)) >= 0); });
  }
  function pass(attr, phrase, words) {
    var total = 0;
    document.querySelectorAll(".ftheme").forEach(function (sec) {
      var n = 0;
      sec.querySelectorAll("li[data-hay]").forEach(function (li) { var ok = !phrase || match(li.getAttribute(attr), phrase, words); li.hidden = !ok; if (ok) n++; });
      sec.hidden = n === 0; total += n;
    });
    return total;
  }
  function run() {
    var phrase = norm(q.value).replace(/[^a-z0-9]+/g, " ").trim();
    var words = phrase.split(" ").filter(function (w) { return w.length > 1 && STOP.indexOf(" " + w + " ") < 0; });
    var total = pass("data-hay", phrase, null);
    if (!total && phrase) total = pass("data-hay", phrase, words);
    if (!total && phrase) total = pass("data-hay2", phrase, null);
    if (!total && phrase) total = pass("data-hay2", phrase, words);
    none.hidden = total > 0;
    if (!total) none.innerHTML = "Aucune fiche liée à « " + q.value.replace(/[<>&]/g, "") + " » n'a fait l'objet d'un texte décodé par KUMAK en 2026. Si une règle change pour cet équipement, elle apparaîtra ici. Le détail des fiches en vigueur est dans le <a href=\\"${CATALOGUE}\\" target=\\"_blank\\" rel=\\"noopener\\">catalogue du ministère</a>.";
  }
  q.addEventListener("input", run);
  document.querySelectorAll("[data-q]").forEach(function (b) { b.addEventListener("click", function () { q.value = b.getAttribute("data-q"); run(); q.focus(); }); });
  var p = new URLSearchParams(location.search).get("q"); if (p) { q.value = p; run(); }
})();
</script>`,
}));


// ---------- calendrier des échéances ----------
// Construit uniquement à partir des tableaux « Calendrier » des numéros publiés (dates vérifiées). Dates floues (« Fin septembre ») ignorées.
const MOIS_IDX = Object.fromEntries(MOIS.map((m, i) => [m, i + 1]));
const parseDateFr = (t) => { const m = t.trim().match(/^(1er|\d{1,2}) ([a-zéû]+) (\d{4})$/); if (!m || !MOIS_IDX[m[2]]) return null; return `${m[3]}-${String(MOIS_IDX[m[2]]).padStart(2, "0")}-${String(m[1] === "1er" ? 1 : +m[1]).padStart(2, "0")}`; };
const echeances = {};
for (const src of sources) {
  let inCal = false;
  for (const line of src.body.split("\n")) {
    if (/^## /.test(line)) inCal = /^## Calendrier/.test(line);
    if (!inCal || !/^\|/.test(line) || /^\|[\s|:-]+\|$/.test(line)) continue;
    const [d, label] = line.replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
    const iso = parseDateFr(d || "");
    if (!iso || !label) continue;
    const e = (echeances[iso] ||= { iso, label, tri: "", refs: [] });
    if (src.tri > e.tri) { e.tri = src.tri; e.label = cleanMd(label); }
    if (!e.refs.some((r) => r.url === src.url)) e.refs.push(src);
  }
}
const TODAY = new Date().toISOString().slice(0, 10);
const allEch = Object.values(echeances).sort((a, b) => a.iso.localeCompare(b.iso));
const futur = allEch.filter((e) => e.iso >= TODAY), passe = allEch.filter((e) => e.iso < TODAY).reverse();
const echItem = (e) => `<li><time datetime="${e.iso}">${dateFr(e.iso)}</time><div><strong>${linkFiches(esc(e.label))}</strong><span class="ech-src">Source : ${e.refs.sort((a, b) => b.tri.localeCompare(a.tri)).map((r) => `<a href="${r.url}">${esc(r.label)}</a>`).join(" · ")}</span></div></li>`;
write("calendrier/index.html", page({
  title: "Échéances CEE",
  description: "Les dates clés de la réglementation CEE : entrées en vigueur, fins de bonification, recensements. Chaque date avec sa source, à ajouter à votre agenda.",
  path: "/calendrier/",
  body: `<main class="article narrow">
  <p class="meta">Échéances</p>
  <h1>Les échéances CEE</h1>
  <p class="lede">Les dates qui comptent pour vos dossiers, chacune reprise d'un numéro de KUMAK et de sa source officielle.</p>
  <div class="ech-sub">
    <a class="btn" href="webcal://kumak.fr/calendrier.ics">Ajouter à mon agenda</a>
    <p class="hint">Abonnement Outlook, Google Agenda ou Apple Calendrier : les nouvelles dates s'ajoutent toutes seules. Sur Google Agenda : « Autres agendas » → « À partir de l'URL » → <code>https://kumak.fr/calendrier.ics</code></p>
  </div>
  <h2 class="list-title">À venir</h2>
  ${futur.length ? `<ul class="ech">${futur.map(echItem).join("")}</ul>` : "<p>Aucune échéance à venir pour l'instant.</p>"}
  ${passe.length ? `<details class="ech-past"><summary>Déjà passées en 2026 (${passe.length})</summary><ul class="ech">${passe.map(echItem).join("")}</ul></details>` : ""}
  <p class="disclaimer">Seules figurent les dates publiées dans KUMAK et vérifiées sur un texte officiel. Une date peut être modifiée par un nouveau texte : vérifiez toujours le texte en vigueur.</p>
  <div class="cta-box" id="inscription">
    <h2>Soyez prévenu des nouvelles dates.</h2>
    ${signupForm("email-cal", "Votre adresse e-mail")}
  </div>
</main>`,
}));
const icsEsc = (t) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const icsFold = (l) => { const out = []; let s = l; while (Buffer.byteLength(s) > 74) { let i = 74; while (Buffer.byteLength(s.slice(0, i)) > 74) i--; out.push(s.slice(0, i)); s = " " + s.slice(i); } out.push(s); return out.join("\r\n"); };
const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
const nextDay = (iso) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ""); };
write("calendrier.ics", ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KUMAK//Calendrier CEE//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
  "X-WR-CALNAME:KUMAK · Échéances CEE", "X-WR-TIMEZONE:Europe/Paris", "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D",
  ...allEch.flatMap((e) => ["BEGIN:VEVENT", `UID:${e.iso}@kumak.fr`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${e.iso.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${nextDay(e.iso)}`,
    `SUMMARY:${icsEsc("CEE · " + e.label)}`, `DESCRIPTION:${icsEsc("Source : " + e.refs.map((r) => r.label + " " + cfg.url + r.url).join(" ; "))}`, `URL:${cfg.url}${e.refs[0].url}`, "TRANSP:TRANSPARENT", "END:VEVENT"]),
  "END:VCALENDAR"].map(icsFold).join("\r\n") + "\r\n");

// ---------- espaces par profil ----------
// Vignettes « Concrètement, pour vous » extraites des numéros, triées par profil
const PROFIL_INSTALL = /install|chauffagiste|désembouage|rénovez|fabriquez ou distribuez|montez des dossiers|artisan/i;
const PROFIL_OBLIGE = /achetez|vendez|emmy|distribuez du fioul|délégataire|mandataire|obligé|demandeur|montez des dossiers/i;
const vignettes = [];
for (const src of sources) {
  const m = src.body.match(/## Concrètement, pour vous\n([\s\S]*?)(?=\n##|$)/);
  if (!m) continue;
  let cur = null;
  for (const line of m[1].split("\n")) {
    const w = line.match(/^- \*\*(.+?)\*\*/);
    if (w) { cur = { who: w[1], rows: [], src }; vignettes.push(cur); continue; }
    const r = line.match(/^\s+- ([^:]{2,20}?)\s*:\s*(.*)$/);
    if (cur && r) cur.rows.push([r[1], r[2]]);
  }
}
vignettes.sort((a, b) => b.src.tri.localeCompare(a.src.tri));
const vignetteCard = (v) => `<div class="profile"><h3>${esc(v.who)}</h3>${v.rows.map(([l, t]) => `<p><span class="lbl">${esc(l)}</span>${linkFiches(marked.parseInline(esc(t.replace(/^./, (c) => c.toUpperCase()))))}</p>`).join("")}<p class="v-src"><a href="${v.src.url}">${esc(v.src.label)} →</a></p></div>`;
const vInstall = vignettes.filter((v) => PROFIL_INSTALL.test(v.who)).slice(0, 6);
const vOblige = vignettes.filter((v) => PROFIL_OBLIGE.test(v.who)).slice(0, 6);

// Numéros avec une rubrique « Impact sur vos outils »
const impacts = sources.filter((src) => src.cahier).map((src) => ({ ...src, sujets: src.cahier.sujets, cahierUrl: src.cahier.url }))
  .sort((a, b) => b.tri.localeCompare(a.tri));
const impactItem = (i) => `<li><a href="${i.cahierUrl}"><span class="meta">${esc(i.label)}</span><strong>${esc(i.sujets[0] || i.titre)}</strong>${i.sujets.length > 1 ? `<span>${i.sujets.slice(1).map(esc).join(" · ")}</span>` : ""}</a></li>`;

for (const i of impacts) {
  write(`impact-outils/${i.slug}/index.html`, page({
    title: `${i.sujets[0] || i.titre} · Impact sur vos outils`,
    description: `Ce qu'il faut adapter dans votre outil de gestion CEE : ${i.sujets.join(" ; ")}. Champs, règles, cas de test.`,
    path: i.cahierUrl,
    type: "article",
    body: `<main class="article narrow">
  <p class="meta"><a href="/impact-outils/">Impact sur vos outils</a> · ${esc(i.label)}</p>
  <div class="eyebrow">Cahier de modifications</div>
  <h1>${esc(i.sujets[0] || i.titre)}</h1>
  ${i.sujets.length > 1 ? `<p class="lede">Ce cahier couvre aussi : ${i.sujets.slice(1).map(esc).join(" ; ")}.</p>` : ""}
  <p class="cahier-src">Texte décodé dans <a href="${i.url}">${esc(i.label)} : ${esc(i.titre)}</a>.</p>
  <div class="prose cahier">${i.sujets.length === 1 ? i.cahier.html.replace(/^\s*<h2>.*?<\/h2>/, "") : i.cahier.html}</div>
  <p class="disclaimer">Ce cahier traduit un texte réglementaire en règles de gestion. Il ne remplace ni le texte officiel ni l'analyse de vos équipes : vérifiez chaque règle sur la source citée dans le numéro avant de la mettre en œuvre.</p>
  <div class="cta-box" id="inscription">
    <h2>Le prochain cahier, dès sa parution.</h2>
    ${signupForm("email-cahier", "Votre adresse e-mail")}
  </div>
</main>`,
  }));
}

const tool = (href, titre, txt, cta) => `<a class="tool" href="${href}"><strong>${titre}</strong><span>${txt}</span><em>${cta} →</em></a>`;

write("installateurs/index.html", page({
  title: "Espace installateurs", noindex: true,
  description: "Bonification CEE, ménage modeste, ce qui a changé pour votre équipement : les outils KUMAK pour les installateurs et artisans RGE.",
  path: "/installateurs/",
  body: `<main class="article narrow">
  <div class="eyebrow">Installateurs, artisans RGE</div>
  <h1>Vous posez des équipements</h1>
  <p class="lede">Trois outils pour répondre vite à vos clients, et ce qui a changé récemment pour vos chantiers.</p>
  <div class="tools">
    ${tool("/verificateur/", "Ma prime est-elle bonifiée ?", "PAC, chauffe-eau thermodynamique, solaire : la réponse avec le motif et la source.", "Vérifier un chantier")}
    ${tool("/verificateur/#revenus", "Mon client est-il modeste ?", "Avec le nombre de personnes et le revenu fiscal : la catégorie et le plafond 2026.", "Calculer")}
    ${tool("/fiches/", "Ce qui a changé pour mon équipement", "Pompe à chaleur, chaudière, chauffe-eau, isolation, LED…", "Chercher")}
  </div>
  ${vInstall.length ? `<h2 class="list-title">Ce qui a changé pour vous récemment</h2>
  <div class="profile-grid space-grid">${vInstall.map(vignetteCard).join("")}</div>` : ""}
  <div class="cta-box" id="inscription">
    <h2>Les règles changent souvent.</h2>
    <p>Chaque lundi, ce qui change pour vos chantiers, en 5 minutes.</p>
    ${signupForm("email-install", "Votre adresse e-mail")}
  </div>
</main>`,
}));

write("obliges-delegataires/index.html", `<!doctype html><meta charset="utf-8"><title>KUMAK</title><meta name="robots" content="noindex"><link rel="canonical" href="${cfg.url}/"><meta http-equiv="refresh" content="0; url=/"><a href="/">kumak.fr</a>`);

write("impact-outils/index.html", page({
  title: "Impact sur vos outils de gestion CEE",
  description: "Les champs, règles et cas de test à reprendre dans votre outil de gestion CEE après chaque nouveau texte.",
  path: "/impact-outils/",
  body: `<main class="article narrow">
  <div class="eyebrow">Obligés, délégataires, mandataires</div>
  <h1>Impact sur vos outils</h1>
  <p class="lede">Quand un texte change une règle, votre outil de gestion CEE doit suivre. Pour chaque texte important, KUMAK traduit la règle en champs, valeurs, contrôles et cas de test.</p>
  <div class="grid3 it-families">
    <div class="feat"><span class="tag">Développé en interne</span><p>Les tableaux et cas de test servent d'expression de besoin et de recette pour votre équipe.</p></div>
    <div class="feat"><span class="tag">Outil généraliste paramétrable</span><p>Les objets, champs et règles à créer ou à modifier, prêts à confier à votre intégrateur.</p></div>
    <div class="feat"><span class="tag">Progiciel CEE du marché</span><p>Les questions à poser à votre éditeur et les cas de test à lui faire dérouler.</p></div>
  </div>
  ${impacts.length ? `<h2 class="list-title">Les textes traduits</h2>
  <ul class="impact-list">${impacts.map(impactItem).join("")}</ul>` : ""}
  <div class="cta-box" id="inscription">
    <h2>Le prochain cahier, dès sa parution.</h2>
    <p>Chaque lundi, les textes de la semaine classés par impact, et leur traduction pour vos outils.</p>
    ${signupForm("email-impact", "Votre adresse e-mail")}
  </div>
</main>`,
}));

// ---------- accueil (obligés, délégataires, mandataires) ----------
write("index.html", page({
  path: "/",
  body: `<main>
<div class="hero" id="inscription">
  <div>
    <div class="eyebrow">Veille CEE · obligés, délégataires, mandataires</div>
    <h1>Chaque texte CEE, <em>décodé pour ceux qui financent.</em></h1>
    <p class="lede">Arrêtés, décrets, fiches, contrôles : chaque lundi, ce qui change pour vos dossiers, vos contrats, votre stock de certificats et vos outils de gestion. Avec la source officielle.</p>
    ${signupForm("email-hero")}
    <div class="facts">
      <div class="fact"><b>1 050</b><span>TWhc d'obligation par an</span></div>
      <div class="fact"><b>280</b><span>TWhc pour la précarité</span></div>
      <div class="fact"><b>5 min</b><span>de lecture le lundi</span></div>
    </div>
  </div>
  ${sample}
</div>

<section>
  <div class="home-grid">
    <div>
      <div class="eyebrow">À ne pas manquer</div>
      <h2>Prochaines échéances</h2>
      ${futur.length ? `<ul class="ech">${futur.slice(0, 3).map(echItem).join("")}</ul>` : "<p>Aucune échéance à venir pour l'instant.</p>"}
      <p class="space-more"><a href="/calendrier/">Toutes les échéances et l'abonnement agenda →</a></p>
    </div>
    <div>
      <div class="eyebrow">Pour vos équipes SI</div>
      <h2>Impact sur vos outils</h2>
      <ul class="impact-list">${impacts.slice(0, 3).map(impactItem).join("")}</ul>
      <p class="space-more"><a href="/impact-outils/">Tous les cahiers de modifications →</a></p>
    </div>
  </div>
</section>

<section>
  <div class="eyebrow">Ce que vous recevez</div>
  <h2>La réglementation, traduite en décisions.</h2>
  <div class="grid3">
    <div class="feat"><span class="tag">Chaque lundi</span><h3>Les textes classés par impact</h3><p>Action requise, à surveiller, à lire : chaque texte de la semaine, ce qu'il change et pour qui, avec ses sources officielles.</p></div>
    <div class="feat"><span class="tag">Par métier</span><h3>Concrètement, pour vous</h3><p>Obligé, délégataire, acheteur ou vendeur de CEE : ce qui change pour vous, un exemple chiffré et ce qu'il faut faire.</p></div>
    <div class="feat"><span class="tag">SI et conformité</span><h3>L'impact sur vos outils</h3><p>Les champs, règles et contrôles à adapter dans votre outil de gestion CEE, avec des cas de test prêts à l'emploi.</p></div>
  </div>
</section>

<section>
  <div class="eyebrow">Pour qui</div>
  <h2>Pensé pour ceux qui portent l'obligation.</h2>
  <ul class="who">
    <li><strong>Obligés et fournisseurs d'énergie</strong><span>Piloter le coût de l'obligation et le stock de certificats</span></li>
    <li><strong>Délégataires et mandataires</strong><span>Sécuriser les dépôts et le statut au PNCEE</span></li>
    <li><strong>Acheteurs et vendeurs de CEE</strong><span>Appliquer la diligence sur les cessions</span></li>
    <li><strong>Conformité et contrôle</strong><span>Anticiper les contrôles et les sanctions</span></li>
    <li><strong>Équipes SI et éditeurs</strong><span>Tenir les règles métier à jour dans les outils</span></li>
    <li><strong>Directions et partenaires</strong><span>Suivre la P6 sans lire le Journal officiel</span></li>
  </ul>
</section>

<section>
  <div class="eyebrow">Questions fréquentes</div>
  <h2>Avant de vous inscrire.</h2>
  <div class="faq">
  <details><summary>C'est gratuit ?</summary><p>Oui. L'édition du lundi et toute la veille sont gratuites, sans engagement. Vous pouvez vous désinscrire en un clic.</p></details>
  <details><summary>Qui rédige KUMAK ?</summary><p>Un professionnel du secteur des CEE. Chaque analyse cite ses sources officielles (Journal officiel, Légifrance, ministère), que vous pouvez vérifier.</p></details>
  <details><summary>Qu'est-ce que l'« impact sur vos outils » ?</summary><p>Pour les textes qui changent une règle de gestion, KUMAK la traduit en champs, valeurs, contrôles et cas de test, que votre outil soit développé en interne, paramétré dans un outil généraliste ou acheté à un éditeur.</p></details>
  <details><summary>Est-ce un conseil juridique ?</summary><p>Non. KUMAK est une veille d'information. Pour un litige ou un contrôle en cours, adressez-vous à un avocat spécialisé.</p></details>
  <details><summary>Que faites-vous de mon adresse e-mail ?</summary><p>Elle sert uniquement à vous envoyer KUMAK. Elle n'est ni vendue ni partagée. Vous pouvez vous désinscrire en un clic depuis chaque e-mail. Le détail figure sur la page <a href="/confidentialite/">Confidentialité</a>.</p></details>
  <details><summary>Je ne reçois pas l'e-mail de confirmation.</summary><p>Vérifiez vos indésirables, puis écrivez à <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a>.</p></details>
  </div>
</section>
</main>`,
}));

// ---------- pages simples ----------
const legal = (path, title, md) => write(`${path}/index.html`, page({
  title, path: `/${path}/`,
  body: `<main class="article narrow"><h1>${title}</h1><div class="prose">${marked.parse(md)}</div></main>`,
}));

legal("mentions-legales", "Mentions légales", `
## Éditeur

${cfg.editor.anonymous
  ? `KUMAK est édité à titre non professionnel. Conformément à l'article 1-1, II, de la loi nº 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, l'éditeur a communiqué ses éléments d'identification à l'hébergeur indiqué ci-dessous.  \nContact : [${cfg.contactEmail}](mailto:${cfg.contactEmail})`
  : `${cfg.editor.name}  \n${cfg.editor.status}  \n${cfg.editor.address ? cfg.editor.address + "  \n" : ""}Contact : [${cfg.contactEmail}](mailto:${cfg.contactEmail})\n\nDirecteur de la publication : ${cfg.editor.publicationDirector}`}

## Hébergement

${cfg.host.name}  
${cfg.host.address}  
[${cfg.host.url}](${cfg.host.url})

## Contenu

KUMAK est une veille d'information sur la réglementation des certificats d'économies d'énergie. Les contenus ne constituent pas un conseil juridique. Seuls les textes publiés au Journal officiel font foi.

Les textes et la mise en forme du site sont protégés. Toute reproduction substantielle nécessite l'accord de l'éditeur. Les citations courtes avec un lien vers la source sont les bienvenues.

## Données personnelles

Voir la page [Confidentialité](/confidentialite/).
`);

legal("confidentialite", "Confidentialité", `
## Ce que nous collectons

Uniquement **votre adresse e-mail**, quand vous vous inscrivez à KUMAK.

Le site n'utilise **aucun cookie, aucun outil de mesure d'audience et aucun service tiers au chargement des pages**. Les polices sont hébergées sur le site lui-même.

## Pourquoi

Pour vous envoyer la newsletter KUMAK. La base légale est votre **consentement**, confirmé par un e-mail de validation (double opt-in).

## Qui y a accès

L'éditeur du site, et le prestataire d'envoi des e-mails **Brevo** (Sendinblue SAS, Paris, France), qui agit comme sous-traitant et héberge les données dans l'Union européenne. Vos données ne sont ni vendues ni louées.

## Combien de temps

Jusqu'à votre désinscription. Un lien de désinscription figure dans chaque e-mail.

## Vos droits

Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à [${cfg.contactEmail}](mailto:${cfg.contactEmail}). Vous pouvez aussi saisir la [CNIL](https://www.cnil.fr/fr/plaintes).
`);

legal("merci", "Presque fini", `
Un e-mail de confirmation vient de vous être envoyé. **Cliquez sur le lien qu'il contient** pour valider votre inscription.

Rien reçu dans quelques minutes ? Regardez dans vos indésirables, ou écrivez à [${cfg.contactEmail}](mailto:${cfg.contactEmail}).

[Lire les éditions déjà parues →](/editions/)
`);

// ---------- vérificateur de bonification ----------
const radio = (name, opts) => `<div class="choices">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}"><span>${l}</span></label>`).join("")}</div>`;
write("verificateur/index.html", page({
  title: "Vérificateur de bonification CEE", noindex: true,
  description: "Votre chantier a-t-il droit à la bonification CEE ? PAC, chauffe-eau thermodynamique, solaire : réponse immédiate avec le motif et la source.",
  path: "/verificateur/",
  body: `<main class="article narrow">
  <div class="eyebrow">Outil gratuit · Bêta</div>
  <h1>Mon chantier a-t-il droit à la bonification ?</h1>
  <p class="lede">Répondez à quelques questions : vous savez tout de suite si le devis ouvre droit à la bonification CEE, et pourquoi.</p>
  <a class="fiche-search" href="#revenus" data-rev><span><strong>Seulement vérifier si un ménage est modeste</strong> Avec les revenus et le nombre de personnes</span><span aria-hidden="true">→</span></a>
  <form id="verif" class="verif" novalidate>
    <fieldset><legend>1. Quel équipement installez-vous ?</legend>
      <select name="fiche" required>
        <option value="">Choisir…</option>
        <option value="BAR-TH-171">Pompe à chaleur air/eau (BAR-TH-171)</option>
        <option value="BAR-TH-172">Pompe à chaleur eau/eau ou eau glycolée/eau (BAR-TH-172)</option>
        <option value="BAR-TH-148">Chauffe-eau thermodynamique (BAR-TH-148)</option>
        <option value="BAR-TH-101">Chauffe-eau solaire individuel (BAR-TH-101)</option>
        <option value="BAR-TH-143">Système solaire combiné (BAR-TH-143)</option>
      </select>
    </fieldset>
    <fieldset><legend>2. Date de signature du devis</legend><input type="date" name="date" min="2026-01-01" max="2027-12-31" required></fieldset>
    <fieldset><legend>3. Le logement est-il une résidence principale ?</legend>${radio("rp", [["oui", "Oui"], ["non", "Non"]])}</fieldset>
    <div id="q-pac" hidden>
      <fieldset><legend>4. Quel équipement est remplacé ?</legend>${radio("equip", [["fossile", "Chaudière gaz, fioul ou charbon"], ["autre", "Autre équipement"]])}</fieldset>
      <fieldset><legend>5. Le modèle de PAC est-il agréé ?</legend><p class="hint">Vérifiez sur la <a href="https://bonus-pac.ademe.fr" target="_blank" rel="noopener">liste ADEME</a>, à la date du devis.</p>${radio("agree", [["oui", "Oui"], ["non", "Non"], ["nsp", "Je ne sais pas"]])}</fieldset>
      <fieldset><legend>6. L'ancienne chaudière avait-elle déjà été financée par une prime CEE ?</legend>${radio("fin", [["non", "Non"], ["avant2021", "Oui, avant 2021"], ["depuis2021", "Oui, en 2021 ou après"], ["nsp", "Je ne sais pas"]])}</fieldset>
    </div>
    <div id="q-sol" hidden>
      <fieldset><legend>4. Un équipement au gaz, au fioul ou au charbon est-il conservé après les travaux ?</legend><p class="hint">Même en appoint, pour le chauffage ou l'eau chaude concernés.</p>${radio("fossile", [["non", "Non"], ["oui", "Oui"]])}</fieldset>
      <fieldset><legend>5. Le ménage est-il modeste ?</legend><p class="hint">Revenus sous les plafonds « ménages modestes » des CEE.</p>${radio("modeste", [["oui", "Oui"], ["non", "Non"], ["nsp", "Je ne sais pas"]])}

      </fieldset>
    </div>
    <div id="q-rev" hidden>
        <details class="calc" id="revenus">
          <summary>Le ménage est-il modeste ? Calculer avec ses revenus</summary>
          <div class="calc-grid">
            <label>Personnes dans le ménage<input type="number" name="rev-pers" min="1" max="15" step="1" inputmode="numeric" placeholder="ex. 3"></label>
            <label>Revenu fiscal de référence total<input type="number" name="rev-rfr" min="0" step="1" inputmode="numeric" placeholder="ex. 35000"><span class="hint">Somme des RFR de tous les avis d'imposition du foyer (revenus N-2 ; N-1 possible s'il est disponible)</span></label>
            <div><span class="calc-lbl">Lieu du logement</span>${radio("rev-zone", [["idf", "Île-de-France"], ["autre", "Autre région"]])}</div>
          </div>
          <div id="calc-out" class="calc-out" role="status" aria-live="polite" hidden></div>
          <p class="hint">Plafonds 2026 de l'<a href="https://aida.ineris.fr/reglementation/arrete-221225-portant-actualisation-plafonds-revenus-lannee-2026-cadre-dispositif" target="_blank" rel="noopener">arrêté du 22 décembre 2025</a> (JO du 26 décembre 2025), pour les opérations engagées en 2026. Aucune donnée n'est envoyée : le calcul se fait dans votre navigateur.</p>
        </details>
    </div>
  </form>
  <div id="verdict" class="verdict" role="status" aria-live="polite" hidden></div>
  <p class="disclaimer">Outil d'information, en version bêta, fondé sur les textes vérifiés dans la <a href="/retro-2026/">Rétrospective 2026</a>. Il ne remplace ni le texte officiel ni la vérification de votre partenaire CEE, et ne calcule pas le montant de la prime. Autres conditions de la fiche (RGE, performances, pièces) non vérifiées ici.</p>
  <div class="cta-box" id="inscription">
    <h2>Les règles changent souvent.</h2>
    <p>Recevez chaque lundi les nouveautés CEE qui touchent vos chantiers.</p>
    ${signupForm("email-verif", "Votre adresse e-mail")}
  </div>
</main>
<script src="/verif.js?v=${ASSET_V}" defer></script>`,
}));

write("404.html", page({
  title: "Page introuvable", path: "/404.html",
  body: `<main class="article narrow"><h1>Page introuvable</h1><p class="lede">Cette page n'existe pas ou a été déplacée.</p><p><a class="btn" href="/">Retour à l'accueil</a></p></main>`,
}));

// ---------- RSS et sitemap ----------
const rfc822 = (iso) => new Date(iso + "T08:00:00+01:00").toUTCString();
write("feed.xml", `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
<title>${cfg.name}</title><link>${cfg.url}/</link><description>${esc(cfg.tagline)}</description><language>fr-fr</language>
${editions.filter((e) => !e.brouillon).map((e) => `<item><title>${esc(`Nº ${e.numero} · ${e.titre}`)}</title><link>${cfg.url}/editions/${e.slug}/</link><guid>${cfg.url}/editions/${e.slug}/</guid><pubDate>${rfc822(e.date)}</pubDate><description>${esc(e.accroche)}</description></item>`).join("\n")}
</channel></rss>`);

const urls = ["/", "/veille/", "/impact-outils/", ...impacts.map((i) => i.cahierUrl), "/fiches/", "/calendrier/", ...codes.map((c) => `/fiches/${ficheSlug(c)}/`), "/mentions-legales/", "/confidentialite/",
  ...editions.filter((e) => !e.brouillon).map((e) => `/editions/${e.slug}/`),
  ...(retros.some((r) => !r.brouillon) ? ["/retro-2026/"] : []),
  ...retros.filter((r) => !r.brouillon).map((r) => `/retro-2026/${r.slug}/`)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${cfg.url}${u}</loc></url>`).join("")}</urlset>`);

// ---------- mode maintenance : site hors ligne ----------
if (cfg.maintenance) {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const f of ["style.css", "favicon.svg", "CNAME", "fonts"]) cpSync(join("static", f), join(OUT, f), { recursive: true });
  const off = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KUMAK</title><meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css?v=${ASSET_V}"></head>
<body>${ladder}<div class="wrap"><header class="nav"><span class="logo">KUMAK <small>VEILLE CEE</small></span></header>
<main class="article narrow"><h1>Bientôt de retour.</h1><p class="lede">Le site est momentanément indisponible.</p></main></div></body></html>`;
  writeFileSync(join(OUT, "index.html"), off);
  writeFileSync(join(OUT, "404.html"), off);
  writeFileSync(join(OUT, "robots.txt"), "User-agent: *\nDisallow: /\n");
  console.log("MODE MAINTENANCE : seule la page « Bientôt de retour » est publiée.");
  process.exit(0);
}

// ---------- fichiers statiques ----------
cpSync("static", OUT, { recursive: true });

const drafts = editions.filter((e) => e.brouillon).length;
console.log(`OK : ${editions.length} édition(s)${drafts ? ` dont ${drafts} brouillon(s)` : ""} → ${OUT}/`);
if (!cfg.brevoFormAction) console.warn("Attention : brevoFormAction est vide dans site.config.json, le formulaire n'enregistre pas encore les inscriptions.");
