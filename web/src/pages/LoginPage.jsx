import LoginForm from "../components/pages/LoginForm.jsx";
import logo from "../img/LogoDonNildo.png";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#154734] flex items-center justify-center px-4">
      <div className="grid w-full max-w-6xl grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Logo (oculto en mobile) */}
        <div className="hidden md:flex items-center justify-center">
          <div className="rounded-full bg-white/10 p-4">
            <img
              src={logo}
              alt="Logo Reciclados Nildo"
              className="w-[360px] h-[360px] xl:w-[480px] xl:h-[480px] aspect-square object-contain rounded-full"
              loading="eager"
            />
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 w-full max-w-[520px] mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#154734] text-center">
            Ingresar al sistema
          </h1>
          <p className="text-gray-600 text-center mt-2 mb-8">
            Ingrese su usuario y contraseña
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
