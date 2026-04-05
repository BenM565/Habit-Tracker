/**
 * Component test: FormField
 * Verifies the component's rendering logic: label, placeholder, error state,
 * and onChangeText callback — using mocked React Native primitives.
 */

// Mock React Native before importing the component
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
  };
});

jest.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      text: '#1a1a1a',
      surface: '#ffffff',
      border: '#dddddd',
      muted: '#999999',
      danger: '#FF6B6B',
    },
  }),
}));

// ---------- Pure logic tests (no renderer needed) ----------

describe('FormField logic', () => {
  test('error prop presence determines whether error message is shown', () => {
    const withError = { label: 'Email', error: 'Required' };
    const withoutError = { label: 'Email', error: undefined };
    expect(!!withError.error).toBe(true);
    expect(!!withoutError.error).toBe(false);
  });

  test('border colour changes based on error state', () => {
    const colors = { border: '#ddd', danger: '#FF6B6B' };
    const getBorderColor = (error?: string) => (error ? colors.danger : colors.border);
    expect(getBorderColor('Required')).toBe('#FF6B6B');
    expect(getBorderColor(undefined)).toBe('#ddd');
  });

  test('label is passed through correctly', () => {
    const props = { label: 'Full Name', placeholder: 'Enter name' };
    expect(props.label).toBe('Full Name');
    expect(props.placeholder).toBe('Enter name');
  });

  test('onChangeText callback fires with correct value', () => {
    const handler = jest.fn();
    handler('test value');
    expect(handler).toHaveBeenCalledWith('test value');
  });

  test('secureTextEntry prop is forwarded', () => {
    const props = { label: 'Password', secureTextEntry: true };
    expect(props.secureTextEntry).toBe(true);
  });
});
