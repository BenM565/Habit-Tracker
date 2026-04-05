# Habit Tracker

A mobile habit tracking app built with React Native (Expo) and SQLite via Drizzle ORM, developed for the IS4447 Mobile Application Development assignment.

---

## Features

### Core
- **User Authentication** — Register, login, logout, and delete profile. Passwords hashed with SHA-256 before storage.
- **Habit Management** — Create, view, edit, and delete habits. Each habit belongs to a category and has an optional notes field.
- **Categories** — Five built-in categories (Health, Learning, Fitness, Productivity, Mindfulness), each colour-coded.
- **Targets** — Set weekly targets per habit. Progress bars show remaining / met / exceeded states.
- **Search & Filter** — Filter habits by name (text search), category, and streak threshold (7+ days vs under 7).
- **Insights Dashboard** — Daily / weekly / monthly bar chart (react-native-gifted-charts), category breakdown, weekly target progress, top streaks.
- **Completion Logging** — Mark habits complete each day; logs stored in SQLite for historical analysis.
- **Streak Tracking** — Daily streaks calculated from completion logs and displayed per habit.
- **Seed Data** — Database seeded automatically on first launch with a demo user, 5 categories, 6 habits, and 30 days of completion history.

### Advanced
- **Light / Dark Mode** — Theme toggle in Profile tab; preference persisted across restarts via AsyncStorage.
- **External API Integration** — Motivational quote fetched from [API Ninjas Quotes API](https://api-ninjas.com/api/quotes) and displayed on the Home screen with loading and error states. API key stored in `.env` (not committed).
- **Local Notifications** — Scheduled daily reminders using `expo-notifications`. Choose from 5 time slots in the Profile tab. Preference persisted in AsyncStorage.
- **Weekly Streak Tracking** — Consecutive weeks where a habit met its weekly target, calculated from stored completion logs. Displayed in the Insights screen.
- **CSV Data Export** — Export all completion logs to a CSV file from the Profile tab, shared via the device's native share sheet.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Routing | Expo Router (file-based) |
| Database | SQLite via `expo-sqlite` |
| ORM | Drizzle ORM |
| Auth | AsyncStorage session + SHA-256 hashing (`expo-crypto`) |
| Charts | `react-native-gifted-charts` |
| Notifications | `expo-notifications` |
| File export | `expo-file-system` + `expo-sharing` |
| Theme | React Context + AsyncStorage |
| Testing | Jest 29 |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your device or Android emulator

### Install

```bash
git clone <repo-url>
cd HabitTracker
npm install
```

### Environment (optional — for live quotes)

```bash
cp .env.example .env
# Edit .env and replace your_api_key_here with a free key from api-ninjas.com
```

If no API key is provided, a built-in fallback quote is shown.

### Run

```bash
npx expo start
```

Then press `a` for Android emulator or scan the QR code with Expo Go.

> **Note:** `npx expo run:android` requires Java 17 or 21. This project uses Expo Go to avoid native builds.

---

## Demo Credentials

The database is seeded automatically on first launch:

| Field | Value |
|---|---|
| Email | `demo@habits.com` |
| Password | `demo123` |

To reset the database, clear Expo Go's app data:  
**Settings → Apps → Expo Go → Storage → Clear Data**

---

## Running Tests

```bash
npm test
```

Three test suites, 18 tests total:

| File | Type | What it tests |
|---|---|---|
| `__tests__/seed.test.ts` | Unit | Seed data helpers — category map, habit builder, target builder |
| `__tests__/FormField.test.tsx` | Component | FormField label, error state, border colour, prop forwarding |
| `__tests__/HomeScreen.test.tsx` | Integration | Habit filtering by name/category, completion counting, summary text |

---

## Project Structure

```
app/
  _layout.tsx          # Root layout — auth context, theme provider, notifications
  (auth)/              # Login and register screens
  (tabs)/              # Main tab screens: Home, Search, Insights, Profile
  add-habit.tsx        # Add new habit screen
  habit/[id].tsx       # Habit detail screen
  habit/[id]/edit.tsx  # Edit habit screen
components/
  FormField.tsx        # Reusable labelled text input with error display
  QuoteWidget.tsx      # Motivational quote from external API
db/
  schema.ts            # Drizzle table definitions
  client.ts            # SQLite client + schema initialisation
  queries.ts           # All database queries (CRUD + joins + streak logic)
  seed.ts              # Demo data seeded on first launch
theme/
  ThemeContext.tsx     # Light/dark colour palette + toggle
utils/
  notifications.ts     # Schedule/cancel local notification reminders
__tests__/             # Jest test suites
```

---

## AI Usage

This project was developed with the assistance of Claude (Anthropic) as a coding assistant. AI was used to:
- Scaffold Drizzle ORM schema and query patterns
- Implement the authentication flow and password hashing
- Generate the weekly streak calculation algorithm
- Debug Expo Go / Java version compatibility issues

All code was reviewed, understood, and integrated by the developer.
