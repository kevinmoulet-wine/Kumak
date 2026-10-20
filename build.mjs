// Génère le site statique kumak.fr dans dist/
// Usage : node build.mjs            -> production (brouillons exclus)
//         node build.mjs --drafts   -> aperçu local, brouillons inclus
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

const DRAFTS = process.argv.includes("--drafts");
const cfg = JSON.parse(readFileSync("site.config.json", "utf8"));
const OUT = "dist";
rmSync(OUT, { recursive: true, force: true });

// ---------- utilitaires ----------
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dateFr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`; };
const write = (path, html) => { const full = join(OUT, path); mkdirSync(full.replace(/\/[^/]+$/, ""), { recursive: true }); writeFileSync(full, html); };

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

// ---------- éditions ----------
const editions = readdirSync("content/editions")
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { data, body } = parseFrontmatter(readFileSync(join("content/editions", f), "utf8"));
    const slug = f.replace(/\.md$/, "");
    for (const k of ["numero", "date", "titre", "accroche"]) if (!data[k]) throw new Error(`${f} : champ « ${k} » manquant`);
    const todo = /À COMPLÉTER/i.test(body);
    if (!data.brouillon && todo) throw new Error(`${f} : il reste des « À COMPLÉTER ». Complétez-les ou remettez « brouillon: true ».`);
    let html = marked.parse(body);
    const items = [];
    html = html.replace(/<h3>\[(ACTION|SURVEILLER|À LIRE)\]\s*(.*?)<\/h3>/g, (_, k, t) => { items.push({ k, t }); return `<h3>${badge(k)} <span>${t}</span></h3>`; });
    return { ...data, date: String(data.date), slug, html, items, todo };
  })
  .filter((e) => DRAFTS || !e.brouillon)
  .sort((a, b) => b.date.localeCompare(a.date));

// ---------- gabarits ----------
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

function page({ title, description = cfg.description, path = "/", body, type = "website" }) {
  const fullTitle = title ? `${title} · ${cfg.name}` : `${cfg.name} · ${cfg.tagline}`;
  const url = cfg.url + path;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${cfg.name}">
<meta property="og:title" content="${esc(title || cfg.tagline)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="fr_FR">
<meta name="theme-color" content="#0B6E4F">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${cfg.name}" href="/feed.xml">
<link rel="preload" href="/fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
</head>
<body>
${ladder}
<div class="wrap">
<header class="nav">
  <a class="logo" href="/">KUMAK <small>VEILLE CEE</small></a>
  <nav aria-label="Navigation principale">
    <a href="/editions/">Éditions</a>
    <a href="/#offres">Offres</a>
    <a class="btn-sm" href="/#inscription">S'inscrire</a>
  </nav>
</header>
${body}
<footer>
  <span>${cfg.name} · kumak.fr · veille des certificats d'économies d'énergie. Information, pas de conseil juridique.</span>
  <nav aria-label="Pied de page">
    <a href="/editions/">Éditions</a>
    <a href="/feed.xml">RSS</a>
    <a href="/mentions-legales/">Mentions légales</a>
    <a href="/confidentialite/">Confidentialité</a>
    <a href="mailto:${cfg.contactEmail}">Contact</a>
  </nav>
</footer>
</div>
<script src="/signup.js" defer></script>
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

write("index.html", page({
  path: "/",
  body: `<main>
<div class="hero" id="inscription">
  <div>
    <div class="eyebrow">6ᵉ période CEE · 2026–2030</div>
    <h1>Chaque arrêté CEE, <em>décodé en 5 minutes.</em></h1>
    <p class="lede">Nouvelles fiches, bonifications, règles de contrôle : KUMAK lit le Journal officiel à votre place et vous dit ce que ça change pour vos dossiers, vos primes et vos marges.</p>
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
  <div class="eyebrow">Ce que vous recevez</div>
  <h2>La réglementation, traduite en décisions.</h2>
  <div class="grid3">
    <div class="feat"><span class="tag">Chaque lundi</span><h3>L'édition hebdo</h3><p>Les textes de la semaine, classés par impact : action requise, à surveiller, à lire. Chacun avec sa source sur Légifrance.</p></div>
    <div class="feat"><span class="tag">Fiche par fiche</span><h3>Les fiches décodées</h3><p>Conditions d'éligibilité, pièces justificatives, pièges au contrôle. Une base qui s'enrichit au fil des éditions.</p></div>
    <div class="feat"><span class="tag">Vu du terrain</span><h3>Les remarques terrain</h3><p>Ce qu'un texte change concrètement dans les dossiers et les systèmes d'information des acteurs CEE.</p></div>
  </div>
</section>

<section>
  <div class="eyebrow">Pour qui</div>
  <h2>Pensé pour ceux qui montent les dossiers.</h2>
  <ul class="who">
    <li><strong>Installateurs RGE</strong><span>Savoir quelles primes proposer aux clients</span></li>
    <li><strong>Délégataires et mandataires</strong><span>Sécuriser les dépôts au PNCEE</span></li>
    <li><strong>Obligés et fournisseurs d'énergie</strong><span>Piloter le coût de l'obligation</span></li>
    <li><strong>Bureaux d'études et AMO</strong><span>Conseiller sur la bonne fiche</span></li>
    <li><strong>Collectivités et bailleurs</strong><span>Financer les programmes de rénovation</span></li>
    <li><strong>Éditeurs et intégrateurs SI</strong><span>Tenir les règles métier à jour</span></li>
  </ul>
</section>

<section id="offres">
  <div class="eyebrow">Offres</div>
  <h2>Gratuit pour commencer.</h2>
  <div class="plans">
    <div class="plan">
      <div class="pname">Le Relevé</div>
      <div class="price">0 €</div>
      <ul><li>L'édition du lundi, en entier</li><li>Les textes classés par impact</li><li>Les sources officielles</li></ul>
      <a class="btn" href="#inscription" style="align-self:flex-start">S'inscrire</a>
    </div>
    <div class="plan next">
      <div class="pname">Pro · bientôt</div>
      <div class="price" style="font-size:34px">À venir</div>
      <ul><li>Fiches décodées et archive complète</li><li>Calendrier des échéances</li><li>Check-lists de contrôle</li><li>Questions-réponses des abonnés</li></ul>
      <p class="sub">Les inscrits gratuits seront consultés sur le prix et bénéficieront d'un tarif de lancement.</p>
    </div>
  </div>
</section>

<section>
  <div class="eyebrow">Questions fréquentes</div>
  <h2>Avant de vous inscrire.</h2>
  <details><summary>Qui rédige KUMAK ?</summary><p>Un consultant qui conçoit depuis plusieurs années des systèmes de gestion des CEE pour des fournisseurs d'énergie. Chaque analyse cite le texte source sur Légifrance.</p></details>
  <details><summary>Est-ce un conseil juridique ?</summary><p>Non. KUMAK est une veille d'information. Pour un litige ou un contrôle en cours, adressez-vous à un avocat spécialisé.</p></details>
  <details><summary>Que faites-vous de mon adresse e-mail ?</summary><p>Elle sert uniquement à vous envoyer KUMAK. Elle n'est ni vendue ni partagée. Vous pouvez vous désinscrire en un clic depuis chaque e-mail. Le détail figure sur la page <a href="/confidentialite/">Confidentialité</a>.</p></details>
  <details><summary>Je ne reçois pas l'e-mail de confirmation.</summary><p>Vérifiez vos indésirables, puis écrivez à <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a>.</p></details>
</section>
</main>`,
}));

// ---------- éditions : pages ----------
for (const e of editions) {
  write(`editions/${e.slug}/index.html`, page({
    title: `Nº ${e.numero} · ${e.titre}`,
    description: e.accroche,
    path: `/editions/${e.slug}/`,
    type: "article",
    body: `<main class="article narrow">
  <p class="meta"><a href="/editions/">Éditions</a> · Nº ${e.numero} · ${dateFr(e.date)}${e.brouillon ? '<span class="draft-flag">BROUILLON</span>' : ""}</p>
  <h1>${esc(e.titre)}</h1>
  <p class="lede">${esc(e.accroche)}</p>
  <div class="prose">${e.html}</div>
  <p class="disclaimer">KUMAK est une veille d'information. Elle ne constitue pas un conseil juridique : vérifiez toujours le texte officiel, et consultez un avocat pour une situation particulière.</p>
  <div class="cta-box" id="inscription">
    <h2>Recevez la prochaine édition.</h2>
    <p>Un e-mail le lundi matin, 5 minutes de lecture.</p>
    ${signupForm("email-ed", "Votre adresse e-mail")}
  </div>
</main>`,
  }));
}

write("editions/index.html", page({
  title: "Éditions",
  description: "Toutes les éditions de KUMAK, la veille réglementaire CEE.",
  path: "/editions/",
  body: `<main class="article narrow">
  <div class="eyebrow">Archives</div>
  <h1>Les éditions</h1>
  ${editions.length
    ? `<ul class="archive">${editions.map((e) => `<li><a href="/editions/${e.slug}/"><span class="num">Nº ${e.numero}<br>${dateFr(e.date)}</span><span><strong>${esc(e.titre)}${e.brouillon ? '<span class="draft-flag">BROUILLON</span>' : ""}</strong><span class="acc">${esc(e.accroche)}</span></span></a></li>`).join("")}</ul>`
    : `<p class="lede">La première édition paraît bientôt. Inscrivez-vous pour la recevoir.</p>`}
  <div class="cta-box" id="inscription">
    <h2>Ne ratez pas la prochaine.</h2>
    ${signupForm("email-arch", "Votre adresse e-mail")}
  </div>
</main>`,
}));

// ---------- pages simples ----------
const legal = (path, title, md) => write(`${path}/index.html`, page({
  title, path: `/${path}/`,
  body: `<main class="article narrow"><h1>${title}</h1><div class="prose">${marked.parse(md)}</div></main>`,
}));

legal("mentions-legales", "Mentions légales", `
## Éditeur

${cfg.editor.name}  
${cfg.editor.status}  
${cfg.editor.address ? cfg.editor.address + "  \n" : ""}Contact : [${cfg.contactEmail}](mailto:${cfg.contactEmail})

Directeur de la publication : ${cfg.editor.publicationDirector}

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

Pour vous envoyer la newsletter KUMAK et, plus tard, vous informer de l'offre payante. La base légale est votre **consentement**, confirmé par un e-mail de validation (double opt-in).

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

const urls = ["/", "/editions/", "/mentions-legales/", "/confidentialite/", ...editions.filter((e) => !e.brouillon).map((e) => `/editions/${e.slug}/`)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${cfg.url}${u}</loc></url>`).join("")}</urlset>`);

// ---------- fichiers statiques ----------
cpSync("static", OUT, { recursive: true });

const drafts = editions.filter((e) => e.brouillon).length;
console.log(`OK : ${editions.length} édition(s)${drafts ? ` dont ${drafts} brouillon(s)` : ""} → ${OUT}/`);
if (!cfg.brevoFormAction) console.warn("Attention : brevoFormAction est vide dans site.config.json, le formulaire n'enregistre pas encore les inscriptions.");
