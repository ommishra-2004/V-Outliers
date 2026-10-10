import math
import logging
from typing import Optional, List, Tuple
import httpx

logger = logging.getLogger(__name__)

EARTH_RADIUS_METERS = 6378137.0
SQ_METERS_TO_SQ_FT = 10.76391042

NOMINATIM_HEADERS = {
    "User-Agent": "SolarPunk-India-Assessment/3.0 (https://solarpunk.in; contact@solarpunk.in)",
    "Accept": "application/json"
}


def point_in_polygon(lat: float, lon: float, poly: List[List[float]]) -> bool:
    """
    Ray casting point-in-polygon algorithm.
    poly is a list of [lat, lon] points.
    """
    n = len(poly)
    if n < 3:
        return False
    inside = False
    p1lat, p1lon = poly[0][0], poly[0][1]
    for i in range(1, n + 1):
        p2lat, p2lon = poly[i % n][0], poly[i % n][1]
        if min(p1lat, p2lat) < lat <= max(p1lat, p2lat):
            if lon <= max(p1lon, p2lon):
                if p1lat != p2lat:
                    xinters = (lat - p1lat) * (p2lon - p1lon) / (p2lat - p1lat) + p1lon
                else:
                    xinters = p1lon
                if p1lon == p2lon or lon <= xinters:
                    inside = not inside
        p1lat, p1lon = p2lat, p2lon
    return inside


def calculate_geodesic_polygon_area_sqft(coords: List[List[float]]) -> float:
    """
    Computes the geodesic surface area of a polygon in square feet.
    coords is a list of [lat, lon] points.
    Uses planar equirectangular projection centered on the polygon origin.
    """
    if len(coords) < 3:
        return 0.0

    lat0, lon0 = coords[0][0], coords[0][1]
    rad = math.pi / 180.0
    cos_lat0 = math.cos(lat0 * rad)

    # Convert coordinates to local Cartesian coordinates (x: East in meters, y: North in meters)
    projected = []
    for pt in coords:
        x = (pt[1] - lon0) * rad * EARTH_RADIUS_METERS * cos_lat0
        y = (pt[0] - lat0) * rad * EARTH_RADIUS_METERS
        projected.append((x, y))

    # Shoelace formula
    accum = 0.0
    n = len(projected)
    for i in range(n):
        j = (i + 1) % n
        accum += projected[i][0] * projected[j][1]
        accum -= projected[j][0] * projected[i][1]

    area_m2 = abs(accum) / 2.0
    return area_m2 * SQ_METERS_TO_SQ_FT


def synthesize_rooftop_polygon(
    center_lat: float, center_lon: float, target_area_sqft: float, aspect_ratio: float = 1.33
) -> List[List[float]]:
    """
    Generates a realistic rectangular rooftop polygon centered on the user's coordinates.
    aspect_ratio: ratio of length to width (1.33 ~ 4:3 standard Indian plot ratio).
    """
    area_m2 = target_area_sqft / SQ_METERS_TO_SQ_FT
    width_m = math.sqrt(area_m2 / aspect_ratio)
    length_m = width_m * aspect_ratio

    rad = math.pi / 180.0
    cos_lat = math.cos(center_lat * rad)
    meters_per_deg_lat = 111132.0
    meters_per_deg_lon = 111132.0 * cos_lat

    d_lat = (length_m / 2.0) / meters_per_deg_lat
    d_lon = (width_m / 2.0) / meters_per_deg_lon

    return [
        [round(center_lat + d_lat, 7), round(center_lon - d_lon, 7)],
        [round(center_lat + d_lat, 7), round(center_lon + d_lon, 7)],
        [round(center_lat - d_lat, 7), round(center_lon + d_lon, 7)],
        [round(center_lat - d_lat, 7), round(center_lon - d_lon, 7)],
    ]


async def query_osm_bbox_buildings(lat: float, lon: float) -> Tuple[Optional[List[List[float]]], List[List[List[float]]], str]:
    """
    Queries official OpenStreetMap API using bounding box around the coordinate (~130m radius).
    Returns:
    - primary_polygon: building containing the point or closest building
    - nearby_polygons: list of all other building footprints in the neighborhood sorted by proximity
    - building_type: detected tag
    """
    delta = 0.0012  # ~130m radius to capture neighborhood rooftops
    min_lon, min_lat = lon - delta, lat - delta
    max_lon, max_lat = lon + delta, lat + delta
    url = f"https://api.openstreetmap.org/api/0.6/map.json?bbox={min_lon},{min_lat},{max_lon},{max_lat}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=NOMINATIM_HEADERS)
            if resp.status_code == 200:
                data = resp.json()
                elements = data.get("elements", [])
                nodes = {e["id"]: [e["lat"], e["lon"]] for e in elements if e.get("type") == "node"}
                ways = [e for e in elements if e.get("type") == "way" and "building" in e.get("tags", {})]

                all_polygons_with_dist = []
                containing_poly = None
                closest_poly = None
                closest_dist = float("inf")
                best_btype = "yes"

                for w in ways:
                    raw_nodes = [nodes[nid] for nid in w.get("nodes", []) if nid in nodes]
                    if len(raw_nodes) >= 3:
                        poly = [[round(p[0], 7), round(p[1], 7)] for p in raw_nodes]
                        if poly[0] == poly[-1] and len(poly) > 3:
                            poly = poly[:-1]

                        area = calculate_geodesic_polygon_area_sqft(poly)
                        if 100.0 <= area <= 200000.0:
                            btype = w.get("tags", {}).get("building", "yes")

                            # Center distance
                            c_lat = sum(p[0] for p in poly) / len(poly)
                            c_lon = sum(p[1] for p in poly) / len(poly)
                            dist = (c_lat - lat) ** 2 + (c_lon - lon) ** 2

                            all_polygons_with_dist.append((dist, poly, btype))

                            # Point in polygon check
                            if point_in_polygon(lat, lon, poly):
                                containing_poly = poly
                                best_btype = btype

                            if dist < closest_dist:
                                closest_dist = dist
                                closest_poly = poly
                                if not containing_poly:
                                    best_btype = btype

                # Sort by distance
                all_polygons_with_dist.sort(key=lambda x: x[0])

                chosen = containing_poly
                # If not inside any building, but closest building is within ~40m, select it
                if not chosen and closest_poly and closest_dist < (0.0004 ** 2):
                    chosen = closest_poly

                nearby = [p for _, p, _ in all_polygons_with_dist if p != chosen][:25]
                return chosen, nearby, best_btype

    except Exception as e:
        logger.debug(f"OSM bbox query failed: {e}")

    return None, [], "unknown"


async def reverse_geocode_location(lat: float, lon: float) -> Tuple[dict, Optional[List[List[float]]]]:
    """
    Reverse geocodes coordinates to address, city, state, and extracts GeoJSON polygon if available.
    """
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&polygon_geojson=1&zoom=18&addressdetails=1"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, headers=NOMINATIM_HEADERS)
            if res.status_code == 200:
                data = res.json()
                address = data.get("address", {})
                city = (
                    address.get("city")
                    or address.get("town")
                    or address.get("suburb")
                    or address.get("city_district")
                    or address.get("county")
                    or "Bengaluru"
                )
                state = address.get("state", "Karnataka")
                postcode = address.get("postcode", "")
                display_name = data.get("display_name", f"{city}, {state}")

                extracted_polygon = None
                geojson = data.get("geojson", {})
                gtype = geojson.get("type")
                coords = geojson.get("coordinates", [])

                if gtype == "Polygon" and coords and len(coords[0]) >= 3:
                    extracted_polygon = [[round(p[1], 7), round(p[0], 7)] for p in coords[0]]
                    if extracted_polygon[0] == extracted_polygon[-1] and len(extracted_polygon) > 3:
                        extracted_polygon = extracted_polygon[:-1]

                return {
                    "formatted_address": display_name,
                    "city": city,
                    "state": state,
                    "postcode": postcode,
                }, extracted_polygon
    except Exception as e:
        logger.warning(f"Reverse geocode failed: {e}")

    return {
        "formatted_address": f"Location ({round(lat, 4)}, {round(lon, 4)})",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postcode": ""
    }, None


async def search_places(query: str) -> List[dict]:
    """
    Geocodes text search query across India with intelligent fallback and pincode detection.
    """
    clean_q = query.strip()
    if not clean_q or len(clean_q) < 2:
        return []

    # If user entered 6 digit pincode
    params = {
        "q": clean_q,
        "format": "json",
        "addressdetails": 1,
        "countrycodes": "in",
        "limit": 8
    }

    url = "https://nominatim.openstreetmap.org/search"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, params=params, headers=NOMINATIM_HEADERS)
            if res.status_code == 200:
                data = res.json()
                results = []
                for item in data:
                    addr = item.get("address", {})
                    city = (
                        addr.get("city")
                        or addr.get("town")
                        or addr.get("suburb")
                        or addr.get("city_district")
                        or addr.get("state_district")
                        or ""
                    )
                    state = addr.get("state", "")
                    results.append({
                        "display_name": item.get("display_name", ""),
                        "latitude": float(item["lat"]),
                        "longitude": float(item["lon"]),
                        "city": city,
                        "state": state
                    })
                return results
    except Exception as e:
        logger.warning(f"Search places failed: {e}")

    return []


async def detect_rooftop_footprint(
    lat: float, lon: float, property_type: str = "Residential"
) -> dict:
    """
    Primary Rooftop Identification Engine:
    1. Queries official OSM API for exact building footprints in neighborhood (~130m).
    2. Uses Nominatim reverse geocode polygon as additional high-accuracy source.
    3. If neither has the building mapped, synthesizes an initial shape.
    4. Computes geodesic area and usable solar area.
    """
    geo_info, nominatim_poly = await reverse_geocode_location(lat, lon)
    osm_poly, nearby_polys, b_type = await query_osm_bbox_buildings(lat, lon)

    polygon = None
    source = "AI_HEURISTIC_SYNTHESIS"
    confidence = 0.80

    if osm_poly:
        polygon = osm_poly
        source = "OSM_VECTOR_FOOTPRINT"
        confidence = 0.96
    elif nominatim_poly:
        polygon = nominatim_poly
        source = "OSM_VECTOR_FOOTPRINT"
        confidence = 0.94
        b_type = "building"
    else:
        # Fallback synthesis based on property type
        if property_type.lower() == "commercial":
            target_area = 3500.0
            aspect = 1.5
        elif property_type.lower() == "plot":
            target_area = 2400.0
            aspect = 1.5
        else:
            target_area = 1200.0
            aspect = 1.33

        polygon = synthesize_rooftop_polygon(lat, lon, target_area, aspect)
        source = "AI_HEURISTIC_SYNTHESIS"
        confidence = 0.80
        b_type = property_type.lower()

    gross_area_sqft = calculate_geodesic_polygon_area_sqft(polygon)
    if gross_area_sqft < 100.0:
        gross_area_sqft = 1200.0

    usable_area_sqft = round(gross_area_sqft * 0.75, 1)
    estimated_kw = round(max(1.0, usable_area_sqft / 100.0), 1)

    return {
        "latitude": lat,
        "longitude": lon,
        "formatted_address": geo_info["formatted_address"],
        "city": geo_info["city"],
        "state": geo_info["state"],
        "postcode": geo_info["postcode"],
        "gross_area_sqft": round(gross_area_sqft, 1),
        "usable_area_sqft": usable_area_sqft,
        "source": source,
        "polygon": polygon,
        "confidence_score": confidence,
        "building_type": b_type,
        "estimated_max_kw": estimated_kw,
        "nearby_polygons": nearby_polys
    }
