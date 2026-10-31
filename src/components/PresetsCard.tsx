import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Button, Card, Field, Hint, Row } from '@/components/ui';
import { useToolkit } from '@/components/ToolkitContext';
import { colors } from '@/theme';

/** Saved profit presets with save / load / delete and JSON download + upload (web). */
export function PresetsCard() {
  const { presets, savePreset, loadPreset, deletePreset, reset, importPresets } = useToolkit().profit;
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  return (
    <Card title="Saved presets">
      <Row>
        <Field label="Preset name" keyboardType="default" value={name} onChangeText={setName} placeholder="e.g. Hoodie – summer" />
      </Row>
      <Row>
        <Button
          label="Save preset"
          onPress={() => {
            if (savePreset(name)) setName('');
          }}
        />
        <Button label="Reset" variant="ghost" onPress={reset} />
      </Row>
      {Platform.OS === 'web' && (
        <Row>
          <Button
            label="Download presets"
            variant="ghost"
            onPress={() => {
              if (presets.length === 0) return setMessage('Nothing to download yet.');
              const blob = new Blob([JSON.stringify({ presets }, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'profit-presets.json';
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          />
          <Button
            label="Upload presets"
            variant="ghost"
            onPress={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'application/json,.json';
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                try {
                  const n = importPresets(JSON.parse(await file.text()));
                  setMessage(`Imported ${n} preset${n === 1 ? '' : 's'}.`);
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : 'Could not read file.');
                }
              };
              input.click();
            }}
          />
        </Row>
      )}
      {message !== '' && <Hint>{message}</Hint>}
      {presets.length === 0 ? (
        <Hint>No presets yet. Saved presets stay on this device.</Hint>
      ) : (
        presets.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Pressable onPress={() => loadPreset(p.id)} style={{ flex: 1 }} accessibilityRole="button">
              <Text style={{ color: colors.text, fontWeight: '600' }}>{p.name}</Text>
            </Pressable>
            <Pressable onPress={() => deletePreset(p.id)} accessibilityRole="button" accessibilityLabel={`Delete ${p.name}`}>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}
    </Card>
  );
}
