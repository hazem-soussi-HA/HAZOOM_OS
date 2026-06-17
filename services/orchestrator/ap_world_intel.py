import json, time, requests, os

def update_world_telemetry():
    while True:
        try:
            # Fetch Global IP and Geo-Coordinates
            geo_data = requests.get('http://ip-api.com/json/').json()
            
            data = {
                'status': 'OPERATIONAL',
                'ip': geo_data.get('query', '0.0.0.0'),
                'city': geo_data.get('city', 'Unknown'),
                'country': geo_data.get('country', 'Unknown'),
                'lat': geo_data.get('lat', 0),
                'lon': geo_data.get('lon', 0),
                'world_time': time.ctime(),
                'security_level': 'ULTRA-VIOLET'
            }
            
            with open('sync_state.json', 'w') as f:
                json.dump(data, f)
            print(f"🌐 Map Coordinates Updated: {data['lat']}, {data['lon']}")
        except Exception as e:
            print(f"Sync Error: {e}")
        time.sleep(15)

if __name__ == '__main__':
    update_world_telemetry()
