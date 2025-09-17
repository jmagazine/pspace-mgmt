from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from .db import db
from bson.objectid import ObjectId
from .gcal import (
    add_event_to_calendar,
    delete_event_from_calendar,
    update_event_in_calendar,
)
import traceback


# Validation helpers
import pytz


def is_valid_reservation(
    start_time, end_time, created_by, reservations_col, exclude_id=None
):
    # Convert to datetime if string
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
    if isinstance(end_time, str):
        end_time = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

    # Convert UTC to America/New_York
    eastern = pytz.timezone("America/New_York")
    start_time_local = start_time.astimezone(eastern)
    end_time_local = end_time.astimezone(eastern)

    # Valid hours in local time
    weekday = start_time_local.weekday()
    min_hour = 8 if weekday < 5 else 10
    max_hour = 22
    if not (
        min_hour <= start_time_local.hour < max_hour
        and min_hour < end_time_local.hour <= max_hour
    ):
        return (
            False,
            f"Reservations are only allowed {min_hour}:00 - {max_hour}:00 (America/New_York) on {'weekends' if weekday >= 5 else 'weekdays'}",
        )

    # Max duration
    duration = (end_time - start_time).total_seconds() / 3600
    if duration > 2:
        return False, "Reservation duration cannot exceed 2 hours"
    if duration <= 0:
        return False, "End time must be after start time"

    # One reservation per user per day
    start_date = start_time.date()
    query = {
        "createdBy": created_by,
        "startTime": {
            "$gte": datetime.combine(start_date, datetime.min.time()),
            "$lt": datetime.combine(start_date, datetime.max.time()),
        },
    }
    if exclude_id:
        query["_id"] = {"$ne": ObjectId(exclude_id)}
    existing = reservations_col.find_one(query)
    if existing:
        return False, "You can only make one reservation per day."

    # Max 10 hours per week
    week_start = start_time - timedelta(days=start_time.weekday())
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    user_week_reservations = reservations_col.find(
        {"createdBy": created_by, "startTime": {"$gte": week_start, "$lte": week_end}}
    )
    total_week_hours = sum(
        (r["endTime"] - r["startTime"]).total_seconds() / 3600
        for r in user_week_reservations
    )
    if total_week_hours + duration > 10:
        return False, "You cannot reserve more than 10 hours per week."

    return True, ""


api = Blueprint("api", __name__, url_prefix="/api")


@api.route("/")
def index():
    return "Welcome to the Reservation System"


@api.route(
    "/reservations",
    methods=[
        "GET",
        "POST",
    ],
)
def reservations():
    reservations_col = db["reservations"]

    try:
        if request.method == "POST":
            new_reservation = request.json

            startTime_datetime = datetime.fromisoformat(
                new_reservation["startTime"].replace("Z", "+00:00")
            )
            endTime_datetime = datetime.fromisoformat(
                new_reservation["endTime"].replace("Z", "+00:00")
            )

            # Validation
            valid, msg = is_valid_reservation(
                new_reservation["startTime"],
                new_reservation["endTime"],
                new_reservation["createdBy"],
                reservations_col,
            )
            if not valid:
                return jsonify({"error": msg}), 400

            # Store with consistent field names
            reservation_data = {
                "reserver": new_reservation["reserver"],
                "createdBy": new_reservation["createdBy"],
                # Convert to datetime objects for MongoDB
                "startTime": startTime_datetime,
                "endTime": endTime_datetime,
            }
            calendar_event = add_event_to_calendar(
                new_reservation["reserver"], startTime_datetime, endTime_datetime
            )

            if not calendar_event:
                return jsonify({"error": "failed to create G-cal event."}), 400

            reservation_data["calendarEventId"] = calendar_event["id"]
            result = reservations_col.insert_one(reservation_data)

            # Return the data as expected by frontend
            response_data = {
                "_id": str(result.inserted_id),
                "startTime": new_reservation["startTime"],
                "endTime": new_reservation["endTime"],
                "reserver": new_reservation["reserver"],
                "createdBy": new_reservation["createdBy"],
            }

            return jsonify(response_data), 201
        elif request.method == "GET":
            print(f"Query args: {request.args}")

            if "start" in request.args and "end" in request.args:
                start_date = datetime.fromisoformat(
                    request.args["start"].replace("Z", "+00:00")
                )
                end_date = datetime.fromisoformat(
                    request.args["end"].replace("Z", "+00:00")
                )
                print(f"Querying from {start_date} to {end_date}")

                reservations = list(
                    reservations_col.find(
                        {
                            "startTime": {"$gte": start_date},
                            "endTime": {"$lte": end_date},
                        }
                    )
                )
            else:
                reservations = list(reservations_col.find())

            print(f"Found {len(reservations)} reservations")
            print(f"Sample reservation: {reservations[0] if reservations else 'None'}")

            # Convert to frontend format
            for r in reservations:
                r["_id"] = str(r["_id"])
                # Ensure we return the string format expected by frontend
                r["startTime"] = str(r["startTime"])
                r["endTime"] = str(r["endTime"])

            return jsonify({"reservations": reservations}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str()}), 400


@api.route("/reservations/<reservation_id>", methods=["PUT", "DELETE"])
def reservation_detail(reservation_id):
    reservations_col = db["reservations"]
    old_reservation = reservations_col.find_one({"_id": ObjectId(reservation_id)})
    if not old_reservation:
        return jsonify({"error": "Reservation not found"}), 404

    try:
        if request.method == "PUT":
            update_data = request.json

            # Update with consistent field names
            new_startTime_datetime = datetime.fromisoformat(
                update_data["startTime"].replace("Z", "+00:00")
            )
            new_endTime_datetime = datetime.fromisoformat(
                update_data["endTime"].replace("Z", "+00:00")
            )
            # Validation
            valid, msg = is_valid_reservation(
                update_data["startTime"],
                update_data["endTime"],
                update_data["createdBy"],
                reservations_col,
                exclude_id=reservation_id,
            )
            if not valid:
                return jsonify({"error": msg}), 400

            backend_data = {
                "startTime": update_data["startTime"],
                "endTime": update_data["endTime"],
                "reserver": update_data["reserver"],
                "createdBy": update_data["createdBy"],
                "startTime": new_startTime_datetime,
                "endTime": new_endTime_datetime,
            }

            updated_event = update_event_in_calendar(
                old_reservation["_id"],
                update_data["reserver"],
                new_startTime_datetime,
                new_endTime_datetime,
            )

            if not updated_event:
                return jsonify({"Error": "Failed to update G-cal event."}, 400)

            result = reservations_col.update_one(
                {"_id": ObjectId(reservation_id)}, {"$set": backend_data}
            )

            return jsonify({"message": "Reservation updated"}), 200
        elif request.method == "DELETE":
            print(old_reservation.keys())
            if "calendarEventId" in old_reservation.keys():
                if not delete_event_from_calendar(old_reservation["calendarEventId"]):
                    return jsonify({"Error": "Failed to update G-cal event."}, 400)
            result = reservations_col.delete_one({"_id": ObjectId(reservation_id)})

            if result.deleted_count == 0:
                return jsonify({"error": "Reservation not found"}), 404

            return jsonify({"message": "Reservation deleted"}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400
