---
numero: 5
date: 2026-10-29
periode: Mai 2026
titre: PAC individuelles : le Coup de pouce exigera un agrément
accroche: Le 29 mai, un décret et deux arrêtés réservent le Coup de pouce Chauffage des PAC individuelles aux modèles agréés « qualité et résilience industrielle », à partir du 1er septembre. FEEBAT et PROFEEL sont reconduits.
brouillon: false
---

## L'essentiel en 30 secondes

- **Agrément PAC** : pour les opérations engagées à partir du 1er septembre, seuls les modèles agréés ouvrent droit à la bonification des fiches BAR-TH-171 et BAR-TH-172.
- **FEEBAT 3 et PROFEEL 3** : la formation des professionnels et la sécurisation des travaux sont reconduites.
- **Registre** : les frais de tenue de compte sont fixés à partir du 1er juin.

## Concrètement, pour vous

- **Vous installez des pompes à chaleur**
  - Ce qui change : à partir du 1er septembre, la bonification des fiches BAR-TH-171 et BAR-TH-172 exige un modèle agréé.
  - Exemple : devis signé le 2 septembre pour une PAC air/eau qui remplace une chaudière gaz dans une résidence principale : le coefficient 5 n'est accordé que si le modèle est agréé ce jour-là.
  - À faire : vérifiez la liste avant chaque devis et notez le numéro d'agrément sur la preuve de réalisation.
- **Vous fabriquez ou distribuez des PAC**
  - Ce qui change : l'agrément suppose une certification et un assemblage du circuit frigorifique dans l'Espace économique européen.
  - Exemple : un modèle entièrement assemblé hors d'Europe ne peut obtenir qu'un agrément transitoire, avec un plan d'investissement.
  - À faire : déposez vos dossiers auprès de l'ADEME avant le 31 mai.
- **Vous avez un compte au registre Emmy**
  - Ce qui change : des frais s'appliquent à partir du 1er juin.
  - Exemple : l'acheteur d'un lot de 100 GWh cumac paie 410 € de frais de transfert (4,10 € par million de kWh cumac).
  - À faire : prévoyez ces frais dans vos prix de cession.

### [ACTION] PAC individuelles : un agrément pour garder la bonification

**Les textes**, tous datés du 29 mai 2026 :

- l'arrêté modifiant les arrêtés cadres des CEE, publié au JO nº 125 du 30 mai 2026 ;
- le décret nº 2026-413, qui organise l'instruction des demandes d'agrément par l'ADEME ;
- un arrêté fixant les conditions d'agrément d'un modèle.

**Ce qui change.** La bonification des fiches **BAR-TH-171** (PAC air/eau) et **BAR-TH-172** (PAC eau/eau ou eau glycolée/eau) est un coefficient 5, pour une résidence principale, quand la PAC remplace une chaudière individuelle au charbon, au fioul ou au gaz. Elle exige désormais que le modèle installé **détienne l'agrément à la date d'engagement** de l'opération. La preuve de réalisation doit mentionner le **numéro d'agrément** du modèle.

**Critères d'agrément.** Une exigence de qualité, certifiée par un organisme européen, et une exigence de résilience industrielle : l'assemblage final du circuit frigorifique, ou d'au moins un de ses sous-ensembles, doit avoir lieu dans l'Espace économique européen. Des agréments transitoires sont possibles avec un plan d'investissement, jusqu'à fin 2028 au plus tard.

**Quand.** Pour les opérations **engagées à partir du 1er septembre 2026**.

**Qui est concerné.** Installateurs de PAC, distributeurs, fabricants et délégataires.

### [À LIRE] FEEBAT 3 et PROFEEL 3 reconduits

**Les textes.** Deux arrêtés du 7 mai 2026, publiés au JO nº 112 du 13 mai 2026.

| Programme | Référence | Durée | Porteurs et budget (selon la Banque des Territoires) |
|---|---|---|---|
| FEEBAT 3 | PRO-FOR-16 | 3 ans à compter de la publication | ATEE et AQC, 37,61 M€ |
| PROFEEL 3 | PRO-INNO-87 | Jusqu'au 30 juin 2030 | CSTB et AQC, 20,8 M€ |

FEEBAT forme les professionnels du bâtiment à la rénovation énergétique. PROFEEL développe des outils pour décider et sécuriser les travaux.

### [À LIRE] Frais de tenue de compte du registre

L'arrêté du 11 mai 2026 (JO nº 112 du 13 mai 2026) fixe, à partir du **1er juin 2026**, les frais à la charge des détenteurs de compte :

| Opération | Frais |
|---|---|
| Ouverture de compte | 150 € |
| Gestion annuelle (due au 31 janvier) | 150 € par année civile commencée |
| Inscription des certificats délivrés | 2,30 € par million de kWh cumac |
| Transfert entre titulaires (payé par l'acquéreur) | 4,10 € par million de kWh cumac |

### [À LIRE] Programme PEPITE et deux fiches agricoles abrogées

- Un arrêté du 29 mai 2026 (JO nº 127 du 2 juin 2026) crée le programme d'accompagnement **PRO-INFO-59 « PEPITE »**, éligible jusqu'au 30 juin 2030.
- Un autre arrêté du 29 mai 2026, publié au même JO, supprime les fiches **AGRI-TH-117** (système de déshumidification thermodynamique fixe pour serres chauffées) et **AGRI-TH-119** (système de déshumidification avec air extérieur) à partir du 3 juin. Les opérations engagées restent valorisables si elles sont recensées sous dix jours.

## Impact sur vos outils

### Agrément PAC (BAR-TH-171 et BAR-TH-172)

**1. Champs à ajouter sur l'opération**

| Champ | Type | Valeurs |
|---|---|---|
| Date d'engagement | Date | Date de signature du devis |
| Référence du modèle de PAC | Texte | Référence exacte du fabricant |
| Numéro d'agrément | Texte | Tel qu'il figure dans la liste de l'ADEME |
| Modèle agréé à la date d'engagement | Oui / Non, calculé | Calculé à partir de la liste des modèles agréés |
| Résidence principale | Oui / Non | |
| Équipement remplacé | Liste | Chaudière charbon, chaudière fioul, chaudière gaz, autre |

**2. Règle de bonification**

Pour une opération BAR-TH-171 ou BAR-TH-172 **engagée à partir du 1er septembre 2026** :

```
SI    résidence principale = Oui
ET    équipement remplacé = chaudière charbon, fioul ou gaz
ET    modèle agréé à la date d'engagement = Oui
ALORS coefficient de bonification = 5
SINON pas de bonification
```

Pour une opération engagée **avant le 1er septembre 2026**, l'agrément n'est pas exigé : la règle précédente continue de s'appliquer.

**3. Table de référence à importer**

| Colonne | Contenu |
|---|---|
| Référence du modèle | Référence fabricant |
| Numéro d'agrément | |
| Type d'agrément | Définitif ou transitoire |
| Date de début | Date d'entrée en vigueur de l'arrêté qui ajoute le modèle |
| Date de fin | Pour un agrément transitoire seulement |

La liste est modifiée par arrêté (2 juillet, 6 octobre 2026…) : prévoyez une mise à jour à chaque nouvel arrêté, sans effacer l'historique. Un modèle ajouté le 15 septembre ne doit pas être considéré comme agréé pour un devis du 10 septembre.

**4. Document**

La preuve de réalisation doit afficher le numéro d'agrément du modèle installé.

**5. Cas de test**

| Date du devis | Remplace | Résidence principale | Modèle | Résultat attendu |
|---|---|---|---|---|
| 28/08/2026 | Chaudière gaz | Oui | Non agréé | Agrément non exigé, règle précédente |
| 02/09/2026 | Chaudière fioul | Oui | Agréé depuis le 06/07 | Coefficient 5 |
| 02/09/2026 | Chaudière gaz | Oui | Non agréé | Pas de bonification |
| 02/09/2026 | Chaudière gaz | Non | Agréé | Pas de bonification |
| 10/09/2026 | Chaudière gaz | Oui | Ajouté à la liste le 15/09 | Pas de bonification |

**Selon votre outil**

- **Développé en interne** : les sections 1 à 5 forment l'expression de besoin ; les cas de test servent de recette.
- **Outil généraliste paramétrable** : créez les champs, la table de référence et une règle de validation qui bloque la bonification quand la condition n'est pas remplie.
- **Progiciel CEE du marché** : donnez les cas de test à l'éditeur et demandez-lui de confirmer le résultat obtenu pour chacun.

## Calendrier

| Date | Échéance |
|---|---|
| 1er mai 2026 | Indépendance des organismes d'inspection |
| 1er juin 2026 | Nouveaux frais de tenue de compte du registre |
| 1er septembre 2026 | Agrément obligatoire pour la bonification BAR-TH-171 et BAR-TH-172 |

## Sources

- [Arrêté du 29 mai 2026 modifiant les arrêtés cadres (AIDA-Ineris, texte publié au JO)](https://aida.ineris.fr/node/45873)
- [CAPEB : PAC « made in Europe », un décret et deux arrêtés officialisent les nouvelles règles](https://www.capeb.fr/actualites/pac-quot-made-in-europe-quot-un-decret-et-deux-arretes-officialisent-les-nouvelles-regles-cee)
- [Arrêté du 7 mai 2026, FEEBAT 3 (AIDA-Ineris)](https://aida.ineris.fr/node/45811)
- [Arrêté du 7 mai 2026, PROFEEL 3 (AIDA-Ineris)](https://aida.ineris.fr/node/45813)
- [Banque des Territoires : FEEBAT et PROFEEL reconduits](https://www.banquedesterritoires.fr/certificats-deconomies-denergie-les-programmes-feebat-et-profeel-reconduits-dans-le-batiment)
- [Arrêté du 11 mai 2026, frais de tenue de compte (AIDA-Ineris)](https://aida.ineris.fr/reglementation/arrete-110526-fixant-montant-frais-tenue-compte-registre-national-certificats)
- [Arrêté du 29 mai 2026, programme PEPITE (AIDA-Ineris)](https://aida.ineris.fr/node/45889)
- [Arrêté du 29 mai 2026 supprimant AGRI-TH-117 et AGRI-TH-119 (AIDA-Ineris)](https://aida.ineris.fr/reglementation/arrete-290526-abrogeant-fiches-doperations-standardisees-agri-th-117-systeme)
