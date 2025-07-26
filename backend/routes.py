from flask import Blueprint, request, jsonify
from .db import db
from bson.objectid import ObjectId


main = Blueprint("main", __name__)

dummy_data = {
    "title": "Team Meeting Room A",
    "owner": "John Smith",
    "start_time": "2025-07-25T14:00:00Z",
    "end_time": "2025-07-25T15:30:00Z",
}


@main.route("/")
def index():
    return "Welcome to the Reservation System"


@main.route("/dummy", methods=["post"])
def dummy():
    try:
        result = db["reservations"].insert_one(dummy_data)
        return (
            jsonify({"message": "Dummy data created", "id": str(result.inserted_id)}),
            201,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@main.route("/reservations", methods=["GET", "POST", "DELETE"])
def reservations():
    # Get collection within the route where we have app context
    reservations_col = db["reservations"]

    # Add a new reservation
    try:
        if request.method == "POST":
            new_reservation = request.json
            reservations_col.insert_one(new_reservation)
            return jsonify(new_reservation), 201
        elif request.method == "GET":
            reservations = list(reservations_col.find())
            print(reservations)
            for r in reservations:
                r["_id"] = str(r["_id"])  # Convert ObjectId to string
            return jsonify(reservations), 200
        elif request.method == "DELETE":
            result = reservations_col.delete_many({})
            return (
                jsonify({"message": f"Deleted {result.deleted_count} reservations"}),
                200,
            )
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@main.route("/reservations/<reservation_id>", methods=["PUT", "DELETE"])
def reservation_detail(reservation_id):
    # Get collection within the route where we have app context
    reservations_col = db["reservations"]

    try:
        if request.method == "PUT":
            updated_data = request.json
            result = reservations_col.update_one(
                {"_id": reservation_id}, {"$set": updated_data}
            )
            if result.modified_count > 0:
                return jsonify({"message": "Reservation updated successfully"}), 200
            else:
                return (
                    jsonify(
                        {"error": f"Reservation with ID {reservation_id} not found"}
                    ),
                    404,
                )
        elif request.method == "DELETE":
            result = reservations_col.delete_one({"_id": ObjectId(reservation_id)})
            if result.deleted_count > 0:
                return jsonify({"message": "Reservation deleted successfully"}), 200
            else:
                return (
                    jsonify(
                        {"error": f"Reservation with ID {reservation_id} not found"}
                    ),
                    404,
                )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
