---
numero: 10
date: 2026-10-29
periode: Octobre 2026
titre: Acheter des CEE : un dossier de diligence obligatoire au 1er novembre
accroche: Un décret et un arrêté du 9 octobre obligent les acheteurs de CEE à évaluer le risque de leur vendeur et à joindre un formulaire signé à chaque contrat de cession. ACTEE+ est prolongé d'un an.
brouillon: false
---

## L'essentiel en 30 secondes

- **Acheteurs de CEE** : procédures écrites de choix du vendeur et formulaire signé joint au contrat, pour les CEE délivrés et cédés à partir du 1er novembre 2026.
- **ACTEE+** : le programme de rénovation des bâtiments publics est prolongé jusqu'au 31 décembre 2027.
- **PAC agréées** : la liste est mise à jour par un arrêté du 6 octobre.

## Concrètement, pour vous

- **Vous achetez des CEE**
  - Ce qui change : pour les CEE délivrés et cédés à partir du 1er novembre, un formulaire signé doit accompagner chaque contrat.
  - Exemple : vous achetez un lot délivré le 5 novembre : le formulaire doit être joint au contrat au plus tard à l'ordre de transfert.
  - À faire : mettez en place la procédure et le modèle de formulaire avant le 1er novembre.
- **Vous vendez des CEE**
  - Ce qui change : vos acheteurs doivent vérifier votre solidité et vos pratiques.
  - Exemple : attendez-vous à fournir votre attestation d'assurance, vos attestations fiscales et sociales et votre démarche qualité.
  - À faire : préparez un dossier type à envoyer à chaque acheteur.
- **Vous êtes une collectivité**
  - Ce qui change : le programme ACTEE+ est prolongé jusqu'au 31 décembre 2027 ; vos acheteurs n'ont pas à évaluer votre risque.
  - Exemple : une commune qui vend ses CEE n'a pas à fournir le dossier de diligence demandé aux vendeurs privés.
  - À faire : profitez du délai d'ACTEE+ pour vos projets de rénovation de bâtiments publics.

### [ACTION] Cessions de CEE : la diligence sur le vendeur devient obligatoire

**Les textes.** Décret nº 2026-945 du 9 octobre 2026 et arrêté du 9 octobre 2026, publiés au JO du 11 octobre 2026 (textes nº 6 et 7).

**Ce que doit faire l'acheteur.**

- Disposer de **procédures** pour identifier, évaluer et gérer le risque que présente le vendeur, et documenter comment il a été choisi.
- Joindre au contrat de cession un **formulaire « dûment renseigné, daté et signé »**, au plus tard à la date de l'ordre de transfert. Le modèle et les informations minimales sur le vendeur sont fixés par l'arrêté.
- Vérifier notamment chez le vendeur : assurance professionnelle, situation fiscale et sociale, procédures collectives, dirigeants et bénéficiaires effectifs, condamnations ou sanctions liées aux CEE, démarche qualité, et liens de contrôle avec les autres intervenants.

L'acheteur n'a pas à évaluer ce risque quand le vendeur est l'Anah, une collectivité, un groupement ou un de leurs établissements publics.

**Quand.** Pour les CEE **délivrés et cédés à partir du 1er novembre 2026**. 

**Risque.** Un dispositif jugé incomplet lors d'un contrôle peut être sanctionné.

**Qui est concerné.** Obligés, traders, délégataires acheteurs, et leurs services achats, conformité et SI, qui doivent produire et archiver ces pièces pour chaque cession.

### [À LIRE] ACTEE+ prolongé jusqu'à fin 2027

L'arrêté du 17 septembre 2026, publié au JO nº 235 du 8 octobre 2026, prolonge le programme **PRO-INNO-66 « ACTEE+ »** du 31 décembre 2026 au **31 décembre 2027** et remplace sa fiche programme.

### [À LIRE] Liste des PAC agréées mise à jour

Un arrêté du 6 octobre 2026 modifie l'arrêté du 2 juillet 2026 qui fixe la liste des modèles de pompes à chaleur agréés. Vérifiez la liste à jour sur la plateforme de l'ADEME avant chaque devis bonifié.

### [À LIRE] Fiche agricole AGRI-TH-108 modifiée

Un arrêté publié au JO du **28 octobre 2026** modifie la fiche AGRI-TH-108. Nous le détaillerons dans une prochaine édition hebdo.

## Impact sur vos outils

### Diligence sur les vendeurs de CEE (CEE délivrés et cédés à partir du 1er novembre 2026)

**1. Fiche vendeur à créer**

| Champ | Type | Valeurs |
|---|---|---|
| Type de vendeur | Liste | Anah, collectivité, groupement de collectivités, établissement public de ces entités, autre |
| Dirigeants et bénéficiaires effectifs | Liste de personnes | |
| Assurance professionnelle | Fichier + date | Attestation et date de validité |
| Situation fiscale et sociale | Fichiers + dates | Attestations et date d'obtention |
| Procédure collective en cours | Oui / Non + date de vérification | |
| Condamnation ou sanction liée aux CEE | Oui / Non + détail | |
| Démarche qualité | Fichier | |
| Liens de contrôle | Oui / Non + détail | Avec le premier détenteur, les mandataires, les organismes de contrôle, les professionnels |
| Volume acheté à ce vendeur sur 12 mois | kWh cumac, calculé | Somme des cessions des 12 derniers mois |
| Moyens consacrés aux CEE par le vendeur | Texte | À comparer au volume acheté |

**2. Pièces sur le contrat de cession**

| Champ | Type |
|---|---|
| Procédure de choix du vendeur | Fichier |
| Formulaire de diligence | Fichier, au modèle de l'arrêté du 9 octobre 2026 |
| Date de signature du formulaire | Date |

**3. Règle**

```
SI    date de délivrance des CEE ≥ 01/11/2026
ET    date du contrat de cession ≥ 01/11/2026
ALORS ordre de transfert bloqué tant que le formulaire
      signé n'est pas joint au contrat

SI    type de vendeur = Anah, collectivité, groupement
      ou établissement public
ALORS évaluation du risque de défaillance non requise
```

Pour un vendeur public, vérifiez dans le texte si le formulaire reste à joindre.

**4. Cas de test**

| CEE délivrés le | Contrat du | Vendeur | Formulaire | Résultat attendu |
|---|---|---|---|---|
| 25/10/2026 | 05/11/2026 | Société privée | Absent | Non soumis (CEE délivrés avant le 1er novembre) |
| 05/11/2026 | 06/11/2026 | Société privée | Absent | Ordre de transfert bloqué |
| 05/11/2026 | 06/11/2026 | Société privée | Signé le 06/11 | Ordre de transfert autorisé |
| 10/11/2026 | 12/11/2026 | Commune | — | Évaluation du risque non requise |

**Selon votre outil**

- **Développé en interne** : ces tableaux et cas de test forment l'expression de besoin et la recette.
- **Outil généraliste paramétrable** : un objet « vendeur » avec ses pièces et dates de validité, et une règle qui bloque l'ordre de transfert sans formulaire signé.
- **Progiciel CEE du marché** : demandez à l'éditeur si ce module est disponible au 1er novembre et faites-lui dérouler les cas de test.

## Calendrier

| Date | Échéance |
|---|---|
| 1er novembre 2026 | Formulaire de diligence obligatoire pour les cessions de CEE |
| 31 décembre 2026 | Fin des bonifications solaire et CET |
| 1er avril 2027 | Pièces des titulaires de comptes Emmy sans établissement en France ou sans 100 000 € de capital |
| 31 décembre 2027 | Fin du programme ACTEE+ |

## Sources

- [Banque des Territoires : détection des fraudes aux CEE, un décret précise les vérifications de l'acquéreur (12 octobre 2026)](https://www.banquedesterritoires.fr/detection-des-fraudes-aux-cee-un-decret-precise-les-exigences-de-verification-effectuer-par)
- [Gossement Avocats : décret et arrêté du 9 octobre 2026](https://www.gossement-avocats.com/blog/certificats-deconomies-denergie-precision-sur-les-dispositifs-didentification-devaluation-et-de-gestion-des-risques-permettant-de-detecter-une-obtention-fraudule/)
- [Victoris Avocat : cession de CEE au 1er novembre 2026](https://www.victorisavocat.com/blog/cession-cee-1er-novembre-2026-decret)
- [Arrêté du 17 septembre 2026, programme ACTEE+ (AIDA-Ineris)](https://aida.ineris.fr/node/46585)
- [Service-Public.fr : pompe à chaleur, agrément et liste des modèles](https://www.service-public.gouv.fr/particuliers/actualites/A19057)
- [Le Moniteur : textes officiels du mercredi 28 octobre 2026](https://www.lemoniteur.fr/veille-jo/cee-aides-aux-entreprises-energie-renouvelable-vos-textes-officiels-du-mercredi-28-octobre-2026.XWRE2MV7OBCF3CN45XE4EQSJ4E.html)
