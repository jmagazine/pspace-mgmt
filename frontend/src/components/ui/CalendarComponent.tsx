import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  X,
} from "lucide-react";
import type { Reservation } from "@/reservation/Reservation";

interface ReservationFormData {
  reserver: string;
  startTime: string;
  endTime: string;
}

interface CalendarComponentProps {
  reservations: Reservation[];
  updateReservations: (startDateTime: any, endDateTime: any) => void;
}

const CalendarComponent = (props: CalendarComponentProps) => {
  // Debug logging - remove this after fixing
  console.log("CalendarComponent props.reservations:", props.reservations);
  console.log("Number of reservations:", props.reservations?.length || 0);
  if (props.reservations?.length > 0) {
    console.log("Sample reservation:", props.reservations[0]);
  }

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"weekly" | "monthly">("monthly");
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState<ReservationFormData>({
    reserver: "",
    startTime: "",
    endTime: "",
  });
  const [formError, setFormError] = useState("");
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);

  //TODO: Check google oauth principal
  const [currentUser] = useState("current_user");

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper function to get the date range for the current view
  const getCurrentViewDateRange = () => {
    if (view === "monthly") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Include the full weeks that contain the first and last days of the month
      const startOfWeek = new Date(firstDay);
      startOfWeek.setDate(firstDay.getDate() - firstDay.getDay());

      const endOfWeek = new Date(lastDay);
      endOfWeek.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

      return {
        startDate: startOfWeek,
        endDate: endOfWeek,
      };
    } else {
      // Weekly view
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return {
        startDate: startOfWeek,
        endDate: endOfWeek,
      };
    }
  };

  // Call updateReservations when the view or date changes
  useEffect(() => {
    const { startDate, endDate } = getCurrentViewDateRange();

    // Set time to start of day for startDate and end of day for endDate
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    props.updateReservations(
      startDateTime.toISOString(),
      endDateTime.toISOString()
    );
  }, [currentDate, view]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      weekDays.push(currentDay);
    }

    return weekDays;
  };

  const createDateTimeISO = (date: Date, time: string) => {
    const dateStr = formatDate(date);
    return new Date(`${dateStr}T${time}:00`).toISOString();
  };

  const getTimeFromISO = (isoString: string) => {
    return new Date(isoString).toTimeString().slice(0, 5);
  };

  const getTimeFromISOAs12Hour = (isoString: string) => {
    const time24 = getTimeFromISO(isoString);
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getValidHoursForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      min: isWeekend ? "10:00" : "08:00",
      max: "22:00",
    };
  };

  const isTimeInValidRange = (
    date: Date,
    startTime: string,
    endTime: string
  ) => {
    const { min, max } = getValidHoursForDate(date);
    return startTime >= min && endTime <= max;
  };

  const hasOverlappingReservation = (
    date: Date,
    startTime: string,
    endTime: string,
    excludeId?: string
  ) => {
    const startDateTime = createDateTimeISO(date, startTime);
    const endDateTime = createDateTimeISO(date, endTime);

    const dayReservations = props.reservations.filter((res) => {
      // Handle different date formats - your backend returns without .000Z
      let dateTimeString = res.startDateTime;
      if (!dateTimeString.includes("Z") && !dateTimeString.includes("+")) {
        dateTimeString += "Z"; // Add UTC indicator if missing
      }
      const resDate = new Date(dateTimeString);
      return (
        formatDate(resDate) === formatDate(date) &&
        (res._id || res.id) !== excludeId
      );
    });

    for (const reservation of dayReservations) {
      const existingStart = reservation.startDateTime;
      const existingEnd = reservation.endDateTime;

      if (startDateTime < existingEnd && endDateTime > existingStart) {
        return true;
      }
    }

    return false;
  };

  const getReservationsForDate = (date: Date) => {
    // Debug logging - remove this after fixing
    console.log("Total reservations:", props.reservations.length);
    console.log("Filtering for date:", formatDate(date));

    const filtered = props.reservations.filter((res) => {
      // Handle different date formats - your backend returns without .000Z
      let dateTimeString = res.startDateTime;
      if (!dateTimeString.includes("Z") && !dateTimeString.includes("+")) {
        dateTimeString += "Z"; // Add UTC indicator if missing
      }

      const resDate = new Date(dateTimeString);
      const resDateFormatted = formatDate(resDate);
      const targetDateFormatted = formatDate(date);

      console.log(
        "Reservation:",
        res.startDateTime,
        "-> formatted:",
        resDateFormatted
      );
      console.log("Target date formatted:", targetDateFormatted);
      console.log("Match:", resDateFormatted === targetDateFormatted);

      return resDateFormatted === targetDateFormatted;
    });

    console.log(
      `Found ${filtered.length} reservations for ${formatDate(date)}`
    );
    return filtered;
  };

  // Alternative timezone-safe version (uncomment if above doesn't work)
  // const getReservationsForDate = (date: Date) => {
  //   return props.reservations.filter((res) => {
  //     const resDate = new Date(res.startDateTime);
  //
  //     // Compare year, month, and day directly to avoid timezone issues
  //     return (
  //       resDate.getFullYear() === date.getFullYear() &&
  //       resDate.getMonth() === date.getMonth() &&
  //       resDate.getDate() === date.getDate()
  //     );
  //   });
  // };

  // Temporary test function - uncomment this to show all reservations on every date for testing
  // const getReservationsForDate = (date: Date) => {
  //   console.log('TEST MODE: Showing all reservations on every date');
  //   return props.reservations;
  // };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
    setEditingReservation(null);
    setFormData({ reserver: "", startTime: "", endTime: "" });
    setFormError("");
  };

  const handleReservationClick = (reservation: Reservation, date: Date) => {
    const userField = reservation.createdBy || reservation.created_by;
    if (userField === currentUser) {
      setSelectedDate(date);
      setEditingReservation(reservation);
      setFormData({
        reserver: reservation.reserver || reservation.owner || "",
        startTime: getTimeFromISO(reservation.startDateTime),
        endTime: getTimeFromISO(reservation.endDateTime),
      });
      setShowModal(true);
      setFormError("");
    }
  };

  const formatTimeTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const validateTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime)
      return {
        valid: false,
        message: "Please select both start and end times",
      };

    if (!selectedDate) return { valid: false, message: "No date selected" };

    if (!isTimeInValidRange(selectedDate, startTime, endTime)) {
      const { min, max } = getValidHoursForDate(selectedDate);
      const dayType =
        selectedDate.getDay() === 0 || selectedDate.getDay() === 6
          ? "weekends"
          : "weekdays";
      const minFormatted = formatTimeTo12Hour(min);
      const maxFormatted = formatTimeTo12Hour(max);
      return {
        valid: false,
        message: `Reservations are only allowed ${minFormatted} - ${maxFormatted} on ${dayType}`,
      };
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (end <= start) {
      return { valid: false, message: "End time must be after start time" };
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 2) {
      return {
        valid: false,
        message: "Reservation duration cannot exceed 2 hours",
      };
    }

    if (
      hasOverlappingReservation(
        selectedDate,
        startTime,
        endTime,
        editingReservation?._id || editingReservation?.id
      )
    ) {
      return {
        valid: false,
        message: "This time slot overlaps with an existing reservation",
      };
    }

    return { valid: true, message: "" };
  };

  const handleFormSubmit = () => {
    if (!formData.reserver.trim()) {
      setFormError("Please enter who is making the reservation");
      return;
    }

    const validation = validateTimeRange(formData.startTime, formData.endTime);
    if (!validation.valid) {
      setFormError(validation.message);
      return;
    }

    // Get current view date range for refreshing
    const { startDate, endDate } = getCurrentViewDateRange();
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    if (editingReservation) {
      // For editing, send POST request to backend with updated data
      const updatedReservation = {
        startDateTime: createDateTimeISO(selectedDate!, formData.startTime),
        endDateTime: createDateTimeISO(selectedDate!, formData.endTime),
        reserver: formData.reserver.trim(),
        createdBy: currentUser,
      };

      fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations/${
          editingReservation._id || editingReservation.id
        }`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedReservation),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("Reservation updated:", data);
          // Refresh reservations for current view
          props.updateReservations(
            startDateTime.toISOString(),
            endDateTime.toISOString()
          );
        })
        .catch((error) => {
          console.error("Error updating reservation:", error);
          setFormError("Failed to update reservation. Please try again.");
          return;
        });
    } else {
      // For creating, let backend generate the ID
      const newReservation = {
        startDateTime: createDateTimeISO(selectedDate!, formData.startTime),
        endDateTime: createDateTimeISO(selectedDate!, formData.endTime),
        reserver: formData.reserver.trim(),
        createdBy: currentUser,
      };

      fetch(`${import.meta.env.VITE_API_URL}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newReservation),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Reservation created:", data);
          // Refresh reservations for current view
          props.updateReservations(
            startDateTime.toISOString(),
            endDateTime.toISOString()
          );
        })
        .catch((error) => {
          console.error("Error creating reservation:", error);
          setFormError("Failed to create reservation. Please try again.");
          return;
        });
    }

    setShowModal(false);
    setEditingReservation(null);
    setFormData({ reserver: "", startTime: "", endTime: "" });
    setFormError("");
  };

  const handleDeleteReservation = () => {
    if (
      editingReservation &&
      (editingReservation._id || editingReservation.id)
    ) {
      // Get current view date range for refreshing
      const { startDate, endDate } = getCurrentViewDateRange();
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);

      fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations/${
          editingReservation._id || editingReservation.id
        }`,
        {
          method: "DELETE",
        }
      )
        .then(() => {
          console.log("Reservation deleted");
          // Refresh reservations for current view
          props.updateReservations(
            startDateTime.toISOString(),
            endDateTime.toISOString()
          );
        })
        .catch((error) => {
          console.error("Error deleting reservation:", error);
          setFormError("Failed to delete reservation. Please try again.");
          return;
        });

      setShowModal(false);
      setEditingReservation(null);
      setFormData({ reserver: "", startTime: "", endTime: "" });
      setFormError("");
    }
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);

    return (
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center font-semibold text-gray-600 bg-gray-100"
          >
            {day}
          </div>
        ))}
        {days.map((date, index) => (
          <div
            key={index}
            className={`min-h-24 p-2 border cursor-pointer hover:bg-blue-50 transition-colors ${
              date
                ? isToday(date)
                  ? "bg-green-100 border-green-400 border-2"
                  : "bg-white border-gray-200"
                : "bg-gray-50 border-gray-200"
            }`}
            onClick={() => date && handleDateClick(date)}
          >
            {date && (
              <>
                <div
                  className={`font-medium text-sm mb-1 ${
                    isToday(date) ? "text-green-800" : ""
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {getReservationsForDate(date)
                    .slice(0, 2)
                    .map((reservation) => (
                      <div
                        key={reservation._id || reservation.id}
                        className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer transition-colors ${
                          (reservation.createdBy || reservation.created_by) ===
                          currentUser
                            ? "bg-green-200 text-green-800 hover:bg-green-300"
                            : "bg-blue-200 text-blue-800"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReservationClick(reservation, date);
                        }}
                        title={
                          (reservation.createdBy || reservation.created_by) ===
                          currentUser
                            ? "Click to edit (your reservation)"
                            : "Reserved by someone else"
                        }
                      >
                        {getTimeFromISOAs12Hour(reservation.startDateTime)} -{" "}
                        {reservation.reserver || reservation.owner}
                      </div>
                    ))}
                  {getReservationsForDate(date).length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{getReservationsForDate(date).length - 2} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date, index) => (
          <div key={index} className="flex flex-col">
            <div
              className={`p-3 text-center font-semibold border-b-2 ${
                isToday(date)
                  ? "bg-green-100 border-green-400 text-green-800"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <div className="text-sm text-gray-600">
                {dayNames[date.getDay()]}
              </div>
              <div className="text-lg">{date.getDate()}</div>
            </div>
            <div
              className="min-h-96 p-2 border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors bg-white"
              onClick={() => handleDateClick(date)}
            >
              <div className="space-y-2">
                {getReservationsForDate(date).map((reservation) => (
                  <div
                    key={reservation._id || reservation.id}
                    className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                      (reservation.createdBy || reservation.created_by) ===
                      currentUser
                        ? "bg-green-200 text-green-800 hover:bg-green-300"
                        : "bg-blue-200 text-blue-800"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReservationClick(reservation, date);
                    }}
                    title={
                      (reservation.createdBy || reservation.created_by) ===
                      currentUser
                        ? "Click to edit (your reservation)"
                        : "Reserved by someone else"
                    }
                  >
                    <div className="font-medium">
                      {getTimeFromISOAs12Hour(reservation.startDateTime)} -{" "}
                      {getTimeFromISOAs12Hour(reservation.endDateTime)}
                    </div>
                    <div className="truncate">
                      {reservation.reserver || reservation.owner}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Calendar className="mr-2" size={24} />
            Reservation Calendar
          </h1>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("monthly")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === "monthly"
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setView("weekly")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === "weekly"
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() =>
              view === "monthly" ? navigateMonth("prev") : navigateWeek("prev")
            }
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-700 min-w-48 text-center">
            {view === "monthly"
              ? `${
                  monthNames[currentDate.getMonth()]
                } ${currentDate.getFullYear()}`
              : `Week of ${currentDate.toLocaleDateString()}`}
          </h2>
          <button
            onClick={() =>
              view === "monthly" ? navigateMonth("next") : navigateWeek("next")
            }
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {view === "monthly" ? renderMonthView() : renderWeekView()}
      </div>

      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingReservation ? "Edit Reservation" : "Make Reservation"} -{" "}
                {selectedDate.toLocaleDateString()}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingReservation(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  Individual/Band/Organization Reserving
                </label>
                <input
                  type="text"
                  value={formData.reserver}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reserver: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name or organization"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock size={16} className="inline mr-1" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {formError}
                </div>
              )}

              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <div>Valid hours:</div>
                <div>• Weekdays: 8:00 AM - 10:00 PM</div>
                <div>• Weekends: 10:00 AM - 10:00 PM</div>
                <div>• Maximum duration: 2 hours</div>
                {editingReservation && (
                  <div className="text-green-600 mt-1">
                    • You can edit this reservation because you created it
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingReservation(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {editingReservation && (
                  <button
                    type="button"
                    onClick={handleDeleteReservation}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingReservation
                    ? "Update Reservation"
                    : "Create Reservation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
