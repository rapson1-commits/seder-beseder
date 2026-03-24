# סדר בסדר — Production Readiness Roadmap

> Features and improvements needed before this app can be considered production-ready.
> Items are grouped by category and sorted by impact.

---

## 🔐 Authentication & Security

| # | Feature | Why it matters |
|---|---------|----------------|
| 1 | **Rate-limit invite code lookups** | Brute-force protection — someone could enumerate all 8-char codes |
| 2 | **Single-use / expiring invite links** | `family_invitations` table already added; wire it up so each invite expires after 7 days or first use |
| 3 | **Email magic-link login** | Google OAuth is great, but some users (elderly family members) may prefer email |
| 4 | **Admin transfer** | Currently admins are set manually; add a UI for an admin to promote another member |
| 5 | **Session refresh on idle** | `@supabase/ssr` handles this in middleware, but add a client-side idle timeout warning |

---

## 🗄️ Data & Database

| # | Feature | Why it matters |
|---|---------|----------------|
| 6 | **Run `schema.sql` migrations in CI** | Prevent drift between code and DB schema; use Supabase CLI `db push` |
| 7 | **Soft-delete for events** | Add `is_deleted BOOLEAN DEFAULT FALSE` to events — currently `deleteEvent()` hard-deletes |
| 8 | **Audit log** | Add an `audit_log` table (`user_id`, `action`, `table_name`, `record_id`, `created_at`) so admins can see who changed what |
| 9 | **Pagination on events** | `getEvents()` loads everything. Add cursor-based pagination (`order by gregorian_date, limit 20, after_cursor`) |
| 10 | **Backup / export** | Let admins export family data as JSON or CSV |

---

## ✅ Forms & Validation

| # | Feature | Why it matters |
|---|---------|----------------|
| 11 | **Duplicate member detection** | Warn when a member with the same first+last name already exists in the family |
| 12 | **Hebrew date field** | Add a Hebrew date picker (event `hebrew_date` column already exists in DB) |
| 13 | **Image upload for members** | Profile photos stored in Supabase Storage; fallback to initials avatar |
| 14 | **Event capacity / headcount** | Add `max_guests` field to events for planning purposes |

---

## 🔔 Notifications & Engagement

| # | Feature | Why it matters |
|---|---------|----------------|
| 15 | **Web push notifications** | Remind members about upcoming events (service worker + VAPID keys) |
| 16 | **WhatsApp share button** | Deep-link: `wa.me/?text=הצטרף+לסדר+בסדר+עם+הקוד+${inviteCode}` |
| 17 | **Email reminders via Supabase Edge Functions** | Send weekly digest or event reminders via Resend/SendGrid |
| 18 | **Birthday reminders** | Add `birthday DATE` to `family_members`; surface upcoming birthdays on home screen |

---

## 🧪 Testing

| # | Feature | Why it matters |
|---|---------|----------------|
| 19 | **Unit tests for `lib/validation.ts`** | Every validator should have passing/failing test cases (use Vitest) |
| 20 | **Unit tests for `lib/db.ts`** | Mock Supabase client; test `getInsights()` logic with sample data |
| 21 | **E2E tests with Playwright** | Cover the critical flows: sign-in → setup → add member → create event → view history |
| 22 | **Add `typecheck` to CI** | `tsc --noEmit` should run on every PR |

---

## 📱 UX & Performance

| # | Feature | Why it matters |
|---|---------|----------------|
| 23 | **Offline support (PWA)** | Service worker + cache strategy so the family list loads without internet |
| 24 | **Optimistic UI updates** | Delete/update should reflect instantly; rollback on error |
| 25 | **SWR / React Query** | Replace manual `useState` + `useEffect` data fetching with a caching layer |
| 26 | **Search members** | Filter bar on `/members` to find a specific person quickly in large families |
| 27 | **Dark mode** | Minimal effort — CSS variables are already in place |
| 28 | **Error boundary** | Wrap the app shell in a React error boundary so unhandled errors show a friendly message instead of a blank screen |

---

## 🌍 Multi-Family & Permissions

| # | Feature | Why it matters |
|---|---------|----------------|
| 29 | **Fine-grained permissions** | Currently only `is_admin` boolean; consider: `viewer`, `editor`, `admin` roles per family |
| 30 | **Event editor role** | Allow non-admins to create events but not delete them |
| 31 | **Read-only family link** | Generate a link that lets someone VIEW the family's events without joining |

---

## 🧰 Developer Experience

| # | Feature | Why it matters |
|---|---------|----------------|
| 32 | **Environment variable validation** | Crash at startup if `NEXT_PUBLIC_SUPABASE_URL` or `ANON_KEY` are missing |
| 33 | **Linting in CI** | `eslint --max-warnings 0` on every PR |
| 34 | **Supabase type generation** | `supabase gen types typescript` → replace `any` casts in `lib/db.ts` with auto-generated DB types |
| 35 | **Storybook for UI components** | Develop and review `Avatar`, `Badge`, `Toast`, `ConfirmModal` in isolation |
