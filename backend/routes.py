from datetime import datetime
from flask import Blueprint, request, jsonify
from .db import db
from bson.objectid import ObjectId

# Add the /api prefix to match frontend calls
api = Blueprint("api", __name__, url_prefix="/api")


@api.route("/")
def index():
    return "Welcome to the Reservation System"


@api.route("/reservations", methods=["GET", "POST", "DELETE"])
def reservations():
    reservations_col = db["reservations"]

    try:
        if request.method == "POST":
            new_reservation = request.json

            # Store with consistent field names
            reservation_data = {
                "reserver": new_reservation["reserver"],
                "createdBy": new_reservation["createdBy"],
                # Convert to datetime objects for MongoDB
                "startTime": datetime.fromisoformat(
                    new_reservation["startTime"].replace("Z", "+00:00")
                ),
                "endTime": datetime.fromisoformat(
                    new_reservation["endTime"].replace("Z", "+00:00")
                ),
            }
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
        elif request.method == "DELETE":
            result = reservations_col.delete_many({})
            return (
                jsonify({"message": f"Deleted {result.deleted_count} reservations"}),
                200,
            )
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@api.route("/ping", methods=["GET"])
def ping():
    return "Ping message received!"


@api.route("/reservations/<reservation_id>", methods=["PUT", "DELETE"])
def reservation_detail(reservation_id):
    reservations_col = db["reservations"]

    try:
        if request.method == "PUT":
            update_data = request.json

            # Update with consistent field names
            backend_data = {
                "startTime": update_data["startTime"],
                "endTime": update_data["endTime"],
                "reserver": update_data["reserver"],
                "createdBy": update_data["createdBy"],
                "startTime": datetime.fromisoformat(
                    update_data["startTime"].replace("Z", "+00:00")
                ),
                "endTime": datetime.fromisoformat(
                    update_data["endTime"].replace("Z", "+00:00")
                ),
            }

            result = reservations_col.update_one(
                {"_id": ObjectId(reservation_id)}, {"$set": backend_data}
            )

            if result.modified_count == 0:
                return jsonify({"error": "Reservation not found"}), 404

            return jsonify({"message": "Reservation updated"}), 200
        elif request.method == "DELETE":
            result = reservations_col.delete_one({"_id": ObjectId(reservation_id)})

            if result.deleted_count == 0:
                return jsonify({"error": "Reservation not found"}), 404

            return jsonify({"message": "Reservation deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
