#!/usr/bin/env python3
"""
Learning Journal - Flask API Server
Provides REST API endpoints for journal entry management
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

JSON_FILE = 'reflections.json'

def load_entries():
    """Load entries from JSON file"""
    if os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def save_entries(entries):
    """Save entries to JSON file"""
    try:
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving entries: {e}")
        return False

@app.route('/api/entries', methods=['GET'])
def get_entries():
    """Get all journal entries"""
    entries = load_entries()
    return jsonify(entries)

@app.route('/api/save-entry', methods=['POST'])
def save_entry():
    """Save a new journal entry"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title') or not data.get('content'):
            return jsonify({'error': 'Title and content are required'}), 400
        
        # Load existing entries
        entries = load_entries()
        
        # Create new entry
        timestamp = int(datetime.now().timestamp() * 1000)
        new_entry = {
            'id': str(timestamp),
            'title': data['title'],
            'content': data['content'],
            'date': data.get('date', datetime.now().strftime('%Y-%m-%d')),
            'timestamp': data.get('timestamp', timestamp),
            'location': data.get('location', {
                'city': 'Unknown',
                'state': '',
                'country': 'Unknown',
                'lat': None,
                'lon': None
            })
        }
        
        # Add to beginning of list
        entries.insert(0, new_entry)
        
        # Save to file
        if save_entries(entries):
            return jsonify({
                'success': True,
                'entry': new_entry,
                'message': 'Entry saved successfully'
            })
        else:
            return jsonify({'error': 'Failed to save entry'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entry/<entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    """Delete a journal entry by ID"""
    try:
        entries = load_entries()
        filtered_entries = [e for e in entries if e['id'] != entry_id]
        
        if len(filtered_entries) == len(entries):
            return jsonify({'error': 'Entry not found'}), 404
        
        if save_entries(filtered_entries):
            return jsonify({
                'success': True,
                'message': 'Entry deleted successfully'
            })
        else:
            return jsonify({'error': 'Failed to delete entry'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear-all', methods=['DELETE'])
def clear_all_entries():
    """Clear all journal entries"""
    try:
        if save_entries([]):
            return jsonify({
                'success': True,
                'message': 'All entries cleared successfully'
            })
        else:
            return jsonify({'error': 'Failed to clear entries'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'API is running'})

if __name__ == '__main__':
    print("=" * 60)
    print("Learning Journal API Server")
    print("=" * 60)
    print("Server running on: http://localhost:5000")
    print("API Endpoints:")
    print("  GET    /api/entries       - Get all entries")
    print("  POST   /api/save-entry    - Save new entry")
    print("  DELETE /api/entry/<id>    - Delete entry")
    print("  DELETE /api/clear-all     - Clear all entries")
    print("  GET    /api/health        - Health check")
    print("=" * 60)
    app.run(debug=True, port=5000)
