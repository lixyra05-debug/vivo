# Audit Agent 3 — Conformité éditoriale et réglementaire

**Périmètre** : claims thérapeutiques · prescriptions de consommation · sources · qualité des données affichées · RGPD.
**Méthode** : balayages regex indépendants des tests garde-fous, lecture humaine des 5 fichiers data phytothérapie (2 236 lignes), liveness curl cadencé 1/s (UA `Vivo-Audit/1.0`) sur 98 URLs dédupliquées, traçage du flux OCR client → Edge Function → Anthropic.
**HEAD audité** : 45678fa, arbre propre. Aucun fichier source modifié.

---

## 0) Tableau récapitulatif

| Sévérité | Statut | Constat | Fichier:ligne |
|---|---|---|---|
| BLOQUANT | PROUVE | Le protocole « Peau Saine » fait BOIRE une infusion de fleurs de bourrache (j3, j17) que la propre carte warning EFSA de l'app déclare « consommation interne déconseillée » (alcaloïdes pyrrolizidiniques hépatotoxiques) | `src/data/protocols.ts:417-419` vs `src/lib/education/content-database.ts:874` |
| BLOQUANT | PROUVE | 7 des 15 features Expert vendues 49,99 €/an n'existent nulle part dans le code (dont « Consultation expert 1/an » et « Alternatives plantes aux médicaments ») ; « plus de 200 plantes » annoncées vs 40 réelles | `src/lib/premium/premium-gate.ts:163-215` + `app/settings/subscription.tsx:49-55` |
| BLOQUANT | PROUVE | La politique de confidentialité affirme que les images du scan ne sont « jamais » collectées, alors que l'OCR envoie la photo à Anthropic (USA) via l'Edge Function ; Anthropic absent des sous-traitants | `app/settings/privacy.tsx:166-168` vs `src/lib/api/ocr-scan.ts:26-31` |
| MAJEUR | PROUVE | « Remèdes naturels par symptôme… validés par les agences » + catégories mappant des pathologies (insomnie, eczéma, dermatite, anxiété, cicatrisation) | `premium-gate.ts:170-172`, `src/lib/remedies/remedy-finder.ts:22,58-59,82` |
| MAJEUR | PROUVE | Liens sources morts massifs : l'URL EMA de 35/40 fiches plantes → 404 ; `vivo-app.fr` → NXDOMAIN ; 6 URLs ANSES, 5 PDFs IARC, ANSM, FDA, registre UE → 404 confirmés | `src/data/plant-encyclopedia.ts:46-47`, `content-database.ts:150,160`, annexe A |
| MAJEUR | PROUVE | Tips des protocoles : affirmations chiffrées inventées et pseudo-science sans aucune source (« −30 % de charge digestive », « la transpiration draine les toxines », « les fruits fermentent mal ») | `src/data/protocols.ts:198,200,202,207,283,453,460` |
| MAJEUR | PROUVE | Sortie LLM affichée sans garde-fou éditorial : le prompt OCR n'interdit aucune allégation/prescription et en modèle une dans son exemple | `supabase/functions/analyze-ingredients/index.ts:15-49` |
| MAJEUR | PROUVE | Aucun garde-fou nom produit absurde (« isabelle ») : fiche, historique, carte virale ScanChoc, PDF médecin | `app/scan-choc/[barcode].tsx:293`, `src/lib/export/generate-pdf.ts:88` |
| MAJEUR | PROUVE | Consentement art. 9 persisté uniquement en AsyncStorage local (preuve art. 7 perdue à la réinstallation) ; Mode Famille collecte des données santé de tiers (enfants) sans la modale | `src/lib/api/health-consent.ts:34-41`, `app/family/edit.tsx` |
| MAJEUR | PROUVE | RevenueCat (sous-traitant US, achats intégrés) absent de la politique de confidentialité | `app/settings/privacy.tsx:231-257` vs `src/lib/purchases/revenuecat.ts` |
| MAJEUR | HYPOTHESE | `evidenceLevel: 'well-established'` surévalué pour ginseng et aubépine (monographies EMA en usage traditionnel) | `plant-encyclopedia.ts:835,644` |
| MINEUR | PROUVE | « Privilégie le clean » dans un tip — l'app détecte elle-même le « clean labeling » comme marketing trompeur | `src/data/protocols.ts:461` |
| MINEUR | PROUVE | Sources hors allowlist : cir-safety.org (panel financé par l'industrie), rspo.org (filière huile de palme) | `content-database.ts:213,301`, `transparency.ts:79-81` |
| MINEUR | PROUVE | URLs racines génériques rattachées à des avis précis (avis ANSES 2019/2022/2024 → `anses.fr/`) | `plant-encyclopedia.ts:521,669,795,816,858` |
| MINEUR | PROUVE | CGU : seul « Abonnement Premium » contractualisé, tier Expert 49,99 € absent | `app/settings/cgu.tsx:238-249` |
| MINEUR | PROUVE | Titre « Thym — antiseptique respiratoire reconnu » excède l'indication EMA | `content-database.ts:438` |
| MINEUR | PROUVE | Protocole peau : aloe par voie orale sans rappel du risque latex à l'écran ; contre-indications jamais affichées sur les écrans protocole/recette/rappel | `protocols.ts:423`, `app/protocols/[id].tsx` (0 occurrence) |
| MINEUR | PROUVE | Mot « cure »/« remède » généralisés dans l'UI (liste des interdits mission) — sens FR « cure de plantes », recensé | `reminder-store.ts:110-111`, `app/remedies/index.tsx:55` |
| COSMETIQUE | PROUVE | **CLAUDE.md annonce 31 cartes éducatives, le fichier en contient 65** | `content-database.ts:2,13` |
| COSMETIQUE | PROUVE | Commentaire « DETOX (3) » vs 4 recettes ; titres « anti-stress »/« anti-ballonnements » ; « Recommandé en consommation modérée » sans source | `wellness-recipes.ts:534,210,230`, `content-database.ts:42` |

---

## 1) BLOQUANTS

### B1 — [PROUVE] L'app fait boire de la bourrache que sa propre base déclare hépatotoxique par voie interne
Le protocole Expert « Peau Saine » (rotation `SKIN_ROTATION`, `src/data/protocols.ts:392-400`) place `borage` en 3ᵉ position → servi aux **jours 3, 10 et 17**. Les recettes des cycles 1 et 3 sont des infusions **de fleurs** à boire :

- `protocols.ts:417` : « Infusion de bourrache : 1,5g de **fleurs séchées** … Le matin (max 4 semaines). »
- `protocols.ts:419` : « Bourrache + souci : 1g de chaque … infusion 10 min. Le matin. »

Or l'app elle-même documente, sources EFSA/ANSES à l'appui :
- `src/lib/education/content-database.ts:874` (carte `borage_pa_warning`, source EFSA pub/4908, **vivante**, tone `warning`) : « la bourrache (feuilles, **fleurs**) contient des alcaloïdes pyrrolizidiniques hépatotoxiques et potentiellement cancérogènes. **Consommation interne déconseillée.** »
- `src/data/plant-encyclopedia.ts:512` : `partUsed: 'Graines (huile) — éviter les parties aériennes au long cours'` ; `:516` : « Parties aériennes (alcaloïdes pyrrolizidiniques) déconseillées au long cours, en grossesse, allaitement, chez l'enfant. »

Aggravation : **aucune contre-indication n'est affichée sur les écrans protocole** — `grep contre-indication app/protocols/[id].tsx app/recipes/[id].tsx app/reminders/index.tsx` → 0 occurrence. L'utilisateur Expert qui suit le programme jour par jour ne voit jamais l'alerte ; seule la fiche encyclopédie (qu'il n'a aucune raison d'ouvrir) la porte. C'est le défaut racine du projet sous une autre forme : l'information de risque existe dans une couche, la surface de consommation ne la lit pas.

Sévérité : BLOQUANT — instruction de consommation contredite par la propre donnée sourcée de l'app, feature payante, risque hépatique documenté.

### B2 — [PROUVE] Vente de 7 features Expert inexistantes + « plus de 200 plantes » pour 40 réelles
Le catalogue `PREMIUM_FEATURES` (`src/lib/premium/premium-gate.ts:163-215`) contient 7 clés Expert **sans le moindre call-site** dans `src/` ou `app/` (grep exhaustif, annexe B) :

| Clé | Promesse affichée à l'achat |
|---|---|
| `expert_consultation` | « Une consultation visio par an avec un pharmacien spécialisé phytothérapie » (:213) |
| `plant_alternatives` | « **Alternatives plantes aux médicaments** — Suggestions d'alternatives naturelles » (:176-178) |
| `expert_articles` | « Dossiers approfondis rédigés par des pharmaciens et nutritionnistes » (:207) |
| `cosmetic_actives` | « Décryptage des INCI et des actifs réellement efficaces » (:184) |
| `pregnancy_safety` | « Alertes spécifiques grossesse » (:190) |
| `children_safety` | « Filtrage adapté aux moins de 3 ans » (:195) |
| `interaction_warnings` | « Détection des interactions à risque … sourcée ANSM » (:201) |

Ces 7 promesses sont **toutes affichées sur l'écran d'achat** : `app/settings/subscription.tsx:53-55` itère `Object.keys(PREMIUM_FEATURES)` filtré `tier === 'expert'` et rend chaque `labelFr` (:398, :522). Le flux d'achat est branché (`purchase(target)` :70, RevenueCat via `src/lib/purchases/revenuecat.ts`). **Aucune mention « bientôt disponible » / « à venir »** (grep :vide).

S'y ajoute `plant_database` (:166) : « Accès à **plus de 200 plantes** » — l'encyclopédie en contient **40** (`grep -c "    id: '" plant-encyclopedia.ts` → 40).

Deux dimensions bloquantes :
1. **Commerciale** : pratique trompeuse (art. L.121-2 C. conso, App Store Review 2.1/3.1) — on encaisse 49,99 €/an sur des promesses fausses, dont une prestation de service nominative (consultation pharmacien).
2. **Santé** : le libellé « Alternatives plantes **aux médicaments** » promet exactement ce que R5 interdit (« remplace ») — positionner des plantes en substitut de médicaments.

Note atténuante factuelle : `REVENUECAT_APPLE_API_KEY = 'appl_REMPLACER_APRES_CONFIG_REVENUECAT'` (`src/lib/purchases/config.ts:10`) — l'achat échouerait aujourd'hui en runtime, mais l'écran et le catalogue sont prêts à encaisser dès que la clé sera posée.

### B3 — [PROUVE] La politique de confidentialité affirme l'inverse de ce que fait le scan OCR
`app/settings/privacy.tsx:166-168` (ARTICLE 3 — Données NON collectées) : « LYXIRIA ne collecte jamais : … **les photos de la galerie ou les images prises au scan (le scan n'enregistre que le code-barres décodé, jamais l'image)** ».

Réalité du code : le scan OCR photographie l'étiquette (`app/(tabs)/scan.tsx:150-159`, `launchCameraAsync({ base64: true })` **et** `launchImageLibraryAsync` — donc aussi des photos de la galerie), transmet le base64 à l'Edge Function Supabase (`src/lib/api/ocr-scan.ts:26-31`), qui le **forwarde à l'API Anthropic aux États-Unis** (`supabase/functions/analyze-ingredients/index.ts:10,112-119`).

Conséquences en cascade dans la même politique :
- ARTICLE 2 (données collectées, :133-153) : la photo n'y figure pas ;
- ARTICLE 4 (finalités, :182-203) : l'analyse d'image n'y figure pas ;
- ARTICLE 6 (sous-traitants, :231-257) : **Anthropic absent** — transfert hors UE non déclaré (art. 44+ RGPD), alors que Sentry y est déclaré avec sa base DPF.

La photo n'est certes pas STOCKÉE (voir point sain S2), mais l'envoi à un tiers est un **traitement** au sens de l'art. 4(2) RGPD, et une photo d'étiquette prise dans une cuisine peut incidemment contenir des mains, reflets, environnement domestique. Une politique qui nie ce traitement est pire que pas de politique : elle constitue une déclaration fausse opposable (art. 13 RGPD, clause abusive).

---

## 2) MAJEURS

### M1 — [PROUVE] Le « Chercheur de Remèdes » mappe des pathologies vers des plantes
- `premium-gate.ts:170-172` : « **Remèdes naturels par symptôme** — Suggestions de remèdes traditionnels **validés** par les agences de santé européennes. » Double problème : « remède … par symptôme » = présentation médicamenteuse (art. L.5111-1 CSP, médicament par présentation) ; « validés » surtraduit l'enregistrement d'usage traditionnel EMA (qui ne valide PAS l'efficacité — c'est le sens même du statut « traditional use »).
- `src/lib/remedies/remedy-finder.ts` : les keywords de recherche incluent des **pathologies caractérisées** : `'insomnie'` (:22), `'anxiété', 'angoisse'` (:59), `'dermatite', 'eczéma', 'cicatrisation'` (:82). Taper « eczéma » renvoie des plantes → l'app suggère des plantes pour une maladie dermatologique.
- Les gardes-fous existants ne couvrent PAS ce fichier ni le mot « remède » : regex protocols `/soigne|guérit|guerit|traite |remplace|cure |médicament/i` (`protocols.test.ts:36`), regex recipes `/(?<!dis)\bsoigne\b|guérit|guerit|\btraite\b|remplace|\bmédicament\b/i` (`wellness-recipes.test.ts:38`). Contrôle refait indépendamment, comme demandé : les data plantes/recettes sont propres (voir S5), c'est le **cadre de présentation** (remèdes, symptômes, pathologies) qui déborde.

### M2 — [PROUVE] Liens sources morts sur les surfaces qui les affichent
Liveness sur 98 URLs dédupliquées (annexe A, codes bruts). **404 confirmés / NXDOMAIN** (les 403 EFSA/ECHA et 412 Cochrane sont classés bot-block non concluant, conformément à la consigne) :

- **`https://www.ema.europa.eu/en/medicines/herbal-medicinal-products` → 404** (`plant-encyclopedia.ts:46-47`, constante `EMA_HMPC_BASE`). C'est le `sourceUrl` de **35 des 40 fiches plantes**, ouvert par `app/plants/[id].tsx:160` (`Linking.openURL(plant.sourceUrl)`) et affiché en clair (:170). Toute la crédibilité « sourcée EMA » du tier Expert débouche sur une 404.
- **`https://www.vivo-app.fr` → NXDOMAIN** (domaine inexistant — le domaine réel du projet est vivo.lyxiria.com). Utilisé par les cartes `score_low` et `score_excellent` (`content-database.ts:150,160`), ouvert par `EducationalCard.tsx:47`. Par la règle de preuve de la mission : source orpheline.
- **6 URLs ANSES → 404** (refonte du site ANSES, pattern `/fr/content/*` mort) : E171 (:24), champignons (:413), ultra-transformés (:427), + `additives-db.ts` : aluminium, stratégie PE, thème additifs.
- **6 URLs EMA herbal spécifiques → 404** : `bardanae-radix`, `cichorii-radix`, `coriandri-fructus`, `juniperi-pseudo-fructus`, `malvae-flos`, `taraxaci-radix` (cartes content-database :601,627,640,731,798,811,863) — slugs probablement erronés puisque 20 autres URLs du même pattern répondent 200.
- **5 PDFs IARC → 404** : `monographs.iarc.who.int/...mono73.pdf`, `mono40-13.pdf`, `mono100F-24.pdf`, `mono100F-29.pdf`, `publications.iarc.fr/_publications/media/download/2954/...pdf` (tous dans `additives-db.ts`, ouverts par `PenaltyCard.tsx:178`). La règle projet « chaque pénalité doit avoir une source scientifique **accessible** » n'est plus tenue.
- **Divers 404** : `ansm.sante.fr/dossiers-thematiques/medicaments-a-base-de-plantes` (carte mille-pertuis :393), `ec.europa.eu/...(registre allégations UE)` (cartes avoine/orge/carotte :547,561,575), `fda.gov/...food-additive-status-list` (carte lécithine :65), `efsa.europa.eu/fr/topics/topic/food-based-dietary-guidelines` (carte crucifères :327), `ema.europa.eu/en/medicines/herbal` (carte calming_herbs :353).

### M3 — [PROUVE] Tips des protocoles : chiffres inventés et pseudo-science, zéro source
L'en-tête de `protocols.ts:9` promet « Sources : EMA HMPC monographs, ANSES, EFSA, Cochrane » — **aucun des 105 tips ne cite quoi que ce soit**, et plusieurs sont faux ou pseudo-scientifiques :
- :198 « Une bonne mastication **réduit la charge digestive de 30%** » — chiffre inventé.
- :200 « L'eau **dilue les sucs gastriques** nécessaires à la digestion » — mythe réfuté.
- :202 « **Les fruits fermentent mal en fin de digestion** » — food combining, pseudo-science.
- :207 « Couche-toi sur le côté **gauche** … favorise la **vidange gastrique** » — inversé (le décubitus gauche réduit le reflux mais ralentit la vidange).
- :283 « chaque interruption **augmente le cortisol pendant 23 minutes** » — les « 23 minutes » sont un chiffre de re-concentration attentionnelle (Gloria Mark), pas de cortisol.
- :460 « **La transpiration draine les toxines** via la peau » — mythe détox réfuté, dans une app dont le cœur de métier est la rigueur toxicologique.
- :453 « Limite les laitages … **Lien démontré** dans plusieurs études » — « démontré » surtraduit des associations observationnelles.
- :369 « respiration de **Wim Hof** … 30 respirations puis rétention » — technique d'hyperventilation avec risques documentés de syncope, promue sans mise en garde, du nom d'une figure commerciale (esprit de la règle « jamais d'auteur militant »).

### M4 — [PROUVE] Le résumé OCR est du texte LLM affiché tel quel, sans cadre R5
`supabase/functions/analyze-ingredients/index.ts:15-49` : le SYSTEM_PROMPT ne contient **aucune interdiction** d'allégation thérapeutique, de prescription ou de conseil médical — alors que tout le contenu statique de l'app est passé au crible R5. Pire, l'exemple du schéma **modèle une prescription pédiatrique** : `"summary": "Produit transformé avec additifs à éviter chez l'enfant."` (:42). `result.summary` et chaque `reason` sont rendus tels quels (`app/ocr/result.tsx:144,247`). La seule surface générative de l'app est la seule sans garde-fou éditorial. (Le disclaimer médical est bien présent sur l'écran résultat — voir S6 — mais il encadre un texte dont le ton n'est pas contraint.)

### M5 — [PROUVE] Aucun garde-fou sur les noms/marques absurdes (« isabelle »)
Grep exhaustif des rendus : seuls des fallbacks null existent, aucune validation de vraisemblance (longueur, casse, ≠ prénom, ≠ code-barres) :
- Fiche produit : `app/product/[barcode].tsx:376` (`name={product.name}`) et message de partage :249 (`${productQuery.data.name ?? 'Produit'} — Score Vivo…`).
- Historique : `app/(tabs)/history.tsx:162` (`name={item.product?.name ?? null}`).
- **Carte virale ScanChoc** : `app/scan-choc/[barcode].tsx:293` (`productName={product.name ?? 'Produit'}`) — une image « ⚠️ ATTENTION / isabelle / 12/100 » peut partir sur les réseaux avec la marque Vivo dessus.
- **PDF destiné au médecin** : `generate-pdf.ts:88` — seul l'échappement HTML est appliqué, pas de contrôle sémantique.
- `src/lib/api/confidence.ts:38` se contente de `isStringFilled(product.name)` — « isabelle » est une chaîne remplie, le produit peut donc afficher un badge de confiance normal.
Risque : crédibilité de l'app et diffusion publique de données OFF pourries sous le branding Vivo. (Le cas observé : barcode 3274080005003, nom « isabelle ».)

### M6 — [PROUVE] Art. 9 : preuve de consentement uniquement locale ; Mode Famille non couvert
Le dispositif existe et est bien conçu (voir S4), mais :
1. `src/lib/api/health-consent.ts:34-41` : le consentement est écrit **uniquement en AsyncStorage** (`@vivo_health_consent`). Les données santé, elles, sont **côté serveur** (`user_profiles.health_profile`, via `useProfileStore.ts:45`). Réinstallation ou second appareil → la preuve du consentement disparaît alors que le traitement serveur continue. L'art. 7.1 RGPD impose au responsable de pouvoir **démontrer** le consentement — le consentement CGU, lui, est bien persisté en base (`consent_at`/`cgu_version`, `register.tsx:40-41`) ; l'asymétrie est en défaveur de la donnée la plus sensible.
2. **Mode Famille** : `app/family/edit.tsx` collecte allergies + conditions de tiers — dont `age_group: 'child' | 'baby'` (mineurs, art. 8) — et les stocke dans `family_profiles` côté serveur. Grep `HealthConsentModal|hasHealthConsent` : appelé **uniquement** depuis `app/settings/health-profile.tsx` et `app/onboarding/health-profile.tsx`. Aucun passage par la modale pour les profils familiaux.

### M7 — [PROUVE] RevenueCat absent de la politique de confidentialité
`react-native-purchases` est intégré (`src/lib/purchases/revenuecat.ts`, commit d4bc7d3) : RevenueCat (société US) recevra app user IDs et receipts. Le tableau des sous-traitants (`privacy.tsx:231-257`) liste Supabase, Vercel, Stripe, Apple/Google, Sentry, OFF/OBF — **pas RevenueCat**. (PostHog : annoncé dans la stack CLAUDE.md mais aucune intégration dans le code — grep vide — donc son absence de la politique est cohérente, rien à signaler.)

### M8 — [HYPOTHESE] `evidenceLevel: 'well-established'` surévalué sur ginseng et aubépine
`plant-encyclopedia.ts:835` (ginseng, « Usage bien établi pour … faiblesse et fatigue ») et :644 (aubépine) sont étiquetés `well-established`, alors que, de mémoire de monographies, EMA/HMPC classe Ginseng radix ET Crataegus en **traditional use** uniquement (le well-established use de l'aubépine a été retiré du projet de monographie 2016). Le badge `well-established` s'affiche en vert « Usage bien établi » sur `PlantListCard`. **Test pour trancher** : ouvrir les deux monographies (URLs spécifiques vivantes, 200 OK — `ema.europa.eu/en/medicines/herbal/…` n'existe pas pour ginseng dans les data, mais la monographie est trouvable sur ema.europa.eu) et vérifier la section « Well-established use » vs « Traditional use ». Même vérification recommandée en lot sur les 13 fiches `well-established`.

---

## 3) MINEURS

- **m1 [PROUVE] « Privilégie le clean »** — `protocols.ts:461` : « Évite les cosmétiques avec parabènes longs (E216-E217 interdits). **Privilégie le clean.** » Contradiction frontale avec `src/lib/scoring/clean-labeling.ts`, dont le rôle est précisément de pénaliser le marketing « clean ». Accessoirement E216-E217 sont des additifs **alimentaires** cités dans un conseil cosmétique.
- **m2 [PROUVE] Sources hors allowlist** — `cir-safety.org` (CIR = Cosmetic Ingredient Review, panel financé par le Personal Care Products Council ; `content-database.ts:213`, `transparency.ts:79-81`) et `rspo.org` (organisation de filière huile de palme, `content-database.ts:301`). Ni agence, ni revue à comité de lecture. `inserm.fr`, `fda.gov`, `cambridge.org`, `santepubliquefrance.fr` : hors liste stricte mais dans l'esprit (institutions publiques / peer-review) — recensés, pas de reproche.
- **m3 [PROUVE] Sources nommées précises, URLs racines** — « ANSES — alerte 2022 curcuma » → `https://www.anses.fr/` (`plant-encyclopedia.ts:795`) ; idem :521 (avis PA 2019), :669 (canneberge), :816 (thé vert 2018), :858 (vigilance ashwagandha 2024) ; `ansm.sante.fr/` (`content-database.ts:241`) ; `efsa.europa.eu/fr` (:54,288,340). L'avis existe, le lien ne permet pas de le retrouver — traçabilité faible, pas invention.
- **m4 [PROUVE] CGU muettes sur le tier Expert** — `cgu.tsx:238-249` (ARTICLE 8) ne contractualise que « Abonnement Premium … (alternatives premium, etc.) ». Le tier Expert 49,99 €/an vendu par `subscription.tsx` n'existe pas dans le contrat que l'utilisateur accepte à l'inscription.
- **m5 [PROUVE] Vocabulaire « cure »/« remède » dans l'UI** — « Ta cure du jour 🌿 / C'est l'heure de ta cure » (notification, `reminder-store.ts:110-111`), « Suivi de tes cures de plantes » (`app/reminders/index.tsx:147`), « Chercheur de Remèdes » (`app/remedies/index.tsx:55`, `explore.tsx:371-379`, `profile.tsx:421`). Ces mots figurent sur la liste des interdits de la mission. Nuance appliquée : en français, « cure de plantes » (durée d'usage) n'est pas une allégation de guérison, et « cure » au sens interdit (traitement curatif) n'apparaît nulle part. Recensés ; le vrai problème du mot « remède » est traité en M1.
- **m6 [PROUVE] Contre-indications jamais montrées au moment de la consommation** — `grep contre-indication` sur `app/protocols/[id].tsx`, `app/recipes/[id].tsx`, `app/reminders/index.tsx` → 0. Les recettes servent houblon/valériane (déconseillés grossesse, <12 ans, conducteurs), aloe oral (`protocols.ts:423`, « qualité alimentaire », max 2 semaines — la fiche encyclopédie est `preliminary` avec warning EFSA génotoxicité du latex), sans surfacer les restrictions que l'app connaît. Version systémique et non-bloquante de B1.
- **m7 [PROUVE] « Thym — antiseptique respiratoire reconnu »** — `content-database.ts:438` : l'indication EMA (toux productive du rhume) ne fait pas du thym un « antiseptique » ; le titre sur-vend la monographie citée.
- **m8 [PROUVE] Avertissements sourcés à conserver tels quels (nuance mission 2)** — recensés et JUGÉS CONFORMES car adossés à une source réglementaire : miel <1 an (ANSES/Cochrane, `content-database.ts:361-363`), réglisse/HTA (EFSA 2008, :377), champignons sauvages (ANSES, :411), mille-pertuis (ANSM, :390), tips packaging (« À éviter pour le contact alimentaire » PVC/PS — `packaging-risks.ts:135,187`, sources ECHA/CIRC dans chaque entrée). Ces prescriptions-là sont de la sécurité sanitaire, pas du marketing.

---

## 4) COSMETIQUES

- **c1 [PROUVE] — CONTRADICTION AVEC CLAUDE.md** : **le CLAUDE.md annonce « 31 cartes éducatives » ; `content-database.ts` en contient 65** (en-tête :2 et :13 « 65 cartes (22 originales + 9 Beauvillard + 34 phytothérapie Premium) », comptage `grep -c "    id: '"` → 65). La doc projet est en retard d'un lot complet (34 cartes phytothérapie non documentées). Signalé en gras conformément à la consigne.
- **c2 [PROUVE]** Commentaire `// ─── DETOX (3)` vs 4 recettes détox réelles (`wellness-recipes.ts:534-608`).
- **c3 [PROUVE]** Titres marketing « anti- » : « Infusion de carvi **anti-ballonnements** » (:210), « Tisane passiflore-mélisse **anti-stress** » (:230), protocole « **Anti-Stress** Naturel » (`protocols.ts:512`) — le corps du texte reste R5-safe, seuls les titres claquent.
- **c4 [PROUVE]** « Recommandé en consommation modérée » (carte E621, `content-database.ts:42`) — la recommandation est de Vivo, pas de l'OMS citée ; formulation à neutraliser.
- **c5 [PROUVE]** « Top 5 produits à éviter » (PDF, `generate-pdf.ts:264`) et « à éviter » (recap, `app/recap/monthly.tsx:349`) — cohérents avec le verdict unifié « À éviter » (`display-helpers.ts:142`) ; recensés comme prescriptifs assumés du système de score (R4 : décision active non re-débattue).

---

## 5) Vérifié et SAIN (avec preuves)

- **S1 — L'échappement HTML du PDF est réel** : la doc projet affirme « escape HTML XSS » — **PROUVÉ, pas de contradiction**. `generate-pdf.ts:53-61` définit `escapeHtml` (5 entités : `& < > " '`), appliqué à TOUS les champs dynamiques textuels : nom/marque produit (:88), userName (:235), periodLabel (:237), badges (:129-132), date (:274). Les seuls interpolés non échappés sont des `number` (:241-253) et des constantes couleur.
- **S2 — Le flux photo OCR est transit-only côté Vivo** : `useOcrSessionStore` est volontairement non persisté (commentaire :5-6 « pas d'AsyncStorage pour éviter de stocker une image lourde », zustand pur, `clear()` :28) ; l'Edge Function ne contient **ni écriture Storage, ni insert DB, ni console.log de l'image** (grep `storage|insert|log|console` → seul faux positif « toxico**log**ie » dans le prompt) ; la photo n'est jamais uploadée dans Supabase Storage. Le problème n'est PAS le flux (sain) mais sa déclaration (B3).
- **S3 — Aucune clé secrète côté client** : `.env.local` = 2 variables `EXPO_PUBLIC_*` uniquement (URL + anon key Supabase) ; grep `service_role|sk-|SECRET|API_KEY` hors `EXPO_PUBLIC_*` sur `src/`+`app/` → seul hit : `REVENUECAT_APPLE_API_KEY` (`config.ts:10`), clé **publique** SDK par design (et encore en placeholder). La clé Claude de l'OCR vit côté serveur : `Deno.env.get('ANTHROPIC_API_KEY')` (`analyze-ingredients/index.ts:65`), jamais dans le bundle client.
- **S4 — Le consentement art. 9 est distinct de la checkbox CGU** : la mission demandait si la checkbox CGU « suffisait » — le code fait mieux : modale dédiée `HealthConsentModal` avec base légale affichée (« RGPD art. 9 §2 a) — consentement explicite », :47-50), checkbox bloquante (`disabled={!checked}` :87), branchée sur les DEUX portes d'entrée du profil santé (`app/onboarding/health-profile.tsx:50,67,134` et `app/settings/health-profile.tsx:77,122,241`), versionnée (`HEALTH_CONSENT_VERSION`). Les réserves (persistance locale, famille) sont en M6 ; le mécanisme lui-même est conforme.
- **S5 — Les 40 fiches plantes et 30 recettes sont R5-safe, contre-vérifiées indépendamment des tests** : lecture humaine intégrale + regex élargie (`soigne|guérit|traite|remède|cure|médicament|antibiotique|efficace|puissant`) → vocabulaire uniforme « propriétés documentées / usage traditionnel reconnu / contribue / favorise / soutient », chaque fiche porte contre-indications ET interactions, mention explicite quand une donnée manque (« données insuffisantes », `plant-encyclopedia.ts:85`). Les seules sorties de route sont celles listées (M8, m7).
- **S6 — Disclaimers médicaux systématiques** : « avis médical | professionnel de santé » présent sur les 11 écrans concernés — `plants/index`, `plants/[id]`, `remedies/index`, `remedies/[categoryId]`, `recipes/index`, `recipes/[id]`, `protocols/index`, `protocols/[id]`, `reminders/index`, `herbarium/index`, `ocr/result` (grep, liste brute en annexe C) + écran dédié `app/settings/health-disclaimer.tsx`.
- **S7 — Aucun auteur militant cité comme source** : grep `gouget|beauvillard|clément|o'neill` sur toutes les data → 0 citation-source. Unique occurrence : un commentaire de code (`content-database.ts:13`) décrivant l'origine historique du lot (« 9 Beauvillard » = cartes extraites PUIS re-sourcées Cochrane/EFSA/ANSES/ANSM/EMA), conforme à la méthode documentée.
- **S8 — Les libellés Scan Choc sont des constats** : `detectProblems` (`scan-choc/[barcode].tsx:75-111`) produit « Cocktail d'additifs (N) », « Ultra-transformé (NOVA 4) », « Huiles de graines », « Excès de sucres/sel/graisses saturées », « Très mal noté » — factuel, chiffré, aucune prescription ni claim.
- **S9 — 44 URLs sources répondent 200** (annexe A) : les 3 DOI (Lancet/Southampton, Nature/Chassaing 2015, Gastroenterology 2021), pubmed, 20 monographies EMA herbal spécifiques, iarc.who.int (aspartame 2023), eur-lex (202, vivant), cnil.fr/fr/plaintes (200 — la promesse « lien CNIL fonctionnel » de la doc est tenue), inserm, cambridge (Monteiro), santepubliquefrance (Nutri-Score), who.int ×3, efsa pub/2712 & 4908 etc.
- **S10 — Contenus de notifications neutres** : « Ta semaine Vivo 📊 » (`notification-scheduler.ts:137`) avec corps factuel (« Cette semaine est calme. Reprends quand tu veux ! », :89) ; « Ta cure du jour 🌿 » (`reminder-store.ts:110-111`) — aucune allégation, aucune culpabilisation.
- **S11 — L'écran transparence est honnête sur la mécanique** : `transparency.ts` décrit la formule composite avec l'emballage comme amortissement (cohérent avec le lot d'août :12-16), sources officielles, FAQ sans promesse d'efficacité santé.

---

## 6) Annexes

### A — Liveness des 98 URLs sources (curl -sI -L, 1 req/s, UA Vivo-Audit/1.0, codes HTTP bruts)

Répartition : `44× 200 · 25× 403 · 23× 404 · 2× 202 · 2× 412 · 2× 000`

**404 confirmés / domaine inexistant (préjudiciables)** :
```
000 https://www.vivo-app.fr                    → NXDOMAIN (host: not found) — domaine inexistant
404 https://www.ema.europa.eu/en/medicines/herbal-medicinal-products   ← EMA_HMPC_BASE, 35/40 fiches
404 https://www.ema.europa.eu/en/medicines/herbal
404 https://www.ema.europa.eu/en/medicines/herbal/bardanae-radix
404 https://www.ema.europa.eu/en/medicines/herbal/cichorii-radix
404 https://www.ema.europa.eu/en/medicines/herbal/coriandri-fructus
404 https://www.ema.europa.eu/en/medicines/herbal/juniperi-pseudo-fructus
404 https://www.ema.europa.eu/en/medicines/herbal/malvae-flos
404 https://www.ema.europa.eu/en/medicines/herbal/taraxaci-radix
404 https://www.anses.fr/fr/content/dioxyde-de-titane-e171
404 https://www.anses.fr/fr/content/champignons-soyez-vigilants
404 https://www.anses.fr/fr/content/aliments-ultra-transform%C3%A9s-de-quoi-parle-t-on
404 https://www.anses.fr/fr/content/exposition-de-la-population-fran%C3%A7aise-laluminium
404 https://www.anses.fr/fr/content/strat%C3%A9gie-nationale-sur-les-perturbateurs-endocriniens
404 https://www.anses.fr/fr/themes/additifs-alimentaires
404 https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono73.pdf
404 https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono40-13.pdf
404 https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono100F-24.pdf
404 https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono100F-29.pdf
404 https://publications.iarc.fr/_publications/media/download/2954/0a0b…e21.pdf
404 https://ansm.sante.fr/dossiers-thematiques/medicaments-a-base-de-plantes
404 https://ec.europa.eu/food/safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-nutrition-and-health-claims_en
404 https://www.fda.gov/food/food-additives-petitions/food-additive-status-list
404 https://www.efsa.europa.eu/fr/topics/topic/food-based-dietary-guidelines
```

**Bot-block, NON concluant (pas des sources inventées)** :
```
403 https://www.efsa.europa.eu/en/efsajournal/pub/*   (21 URLs — WAF EFSA bloque les HEAD non-navigateur)
403 https://echa.europa.eu/  ·  403 https://echa.europa.eu/fr
412 https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007653.pub2/full
412 https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007094.pub5/full
202 https://eur-lex.europa.eu/… (×2 — accepté, vivant)
000→200 https://www.efsa.europa.eu/fr (HEAD refusé, GET 200 — vivant)
```

**200 OK (extrait)** : 20 monographies EMA herbal spécifiques (thymi-herba, valerianae-radix, menthae-piperitae-folium…), 3 DOI (doi.org), pubmed 25875025, iarc.who.int/news (aspartame), who.int ×3, inserm, cambridge (Monteiro), santepubliquefrance, cnil.fr/fr/plaintes, anses.fr racine, ansm.sante.fr racine, efsa pub/2712, pub/4908, rspo.org, cir-safety.org.

### B — Preuve des features fantômes
```
$ for k in expert_consultation plant_alternatives cosmetic_actives expert_articles \
    pregnancy_safety children_safety interaction_warnings; do
    grep -rn "$k" src/ app/ --include="*.ts" --include="*.tsx" \
      | grep -v premium-gate.ts | grep -v __tests__ ; done
(sortie vide — 0 call-site pour les 7 clés)

$ grep -niE "bientôt|à venir|prochainement|roadmap|beta" app/settings/subscription.tsx \
    src/components/premium/PremiumPaywall.tsx
(sortie vide — aucune mention atténuante)

$ grep -c "    id: '" src/data/plant-encyclopedia.ts
40        ← vs « plus de 200 plantes » (premium-gate.ts:166)
```

### C — Écrans portant le disclaimer médical (grep "avis médical|professionnel de santé")
```
app/herbarium/index.tsx · app/ocr/result.tsx · app/plants/[id].tsx · app/plants/index.tsx
app/protocols/[id].tsx · app/protocols/index.tsx · app/recipes/[id].tsx · app/recipes/index.tsx
app/remedies/[categoryId].tsx · app/remedies/index.tsx · app/reminders/index.tsx
app/settings/health-disclaimer.tsx (+ cgu.tsx, legal.tsx)
```

### D — Jours bourrache du protocole Peau (rotation index 2, `(day-1) % 7 === 2`)
```
jours 3, 10, 17 — j3 et j17 : infusion de fleurs à boire (protocols.ts:417,419) ; j10 : capsules d'huile (:418)
```

### E — Comptages data réels vs annoncés
```
content-database.ts  : 65 cartes   (CLAUDE.md : « 31 cartes » — CONTRADICTION, voir c1)
plant-encyclopedia.ts: 40 fiches   (CLAUDE.md : 40 ✓ ; catalogue payant : « plus de 200 » ✗ — voir B2)
wellness-recipes.ts  : 30 recettes (CLAUDE.md : 30 ✓ ; répartition detox = 4, commentaire « (3) » ✗)
```
