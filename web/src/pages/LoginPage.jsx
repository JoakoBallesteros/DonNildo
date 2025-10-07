//Maqueta la página (dividido en dos columnas como en tu imagen, logo + form).
import LoginForm from "../components/LoginForm";
import logo from "../img/LogoDonNildo.png";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e4b37] font-sans">
     <div className="flex max-w-5xl w-[90%] bg-white rounded-xl overflow-hidden shadow-2xl">

    {/* Sección del Logo */}
    <div className="flex flex-1 bg-[#1e4b37] items-center justify-center">
      <div className="bg-black rounded-md p-4 flex items-center justify-center">
        <img src={logo} alt="Logo" className="w-60 h-60 object-contain" />
      </div>
    </div>

    {/* Sección del Formulario */}
    <div className="flex flex-1 flex-col justify-center p-10">
      <h1 className="text-2xl font-bold text-[#1e4b37] mb-2">Ingresar al sistema</h1>
      <p className="text-gray-600 mb-6">Ingrese su usuario y contraseña</p>
      <LoginForm />
    </div>

    </div>
  </div>
  );
}