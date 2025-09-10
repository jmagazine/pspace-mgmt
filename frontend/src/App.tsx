import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/LoginPage";
import CalendarPage from "@/pages/CalendarPage";

// Component to handle authentication-based routing
const AuthRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/calendar" replace /> : <LoginPage />}
      />
      <Route
        path="/calendar"
        element={user ? <CalendarPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/"
        element={<Navigate to={user ? "/calendar" : "/login"} replace />}
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <AuthRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
