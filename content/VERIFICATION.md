# Journal de vérification des faits

Chaque numéro publié porte un champ `verifie: AAAA-MM-JJ` : la date à laquelle chacun de ses faits (dates, chiffres, références, codes de fiche) a été confirmé sur une source officielle. Le site refuse de publier un numéro sans cette date.

## Protocole (avant chaque publication)

1. `node build.mjs --faits <slug>` : la liste de tous les faits du numéro s'affiche.
2. Chaque fait est confirmé sur une source officielle : texte au JO (Légifrance, ou AIDA-Ineris qui le reproduit), ecologie.gouv.fr (lettres d'information CEE, flash infos DGEC, catalogue des fiches), PNCEE, conseil-etat.fr. À défaut, deux sources secondaires fiables (Banque des Territoires, Gossement, Actu-Environnement, Le Moniteur, ATEE).
3. Ce qui n'est pas confirmé est retiré, pas « à vérifier ». Les décomptes de presse (nombre de modèles, de fiches…) sont présentés comme tels.
4. Tout code de fiche cité doit avoir un intitulé vérifié au catalogue du ministère (`FICHE_NOMS` dans `build.mjs`).
5. Chaque section `### [ACTION|SURVEILLER|À LIRE]` doit avoir sa source dans `## Sources`.
6. Le champ `verifie:` est renseigné, puis `brouillon: false`.

## Audit du 4 novembre 2026 (11 numéros, vérificateur, accueil)

Sources consultées : décret 2025-1048 (JO), webinaire DGEC du 2/12/2025, arrêtés des 21 et 22/12/2025, 27/12/2025, 6/09/2025, 7/01, 5/02, 23/02, 26/03, 14/04, 27/04, 7/05, 11/05, 29/05 (×3), 19/06, 27/07, 17/08 (×2), 4/09, 18/09, 17/09, 28/10/2026 (AIDA-Ineris ou Légifrance), article D. 221-26-1 (code consolidé, ministère), fiche BAR-TH-143 vA79-6 et catalogue des fiches (ministère), lettre d'information CEE de septembre 2026 (DGEC), ordonnances et décisions du Conseil d'État nº 510623, 515657, 510621, 500483.

| Numéro | Résultat | Corrections |
|---|---|---|
| Édition nº 1 | Chiffres P6, 12 ans, seuils, 300 GWhc, 2 TWhc, 500 TWhc, 0,364 confirmés | Retrait de la « capacité technique et financière » (absente du décret) ; critères de pondération réécrits d'après l'article R. 221-18 (référence à la loi du 30 juin 2025 non confirmée, retirée) |
| Janvier | Confirmé | « Entretien » → « maintien en fonctionnement » (terme du texte) ; avis d'imposition : exceptions Anah et bailleurs sociaux |
| Février | Confirmé (dates, délais 10 et 21 jours, intitulés) | Aucune |
| Mars | Confirmé | Non-cumul BAR-TH-143 : il figure dans la fiche annexée à l'arrêté, pas dans son corps ; taux de contrôle précisés (15 % / 30 %) ; source officielle ajoutée (fiche vA79-6) |
| Avril | Confirmé (50/75/100 %, JO, PRO-INNO-86) | « Entretien » → « maintien en fonctionnement » |
| Mai | Confirmé (agrément, frais de registre, programmes) | Rôle ADEME / ministères précisé |
| Juin | **Erreur corrigée** : les 94 M€ ramenés à 5,22 M€ sont la sanction pécuniaire, pas l'annulation ; l'annulation portait sur 4,34 + 1,96 TWhc, pour un compte de 0,22 + 0,59 TWhc | Conditions Emmy réécrites d'après D. 221-26-1 (pas d'« accord préalable du ministre » ; certificats fiscaux et sociaux ajoutés) |
| Juillet | Confirmé (14/12/10 %, ancienne règle 10 %, CE 22/07, CE 29/07) | Décompte des PAC agréées (1 567 / 201) non vérifiable officiellement : arrondi et attribué à la presse |
| Août | Confirmé (coefficients, période, décarbonation) | Périmètre de la décarbonation précisé par fiche ; exclusion MaPrimeRénov' ajoutée ; mise à jour : suppression de BAR-TH-168 au 4 novembre |
| Septembre | Confirmé (4/09, 18/09) | Date de fin de consultation « 7 octobre » non confirmée : remplacée par la présentation au CSE du 10 septembre ; 27 fiches au lieu d'« une vingtaine » |
| Octobre | Confirmé (diligence, ACTEE+, PAC) | **Omission corrigée** : arrêté du 26 octobre supprimant 27 fiches (recensement avant le 17 novembre) ; AGRI-TH-108 détaillée ; conditions cumulatives du 1er novembre précisées |
| Vérificateur | Plafonds 2026 et coefficients confirmés | Alerte MaPrimeRénov' ajoutée |
