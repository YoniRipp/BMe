import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from 'next-themes';
import { Providers } from './Providers';
import { AppRoutes } from './routes';

const googleClientId = (import.meta as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env
  ?.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId || 'placeholder.apps.googleusercontent.com'}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Providers>
          <AppRoutes />
        </Providers>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
