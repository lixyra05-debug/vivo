import {
  fetchProductMultiSource,
  fetchProductCategoriesTags,
  fetchProductPackagings,
  normalizeOFFProduct,
  productToScoringInput,
  type OFFProduct,
} from '../openfoodfacts';

describe('fetchProductMultiSource', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retourne un produit food quand OFF répond avec un produit', async () => {
    const offProduct = {
      code: '5449000000996',
      product_name: 'Coca-Cola',
      brands: 'Coca-Cola',
      ingredients_text: 'eau, sucre',
      additives_tags: ['en:e150d'],
      nova_group: 4,
    };
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 1, product: offProduct }), { status: 200 }),
    );
    const result = await fetchProductMultiSource('5449000000996');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('food');
    expect(result?.product.code).toBe('5449000000996');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toEqual(
      expect.stringContaining('fr.openfoodfacts.org'),
    );
  });

  it('retombe sur OBF quand OFF retourne null', async () => {
    const obfProduct = {
      code: '3600540123456',
      product_name: 'Shampoing doux',
      brands: 'MarqueX',
      ingredients_text: 'Aqua, Sodium Laureth Sulfate',
      categories_tags: ['en:shampoos'],
    };
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      // OFF : produit non trouvé (status !== 1)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 0 }), { status: 200 }),
      )
      // OBF : trouvé
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 1, product: obfProduct }), { status: 200 }),
      );

    const result = await fetchProductMultiSource('3600540123456');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('cosmetic');
    expect(result?.product.code).toBe('3600540123456');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toEqual(
      expect.stringContaining('world.openbeautyfacts.org'),
    );
  });

  it('retourne null si OFF et OBF ne trouvent rien', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('not found', { status: 404 }))
      .mockResolvedValueOnce(new Response('not found', { status: 404 }));

    const result = await fetchProductMultiSource('0000000000000');
    expect(result).toBeNull();
  });
});

describe('fetchProductCategoriesTags', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retourne le tableau complet de categories_tags (racine → spécifique)', async () => {
    const tags = ['en:foods', 'en:dairies', 'en:cookies'];
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 1,
          product: { categories_tags: tags },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchProductCategoriesTags('5449000000996');
    expect(result).toEqual(tags);
  });

  it('retourne [] quand categories_tags est absent ou que la requête échoue', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      // Cas 1 : produit trouvé mais sans categories_tags.
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 1, product: {} }), {
          status: 200,
        }),
      )
      // Cas 2 : 404 — produit non trouvé.
      .mockResolvedValueOnce(new Response('not found', { status: 404 }));

    const a = await fetchProductCategoriesTags('1');
    const b = await fetchProductCategoriesTags('2');
    expect(a).toEqual([]);
    expect(b).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('fetchProductPackagings', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('demande `packagings` et non le champ hérité `packaging_tags`', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 1, product: { packagings: [] } }), {
        status: 200,
      }),
    );

    await fetchProductPackagings('3274080005003');
    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain('fields=packagings');
    expect(url).not.toContain('packaging_tags');
  });

  it('retourne les composants avec matériau, forme et contact alimentaire', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 1,
          product: {
            packagings: [
              {
                material: 'en:pet-1-polyethylene-terephthalate',
                shape: 'en:bottle',
                food_contact: 1,
                weight_measured: 20.24,
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    expect(await fetchProductPackagings('3274080005003')).toEqual([
      {
        material: 'en:pet-1-polyethylene-terephthalate',
        shape: 'en:bottle',
        food_contact: 1,
      },
    ]);
  });

  it('ne retombe JAMAIS sur packaging_tags quand packagings est absent', async () => {
    // R6. Ces tags sont ceux, réels, de la bouteille Cristaline : ils
    // annoncent une canette en aluminium sur une bouteille en PET. Mieux vaut
    // aucune section qu'une section fausse.
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 1,
          product: {
            packaging_tags: ['en:aluminium-can', 'en:hdpefilm-packet'],
          },
        }),
        { status: 200 },
      ),
    );

    expect(await fetchProductPackagings('3274080005003')).toEqual([]);
  });

  it('retourne [] quand le produit est introuvable ou que la requête échoue', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 0 }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response('not found', { status: 404 }));

    expect(await fetchProductPackagings('1')).toEqual([]);
    expect(await fetchProductPackagings('2')).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('normalizeOFFProduct — emballage', () => {
  // La charge utile contient déjà `packagings[]` : on cessait simplement de la
  // lire. Sans ce mappage, les écrans de classement noteraient la formulation
  // seule et afficheraient une note différente de celle de la fiche.
  it('conserve les composants d’emballage de la charge utile', () => {
    const product = normalizeOFFProduct({
      code: '3274080005003',
      product_name: 'Cristaline',
      packagings: [
        {
          material: 'en:pet-1-polyethylene-terephthalate',
          shape: 'en:bottle',
          food_contact: 1,
          weight_measured: 20.24,
        },
      ],
    });

    expect(product.packaging_components).toEqual([
      {
        material: 'en:pet-1-polyethylene-terephthalate',
        shape: 'en:bottle',
        food_contact: 1,
      },
    ]);
  });

  it('renvoie une liste vide — jamais undefined — quand packagings est absent', () => {
    // Le cache Supabase déclare la colonne NOT NULL DEFAULT '[]'.
    expect(normalizeOFFProduct({ code: '1' }).packaging_components).toEqual([]);
  });

  it('ne déduit JAMAIS l’emballage du champ hérité `packaging`', () => {
    // `packaging` est du texte libre notoirement faux ; il reste exposé tel
    // quel mais ne doit alimenter aucun calcul.
    const product = normalizeOFFProduct({
      code: '1',
      packaging: 'Canette,Aluminium',
    });
    expect(product.packaging_components).toEqual([]);
    expect(product.packaging_material).toBe('Canette,Aluminium');
  });
});

/**
 * S1b — la compatibilité reçoit ses propres sources, la note garde la sienne.
 *
 * Charge utile RÉELLE du Nutella 3017620422003 (Open Food Facts, licence ODbL,
 * relevée le 29 octobre 2026) : la langue principale de la fiche est
 * l'anglais, et son texte, tronqué, se réduit à « sugar, palm oil ». Le texte
 * français, complet, n'était jamais lu, et `allergens_tags` était jeté.
 */
describe('normalizeOFFProduct — sources des allergènes (S1b)', () => {
  const NUTELLA = {
    code: '3017620422003',
    product_name: 'Nutella',
    lang: 'en',
    ingredients_text: 'sugar, palm oil',
    ingredients_text_fr:
      'Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines [SOJA), vanilline. Sans gluten.',
    allergens_tags: ['en:milk', 'en:nuts', 'en:soybeans'],
  };

  it('garde le texte français à part : ingredients_raw reste le texte principal', () => {
    const product = normalizeOFFProduct(NUTELLA);
    expect(product.ingredients_raw).toBe('sugar, palm oil');
    expect(product.ingredients_text_fr).toBe(NUTELLA.ingredients_text_fr);
  });

  it('conserve allergens_tags tels que la source les donne', () => {
    expect(normalizeOFFProduct(NUTELLA).allergens_tags).toEqual([
      'en:milk',
      'en:nuts',
      'en:soybeans',
    ]);
    // Un tag saisi hors taxonomie passe aussi : c'est le moteur, pas le
    // parseur, qui l'ignore (table un pour un des 14 tags canoniques).
    const saisieLibre = { ...NUTELLA, allergens_tags: ['en:milk', 'nl:Milch'] };
    expect(normalizeOFFProduct(saisieLibre).allergens_tags).toEqual(['en:milk', 'nl:Milch']);
  });

  // Les deux formes réelles d'une fiche sans texte français : le champ absent, et
  // le champ vide — c'est ainsi qu'OFF sert 20005726 (texte bulgare seulement).
  it.each([
    ['champ absent', { code: '1', ingredients_text: 'eau' }],
    ['champ vide', { code: '20005726', ingredients_text: 'вода', ingredients_text_fr: '' }],
    ['champ blanc', { code: '1', ingredients_text: 'eau', ingredients_text_fr: '  ' }],
  ])('sans texte français (%s) : null, et sans tags : liste vide', (_cas, payload) => {
    // Le cache Supabase déclare `allergens_tags` NOT NULL DEFAULT '{}' (migration 017).
    const product = normalizeOFFProduct(payload);
    expect(product.ingredients_text_fr).toBeNull();
    expect(product.allergens_tags).toEqual([]);
  });

  it("écarte d'allergens_tags tout ce qui n'est pas une chaîne", () => {
    // Charge utile JSON telle qu'un contributeur pourrait la produire : HORS
    // contrat, d'où `unknown` puis une conversion explicite.
    const brut: unknown = JSON.parse(
      '{"code": "1", "allergens_tags": ["en:milk", 42, null, "en:eggs"]}',
    );
    expect(normalizeOFFProduct(brut as OFFProduct).allergens_tags).toEqual(['en:milk', 'en:eggs']);
  });

  it('la note ne change pas : productToScoringInput ignore les deux champs', () => {
    const product = normalizeOFFProduct(NUTELLA);
    const sansSources = { ...product, ingredients_text_fr: null, allergens_tags: [] };
    expect(productToScoringInput(product)).toEqual(productToScoringInput(sansSources));
    expect(productToScoringInput(product).ingredients_raw).toBe('sugar, palm oil');
  });
});
