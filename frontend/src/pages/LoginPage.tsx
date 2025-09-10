import { Button } from "../components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await login();
      // Navigation will happen automatically when user state changes
    } catch (err) {
      console.error("❌ Google login failed:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            P-Space Reservations
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your reservations
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
