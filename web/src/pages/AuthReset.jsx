import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client using Vite env vars.  Make sure VITE_SUPABASE_URL
// and VITE_SUPABASE_ANON_KEY are defined in your `.env` for the React app.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);


export default function AuthReset() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Determine where to send the user after a successful reset.  You can
  // customise this URL to match your own login route.
  const redirectTo = '/login?reset=ok';

  useEffect(() => {
    // Extract the code query parameter from the URL.  Supabase appends
    // `?code=...` to the redirect URL in the password‑reset email.
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      setError('El enlace de restablecimiento no es válido o está incompleto.');
      setReady(true);
      return;
    }
    // Exchange the code for a temporary session.  This call also creates
    // an authenticated Supabase session in the client, which is required
    // for `updateUser` to succeed.
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchError }) => {
      if (exchError) {
        setError(
          exchError.message ||
            'No pudimos validar el enlace. Es posible que haya expirado.'
        );
      }
      setReady(true);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    // Attempt to update the user's password.  Supabase requires the user
    // to be authenticated (via exchangeCodeForSession) for this to work.
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message || 'No se pudo actualizar la contraseña.');
      return;
    }
    setMessage(
      '¡Contraseña actualizada! Serás redirigido al inicio de sesión en un momento.'
    );
    // Redirect to the login page after a short delay to allow the user to
    // read the success message.  Adjust the timeout as desired.
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 1500);
  };

  // Show a loading indicator while we exchange the code.  This prevents the
  // form from showing before we know whether the code was valid.
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-green-800">
          Restablecer contraseña
        </h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {message && <p className="text-green-700 mb-4">{message}</p>}
        {/* Only show the form if we have no success message yet. */}
        {!message && (
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 text-white font-semibold rounded-lg transition-colors ${
                loading
                  ? 'bg-green-700 opacity-70 cursor-not-allowed'
                  : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {loading ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}