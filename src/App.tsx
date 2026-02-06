import { GoogleOAuthProvider } from '@react-oauth/google';
import { Providers } from './Providers';
import { AppRoutes } from './routes';

const googleClientId = (import.meta as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env
  ?.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId || 'placeholder.apps.googleusercontent.com'}>
      <Providers>
        <AppRoutes />
      </Providers>
    </GoogleOAuthProvider>
  );
}

export default App;
