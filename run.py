#!/usr/bin/env python3
"""
Simple run script for the Flask application
"""
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app import app

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
