import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '@/features/auth/api';

/**
 * Handles OAuth callback (e.g. Twitter redirect flow). Reads token from query,
 * stores it, then closes popup (postMessage to opener) or navigates to /.
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      if (window.opener) {
        window.opener.postMessage({ type: 'auth', error: 'missing_token' }, window.location.origin);
        window.close();
      } else {
        navigate('/login', { replace: true });
      }
      return;
    }
    setToken(token);
    if (window.opener) {
      window.opener.postMessage({ type: 'auth', token }, window.location.origin);
      window.close();
    } else {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
