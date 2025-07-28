import { useState } from "react";
import CalendarComponent from "@/components/ui/CalendarComponent";
import type { Reservation } from "@/reservation/Reservation";

const CalendarPage = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);

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

  return (
    <CalendarComponent
      reservations={reservations}
      updateReservations={updateReservations}
    ></CalendarComponent>
  );
};

export default CalendarPage;
