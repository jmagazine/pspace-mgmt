import { Button } from "@/components/ui/Button";

import LoginPage from "@/pages/LoginPage";
import CalendarPage from "@/pages/CalendarPage";

function App() {
  return (
    <h1 className="text-2xl font-bold text-center my-4">
      P-Space Reservations
      {/* <LoginPage /> */}
      <CalendarPage />
    </h1>
  );
}

export default App;
