import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.tsx'

if (import.meta.env.VITE_COGNITO_USER_POOL_ID && !import.meta.env.VITE_COGNITO_USER_POOL_ID.includes("YOUR_")) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      }
    }
  });
} else {
  console.warn("Amplify not configured. Missing valid VITE_COGNITO_USER_POOL_ID in .env.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
