-- 007_swap_seed.sql
-- Seed 10 catégories de Smart Swaps + règles de déclenchement par mots-clés.

WITH upserts AS (
  INSERT INTO public.swap_categories (category_name_fr, swap_type, brut_alternatives, display_order)
  VALUES
    ('Boissons sucrées', 'brut',
     '[
       {"emoji": "💧", "name": "Eau pétillante + citron", "why": "Hydratation, zéro sucre, zéro additif"},
       {"emoji": "🍵", "name": "Thé vert glacé maison", "why": "Antioxydants naturels, sans sirop"},
       {"emoji": "🫖", "name": "Infusion menthe-gingembre", "why": "Digestion, aucune calorie ajoutée"},
       {"emoji": "🥛", "name": "Kéfir de fruits maison", "why": "Probiotiques vivants, microbiote"},
       {"emoji": "🍋", "name": "Citronnade pressée", "why": "Vitamine C naturelle, pas de colorant"}
     ]'::jsonb, 1),

    ('Céréales petit-déjeuner', 'brut',
     '[
       {"emoji": "🥣", "name": "Flocons d''avoine nature", "why": "NOVA 1, fibres solubles, IG bas"},
       {"emoji": "🌰", "name": "Muesli maison (avoine + noix)", "why": "Pas de sucre ajouté, satiété durable"},
       {"emoji": "🍯", "name": "Porridge au miel brut", "why": "Énergie lente, sans additifs"},
       {"emoji": "🥥", "name": "Granola maison à l''huile d''olive", "why": "Bonnes graisses, sans huile de palme"}
     ]'::jsonb, 2),

    ('Snacks salés', 'brut',
     '[
       {"emoji": "🥜", "name": "Amandes nature", "why": "Magnésium, bonnes graisses, NOVA 1"},
       {"emoji": "🌰", "name": "Noix mélangées non salées", "why": "Oméga-3, rassasiantes"},
       {"emoji": "🥕", "name": "Bâtonnets de légumes + houmous", "why": "Fibres, protéines végétales"},
       {"emoji": "🍅", "name": "Tomates cerises + mozzarella", "why": "Lycopène, protéines de qualité"},
       {"emoji": "🫒", "name": "Olives nature", "why": "Graisses mono-insaturées, NOVA 1"}
     ]'::jsonb, 3),

    ('Confiseries & bonbons', 'brut',
     '[
       {"emoji": "🍇", "name": "Raisins secs bio", "why": "Sucre naturel + fibres, pas de colorants"},
       {"emoji": "🍑", "name": "Abricots moelleux non soufrés", "why": "Sans conservateur E220"},
       {"emoji": "🍫", "name": "Chocolat noir 85%+", "why": "Peu de sucre, polyphénols"},
       {"emoji": "🌿", "name": "Dattes Medjool", "why": "Sucre naturel, minéraux, NOVA 1"}
     ]'::jsonb, 4),

    ('Plats préparés', 'brut',
     '[
       {"emoji": "🍚", "name": "Riz complet + légumes vapeur", "why": "Base NOVA 1, personnalisable"},
       {"emoji": "🥔", "name": "Patate douce rôtie + œuf", "why": "Index glycémique bas, protéines complètes"},
       {"emoji": "🍳", "name": "Omelette aux herbes fraîches", "why": "5 minutes, aucun additif"},
       {"emoji": "🥗", "name": "Buddha bowl (quinoa + avocat)", "why": "Protéines + fibres + bonnes graisses"}
     ]'::jsonb, 5),

    ('Sauces & condiments', 'brut',
     '[
       {"emoji": "🫒", "name": "Huile d''olive extra-vierge + citron", "why": "Vinaigrette minute, polyphénols"},
       {"emoji": "🧄", "name": "Purée d''ail + herbes fraîches", "why": "Goût puissant, 0 additif"},
       {"emoji": "🍯", "name": "Moutarde à l''ancienne pure", "why": "Ingrédients simples, pas de sucre caché"},
       {"emoji": "🌶️", "name": "Salsa tomate fraîche maison", "why": "Lycopène, vitamines, NOVA 1"}
     ]'::jsonb, 6),

    ('Produits laitiers sucrés', 'brut',
     '[
       {"emoji": "🥛", "name": "Yaourt nature + fruits frais", "why": "Sucre naturel uniquement, probiotiques"},
       {"emoji": "🍯", "name": "Skyr + miel + noix", "why": "Protéines élevées, index glycémique bas"},
       {"emoji": "🥥", "name": "Yaourt coco maison + graines de chia", "why": "Sans additifs, oméga-3"},
       {"emoji": "🍓", "name": "Fromage blanc 0% + fraises écrasées", "why": "Sucre naturel, rassasiant"}
     ]'::jsonb, 7),

    ('Biscuits & gâteaux', 'brut',
     '[
       {"emoji": "🥜", "name": "Energy balls dattes-noix", "why": "Aucun sucre ajouté, NOVA 1"},
       {"emoji": "🍌", "name": "Banana bread maison", "why": "Sucre des fruits, contrôle des ingrédients"},
       {"emoji": "🍪", "name": "Cookies avoine-chocolat 85%", "why": "IG modéré, moins de 10g de sucre"},
       {"emoji": "🥥", "name": "Mugcake à la banane + œuf", "why": "3 ingrédients, prêt en 2 minutes"}
     ]'::jsonb, 8),

    ('Charcuterie', 'brut',
     '[
       {"emoji": "🐟", "name": "Sardines à l''huile d''olive", "why": "Oméga-3, pas de nitrites"},
       {"emoji": "🥚", "name": "Œufs durs + herbes", "why": "Protéines complètes, NOVA 1"},
       {"emoji": "🍗", "name": "Blanc de poulet rôti maison", "why": "Sans conservateurs, sans sel ajouté"},
       {"emoji": "🫛", "name": "Houmous de pois chiches", "why": "Protéines végétales, fibres"}
     ]'::jsonb, 9),

    ('Glaces & desserts glacés', 'brut',
     '[
       {"emoji": "🍌", "name": "Nice cream banane congelée", "why": "1 ingrédient, zéro sucre ajouté"},
       {"emoji": "🍓", "name": "Sorbet minute fruits rouges", "why": "Mixer 2 min, aucun additif"},
       {"emoji": "🥭", "name": "Mangue congelée + yaourt grec", "why": "Créméux naturel, sans stabilisant"},
       {"emoji": "🍫", "name": "Glace chocolat avocat maison", "why": "Bonnes graisses, pas de lécithine"}
     ]'::jsonb, 10)
  RETURNING id, category_name_fr
)
-- Règles de déclenchement : mots-clés dans le nom/catégorie du produit scanné.
INSERT INTO public.swap_rules (trigger_keywords, trigger_nova_min, swap_category_id)
SELECT keywords, 3, id FROM upserts
CROSS JOIN LATERAL (
  VALUES
    ('Boissons sucrées', ARRAY['soda', 'cola', 'limonade', 'boisson', 'sirop', 'energy', 'ice tea', 'nectar', 'jus']),
    ('Céréales petit-déjeuner', ARRAY['céréales', 'cereales', 'muesli', 'granola', 'corn flakes', 'chocapic', 'miel pops', 'frosties']),
    ('Snacks salés', ARRAY['chips', 'crackers', 'tuc', 'pringles', 'biscuits apéritif', 'cacahuètes grillées', 'bretzel', 'maïs soufflé']),
    ('Confiseries & bonbons', ARRAY['bonbon', 'haribo', 'dragibus', 'fraise tagada', 'chewing', 'sucette', 'guimauve', 'réglisse']),
    ('Plats préparés', ARRAY['lasagne', 'pizza', 'quiche', 'plat cuisiné', 'micro-ondes', 'surgelé', 'ready meal', 'raviolis']),
    ('Sauces & condiments', ARRAY['ketchup', 'mayonnaise', 'sauce', 'vinaigrette', 'moutarde', 'barbecue', 'pesto industriel']),
    ('Produits laitiers sucrés', ARRAY['yaourt sucré', 'danette', 'crème dessert', 'actimel', 'fromage blanc aux fruits', 'liégeois', 'petit filous']),
    ('Biscuits & gâteaux', ARRAY['biscuit', 'gâteau', 'madeleine', 'prince', 'bn', 'pepito', 'petit beurre', 'goûter', 'brioche industrielle']),
    ('Charcuterie', ARRAY['jambon', 'saucisson', 'saucisse', 'bacon', 'lardons', 'chorizo', 'pâté', 'rillettes', 'mortadelle']),
    ('Glaces & desserts glacés', ARRAY['glace', 'magnum', 'cornet', 'bâtonnet', 'sorbet industriel', 'crème glacée'])
) AS mapping(cat_name, keywords)
WHERE mapping.cat_name = upserts.category_name_fr;
