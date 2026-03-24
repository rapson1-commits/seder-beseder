# 🏠 סדר בסדר — Full Stack App

עושים סדר בחגים המשפחתיים

## מה יש כאן
- Next.js 14 (App Router)
- Supabase (Auth + Database)
- Tailwind CSS
- RTL Hebrew, mobile-first PWA

## 🚀 העלאה לאינטרנט — 4 צעדים

### 1. הכן את מסד הנתונים
1. כנס ל-[supabase.com](https://supabase.com) → צור פרויקט חדש
2. לך ל-SQL Editor → הדבק את כל התוכן מ-`schema.sql` → לחץ RUN
3. לך ל-Authentication → Providers → הפעל Google
4. לך ל-Settings → API → שמור את ה-URL ואת ה-anon key

### 2. הגדר משתני סביבה
העתק את הקובץ:
```bash
cp .env.example .env.local
```
ערוך את `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. העלה ל-GitHub
1. כנס ל-[github.com](https://github.com) → New repository → `seder-beseder`
2. גרור את כל התיקייה לתוך הריפו

### 4. פרוס ב-Vercel
1. כנס ל-[vercel.com](https://vercel.com) → New Project
2. בחר את ה-repository
3. הוסף את משתני הסביבה (מה-.env.local)
4. לחץ Deploy → בעוד 3 דקות יש לך קישור!

## 📱 הרצה מקומית
```bash
npm install
npm run dev
```
פתח [http://localhost:3000](http://localhost:3000)

## 🗂️ מבנה הקוד
```
src/
  app/
    page.tsx          ← דף כניסה
    home/             ← דף הבית
    members/          ← רשימת בני משפחה
    members/[id]/     ← פרופיל אישי
    history/          ← היסטוריית חגים
    events/[id]/      ← פרטי אירוע + מי מביא מה
    events/new/       ← הוספת אירוע
    insights/         ← תובנות חכמות
    settings/         ← הגדרות
    setup/            ← צירוף למשפחה
  components/
    ui/               ← רכיבי UI
    layout/           ← ניווט תחתון
  lib/
    supabase.ts       ← חיבור לסופאבייס
    db.ts             ← שאילתות
  types/
    index.ts          ← הגדרות טיפוסים
```

## 💡 שאלות? 
פתח שיחה חדשה עם Claude ושאל!
