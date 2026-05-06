/**
 * ScanChocCard — carte d'alerte partageable pour les produits mal notés.
 *
 * Format portrait 9:16 (1080×1920 export). Layout :
 *  - header "⚠️ ATTENTION"
 *  - photo produit 200×200
 *  - nom du produit (max 2 lignes)
 *  - score géant 72px /100
 *  - jusqu'à 3 lignes de problèmes (emoji + label)
 *  - section alternative optionnelle (sage)
 *  - footer "Scan tes courses sur Vivo"
 *
 * Le rendu se fait dans un <View> avec aspectRatio 9:16 + width 100%
 * pour stabiliser les dimensions de la capture (react-native-view-shot).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

export interface ScanChocProblem {
  emoji: string;
  label: string;
}

export interface ScanChocAlternative {
  name: string;
  score: number;
  imageUrl: string | null;
}

export interface ScanChocCardProps {
  productName: string;
  productImage: string | null;
  score: number;
  problems: ScanChocProblem[]; // max 3 affichés
  alternative?: ScanChocAlternative | null;
}

export function ScanChocCard({
  productName,
  productImage,
  score,
  problems,
  alternative,
}: ScanChocCardProps) {
  const visibleProblems = problems.slice(0, 3);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#DC2626', '#991B1B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.warningHeader}>⚠️ ATTENTION</Text>

        <View style={styles.imageWrap}>
          {productImage ? (
            <Image
              source={{ uri: productImage }}
              style={styles.image}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]} />
          )}
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {productName}
        </Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreSuffix}>/100</Text>
        </View>

        <View style={styles.problemsList}>
          {visibleProblems.map((problem, index) => (
            <View
              key={`${problem.emoji}-${problem.label}-${index}`}
              style={styles.problemRow}
            >
              <Text style={styles.problemEmoji}>{problem.emoji}</Text>
              <Text style={styles.problemLabel}>{problem.label}</Text>
            </View>
          ))}
        </View>

        {alternative ? (
          <View style={styles.alternativeContainer}>
            <Text style={styles.alternativeHeader}>✅ Mieux noté</Text>
            <View style={styles.alternativeRow}>
              {alternative.imageUrl ? (
                <Image
                  source={{ uri: alternative.imageUrl }}
                  style={styles.alternativeImage}
                  contentFit="contain"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View
                  style={[styles.alternativeImage, styles.imageFallback]}
                />
              )}
              <Text style={styles.alternativeName} numberOfLines={1}>
                {alternative.name}
              </Text>
              <Text style={styles.alternativeScore}>
                ({alternative.score}/100)
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.footer}>Scan tes courses sur Vivo</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    aspectRatio: 9 / 16,
    overflow: 'hidden',
    borderRadius: 24,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 28,
  },
  warningHeader: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
    alignSelf: 'center',
  },
  imageWrap: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignSelf: 'center',
    marginVertical: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  productName: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 8,
  },
  scoreNumber: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 72,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 80,
  },
  scoreSuffix: {
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 0.7,
    marginLeft: 6,
    marginBottom: 12,
  },
  problemsList: {
    marginTop: 16,
    gap: 10,
  },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  problemEmoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  problemLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  alternativeContainer: {
    backgroundColor: 'rgba(139,173,139,0.95)',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  alternativeHeader: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  alternativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alternativeImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  alternativeName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  alternativeScore: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  footer: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.7,
    alignSelf: 'center',
    marginTop: 'auto',
  },
});
