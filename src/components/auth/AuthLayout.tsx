import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="https://fixturlaser.com/wp-content/uploads/2021/05/ACOEM-LOGO-WithoutBaseline-CMYK-Bicolor-768x237.png"
            alt="Acoem Logo"
            className="h-20 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            ACOEM Daily Engineer Activity
          </h1>
          <p className="text-blue-100">
            Track and manage your engineering activities
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
