/**
 * Politique de Confidentialité — Vivo / LYXIRIA.
 *
 * Texte statique long. Pas de GlassCard (R9) — fond cream, séparateurs subtils.
 * 12 articles RGPD (art. 6, 9, 15-21).
 * Version 1.0 — dernière mise à jour 3 mai 2026.
 */

import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
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

interface TableProps {
  headers: readonly string[];
  rows: ReadonlyArray<readonly string[]>;
  flex?: readonly number[];
}

function Table({ headers, rows, flex }: TableProps) {
  const cols = headers.length;
  const flexValues = flex ?? Array.from({ length: cols }, () => 1);

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        {headers.map((h, i) => (
          <Text
            key={`h-${i}`}
            style={[styles.tableHeaderCell, { flex: flexValues[i] ?? 1 }]}
          >
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, rowIdx) => (
        <View
          key={`r-${rowIdx}`}
          style={[
            styles.tableRow,
            rowIdx === rows.length - 1 ? styles.tableRowLast : null,
          ]}
        >
          {row.map((cell, i) => (
            <Text
              key={`c-${rowIdx}-${i}`}
              style={[styles.tableCell, { flex: flexValues[i] ?? 1 }]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function PrivacyScreen() {
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
              <Text style={styles.screenTitle}>Politique de Confidentialité</Text>
              <Text style={styles.screenSubtitle}>
                Dernière mise à jour : 3 mai 2026 — Version 1.0
              </Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={{ gap: 0 }}>
            <Article title="ARTICLE 1 — Responsable du traitement">
              <Paragraph>
                Le responsable du traitement des données personnelles est :
              </Paragraph>
              <Paragraph>
                LYXIRIA — Hector Volant, micro-entrepreneur{'\n'}
                Paris, France{'\n'}
                SIRET en cours d&apos;attribution{'\n'}
                Contact : support@lyxiria.com
              </Paragraph>
              <Paragraph>
                LYXIRIA s&apos;engage à respecter le Règlement Général sur la Protection des
                Données (RGPD — Règlement UE 2016/679) et la loi Informatique et Libertés (loi
                n°&nbsp;78-17 du 6 janvier 1978 modifiée).
              </Paragraph>
            </Article>

            <Article title="ARTICLE 2 — Données collectées">
              <Paragraph>LYXIRIA collecte uniquement les données suivantes :</Paragraph>
              <Table
                headers={['Donnée', 'Catégorie', 'Caractère']}
                flex={[1.4, 1.2, 0.9]}
                rows={[
                  ['Adresse email', 'Compte', 'Obligatoire'],
                  ['Mot de passe (hashé)', 'Compte', 'Obligatoire'],
                  ['Date de création du compte', 'Compte', 'Automatique'],
                  [
                    'Profil santé (allergies, grossesse, diabète, etc.)',
                    'Donnée de santé (RGPD art. 9)',
                    'Optionnel',
                  ],
                  ['Historique de scans (code-barres, date, score)', 'Usage', 'Automatique'],
                  ['Favoris', 'Usage', 'Optionnel'],
                  ['Streak, badges, gamification', 'Usage', 'Automatique'],
                  ['Consentement CGU (date + version)', 'Conformité', 'Automatique'],
                  ['Signalements de produits', 'Contribution', 'Optionnel'],
                  ['Erreurs techniques anonymisées', 'Diagnostic', 'Automatique (Sentry)'],
                ]}
              />
              <Paragraph>
                Le profil santé est considéré comme une donnée sensible au sens de l&apos;article
                9 du RGPD. Sa saisie est strictement optionnelle et son traitement repose sur le
                consentement explicite de l&apos;utilisateur (art. 9.2.a RGPD).
              </Paragraph>
            </Article>

            <Article title="ARTICLE 3 — Données NON collectées">
              <Paragraph>LYXIRIA ne collecte jamais :</Paragraph>
              <Bullet>la géolocalisation de l&apos;utilisateur,</Bullet>
              <Bullet>les contacts du téléphone,</Bullet>
              <Bullet>
                les photos de la galerie ou les images prises au scan (le scan n&apos;enregistre
                que le code-barres décodé, jamais l&apos;image),
              </Bullet>
              <Bullet>
                les données financières (numéros de carte bancaire, IBAN) — celles-ci sont gérées
                exclusivement par Stripe / Apple / Google,
              </Bullet>
              <Bullet>les données comportementales en dehors de l&apos;Application,</Bullet>
              <Bullet>les identifiants publicitaires (IDFA / AAID).</Bullet>
              <Paragraph>
                Aucune donnée n&apos;est revendue à des tiers. Aucune donnée n&apos;est utilisée à
                des fins publicitaires.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 4 — Finalités du traitement">
              <Paragraph>Les données collectées sont utilisées exclusivement pour :</Paragraph>
              <Bullet>
                1. Fournir le service : authentification, calcul du score personnalisé,
                historique, favoris, suggestions d&apos;alternatives.
              </Bullet>
              <Bullet>
                2. Améliorer l&apos;Application : analyse des erreurs techniques anonymisées via
                Sentry pour corriger les bugs.
              </Bullet>
              <Bullet>
                3. Communiquer : envoi d&apos;emails transactionnels (création de compte,
                réinitialisation du mot de passe).
              </Bullet>
              <Bullet>
                4. Respecter nos obligations légales : conservation de la preuve de consentement
                aux CGU.
              </Bullet>
              <Paragraph>
                Les données ne sont jamais utilisées pour du profilage publicitaire ni revendues.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 5 — Base légale du traitement (RGPD art. 6 et 9)">
              <Table
                headers={['Finalité', 'Base légale']}
                flex={[1.3, 1]}
                rows={[
                  ['Création et gestion du compte', 'Exécution du contrat (art. 6.1.b RGPD)'],
                  ['Profil santé', 'Consentement explicite (art. 9.2.a RGPD)'],
                  [
                    'Historique, favoris, gamification',
                    'Exécution du contrat (art. 6.1.b RGPD)',
                  ],
                  ['Diagnostic d’erreurs Sentry', 'Intérêt légitime (art. 6.1.f RGPD)'],
                  [
                    'Conservation de la preuve de consentement',
                    'Obligation légale (art. 6.1.c RGPD)',
                  ],
                  ['Abonnement Premium', 'Exécution du contrat (art. 6.1.b RGPD)'],
                ]}
              />
            </Article>

            <Article title="ARTICLE 6 — Hébergement et sous-traitants">
              <Paragraph>
                Les données sont hébergées et traitées par les sous-traitants suivants, tous
                engagés contractuellement à respecter le RGPD :
              </Paragraph>
              <Table
                headers={['Sous-traitant', 'Service', 'Localisation']}
                flex={[1.1, 1.4, 1]}
                rows={[
                  ['Supabase Inc.', 'Base de données, authentification', 'Irlande (UE)'],
                  ['Vercel Inc.', 'Hébergement web', 'Union Européenne'],
                  [
                    'Stripe Payments Europe Ltd.',
                    'Paiements Premium web',
                    'Irlande (UE)',
                  ],
                  [
                    'Apple / Google',
                    'Paiements Premium mobile',
                    'Conditions propres aux stores',
                  ],
                  [
                    'Sentry (Functional Software Inc.)',
                    'Diagnostic d’erreurs anonymisées',
                    'États-Unis (DPF UE/US)',
                  ],
                  [
                    'Open Food Facts / Open Beauty Facts',
                    'Base produits ouverte (ODbL)',
                    'Union Européenne',
                  ],
                ]}
              />
              <Paragraph>
                Toutes les données utilisateur identifiantes sont hébergées au sein de l&apos;Union
                Européenne (Irlande). Sentry reçoit uniquement des données techniques anonymisées
                (pas d&apos;email, pas d&apos;adresse IP, pas de code-barres scannés).
              </Paragraph>
            </Article>

            <Article title="ARTICLE 7 — Durée de conservation">
              <Table
                headers={['Donnée', 'Durée']}
                flex={[1.1, 1.4]}
                rows={[
                  [
                    'Compte actif',
                    'Pendant la durée d’utilisation de l’Application',
                  ],
                  [
                    'Compte inactif',
                    '3 ans à compter du dernier accès, puis suppression automatique',
                  ],
                  [
                    'Compte supprimé par l’utilisateur',
                    'Suppression sous 30 jours maximum',
                  ],
                  [
                    'Preuve de consentement aux CGU',
                    '3 ans après suppression du compte (obligation légale)',
                  ],
                  [
                    'Données de paiement',
                    'Aucune donnée stockée par LYXIRIA — gérées par Stripe / Apple / Google',
                  ],
                  ['Logs Sentry', '90 jours maximum'],
                ]}
              />
            </Article>

            <Article title="ARTICLE 8 — Droits de l'utilisateur (RGPD art. 15 à 21)">
              <Paragraph>
                L&apos;utilisateur dispose des droits suivants sur ses données personnelles :
              </Paragraph>
              <Bullet>
                Droit d&apos;accès (art. 15) : obtenir une copie de toutes ses données.
              </Bullet>
              <Bullet>
                Droit de rectification (art. 16) : corriger ses données inexactes ou incomplètes.
              </Bullet>
              <Bullet>
                Droit à l&apos;effacement (art. 17) : supprimer son compte et toutes les données
                associées.
              </Bullet>
              <Bullet>
                Droit à la limitation (art. 18) : suspendre temporairement le traitement.
              </Bullet>
              <Bullet>
                Droit à la portabilité (art. 20) : recevoir ses données dans un format structuré
                et lisible (JSON).
              </Bullet>
              <Bullet>
                Droit d&apos;opposition (art. 21) : s&apos;opposer à un traitement spécifique
                fondé sur l&apos;intérêt légitime.
              </Bullet>
              <Bullet>
                Droit de retirer son consentement : à tout moment, notamment pour le profil santé.
              </Bullet>
              <Paragraph>
                Pour exercer ces droits, contactez : support@lyxiria.com. La réponse sera
                apportée sous un délai maximum d&apos;un mois (art. 12 RGPD).
              </Paragraph>
              <Paragraph>
                En cas de désaccord, l&apos;utilisateur peut introduire une réclamation auprès de
                la CNIL :
              </Paragraph>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={[styles.paragraph, { flex: 1 }]}>
                  Site web :{' '}
                  <Text
                    accessibilityRole="link"
                    style={styles.link}
                    onPress={() => {
                      void Linking.openURL('https://www.cnil.fr/fr/plaintes');
                    }}
                  >
                    https://www.cnil.fr/fr/plaintes
                  </Text>
                </Text>
              </View>
              <Bullet>
                Adresse : 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
              </Bullet>
            </Article>

            <Article title="ARTICLE 9 — Suppression du compte">
              <Paragraph>
                L&apos;utilisateur peut supprimer son compte à tout moment depuis l&apos;écran
                «&nbsp;Paramètres&nbsp;» de l&apos;Application. La suppression entraîne :
              </Paragraph>
              <Bullet>
                l&apos;effacement de l&apos;adresse email, du mot de passe et du profil santé,
              </Bullet>
              <Bullet>
                l&apos;effacement de l&apos;historique de scans, des favoris, des badges et de la
                streak,
              </Bullet>
              <Bullet>la suppression irréversible du compte sous 30 jours maximum.</Bullet>
              <Paragraph>
                Conformément à l&apos;article 17.3 du RGPD, certaines données peuvent être
                conservées au-delà de cette durée pour respecter une obligation légale (preuve de
                consentement aux CGU, conservée 3 ans).
              </Paragraph>
            </Article>

            <Article title="ARTICLE 10 — Sécurité">
              <Paragraph>
                LYXIRIA met en œuvre les mesures techniques et organisationnelles suivantes :
              </Paragraph>
              <Bullet>chiffrement des mots de passe (bcrypt / scrypt),</Bullet>
              <Bullet>chiffrement des communications réseau (HTTPS / TLS 1.2 minimum),</Bullet>
              <Bullet>
                isolation des données par utilisateur via Row Level Security (RLS) au niveau de
                la base de données,
              </Bullet>
              <Bullet>accès aux données restreint au strict nécessaire,</Bullet>
              <Bullet>sauvegardes régulières et chiffrées des données,</Bullet>
              <Bullet>monitoring des erreurs et tentatives d&apos;intrusion via Sentry.</Bullet>
              <Paragraph>
                En cas de violation de données susceptible d&apos;engendrer un risque élevé pour
                les droits des utilisateurs, LYXIRIA s&apos;engage à notifier la CNIL dans un
                délai de 72 heures et à informer les utilisateurs concernés sans délai (art. 33 et
                34 RGPD).
              </Paragraph>
            </Article>

            <Article title="ARTICLE 11 — Cookies et traceurs">
              <Paragraph>L&apos;Application mobile n&apos;utilise pas de cookies.</Paragraph>
              <Paragraph>
                Le site web (page d&apos;accueil) utilise uniquement des cookies strictement
                nécessaires au fonctionnement (session) — aucun cookie de mesure d&apos;audience,
                aucun cookie publicitaire, aucun traceur tiers.
              </Paragraph>
            </Article>

            <Article title="ARTICLE 12 — Modification de la Politique et contact">
              <Paragraph>
                LYXIRIA se réserve le droit de modifier la présente Politique de Confidentialité.
                Toute modification substantielle sera notifiée à l&apos;utilisateur via
                l&apos;Application et / ou par email.
              </Paragraph>
              <Paragraph>
                Pour toute question relative à la protection de vos données personnelles :
              </Paragraph>
              <Bullet>Email : support@lyxiria.com</Bullet>
              <Bullet>
                Délégué à la protection des données (DPO) : Hector Volant, support@lyxiria.com
              </Bullet>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={[styles.paragraph, { flex: 1 }]}>
                  Autorité de contrôle : CNIL —{' '}
                  <Text
                    accessibilityRole="link"
                    style={styles.link}
                    onPress={() => {
                      void Linking.openURL('https://www.cnil.fr');
                    }}
                  >
                    https://www.cnil.fr
                  </Text>
                </Text>
              </View>
            </Article>
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <Pressable
            onPress={() => router.push('/settings/cgu')}
            accessibilityRole="link"
            accessibilityLabel="Voir aussi : CGU"
            style={styles.crossLink}
          >
            <Text style={styles.crossLinkText}>Voir aussi : CGU</Text>
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
  link: {
    color: Colors.sage,
    textDecorationLine: 'underline',
    fontFamily: 'Inter-SemiBold',
  },
  table: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(139,173,139,0.25)',
    overflow: 'hidden',
    backgroundColor: 'rgba(139,173,139,0.04)',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(139,173,139,0.18)',
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(139,173,139,0.10)',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeaderCell: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  tableCell: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
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
