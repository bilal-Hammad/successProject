import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const MAX_CHARS = 4000;

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

type Props = {
  visible: boolean;
  date: string;
  habitColor: string;
  initialNote?: string;
  onClose: () => void;
  onSave: (note: string) => void;
};

export function AddNoteModal({ visible, date, habitColor, initialNote = '', onClose, onSave }: Props) {
  const [note, setNote] = useState(initialNote);
  const [time] = useState(fmtTime());

  useEffect(() => {
    if (visible) setNote(initialNote);
  }, [visible, initialNote]);

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Dim overlay */}
      <Pressable style={an.overlay} onPress={onClose} />

      <View style={an.sheet}>
        {/* Handle */}
        <View style={an.handle} />

        {/* Header */}
        <View style={an.header}>
          <Pressable onPress={onClose} style={an.closeBtn} hitSlop={10}>
            <Text style={an.closeX}>✕</Text>
          </Pressable>
          <Text style={an.title}>Add Note</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Text style={an.menuDots}>···</Text>
            <Pressable
              onPress={handleSave}
              style={[an.saveBtn, { backgroundColor: habitColor }]}
              hitSlop={8}
            >
              <Text style={an.saveBtnText}>✓</Text>
            </Pressable>
          </View>
        </View>

        {/* Note input */}
        <ScrollView style={an.inputWrap} keyboardShouldPersistTaps="handled">
          <TextInput
            value={note}
            onChangeText={(t) => setNote(t.slice(0, MAX_CHARS))}
            placeholder="Note"
            placeholderTextColor="#C7C7CC"
            multiline
            textAlignVertical="top"
            style={an.input}
            autoFocus
            maxLength={MAX_CHARS}
          />
          <Text style={an.charCount}>{note.length}/{MAX_CHARS}</Text>

          {/* Date / time row */}
          <View style={an.metaRow}>
            <Text style={an.calIcon}>📅</Text>
            <View style={[an.chip, { backgroundColor: '#F2F2F7' }]}>
              <Text style={an.chipText}>{fmtDate(date)}</Text>
            </View>
            <View style={[an.chip, { backgroundColor: '#F2F2F7' }]}>
              <Text style={an.chipText}>{time}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const an = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(60,60,67,0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(60,60,67,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { fontSize: 14, color: '#3C3C43' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  menuDots: { fontSize: 20, color: '#8E8E93', fontWeight: '700' },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  inputWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  input: {
    fontSize: 17,
    color: '#1C1C1E',
    minHeight: 120,
    lineHeight: 24,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  calIcon: { fontSize: 20 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
});
