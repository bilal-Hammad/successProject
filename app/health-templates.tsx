import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APPLE_HEALTH_SECTIONS, type HealthTemplate } from '../src/templates/healthTemplates';
import { isHealthKitAvailable, readTodayValue, requestHealthKitPermission } from '../src/services/HealthKitService';

export default function HealthTemplatesScreen() {
  const router = useRouter();

  const handleSelect = async (template: HealthTemplate) => {
    if (Platform.OS === 'ios') {
      const result = await requestHealthKitPermission(template.healthKitType);

      if (!result.ok) {
        // Show the actual error so it's debuggable — not a generic message
        Alert.alert('Health Access', result.reason);
        // Still navigate so the user can create the habit; sync just won't work yet
      } else {
        // initHealthKit succeeded — the permission sheet was shown (or already granted).
        // HealthKit never reveals read-permission status for privacy, so we do a
        // quick read: if it returns data we're good; if 0, the user may have denied
        // or there's simply no data recorded for today yet.
        const value = await readTodayValue(template.healthKitType);
        console.log(`[HealthKit] Post-init read for ${template.healthKitType}: ${value}`);
        if (value === 0) {
          // Can't distinguish "denied" from "no data today" — show a soft hint
          // but do NOT block navigation
          Alert.alert(
            'Health Access',
            'Permission sheet was shown. If your data doesn\'t appear, go to Settings > Health > Data Access & Devices > Momentum and enable access.',
            [{ text: 'OK', style: 'default' }],
          );
        }
      }
    }

    router.push({
      pathname: '/habit/new',
      params: {
        title: template.title,
        icon: template.emoji,
        color: '#34C759',
        habitType: 'track',
        ...(template.unit ? { unit: template.unit } : {}),
        ...(template.defaultGoal ? { goal: String(template.defaultGoal) } : {}),
        healthKitType: template.healthKitType,
      },
    });
  };

  return (
    <SafeAreaView style={ht.safe}>
      {/* Header */}
      <View style={ht.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={ht.backBtn}>
          <Text style={ht.backText}>‹</Text>
        </Pressable>
        <Text style={ht.headerTitle}>Apple Health</Text>
        <View style={ht.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ht.scroll}
      >
        {APPLE_HEALTH_SECTIONS.map((section) => (
          <View key={section.id}>
            <Text style={ht.sectionLabel}>{section.label}</Text>
            <View style={ht.card}>
              {section.templates.map((tmpl, idx) => (
                <View key={tmpl.id}>
                  <Pressable
                    onPress={() => handleSelect(tmpl)}
                    style={({ pressed }) => [ht.row, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <View style={ht.iconWrap}>
                      <Text style={ht.iconEmoji}>{tmpl.emoji}</Text>
                    </View>
                    <Text style={ht.rowLabel} numberOfLines={1}>{tmpl.title}</Text>
                    <Text style={ht.chevron}>›</Text>
                  </Pressable>
                  {idx < section.templates.length - 1 && <View style={ht.sep} />}
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ht = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#F2F2F7',
  },
  backBtn: {
    width: 44,
  },
  backText: {
    fontSize: 32,
    color: '#007AFF',
    lineHeight: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 44,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 52,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 18,
  },
  rowLabel: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
    fontWeight: '600',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 60,
  },
});
