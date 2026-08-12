/**
 * ConglomerateSection — affiche la maison-mère d'une marque résolue via Wikidata.
 *
 * Loading skeleton ~1-2s pendant la résolution (REST wbsearchentities + SPARQL).
 * Si owner trouvé : nom + drapeau emoji du pays + lien tap vers Wikidata.
 * Si pas de pays (countryCode === null) : nom seul, pas de drapeau (R3 plan).
 * Si rien trouvé OU brand vide : `null` (la section n'apparaît pas).
 *
 * Cache module-level dans `conglomerate.ts` — pas de re-fetch sur navigation.
 */

import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Building2, ExternalLink } from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import {
  countryCodeToFlag,
  getConglomerateOwner,
  type ConglomerateInfo,
} from '@/src/lib/api/conglomerate';

interface ConglomerateSectionProps {
  brandName: string | null | undefined;
}

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'resolved'; info: ConglomerateInfo }
  | { kind: 'empty' };

export function ConglomerateSection({ brandName }: ConglomerateSectionProps) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  useEffect(() => {
    if (!brandName || brandName.trim().length === 0) {
      setState({ kind: 'empty' });
      return;
    }

    let cancelled = false;
    setState({ kind: 'loading' });

    getConglomerateOwner(brandName).then((info) => {
      if (cancelled) return;
      setState(info ? { kind: 'resolved', info } : { kind: 'empty' });
    });

    return () => {
      cancelled = true;
    };
  }, [brandName]);

  if (state.kind === 'idle' || state.kind === 'empty') return null;

  if (state.kind === 'loading') {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.headerRow}>
          <Building2 color={Colors.text} size={18} strokeWidth={2.2} />
          <Text style={styles.title}>Maison-mère</Text>
        </View>
        <View style={styles.skeleton}>
          <View style={[styles.skelBar, { width: '60%' }]} />
          <View style={[styles.skelBar, { width: '35%' }]} />
        </View>
      </GlassCard>
    );
  }

  const { info } = state;
  const flag = countryCodeToFlag(info.countryCode);
  const wikidataUrl = `https://www.wikidata.org/wiki/${info.ownerWikidataId}`;

  function openWikidata() {
    Linking.openURL(wikidataUrl).catch(() => undefined);
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Building2 color={Colors.text} size={18} strokeWidth={2.2} />
        <Text style={styles.title}>Maison-mère</Text>
      </View>

      <View style={styles.ownerRow}>
        <Text style={styles.ownerName}>{info.ownerName}</Text>
        {flag ? <Text style={styles.flag}>{flag}</Text> : null}
      </View>

      {info.countryName ? (
        <Text style={styles.countryName}>{info.countryName}</Text>
      ) : null}

      <Pressable
        onPress={openWikidata}
        accessibilityRole="link"
        accessibilityLabel="Voir la fiche sur Wikidata"
        hitSlop={6}
        style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.65 }]}
      >
        <ExternalLink color={Colors.sage} size={13} strokeWidth={2.2} />
        <Text style={styles.linkText}>Voir sur Wikidata</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ownerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
    flexShrink: 1,
  },
  flag: {
    fontSize: 22,
  },
  countryName: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  linkText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.sageVivid,
    letterSpacing: 0.2,
  },
  skeleton: {
    gap: 8,
    marginTop: 4,
  },
  skelBar: {
    height: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
  },
});
