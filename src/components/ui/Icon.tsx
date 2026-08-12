/**
 * Icon — wrapper unique au-dessus de `lucide-react-native`.
 *
 * Pourquoi : avant ce composant, les icônes étaient posées à la main avec des
 * valeurs ad hoc (`size={22} strokeWidth={2.2}`, `size={20} strokeWidth={2.4}`,
 * `size={22} strokeWidth={2.2}`…). Trois tailles, cinq graisses de trait, aucune
 * cohérence → l'œil lit un patchwork au lieu d'un système.
 *
 * Ici : 3 tailles, un `strokeWidth` unique de 1.75 (plus fin = plus premium que
 * le 2.2 précédent), et une couleur qui ne peut être qu'un token de la palette.
 *
 * Registre curé : chaque icône est importée explicitement. Ajouter une entrée
 * au registre est un acte volontaire — c'est ce qui empêche l'inventaire
 * d'icônes de dériver. Un `name` absent est une erreur de compilation.
 */

import {
  // — Navigation & chrome —
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Lock,
  Minus,
  Plus,
  Search,
  X,
  // — Actions —
  Bell,
  Camera,
  Check,
  Edit3,
  RotateCcw,
  ScanLine,
  Share2,
  Trash2,
  // — Domaine botanique & produit —
  BookHeart,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CupSoda,
  Droplet,
  Leaf,
  Package,
  Pill,
  Recycle,
  Sprout,
  Utensils,
  // — Statistiques & gamification —
  Award,
  BarChart3,
  Flame,
  Medal,
  PartyPopper,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  // — Statut & alerte —
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  Siren,
  // — Compte & contenu —
  Clock,
  FileText,
  Heart,
  Sparkles,
  Store,
  User,
  Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Palette } from '@/src/constants/theme';
import type { PaletteToken } from '@/src/constants/theme';

/** Trois tailles, pas une de plus. */
export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSizeToken = keyof typeof IconSize;

const REGISTRY = {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Lock,
  Minus,
  Plus,
  Search,
  X,

  Bell,
  Camera,
  Check,
  Edit3,
  RotateCcw,
  ScanLine,
  Share2,
  Trash2,

  BookHeart,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CupSoda,
  Droplet,
  Leaf,
  Package,
  Pill,
  Recycle,
  Sprout,
  Utensils,

  Award,
  BarChart3,
  Flame,
  Medal,
  PartyPopper,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,

  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  Siren,

  Clock,
  FileText,
  Heart,
  Sparkles,
  Store,
  User,
  Users,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof REGISTRY;

/** Noms disponibles, exposé pour les tests et l'outillage. */
export const ICON_NAMES = Object.keys(REGISTRY) as IconName[];

interface IconProps {
  name: IconName;
  /** `sm` 16 · `md` 20 (défaut) · `lg` 24 */
  size?: IconSizeToken;
  /** Token de palette uniquement — aucun hex en dur au call-site (R6). */
  color?: PaletteToken;
  strokeWidth?: number;
  /**
   * Absent = icône décorative, masquée aux lecteurs d'écran (le libellé
   * textuel adjacent porte déjà l'information).
   */
  accessibilityLabel?: string;
  /**
   * Pas de `testID` : `lucide-react-native` le convertit en `data-testid`, que
   * react-native-svg ignore. Exposer ce prop reviendrait à promettre une API
   * morte. Pour cibler une icône en test, passer par `accessibilityLabel` ou
   * par le conteneur parent.
   */
}

export function Icon({
  name,
  size = 'md',
  color = 'forest',
  strokeWidth = 1.75,
  accessibilityLabel,
}: IconProps) {
  const Glyph = REGISTRY[name];
  const decorative = accessibilityLabel === undefined;

  return (
    <Glyph
      size={IconSize[size]}
      color={Palette[color]}
      strokeWidth={strokeWidth}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    />
  );
}
