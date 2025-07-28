export interface Reservation {
  _id?: string; // Optional, will be set by backend
  startDateTime: string;
  endDateTime: string;
  reserver?: string; // Frontend field
  owner?: string; // Backend field - same as reserver
  createdBy: string;
  created_by?: string; // Backend field - same as createdBy
}
