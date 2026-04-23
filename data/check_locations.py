import csv

with open('C:/xampp/htdocs/Tourista/data/hotels_users_ratings.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    locations = set()
    for row in reader:
        locations.add(row['Location'])
    
    for loc in sorted(locations):
        print(loc)
    print(f"\nTotal: {len(locations)} locations")
