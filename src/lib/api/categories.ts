import type { CategoryDef } from './types';

// Icônes Lucide vérifiées dans node_modules/lucide-react-native v1.8. Fallback `Package` / `Sparkles` / `Circle` si catégorie ambiguë.
export const CATEGORIES: CategoryDef[] = [
  // Alimentation (13)
  { slug: 'boissons', name: 'Boissons', emoji: '🥤', icon: 'Coffee', off_tag: 'beverages', obf_tag: null, type: 'food' },
  { slug: 'laitages', name: 'Laitages', emoji: '🥛', icon: 'Milk', off_tag: 'dairies', obf_tag: null, type: 'food' },
  { slug: 'cereales-petit-dej', name: 'Céréales p.-déj', emoji: '🥣', icon: 'Wheat', off_tag: 'breakfast-cereals', obf_tag: null, type: 'food' },
  { slug: 'snacks-sales', name: 'Snacks salés', emoji: '🥨', icon: 'UtensilsCrossed', off_tag: 'salty-snacks', obf_tag: null, type: 'food' },
  { slug: 'biscuits-sucres', name: 'Biscuits sucrés', emoji: '🍪', icon: 'Cookie', off_tag: 'biscuits', obf_tag: null, type: 'food' },
  { slug: 'plats-prepares', name: 'Plats préparés', emoji: '🍱', icon: 'ChefHat', off_tag: 'meals', obf_tag: null, type: 'food' },
  { slug: 'pates-riz', name: 'Pâtes & Riz', emoji: '🍝', icon: 'Soup', off_tag: 'pastas', obf_tag: null, type: 'food' },
  { slug: 'sauces', name: 'Sauces', emoji: '🥫', icon: 'Soup', off_tag: 'sauces', obf_tag: null, type: 'food' },
  { slug: 'chocolats', name: 'Chocolats', emoji: '🍫', icon: 'Candy', off_tag: 'chocolates', obf_tag: null, type: 'food' },
  { slug: 'conserves', name: 'Conserves', emoji: '🥫', icon: 'Archive', off_tag: 'canned-foods', obf_tag: null, type: 'food' },
  { slug: 'charcuterie', name: 'Charcuterie', emoji: '🥓', icon: 'Beef', off_tag: 'meats', obf_tag: null, type: 'food' },
  { slug: 'fromages', name: 'Fromages', emoji: '🧀', icon: 'Slice', off_tag: 'cheeses', obf_tag: null, type: 'food' },
  { slug: 'pains', name: 'Pains', emoji: '🥖', icon: 'Wheat', off_tag: 'breads', obf_tag: null, type: 'food' },

  // Cosmétiques (13)
  { slug: 'shampoings', name: 'Shampoings', emoji: '🧴', icon: 'Droplet', off_tag: null, obf_tag: 'shampoos', type: 'cosmetic' },
  { slug: 'apres-shampoings', name: 'Après-shampoings', emoji: '💧', icon: 'Droplet', off_tag: null, obf_tag: 'hair-conditioners', type: 'cosmetic' },
  { slug: 'gels-douche', name: 'Gels douche', emoji: '🛁', icon: 'Bath', off_tag: null, obf_tag: 'shower-gels', type: 'cosmetic' },
  { slug: 'savons', name: 'Savons', emoji: '🧼', icon: 'Bath', off_tag: null, obf_tag: 'soaps', type: 'cosmetic' },
  { slug: 'deodorants', name: 'Déodorants', emoji: '🌿', icon: 'SprayCan', off_tag: null, obf_tag: 'deodorants', type: 'cosmetic' },
  { slug: 'cremes-visage', name: 'Crèmes visage', emoji: '🧴', icon: 'Sparkles', off_tag: null, obf_tag: 'face-creams', type: 'cosmetic' },
  { slug: 'serums', name: 'Sérums', emoji: '💎', icon: 'Sparkles', off_tag: null, obf_tag: 'serums', type: 'cosmetic' },
  { slug: 'cremes-solaires', name: 'Crèmes solaires', emoji: '☀️', icon: 'Sun', off_tag: null, obf_tag: 'sunscreens', type: 'cosmetic' },
  { slug: 'baumes-levres', name: 'Baumes lèvres', emoji: '💋', icon: 'Sparkles', off_tag: null, obf_tag: 'lip-balms', type: 'cosmetic' }, // fallback Sparkles (pas d'icône lèvre nette)
  { slug: 'dentifrices', name: 'Dentifrices', emoji: '🦷', icon: 'Sparkles', off_tag: null, obf_tag: 'toothpastes', type: 'cosmetic' }, // fallback Sparkles (pas de Tooth stable)
  { slug: 'maquillage-teint', name: 'Maquillage teint', emoji: '💄', icon: 'Sparkles', off_tag: null, obf_tag: 'foundations', type: 'cosmetic' }, // fallback Sparkles
  { slug: 'mascaras', name: 'Mascaras', emoji: '👁️', icon: 'Eye', off_tag: null, obf_tag: 'mascaras', type: 'cosmetic' },
  { slug: 'soins-bebe', name: 'Soins bébé', emoji: '👶', icon: 'Baby', off_tag: null, obf_tag: 'baby-care', type: 'cosmetic' },
];

export function getCategoryBySlug(slug: string): CategoryDef | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getCategoriesByType(type: 'food' | 'cosmetic'): CategoryDef[] {
  return CATEGORIES.filter((c) => c.type === type);
}

export function getAllCategories(): CategoryDef[] {
  return CATEGORIES;
}
