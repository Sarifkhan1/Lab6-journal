#!/usr/bin/env python3
"""
Learning Journal PWA - Flask Backend
Deployed on PythonAnywhere
Provides REST API endpoints for journal reflection management
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Path to JSON file (in backend directory)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, 'backend', 'reflections.json')

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
        # Ensure backend directory exists
        os.makedirs(os.path.dirname(JSON_FILE), exist_ok=True)
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving entries: {e}")
        return False

# ===================================
# ROUTES FOR HTML PAGES
# ===================================

@app.route('/')
def index():
    """Serve the home page"""
    return render_template('index.html')

@app.route('/journal')
def journal():
    """Serve the journal page"""
    return render_template('journal.html')

@app.route('/projects')
def projects():
    """Serve the projects page"""
    return render_template('projects.html')

@app.route('/about')
def about():
    """Serve the about page"""
    return render_template('about.html')

# ===================================
# API ROUTES
# ===================================

@app.route('/reflections', methods=['GET'])
def get_reflections():
    """Get all journal reflections"""
    try:
        entries = load_entries()
        return jsonify(entries)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/add_reflection', methods=['POST'])
def add_reflection():
    """Add a new journal reflection"""
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
                'message': 'Reflection added successfully'
            })
        else:
            return jsonify({'error': 'Failed to save reflection'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/update_reflection/<entry_id>', methods=['PUT'])
def update_reflection(entry_id):
    """Update an existing reflection"""
    try:
        data = request.get_json()
        
        # Load existing entries
        entries = load_entries()
        
        # Find entry by ID
        entry_index = None
        for i, entry in enumerate(entries):
            if entry.get('id') == entry_id:
                entry_index = i
                break
        
        if entry_index is None:
            return jsonify({'error': 'Reflection not found'}), 404
        
        # Update entry fields
        updated_entry = entries[entry_index].copy()
        if 'title' in data:
            updated_entry['title'] = data['title']
        if 'content' in data:
            updated_entry['content'] = data['content']
        if 'date' in data:
            updated_entry['date'] = data['date']
        if 'location' in data:
            updated_entry['location'] = data['location']
        
        # Update timestamp to reflect modification time
        updated_entry['timestamp'] = int(datetime.now().timestamp() * 1000)
        
        entries[entry_index] = updated_entry
        
        # Save to file
        if save_entries(entries):
            return jsonify({
                'success': True,
                'entry': updated_entry,
                'message': 'Reflection updated successfully'
            })
        else:
            return jsonify({'error': 'Failed to update reflection'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete_reflection/<entry_id>', methods=['DELETE'])
def delete_reflection(entry_id):
    """Delete a reflection by ID"""
    try:
        entries = load_entries()
        filtered_entries = [e for e in entries if e.get('id') != entry_id]
        
        if len(filtered_entries) == len(entries):
            return jsonify({'error': 'Reflection not found'}), 404
        
        if save_entries(filtered_entries):
            return jsonify({
                'success': True,
                'message': 'Reflection deleted successfully'
            })
        else:
            return jsonify({'error': 'Failed to delete reflection'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reflections/search', methods=['GET'])
def search_reflections():
    """Search reflections on the server side"""
    try:
        query = request.args.get('q', '').lower().strip()
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        entries = load_entries()
        filtered_entries = entries
        
        # Filter by keyword (search in title and content)
        if query:
            filtered_entries = [
                e for e in filtered_entries
                if query in e.get('title', '').lower() or query in e.get('content', '').lower()
            ]
        
        # Filter by date range
        if date_from:
            filtered_entries = [
                e for e in filtered_entries
                if e.get('date', '') >= date_from
            ]
        
        if date_to:
            filtered_entries = [
                e for e in filtered_entries
                if e.get('date', '') <= date_to
            ]
        
        return jsonify(filtered_entries)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Learning Journal API is running',
        'endpoints': {
            'GET /reflections': 'Get all reflections',
            'POST /add_reflection': 'Add new reflection',
            'PUT /update_reflection/<id>': 'Update reflection',
            'DELETE /delete_reflection/<id>': 'Delete reflection',
            'GET /reflections/search': 'Search reflections'
        }
    })

if __name__ == '__main__':
    print("=" * 60)
    print("Learning Journal PWA - Flask Backend")
    print("=" * 60)
    print("Server running on: http://localhost:5000")
    print("API Endpoints:")
    print("  GET    /reflections              - Get all reflections")
    print("  POST   /add_reflection           - Add new reflection")
    print("  PUT    /update_reflection/<id>   - Update reflection")
    print("  DELETE /delete_reflection/<id>   - Delete reflection")
    print("  GET    /reflections/search       - Search reflections")
    print("  GET    /health                   - Health check")
    print("=" * 60)
    app.run(debug=True, port=5000)

