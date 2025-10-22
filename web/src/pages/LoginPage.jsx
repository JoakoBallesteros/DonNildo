import LoginForm from "../components/pages/LoginForm";
import logo from "../img/LogoDonNildo.png";


export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#154734] font-sans">
  <div className="flex items-center justify-center gap-20"> 
    {/* LOGO */}
    <div className="flex-1 flex items-center justify-center p-2">
      <div>
        <img
          src={logo}
          alt="Logo Reciclados Nildo"
          className="object-contain rounded-full w-[500px] h-[500px]"
        />
      </div>
    </div>

    {/* FORMULARIO */}
    <div className="bg-white rounded-xl shadow-lg p-10 w-[500px]  h-[500px] flex flex-col gap-2 justify-center mb-2">
      <h1 className="text-2xl font-bold text-[#154734] text-center">
        Ingresar al sistema
      </h1>
      <p className="text-gray-600 text-center mb-12 align-center">
        Ingrese su usuario y contraseña
      </p>
      <LoginForm />
      </div>
    </div>
  </div>

  );
}
