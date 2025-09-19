import datetime
import os.path

from googleapiclient.discovery import build
from google.oauth2 import service_account
from pymongo import MongoClient

# from db import db
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv("backend/.env.production")

GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID")
if not os.path.exists("backend/service_account.json"):
    GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
    if GOOGLE_SERVICE_ACCOUNT_FILE:
        with open("backend/service_account.json", "w") as f:
            f.write(GOOGLE_SERVICE_ACCOUNT_FILE)

SCOPES = ["https://www.googleapis.com/auth/calendar"]
credentials = service_account.Credentials.from_service_account_file(
    "backend/service_account.json", scopes=SCOPES
)

service = build("calendar", "v3", credentials=credentials)


def add_event_to_calendar(
    title: str, start_time_utc: datetime.datetime, end_time_utc: datetime.datetime
):
    """
    Adds an event to the Google Calendar using the service account.
    :param title: Event title/summary
    :param start_time_utc: Start time as a datetime object (UTC)
    :param end_time_utc: End time as a datetime object (UTC)
    :return: The created event resource or None if failed
    """
    event = {
        "summary": title,
        "start": {
            "dateTime": start_time_utc.isoformat(),
            "timeZone": "UTC",
        },
        "end": {
            "dateTime": end_time_utc.isoformat(),
            "timeZone": "UTC",
        },
    }
    try:
        created_event = (
            service.events().insert(calendarId=GOOGLE_CALENDAR_ID, body=event).execute()
        )
        print(f"Event created: {created_event.get('htmlLink')}")
        return created_event
    except HttpError as error:
        print(f"An error occurred while creating event: {error}")
        return None


def delete_event_from_calendar(event_id: str):
    """
    Deletes an event from the Google Calendar using the service account.
    :param event_id: The ID of the event to delete
    :return: True if deleted successfully, False otherwise
    """
    try:
        service.events().delete(
            calendarId=GOOGLE_CALENDAR_ID, eventId=event_id
        ).execute()
        print(f"Event {event_id} deleted successfully.")
        return True
    except HttpError as error:
        print(f"An error occurred while deleting event: {error}")
        return False


def update_event_in_calendar(
    event_id: str,
    title: str = None,
    start_time_utc: str = None,
    end_time_utc: str = None,
):
    """
    Updates an event in the Google Calendar using the service account.
    :param event_id: The ID of the event to update
    :param title: New event title/summary (optional)
    :param start_time_utc: New start time as ISO 8601 string (UTC) (optional)
    :param end_time_utc: New end time as ISO 8601 string (UTC) (optional)
    :return: The updated event resource or None if failed
    """
    try:
        # Get the existing event
        event = (
            service.events()
            .get(calendarId=GOOGLE_CALENDAR_ID, eventId=event_id)
            .execute()
        )

        # Update fields if provided
        if title is not None:
            event["summary"] = title
        if start_time_utc is not None:
            event["start"]["dateTime"] = start_time_utc
            event["start"]["timeZone"] = "UTC"
        if end_time_utc is not None:
            event["end"]["dateTime"] = end_time_utc
            event["end"]["timeZone"] = "UTC"

        updated_event = (
            service.events()
            .update(calendarId=GOOGLE_CALENDAR_ID, eventId=event_id, body=event)
            .execute()
        )
        print(f"Event updated: {updated_event.get('htmlLink')}")
        return updated_event
    except HttpError as error:
        print(f"An error occurred while updating event: {error}")
        return None


def event_exists_in_calendar(
    title: str, start_time_utc: str, end_time_utc: str
) -> bool:
    """
    Checks if an event with the given title, start time, and end time exists in the Google Calendar.
    :param title: Event title/summary
    :param start_time_utc: Start time as ISO 8601 string (UTC)
    :param end_time_utc: End time as ISO 8601 string (UTC)
    :return: True if such an event exists, False otherwise
    """
    try:
        events_result = (
            service.events()
            .list(
                calendarId=GOOGLE_CALENDAR_ID,
                timeMin=start_time_utc,
                timeMax=end_time_utc,
                singleEvents=True,
                orderBy="startTime",
                maxResults=2500,
            )
            .execute()
        )
        events = events_result.get("items", [])
        for event in events:
            event_title = event.get("summary", "")
            event_start = event["start"].get("dateTime", event["start"].get("date"))
            event_end = event["end"].get("dateTime", event["end"].get("date"))
            if (
                event_title == title
                and event_start == start_time_utc
                and event_end == end_time_utc
            ):
                return True
        return False
    except HttpError as error:
        print(f"An error occurred while checking event existence: {error}")
        return False


def sync_reservations_to_calendar(db):
    reservations = list(db["reservations"].find({}))
    for res in reservations:
        title = res.get("reserver")
        start_dt = res.get("startTime")  # datetime object in UTC
        end_dt = res.get("endTime")  # datetime object in UTC

        # Convert datetime to ISO8601 string in UTC
        start_iso = (
            start_dt.isoformat().replace("+00:00", "Z")
            if start_dt.tzinfo
            else start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        )
        end_iso = (
            end_dt.isoformat().replace("+00:00", "Z")
            if end_dt.tzinfo
            else end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        )

        if not event_exists_in_calendar(title, start_iso, end_iso):
            # Add event to calendar
            event = {
                "summary": title,
                "start": {"dateTime": start_iso, "timeZone": "UTC"},
                "end": {"dateTime": end_iso, "timeZone": "UTC"},
            }
            try:
                service.events().insert(
                    calendarId=GOOGLE_CALENDAR_ID, body=event
                ).execute()
                print(f"Added event for reservation: {title} {start_iso} - {end_iso}")
            except Exception as e:
                print(f"Failed to add event for {title}: {e}")
        else:
            print(
                f"Event already exists for reservation: {title} {start_iso} - {end_iso}"
            )


def delete_all_events_from_calendar():
    """
    Deletes all events from the Google Calendar specified by GOOGLE_CALENDAR_ID.
    """
    try:
        # Get all events
        events_result = (
            service.events()
            .list(
                calendarId=GOOGLE_CALENDAR_ID,
                maxResults=2500,  # Max allowed by Google
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
        events = events_result.get("items", [])

        count = 0
        for event in events:
            service.events().delete(
                calendarId=GOOGLE_CALENDAR_ID, eventId=event["id"]
            ).execute()
            count += 1
        print(f"Deleted {count} events from calendar {GOOGLE_CALENDAR_ID}")
        return count
    except HttpError as error:
        print(f"An error occurred while deleting events: {error}")
        return 0


def main():
    try:
        now = datetime.datetime.now(tz=datetime.timezone.utc).isoformat()
        print("Getting the upcoming 10 events")
        events_result = (
            service.events()
            .list(
                calendarId=GOOGLE_CALENDAR_ID,
                timeMin=now,
                maxResults=10,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )

        events = events_result.get("items", [])
        if not events:
            print("No upcoming events found.")
            return

        for event in events:
            start = event["start"].get("dateTime", event["start"].get("date"))
            print(start, event["summary"])

    except HttpError as error:
        print(f"An error occurred: {error}")


if __name__ == "__main__":
    # DATABASE_CONNECTION_STRING = os.getenv("DATABASE_CONNECTION_STRING")
    # client = MongoClient(DATABASE_CONNECTION_STRING)
    # db = client["pspace-mgmt"]
    # sync_reservations_to_calendar(db)
    main()
    # delete_all_events_from_calendar()
