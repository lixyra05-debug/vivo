/**
 * Conditions Générales d'Utilisation (CGU) — Vivo / LYXIRIA.
 *
 * Texte statique long. Pas de GlassCard (R9) — fond cream, séparateurs subtils.
 * Version 1.0 — dernière mise à jour 3 mai 2026.
 */

import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';

interface ArticleProps {
  title: string;
  children: ReactNode;
}

function Article({ title, children }: ArticleProps) {
  return (
    <View style={styles.article}>
      <Text style={styles.articleTitle}>{title}</Text>
      <View style={{ gap: 16 }}>{children}</View>
    </View>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={[styles.paragraph, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

export default function CguScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 22 }}>
        <FadeIn delay={0}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.backButton}
            >
              <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.screenTitle}>
                Conditions Générales d&apos;Utilisation
              </Text>
              <Text style={styles.screenSubtitle}>
                Dernière mise à jour : 3 mai 2026 — Version 1.0
              </Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={{ gap: 0 }}>
            <Article title="ARTICLE 1 — Objet">
              <Paragraph>
                Les présentes Conditions Générales d&apos;Utilisation («&nbsp;CGU&nbsp;») régissent
                l&apos;accès et l&apos;utilisation de l&apos;application mobile Vivo
                («&nbsp;l&apos;Application&nbsp;»), éditée par LYXIRIA. Vivo est une application
                d&apos;aide à la décision alimentaire et cosmétique permettant à
                l&apos;utilisateur de scanner des produits du commerce et d&apos;obtenir un score
                nutritionnel ou cosmétique calculé par notre algorithme.
              </Paragraph>
              <Paragraph>
                L&apos;utilisation de l&apos;Application implique l&apos;acceptation pleine et
                entière des présentes CGU.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 2 — Acceptation des CGU">
              <Paragraph>
                L&apos;inscription sur l&apos;Application vaut acceptation expresse et sans
                réserve des présentes CGU. L&apos;utilisateur reconnaît avoir pris connaissance de
                l&apos;ensemble du document avant de cocher la case d&apos;acceptation lors de la
                création de son compte.
              </Paragraph>
              <Paragraph>
                L&apos;utilisateur déclare être âgé de 16 ans révolus. Pour les mineurs,
                l&apos;utilisation de l&apos;Application requiert l&apos;accord préalable
                d&apos;un titulaire de l&apos;autorité parentale.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 3 — Description du service">
              <Paragraph>Vivo propose les fonctionnalités suivantes :</Paragraph>
              <Bullet>
                Scan de produits : lecture du code-barres d&apos;un produit alimentaire ou
                cosmétique pour obtenir des informations nutritionnelles et un score Vivo
                (0-100).
              </Bullet>
              <Bullet>
                Score Vivo : algorithme de scoring développé par LYXIRIA, fondé sur des pénalités
                appliquées aux additifs, à la transformation industrielle (NOVA) et aux
                ingrédients controversés. Le score est purement informatif et ne constitue ni un
                avis médical, ni une recommandation nutritionnelle individualisée, ni un
                diagnostic.
              </Bullet>
              <Bullet>
                Profil santé personnalisé : l&apos;utilisateur peut déclarer des contraintes
                (allergies, grossesse, diabète, etc.) pour ajuster les scores. Ces informations
                sont saisies à titre purement déclaratif et restent sous la responsabilité de
                l&apos;utilisateur.
              </Bullet>
              <Bullet>
                Historique de scans, favoris, gamification : l&apos;utilisateur peut consulter ses
                scans passés, marquer des favoris et débloquer des badges.
              </Bullet>
              <Bullet>
                Alternatives : suggestion de produits similaires mieux notés issus de la base
                Open Food Facts.
              </Bullet>
              <Bullet>
                Cartes éducatives : contenus pédagogiques sourcés (EFSA, ANSES, OMS, Cochrane,
                EMA) déclenchés par le scan de certains ingrédients.
              </Bullet>
              <Paragraph>
                L&apos;Application est fournie «&nbsp;telle quelle&nbsp;». LYXIRIA se réserve le
                droit de modifier, suspendre ou supprimer tout ou partie des fonctionnalités sans
                préavis.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 4 — Inscription et compte utilisateur">
              <Paragraph>La création d&apos;un compte requiert :</Paragraph>
              <Bullet>une adresse email valide,</Bullet>
              <Bullet>un mot de passe d&apos;au moins 8 caractères,</Bullet>
              <Bullet>
                l&apos;acceptation des présentes CGU et de la Politique de Confidentialité.
              </Bullet>
              <Paragraph>
                L&apos;utilisateur s&apos;engage à fournir des informations exactes et à les
                maintenir à jour. Il est seul responsable de la confidentialité de ses
                identifiants. Toute activité réalisée depuis son compte est réputée effectuée par
                lui.
              </Paragraph>
              <Paragraph>
                LYXIRIA se réserve le droit de suspendre ou supprimer tout compte en cas
                d&apos;usage frauduleux, de tentative de manipulation des données, ou de
                violation manifeste des présentes CGU.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 5 — Données produits et sources">
              <Paragraph>
                Les données affichées sur l&apos;Application proviennent de bases ouvertes :
              </Paragraph>
              <Bullet>
                Open Food Facts (https://world.openfoodfacts.org) — base collaborative sous
                licence Open Database License (ODbL) v1.0.
              </Bullet>
              <Bullet>
                Open Beauty Facts (https://world.openbeautyfacts.org) — équivalent cosmétique
                sous la même licence.
              </Bullet>
              <Paragraph>
                Ces bases sont alimentées par une communauté de contributeurs bénévoles. Bien que
                LYXIRIA mette en œuvre des contrôles de cohérence (signalements, complétude,
                badge de confiance), les informations affichées peuvent être incomplètes,
                inexactes ou non actualisées. L&apos;utilisateur est invité à vérifier
                l&apos;étiquette physique du produit avant tout achat ou consommation.
              </Paragraph>
              <Paragraph>
                Le score Vivo est calculé par LYXIRIA à partir de ces données. La méthodologie
                complète est consultable dans l&apos;écran «&nbsp;Comment ce score est
                calculé&nbsp;?&nbsp;» de l&apos;Application.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 6 — Limitation de responsabilité">
              <Paragraph>
                Vivo est un outil d&apos;information et d&apos;aide à la décision. Il ne remplace
                en aucun cas l&apos;avis d&apos;un professionnel de santé.
              </Paragraph>
              <Paragraph>LYXIRIA ne saurait être tenu responsable :</Paragraph>
              <Bullet>
                des décisions de consommation ou d&apos;achat prises par l&apos;utilisateur sur la
                base du score Vivo ou des informations affichées,
              </Bullet>
              <Bullet>
                des conséquences d&apos;une mauvaise interprétation des cartes éducatives,
              </Bullet>
              <Bullet>
                d&apos;une réaction allergique, d&apos;une intolérance ou d&apos;un effet
                indésirable lié à un produit consommé,
              </Bullet>
              <Bullet>
                des erreurs ou inexactitudes dans les données issues des bases Open Food Facts et
                Open Beauty Facts,
              </Bullet>
              <Bullet>
                d&apos;une indisponibilité temporaire de l&apos;Application liée à un incident
                technique, une opération de maintenance ou un événement de force majeure.
              </Bullet>
              <Text style={styles.boldParagraph}>
                En cas de doute sur un produit, une allergie, un régime médical ou une contrainte
                de santé, consultez un médecin, un pharmacien ou un diététicien-nutritionniste.
              </Text>
            </Article>

            <Article title="ARTICLE 7 — Propriété intellectuelle">
              <Paragraph>
                L&apos;Application, son code source, son design, ses logos, l&apos;algorithme de
                scoring Vivo, les cartes éducatives et l&apos;ensemble des contenus produits par
                LYXIRIA sont protégés par le droit d&apos;auteur et le droit des marques. Toute
                reproduction, représentation, extraction ou réutilisation, totale ou partielle,
                est interdite sans autorisation écrite préalable.
              </Paragraph>
              <Paragraph>
                Les données produits issues d&apos;Open Food Facts et Open Beauty Facts restent
                soumises à la licence ODbL v1.0.
              </Paragraph>
              <Paragraph>
                L&apos;utilisateur conserve la propriété des données qu&apos;il saisit (profil
                santé, favoris). Il accorde à LYXIRIA une licence non exclusive et gratuite
                d&apos;utilisation de ces données aux seules fins du fonctionnement de
                l&apos;Application.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 8 — Abonnement Premium">
              <Paragraph>
                L&apos;utilisation de Vivo est gratuite. Un abonnement Premium optionnel donne
                accès à des fonctionnalités avancées (alternatives premium, etc.).
              </Paragraph>
              <Paragraph>Les abonnements sont gérés via :</Paragraph>
              <Bullet>l&apos;App Store (Apple) ou le Play Store (Google) sur mobile,</Bullet>
              <Bullet>Stripe sur le web.</Bullet>
              <Paragraph>
                La résiliation s&apos;effectue directement via la plateforme de souscription,
                conformément aux conditions fixées par chacune de ces plateformes. LYXIRIA
                n&apos;a pas la faculté technique de résilier un abonnement souscrit via l&apos;App
                Store ou le Play Store.
              </Paragraph>
              <Paragraph>
                Le scan de produits, les filtres allergènes et les fonctionnalités de base
                resteront toujours gratuits.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 9 — Modification des CGU">
              <Paragraph>
                LYXIRIA se réserve le droit de modifier les présentes CGU à tout moment. Toute
                modification substantielle sera notifiée à l&apos;utilisateur via l&apos;Application
                et / ou par email. Le maintien de l&apos;utilisation de l&apos;Application après
                notification vaut acceptation des nouvelles CGU.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 10 — Droit applicable et juridiction compétente">
              <Paragraph>
                Les présentes CGU sont soumises au droit français. En cas de litige et après
                tentative de résolution amiable, les tribunaux français compétents seront seuls
                habilités à connaître du différend.
              </Paragraph>
              <Paragraph>
                Conformément au Code de la consommation, l&apos;utilisateur peut recourir à un
                médiateur de la consommation préalablement à toute action judiciaire.
              </Paragraph>
            </Article>
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <Pressable
            onPress={() => router.push('/settings/privacy')}
            accessibilityRole="link"
            accessibilityLabel="Voir aussi : Politique de Confidentialité"
            style={styles.crossLink}
          >
            <Text style={styles.crossLinkText}>
              Voir aussi : Politique de Confidentialité
            </Text>
          </Pressable>
        </FadeIn>

        <FadeIn delay={200}>
          <Text style={styles.footerLine}>
            Éditeur : LYXIRIA, Paris, France — Hector Volant, micro-entrepreneur, SIRET en cours
            d&apos;attribution. Contact : support@lyxiria.com
          </Text>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    shadowColor: '#587858',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  screenTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  article: {
    paddingTop: 24,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(139,173,139,0.18)',
    gap: 12,
  },
  articleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  paragraph: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  boldParagraph: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 4,
  },
  bulletDot: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.sage,
    lineHeight: 22,
  },
  crossLink: {
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  crossLinkText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.sage,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  footerLine: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});
