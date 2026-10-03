import {initializeApp} from 'firebase/app';import {getAuth} from 'firebase/auth';import {getFirestore} from 'firebase/firestore';
const e=import.meta.env;
const cfg={apiKey:e.VITE_FB_API_KEY,authDomain:e.VITE_FB_AUTH_DOMAIN,projectId:e.VITE_FB_PROJECT_ID,appId:e.VITE_FB_APP_ID};
if(!cfg.apiKey||!cfg.projectId)throw new Error('Firebase env vars (VITE_FB_*) are missing. Add them in Vercel → Project → Settings → Environment Variables and redeploy.');
const app=initializeApp(cfg);
export const auth=getAuth(app);export const db=getFirestore(app);
