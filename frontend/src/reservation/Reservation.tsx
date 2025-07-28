export interface Reservation {
  id?: string; // Frontend local ID (for compatibility)
  _id?: string; // Backend MongoDB ID
  startDateTime: string;
  endDateTime: string;
  reserver?: string; // Frontend field
  owner?: string; // Backend field - same as reserver
  createdBy?: string; // Frontend field
  created_by?: string; // Backend field - same as createdBy
}
