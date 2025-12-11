
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supa } from "../../lib/supabaseClient";

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    
    supa.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("[ProtectedRoute] Error getSession:", error.message);
          setSession(null);
        } else {
          setSession(data.session);
        }
        setLoading(false);
      });

   
    const { data: subscription } = supa.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
      }
    );

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Verificando sesión…
      </div>
    );
  }


  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

 
  return <Outlet />;
}