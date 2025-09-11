from flask import current_app, g
from werkzeug.local import LocalProxy
from pymongo import MongoClient


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        DATABASE_CONNECTIONS_STRING = current_app.config["DATABASE_CONNECTION_STRING"]
        if not DATABASE_CONNECTIONS_STRING:
            print("DATABASE_CONNECTION_STRING not specified")
            return None
        client = MongoClient(DATABASE_CONNECTIONS_STRING)

        db = g._database = client["pspace-mgmt"]
    return db


db = LocalProxy(get_db)


# def create_document(collection_name, document):
#     if not isinstance(document, dict):
#         raise ValueError("Document must be a dictionary")

#     return result.inserted_id


# def read_documents(collection_name, query={}):
#     result = db[collection_name].find(query)
#     return list(result)


# def update_document(collection_name, document_id, update_fields):
#     result = db[collection_name].update_one(
#         {"_id": document_id}, {"$set": update_fields}
#     )
#     return result.modified_count


# def delete_document(collection_name, document_id):
#     result = db[collection_name].delete_one({"_id": document_id})
#     return result.deleted_count
