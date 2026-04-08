import LoginForm from "../components/pages/LoginForm.jsx";
import logo from "../img/LogoHydroPack.png";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #060d1f 0%, #0b1a38 40%, #102354 100%)',
      }}
    >
      {/* Ambient glow blobs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #22d3ee, transparent 65%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3a6fd4, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 md:grid-cols-2 gap-10 items-center">

        {/* Brand side */}
        <div className="hidden md:flex flex-col items-center justify-center gap-6">
          <img
            src={logo}
            alt="Logo HydroPack"
            className="w-[280px] h-[280px] xl:w-[360px] xl:h-[360px] object-contain drop-shadow-2xl"
            loading="eager"
          />
          <div className="text-center">
            <h1
              className="text-5xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              HydroPack
            </h1>
            <p className="mt-2 text-lg" style={{ color: '#67e8f9' }}>
              Sistema de gestión integral
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-[520px] mx-auto"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(96,165,250,0.15)',
          }}
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 md:hidden">
            <img src={logo} alt="HydroPack" className="w-20 h-20 object-contain" />
          </div>

          <h1
            className="text-2xl md:text-3xl font-bold text-center"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--hp-navy-900, #0b1a38)' }}
          >
            Ingresar al sistema
          </h1>
          <p className="text-slate-500 text-center mt-2 mb-8 text-sm">
            Ingrese su usuario y contraseña
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
