import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export default function FormField({ label, error, style, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: colors.text }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            padding: 12,
            borderRadius: 8,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: 15,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={{ fontSize: 12, color: colors.danger, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}
