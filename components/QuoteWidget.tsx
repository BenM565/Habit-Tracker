import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const API_KEY = process.env.EXPO_PUBLIC_QUOTES_API_KEY ?? '';

type Quote = { quote: string; author: string };

export default function QuoteWidget() {
  const { colors } = useTheme();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuote();
  }, []);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API_KEY || API_KEY === 'your_api_key_here') {
        // Fallback quote when no API key is configured
        setQuote({ quote: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' });
        return;
      }
      const res = await fetch('https://api.api-ninjas.com/v1/quotes?category=fitness', {
        headers: { 'X-Api-Key': API_KEY },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Quote[] = await res.json();
      if (data.length > 0) setQuote(data[0]);
    } catch (e) {
      setError('Could not load quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: 10, padding: 16,
      marginBottom: 20, borderLeftWidth: 4, borderLeftColor: colors.primary,
    }}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{error}</Text>
          <TouchableOpacity onPress={fetchQuote}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : quote ? (
        <>
          <Text style={{ fontSize: 13, color: colors.subtext, fontStyle: 'italic', marginBottom: 6 }}>
            "{quote.quote}"
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>— {quote.author}</Text>
            <TouchableOpacity onPress={fetchQuote}>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>New quote</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
}
