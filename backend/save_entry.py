#!/usr/bin/env python3
"""
Learning Journal - Save Entry Script
Allows manual entry creation via command line interface
"""

import json
import os
from datetime import datetime

# Path to the JSON file
JSON_FILE = 'reflections.json'

def load_entries():
    """Load existing entries from JSON file"""
    if os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Warning: JSON file is corrupted. Creating new file.")
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

def create_entry(title, content):
    """Create a new journal entry"""
    timestamp = int(datetime.now().timestamp() * 1000)
    entry = {
        'id': str(timestamp),
        'title': title,
        'content': content,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'timestamp': timestamp,
        'location': {
            'city': 'Unknown',
            'state': '',
            'country': 'Unknown',
            'lat': None,
            'lon': None
        }
    }
    return entry

def main():
    """Main function to run the script"""
    print("=" * 60)
    print("Learning Journal - Add New Entry")
    print("=" * 60)
    
    # Get user input
    title = input("\nEnter entry title: ").strip()
    if not title:
        print("Error: Title cannot be empty!")
        return
    
    print("\nEnter your reflection (type 'END' on a new line to finish):")
    content_lines = []
    while True:
        line = input()
        if line.strip() == 'END':
            break
        content_lines.append(line)
    
    content = '\n'.join(content_lines).strip()
    if not content:
        print("Error: Content cannot be empty!")
        return
    
    # Create and save entry
    entries = load_entries()
    new_entry = create_entry(title, content)
    entries.insert(0, new_entry)  # Add to beginning
    
    if save_entries(entries):
        print("\n" + "=" * 60)
        print("✅ Entry saved successfully!")
        print("=" * 60)
        print(f"Title: {title}")
        print(f"Date: {new_entry['date']}")
        print(f"Total entries: {len(entries)}")
    else:
        print("\n❌ Failed to save entry!")

if __name__ == '__main__':
    main()
