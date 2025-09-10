export interface Reservation {
  _id?: string; // Backend MongoDB ID
  title: string;
  startTime: string;
  endTime: string;
  reserver?: string;
  createdBy?: string;
}
