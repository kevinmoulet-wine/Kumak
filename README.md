# kumak.fr

Site de KUMAK, la veille réglementaire CEE. C'est un site statique, généré à partir de fichiers Markdown et publié sur GitHub Pages. Les inscriptions sont gérées par Brevo.

## Structure

| Élément | Rôle |
|---|---|
| `content/editions/*.md` | Une édition par fichier, nommé `AAAA-MM-JJ-titre-court.md` |
| `site.config.json` | Adresse de contact, URL du formulaire Brevo, mentions légales |
| `static/` | Style, polices, favicon, script d'inscription, `CNAME` |
| `build.mjs` | Génère le site dans `dist/` |
| `.github/workflows/deploy.yml` | Publie automatiquement à chaque push sur `main` |

## Publier une édition chaque semaine

1. Copier le brouillon du vendredi dans `content/editions/AAAA-MM-JJ-titre.md`, avec cet en-tête :
   ```
   ---
   numero: 2
   date: 2026-11-02
   titre: Titre de l'édition
   accroche: Une phrase d'accroche.
   brouillon: true
   ---
   ```
2. Classer chaque texte avec un titre de niveau 3 :
   - `### [ACTION] Titre`
   - `### [SURVEILLER] Titre`
   - `### [À LIRE] Titre`
3. Compléter les encarts `[À COMPLÉTER PAR KEVIN …]`, puis passer `brouillon: false`. Tant qu'il reste un « À COMPLÉTER », la publication est bloquée.
4. Faire un commit et un push. Le site est à jour environ 1 minute plus tard.
5. Dans Brevo, envoyer la campagne du lundi à 8 h, avec un lien vers l'édition sur kumak.fr.

Pour un aperçu local, brouillons compris : `npm install`, puis `npm run preview`.

---

## Mise en ligne (une seule fois)

### 1. GitHub (10 min)

1. Créer un dépôt **public** nommé `kumak`, à part de kevinmoulet-wine. GitHub Pages est gratuit pour les dépôts publics.
2. Y pousser ce dossier :
   ```bash
   cd kumak
   git init -b main
   git add .
   git commit -m "Site kumak.fr"
   git remote add origin https://github.com/<ton-compte>/kumak.git
   git push -u origin main
   ```
3. Dans le dépôt, aller dans **Settings → Pages → Build and deployment → Source** et choisir **GitHub Actions**.
4. Toujours dans **Settings → Pages**, saisir `kumak.fr` dans **Custom domain**, puis cocher **Enforce HTTPS** une fois le certificat prêt.

### 2. OVH : faire pointer kumak.fr vers GitHub (10 min)

Chemin : Web Cloud → Noms de domaine → kumak.fr → **Zone DNS**.

1. **Supprimer** les enregistrements `A` et `AAAA` de `kumak.fr`, ainsi que l'enregistrement de `www`. **Ne pas toucher aux MX.**
2. **Ajouter** ces enregistrements :

| Type | Sous-domaine | Cible |
|---|---|---|
| A | *(vide)* | `185.199.108.153` |
| A | *(vide)* | `185.199.109.153` |
| A | *(vide)* | `185.199.110.153` |
| A | *(vide)* | `185.199.111.153` |
| AAAA | *(vide)* | `2606:50c0:8000::153` |
| AAAA | *(vide)* | `2606:50c0:8001::153` |
| AAAA | *(vide)* | `2606:50c0:8002::153` |
| AAAA | *(vide)* | `2606:50c0:8003::153` |
| CNAME | `www` | `<ton-compte>.github.io.` |

3. Attendre de quelques minutes à 24 h, sans supprimer ni recréer d'enregistrement pendant ce temps.

### 3. Adresse contact@kumak.fr (5 min)

Chemin : Web Cloud → **E-mails** → kumak.fr → **Redirections**. Ajouter une redirection de `contact@kumak.fr` vers ta boîte personnelle. Elle s'appuie sur les MX OVH, d'où la consigne de ne pas les toucher.

### 4. Brevo : inscriptions et envois (20 min)

1. Créer un compte sur brevo.com, puis une liste **KUMAK – Le Relevé**.
2. **Expéditeurs, domaines et IP dédiées → Domaines → Ajouter un domaine** : `kumak.fr`. Brevo affiche 3 ou 4 enregistrements (code Brevo, DKIM, DMARC). Les copier dans la zone DNS OVH, puis cliquer sur **Authentifier**.
3. **Expéditeurs** : ajouter `KUMAK <contact@kumak.fr>`.
4. **Contacts → Formulaires → Créer un formulaire d'inscription** :
   - liste : KUMAK – Le Relevé ;
   - **double opt-in activé**, avec un e-mail de confirmation en français ;
   - page de redirection après confirmation : `https://kumak.fr/editions/`.
5. À l'étape **Partager**, copier le code HTML intégré, repérer `action="https://….sibforms.com/serve/…"`, puis coller cette URL dans `site.config.json` :
   ```json
   "brevoFormAction": "https://….sibforms.com/serve/…"
   ```
6. Faire un commit et un push, puis tester une inscription avec ta propre adresse.

---

## Avant d'ouvrir l'offre payante

- **Statut** : pour vendre des abonnements, il faut un statut, par exemple une micro-entreprise, et un numéro SIRET. Un expert-comptable peut t'aider à choisir.
- **Mentions légales** : ajouter le SIRET et une adresse, ou une domiciliation, dans `site.config.json`. Ces informations deviennent obligatoires dès qu'il y a une activité commerciale.
- **Conditions générales de vente** : une page à ajouter. Le faire relire par un avocat est recommandé.
- **Paiement** : liens de paiement Stripe, plus une liste « Pro » dans Brevo.
