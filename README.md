# OMEGA

## Локально
1. `npm install`
2. Создай `.env` по образцу `.env.example` (ключи Firebase)
3. `npm run dev`

## Настройка Firebase (один раз, проект omega-ba479)
- Authentication → Sign-in method → включить **Email/Password**
- Authentication → Settings → **Authorized domains** → добавить домен Vercel (`твой-проект.vercel.app`)
- Firestore Database → Create database (Production mode)
- Firestore → Rules → вставить содержимое `firestore.rules` → Publish

## Публикация на Vercel
1. Залей проект на GitHub (файл `.env` НЕ коммитится — он в `.gitignore`).
2. vercel.com → Add New → Project → выбери репозиторий (Framework: Vite определится сам).
3. Settings → Environment Variables → добавь 4 переменные из `.env.example`:
   `VITE_FB_API_KEY`, `VITE_FB_AUTH_DOMAIN`, `VITE_FB_PROJECT_ID`, `VITE_FB_APP_ID`
4. Deploy (при добавлении переменных после первого деплоя — сделай Redeploy).
