import { useState } from "react";
import CalendarComponent from "@/components/ui/CalendarComponent";
import type { Reservation } from "@/reservation/Reservation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

const CalendarPage = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const { user, logout } = useAuth();

  const updateReservations = async (
    startDateTime: string,
    endDateTime: string
  ) => {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/reservations?start=${startDateTime}&end=${endDateTime}`
    );
    const data = await response.json();
    console.log(data);

    // Sort reservations by start time
    const sortedReservations = (data["reservations"] || []).sort(
      (a: Reservation, b: Reservation) => {
        const dateA = new Date(a.startDateTime);
        const dateB = new Date(b.startDateTime);
        return dateA.getTime() - dateB.getTime();
      }
    );

    setReservations(sortedReservations);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will happen automatically when user state changes
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">
            Welcome, {user?.displayName}
          </h1>
          <span className="text-sm text-gray-500">({user?.email})</span>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </Button>
      </div>
      <CalendarComponent
        reservations={reservations}
        updateReservations={updateReservations}
      />
    </div>
  );
};

export default CalendarPage;
