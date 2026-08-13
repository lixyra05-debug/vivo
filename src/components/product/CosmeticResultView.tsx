import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, Leaf } from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ProductHeader } from '@/src/components/product/ProductHeader';
import {
  ScoreCircle,
  SCORE_LABEL_FORMULATION,
} from '@/src/components/product/ScoreCircle';
import { Colors, scoreColor } from '@/src/constants/colors';
import { findCosmeticIngredient } from '@/src/lib/scoring/cosmetic-ingredients-db';
import { getCosmeticProfileLabel } from '@/src/lib/scoring/cosmetic-profiles';
import type {
  CosmeticIngredientRisk,
  CosmeticProduct,
  CosmeticProfile,
  CosmeticScoringResult,
} from '@/src/lib/api/types';

interface CosmeticResultViewProps {
  product: CosmeticProduct;
  result: CosmeticScoringResult;
  profile: CosmeticProfile;
}

const RISK_COLOR: Record<CosmeticIngredientRisk, string> = {
  safe: Colors.score.green,
  caution: Colors.score.yellow,
  warning: Colors.score.orange,
  danger: Colors.score.red,
};

const RISK_LABEL: Record<CosmeticIngredientRisk, string> = {
  safe: 'Sûr',
  caution: 'Vigilance',
  warning: 'Attention',
  danger: 'Danger',
};

/**
 * Verdict cosmétique. Seuils (90 / 70 / 50 / 30) et libellés INCHANGÉS ;
 * seules les descriptions ont été réécrites en constats.
 *
 * Elles prescrivaient une conduite (« À limiter », « On cherche un
 * remplaçant ») et qualifiaient la formule en absolu (« irréprochable »,
 * « globalement saine ») alors que le score ne pèse que les ingrédients INCI
 * identifiés — pas l'emballage, pas ce que la peau tolère.
 *
 * Exporté pour être testable : c'est du contenu réglementairement sensible.
 */
export function verdictFromScore(score: number): { label: string; description: string } {
  if (score >= 90) {
    return {
      label: 'Excellent',
      description: 'Très peu de pénalités relevées sur la formule.',
    };
  }
  if (score >= 70) {
    return {
      label: 'Bon',
      description: "Peu d'ingrédients pénalisés dans la formule.",
    };
  }
  if (score >= 50) {
    return {
      label: 'Moyen',
      description: 'Plusieurs ingrédients de la formule sont pénalisés.',
    };
  }
  if (score >= 30) {
    return {
      label: 'Mauvais',
      description: 'La formule cumule de nombreux ingrédients pénalisés.',
    };
  }
  return {
    label: 'À éviter',
    description: 'La formule cumule des pénalités majeures.',
  };
}

export function CosmeticResultView({ product, result, profile }: CosmeticResultViewProps) {
  const scoreHex = scoreColor(result.score_final);
  const verdict = verdictFromScore(result.score_final);
  const topRisky = result.risky_ingredients.slice(0, 8);

  return (
    <View style={{ gap: 22 }}>
      <FadeIn delay={60}>
        <ProductHeader
          name={product.name}
          brand={product.brand}
          imageUrl={product.image_url}
          score={result.score_final}
          isOrganic={false}
          category={product.category}
        />
      </FadeIn>

      <FadeIn delay={140}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={styles.scoreHaloWrap}>
            <View style={[styles.scoreHalo, { backgroundColor: `${scoreHex}14` }]} />
            {/*
              Libellé explicite : le malus emballage ne s'applique qu'à
              l'alimentaire (le barème est sourcé sur la migration au CONTACT
              ALIMENTAIRE). Ce score reste la seule formulation, et le dit.
            */}
            <ScoreCircle
              score={result.score_final}
              size={200}
              strokeWidth={14}
              label={SCORE_LABEL_FORMULATION}
            />
          </View>
          <Text
            style={{
              fontFamily: 'BricolageGrotesque-SemiBold',
              fontSize: 20,
              color: scoreHex,
              letterSpacing: -0.3,
            }}
          >
            {verdict.label}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: Colors.textMuted,
              textAlign: 'center',
              paddingHorizontal: 24,
              lineHeight: 19,
            }}
          >
            {verdict.description}
          </Text>
          {profile !== 'standard' ? (
            <View style={styles.profileChip}>
              <Text style={styles.profileChipText}>
                Profil : {getCosmeticProfileLabel(profile)}
              </Text>
            </View>
          ) : null}
        </View>
      </FadeIn>

      {result.blockers.length > 0 ? (
        <FadeIn delay={220}>
          <GlassCard tone="danger" style={{ padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlertTriangle color={Colors.score.red} size={18} strokeWidth={2.2} />
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-SemiBold',
                  fontSize: 15,
                  color: Colors.score.red,
                }}
              >
                Bloquants détectés
              </Text>
            </View>
            <View style={{ gap: 4 }}>
              {result.blockers.map((b) => (
                <Text
                  key={b}
                  style={{ fontFamily: 'Inter', fontSize: 13, color: Colors.text }}
                >
                  • {b}
                </Text>
              ))}
            </View>
          </GlassCard>
        </FadeIn>
      ) : null}

      <FadeIn delay={300}>
        <View style={{ gap: 10 }}>
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 20,
                color: Colors.text,
                letterSpacing: -0.3,
              }}
            >
              Analyse INCI
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: Colors.textMuted,
              }}
            >
              Les ingrédients identifiés dans la formule.
            </Text>
          </View>
          {topRisky.length === 0 ? (
            <GlassCard style={{ padding: 16, gap: 10, flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.cleanIconBg}>
                <Leaf color={Colors.sage} size={20} strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 13,
                  color: Colors.text,
                  flex: 1,
                  lineHeight: 19,
                }}
              >
                Formule propre, aucun ingrédient préoccupant détecté.
              </Text>
            </GlassCard>
          ) : (
            <GlassCard style={{ padding: 14, gap: 12 }}>
              {topRisky.map((item, idx) => {
                const entry = findCosmeticIngredient(item.inci);
                const dotColor = RISK_COLOR[item.risk];
                return (
                  <View
                    key={item.inci}
                    style={[
                      styles.ingredientRow,
                      idx < topRisky.length - 1 ? styles.ingredientRowBorder : null,
                    ]}
                  >
                    <View style={[styles.riskDot, { backgroundColor: dotColor }]} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={{
                          fontFamily: 'BricolageGrotesque-SemiBold',
                          fontSize: 14,
                          color: Colors.text,
                        }}
                        numberOfLines={2}
                      >
                        {entry?.nameFr ?? item.inci}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Inter-Medium',
                          fontSize: 11,
                          color: Colors.textMuted,
                          letterSpacing: 0.4,
                        }}
                      >
                        {item.inci.toUpperCase()}
                      </Text>
                      {item.reason ? (
                        <Text
                          style={{
                            fontFamily: 'Inter',
                            fontSize: 12,
                            color: Colors.textMuted,
                            lineHeight: 17,
                            marginTop: 2,
                          }}
                        >
                          {item.reason}
                        </Text>
                      ) : null}
                    </View>
                    <View style={[styles.riskPill, { backgroundColor: `${dotColor}22` }]}>
                      <Text style={[styles.riskPillText, { color: dotColor }]}>
                        {RISK_LABEL[item.risk]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          )}
        </View>
      </FadeIn>

      {result.penalties.length > 0 ? (
        <FadeIn delay={400}>
          <View style={{ gap: 10 }}>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 20,
                  color: Colors.text,
                  letterSpacing: -0.3,
                }}
              >
                Pénalités
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: Colors.textMuted,
                }}
              >
                Les éléments qui pèsent sur la note.
              </Text>
            </View>
            <GlassCard style={{ padding: 14, gap: 10 }}>
              {result.penalties.map((p, idx) => (
                <View
                  key={`${p.code}-${idx}`}
                  style={[
                    styles.penaltyRow,
                    idx < result.penalties.length - 1 ? styles.penaltyRowBorder : null,
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 13,
                      color: Colors.text,
                      flex: 1,
                    }}
                    numberOfLines={2}
                  >
                    {p.label}
                  </Text>
                  <View style={styles.penaltyChip}>
                    <Text style={styles.penaltyChipText}>
                      -{Math.round(p.points)} pts
                    </Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </View>
        </FadeIn>
      ) : null}

      {result.profile_adjustments.length > 0 ? (
        <FadeIn delay={500}>
          <GlassCard style={{ padding: 16, gap: 6 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                fontSize: 15,
                color: Colors.text,
              }}
            >
              Ajustements liés à ton profil
            </Text>
            {result.profile_adjustments.map((a) => (
              <Text
                key={a}
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: Colors.textMuted,
                  lineHeight: 19,
                }}
              >
                • {a}
              </Text>
            ))}
          </GlassCard>
        </FadeIn>
      ) : null}

      {product.ingredients_inci ? (
        <FadeIn delay={580}>
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                fontSize: 16,
                color: Colors.text,
              }}
            >
              Liste INCI complète
            </Text>
            <GlassCard style={{ padding: 14 }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 12,
                  color: Colors.textMuted,
                  lineHeight: 18,
                }}
              >
                {product.ingredients_inci}
              </Text>
            </GlassCard>
          </View>
        </FadeIn>
      ) : null}

      <View style={{ height: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  scoreHaloWrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
  },
  profileChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F3F3EC',
  },
  profileChipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
  },
  cleanIconBg: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 10,
  },
  ingredientRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7DA',
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  riskPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  riskPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  penaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  penaltyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7DA',
  },
  penaltyChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 67, 54, 0.12)',
  },
  penaltyChipText: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 12,
    color: Colors.score.red,
  },
});
