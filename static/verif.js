// Vérificateur de bonification CEE : règles vérifiées dans la Rétrospective 2026 (mai, août, septembre).
(function () {
  var form = document.getElementById("verif");
  if (!form) return;
  var out = document.getElementById("verdict");

  var FICHES = {
    "BAR-TH-171": { nom: "PAC air/eau", type: "pac" },
    "BAR-TH-172": { nom: "PAC eau/eau ou eau glycolée/eau", type: "pac" },
    "BAR-TH-148": { nom: "Chauffe-eau thermodynamique", type: "sol", modeste: 7, autres: 4 },
    "BAR-TH-101": { nom: "Chauffe-eau solaire individuel", type: "sol", modeste: 5, autres: 4 },
    "BAR-TH-143": { nom: "Système solaire combiné", type: "sol", modeste: 5, autres: 4, rp: true }
  };
  var SRC = {
    pac: [["Arrêté du 29 mai 2026 (agrément PAC)", "/retro-2026/05-mai/"], ["Liste des modèles agréés (ADEME)", "https://bonus-pac.ademe.fr"]],
    sol: [["Arrêtés du 17 août 2026 (bonifications solaire et CET)", "/retro-2026/08-aout/"]],
    rempl: [["Arrêté du 4 septembre 2026 (remplacement d'équipements déjà financés)", "/retro-2026/09-septembre/"]]
  };

  function val(n) { var el = form.querySelector('[name="' + n + '"]:checked') || form.elements[n]; return el ? el.value : ""; }
  function show(id, on) { var el = document.getElementById(id); if (el) el.hidden = !on; }

  function refresh() {
    var f = FICHES[val("fiche")];
    show("q-pac", f && f.type === "pac");
    show("q-sol", f && f.type === "sol");
  }

  function verdict() {
    var code = val("fiche"), f = FICHES[code], d = val("date");
    if (!f || !d) return null;
    var r = { status: "", titre: "", motifs: [], alertes: [], sources: [] };
    var rp = val("rp");

    if (f.type === "pac") {
      r.sources = SRC.pac.slice();
      var equip = val("equip"), agree = val("agree"), fin = val("fin");
      if (equip && equip !== "fossile") { r.status = "non"; r.titre = "Pas de bonification Coup de pouce"; r.motifs.push("La bonification suppose le remplacement d'une chaudière individuelle au charbon, au fioul ou au gaz."); }
      else if (rp === "non") { r.status = "non"; r.titre = "Pas de bonification Coup de pouce"; r.motifs.push("La bonification vaut seulement pour un logement occupé en résidence principale."); }
      else if (d < "2026-09-01") { r.status = "verifier"; r.titre = "Agrément non exigé pour ce devis"; r.motifs.push("Le devis est signé avant le 1er septembre 2026 : l'agrément du modèle n'est pas demandé. La bonification dépend de la version de la fiche en vigueur à la date du devis : à vérifier."); }
      else if (agree === "oui") { r.status = "oui"; r.titre = "Oui : coefficient ×5"; r.motifs.push("Chaudière fossile remplacée, résidence principale et modèle agréé à la date du devis."); r.alertes.push("Indiquez le numéro d'agrément du modèle sur la preuve de réalisation."); }
      else if (agree === "non") { r.status = "non"; r.titre = "Pas de bonification Coup de pouce"; r.motifs.push("Depuis le 1er septembre 2026, le modèle de PAC doit être agréé le jour de la signature du devis."); }
      else { r.status = "verifier"; r.titre = "À vérifier : le modèle est-il agréé ?"; r.motifs.push("Toutes les autres conditions sont remplies. Vérifiez que le modèle figurait sur la liste ADEME le jour du devis."); }
      if (!equip || !rp) { r.status = "incomplet"; }

      if (fin === "avant2021") {
        r.sources = r.sources.concat(SRC.rempl);
        if (d >= "2026-09-07") r.alertes.push("La chaudière a déjà été financée par des CEE avant 2021 : une nouvelle prime est possible depuis le 7 septembre 2026, si l'opération d'origine relève d'une des 16 fiches listées par l'arrêté du 4 septembre. Gardez la facture et la fiche d'origine.");
        else r.alertes.push("La chaudière a déjà été financée par des CEE : avant le 7 septembre 2026, son remplacement ne pouvait pas être financé pendant sa durée de vie conventionnelle.");
      } else if (fin === "depuis2021") {
        r.sources = r.sources.concat(SRC.rempl);
        r.alertes.push("La chaudière a été financée par des CEE en 2021 ou après : la dérogation du 4 septembre 2026 ne s'applique pas. Vérifiez la durée de vie conventionnelle avant de promettre une prime.");
      } else if (fin === "nsp") {
        r.alertes.push("Demandez au client si l'ancienne chaudière avait été financée par une prime CEE : cela peut bloquer la nouvelle prime.");
      }
    } else {
      r.sources = SRC.sol.slice();
      var fossile = val("fossile"), mod = val("modeste");
      if (d < "2026-09-01" || d > "2026-12-31") { r.status = "non"; r.titre = "Pas de bonification de l'arrêté du 17 août"; r.motifs.push("Cette bonification vaut seulement pour les devis signés du 1er septembre au 31 décembre 2026. La prime CEE de base reste possible."); }
      else if (f.rp && rp === "non") { r.status = "non"; r.titre = "Pas de bonification"; r.motifs.push("Pour le système solaire combiné, la bonification vaut seulement en résidence principale."); }
      else if (fossile === "oui") { r.status = "non"; r.titre = "Pas de bonification"; r.motifs.push("Un équipement capable d'utiliser une énergie fossile est conservé : la bonification suppose une décarbonation complète. La prime CEE de base reste possible."); }
      else if (!fossile || (f.rp && !rp)) { r.status = "incomplet"; }
      else if (mod === "oui") { r.status = "oui"; r.titre = "Oui : coefficient ×" + f.modeste; r.motifs.push("Devis dans la période, aucun équipement fossile conservé, ménage modeste ou très modeste."); }
      else if (mod === "non") { r.status = "oui"; r.titre = "Oui : coefficient ×" + f.autres; r.motifs.push("Devis dans la période, aucun équipement fossile conservé."); }
      else { r.status = "oui"; r.titre = "Oui : coefficient ×" + f.autres + " ou ×" + f.modeste; r.motifs.push("×" + f.modeste + " si le ménage est modeste ou très modeste, ×" + f.autres + " sinon. Vérifiez ses revenus avec les plafonds 2026."); }
      if (r.status === "oui") r.alertes.push("Faites signer le devis avant le 31 décembre 2026.");
    }
    return r;
  }

  function render() {
    refresh();
    var r = verdict();
    if (!r || r.status === "incomplet") { out.hidden = true; return; }
    var icon = { oui: "✓", non: "✕", verifier: "?" }[r.status];
    out.className = "verdict v-" + r.status;
    out.innerHTML =
      '<div class="v-head"><span class="v-icon" aria-hidden="true">' + icon + "</span><strong>" + r.titre + "</strong></div>" +
      r.motifs.map(function (m) { return "<p>" + m + "</p>"; }).join("") +
      (r.alertes.length ? '<ul class="v-alerts">' + r.alertes.map(function (a) { return "<li>" + a + "</li>"; }).join("") + "</ul>" : "") +
      '<p class="v-amount">Pour le montant de la prime : <a href="https://calculateur-cee.ademe.fr" target="_blank" rel="noopener">calculateur officiel de l’ADEME</a>.</p>' +
      '<p class="v-src">Sources : ' + r.sources.map(function (s) { return '<a href="' + s[1] + '">' + s[0] + "</a>"; }).join(" · ") + "</p>";
    out.hidden = false;
  }

  form.addEventListener("change", render);
  form.addEventListener("input", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
  refresh();
})();
