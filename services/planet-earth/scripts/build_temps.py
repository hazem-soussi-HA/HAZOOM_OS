#!/usr/bin/env python3
"""
build_temps.py — transparent climatology model for the Temperature platform.

This does NOT fetch live observations. It produces a *reproducible modeled*
annual-mean temperature for each country from public, checkable inputs:
    - absolute latitude  (the dominant control on annual mean temperature)
    - mean elevation     (with a standard environmental lapse rate)
    - an optional manual continentality tweak

Model (documented in the UI "Methodology" panel and in the JSON meta):
    T(degC) = 27.0
              - 0.0145 * |latitude|^1.8          # latitudinal gradient
              - 0.0065 * elevation_m             # -6.5 C / 1000 m lapse rate
              + continentality_tweak             # optional per-country nudge

This is a teaching/visualization model, not a measurement. The UI clearly
labels the data as "MODELED climatology", never as live readings, and offers
a clearly-marked live-API hook (disabled offline) for real data.

Run:
    python3 scripts/build_temps.py
Outputs data/temperatures.json next to this repo root.
"""
import json
import os
import math
from datetime import datetime, timezone

# name, iso2, iso3, lat, lon, mean_elevation_m, region, continentality_tweak
# Coordinates are approximate country "centroid-ish" reference points.
# Elevations are approximate mean elevations (m). Tweaks are tiny manual
# nudges for well-known continental-interior cold spots / maritime warmth.
COUNTRIES = [
    # Africa
    ("Algeria", "DZ", "DZA", 28.0, 1.7, 800, "Africa", 0.0),
    ("Angola", "AO", "AGO", -11.2, 17.9, 1117, "Africa", 0.0),
    ("Benin", "BJ", "BEN", 9.3, 2.3, 200, "Africa", 0.0),
    ("Botswana", "BW", "BWA", -22.3, 24.7, 1000, "Africa", 0.0),
    ("Burkina Faso", "BF", "BFA", 12.2, -1.5, 316, "Africa", 0.0),
    ("Burundi", "BI", "BDI", -3.4, 29.9, 1743, "Africa", 0.0),
    ("Cameroon", "CM", "CMR", 7.4, 12.4, 667, "Africa", 0.0),
    ("Cape Verde", "CV", "CPV", 16.0, -24.0, 150, "Africa", 1.0),
    ("Central African Republic", "CF", "CAF", 6.6, 20.9, 635, "Africa", 0.0),
    ("Chad", "TD", "TCD", 15.5, 18.7, 543, "Africa", -1.0),
    ("Comoros", "KM", "COM", -11.6, 43.3, 300, "Africa", 1.0),
    ("Congo (Brazzaville)", "CG", "COG", -0.2, 15.8, 430, "Africa", 0.0),
    ("Congo (Kinshasa)", "CD", "COD", -4.0, 21.8, 727, "Africa", 0.0),
    ("Cote d'Ivoire", "CI", "CIV", 7.5, -5.5, 250, "Africa", 0.0),
    ("Djibouti", "DJ", "DJI", 11.8, 42.6, 430, "Africa", 2.0),
    ("Egypt", "EG", "EGY", 26.8, 30.8, 321, "Africa", -1.0),
    ("Equatorial Guinea", "GQ", "GNQ", 1.7, 10.3, 600, "Africa", 0.0),
    ("Eritrea", "ER", "ERI", 15.2, 39.8, 853, "Africa", 0.0),
    ("Eswatini", "SZ", "SWZ", -26.5, 31.5, 340, "Africa", 0.0),
    ("Ethiopia", "ET", "ETH", 9.1, 40.5, 1330, "Africa", -2.0),
    ("Gabon", "GA", "GAB", -0.8, 11.6, 377, "Africa", 0.0),
    ("Gambia", "GM", "GMB", 13.4, -15.3, 34, "Africa", 0.0),
    ("Ghana", "GH", "GHA", 7.9, -1.0, 190, "Africa", 0.0),
    ("Guinea", "GN", "GIN", 9.9, -11.0, 472, "Africa", 0.0),
    ("Guinea-Bissau", "GW", "GNB", 11.8, -15.2, 70, "Africa", 0.0),
    ("Kenya", "KE", "KEN", -0.0, 37.9, 762, "Africa", 0.0),
    ("Lesotho", "LS", "LSO", -29.6, 28.2, 2161, "Africa", -1.0),
    ("Liberia", "LR", "LBR", 6.4, -9.4, 243, "Africa", 0.0),
    ("Libya", "LY", "LBY", 26.3, 17.2, 423, "Africa", -1.0),
    ("Madagascar", "MG", "MDG", -18.8, 46.9, 441, "Africa", 0.0),
    ("Malawi", "MW", "MWI", -13.3, 34.3, 779, "Africa", 0.0),
    ("Mali", "ML", "MLI", 17.6, -4.0, 343, "Africa", -1.0),
    ("Mauritania", "MR", "MRT", 21.0, -10.9, 276, "Africa", 0.0),
    ("Mauritius", "MU", "MUS", -20.3, 57.6, 100, "Africa", 1.5),
    ("Morocco", "MA", "MAR", 31.8, -7.1, 909, "Africa", 0.0),
    ("Mozambique", "MZ", "MOZ", -18.7, 35.5, 345, "Africa", 0.0),
    ("Namibia", "NA", "NAM", -22.96, 18.5, 1090, "Africa", 0.0),
    ("Niger", "NE", "NER", 17.6, 8.1, 472, "Africa", -1.0),
    ("Nigeria", "NG", "NGA", 9.1, 8.7, 380, "Africa", 0.0),
    ("Rwanda", "RW", "RWA", -1.9, 29.9, 1594, "Africa", 0.0),
    ("Sao Tome and Principe", "ST", "STP", 0.2, 6.6, 200, "Africa", 1.0),
    ("Senegal", "SN", "SEN", 14.5, -14.5, 69, "Africa", 0.0),
    ("Seychelles", "SC", "SYC", -4.7, 55.5, 30, "Africa", 1.5),
    ("Sierra Leone", "SL", "SLE", 8.5, -11.8, 279, "Africa", 0.0),
    ("Somalia", "SO", "SOM", 5.2, 46.2, 410, "Africa", 1.0),
    ("South Africa", "ZA", "ZAF", -30.6, 22.9, 1038, "Africa", 0.0),
    ("South Sudan", "SS", "SSD", 7.0, 30.0, 522, "Africa", 0.0),
    ("Sudan", "SD", "SDN", 12.9, 30.2, 568, "Africa", -1.0),
    ("Tanzania", "TZ", "TZA", -6.4, 34.9, 1018, "Africa", 0.0),
    ("Togo", "TG", "TGO", 8.6, 0.8, 236, "Africa", 0.0),
    ("Tunisia", "TN", "TUN", 33.9, 9.5, 246, "Africa", -1.0),
    ("Uganda", "UG", "UGA", 1.4, 32.3, 1100, "Africa", 0.0),
    ("Zambia", "ZM", "ZMB", -13.1, 27.8, 1120, "Africa", 0.0),
    ("Zimbabwe", "ZW", "ZWE", -19.0, 29.2, 916, "Africa", 0.0),
    # Europe
    ("Albania", "AL", "ALB", 41.2, 20.2, 708, "Europe", 0.0),
    ("Andorra", "AD", "AND", 42.5, 1.6, 1996, "Europe", 0.0),
    ("Austria", "AT", "AUT", 47.5, 14.6, 910, "Europe", 0.0),
    ("Belarus", "BY", "BLR", 53.7, 27.9, 160, "Europe", -1.0),
    ("Belgium", "BE", "BEL", 50.5, 4.5, 100, "Europe", 0.0),
    ("Bosnia and Herzegovina", "BA", "BIH", 43.9, 17.7, 500, "Europe", 0.0),
    ("Bulgaria", "BG", "BGR", 42.7, 25.5, 470, "Europe", 0.0),
    ("Croatia", "HR", "HRV", 45.1, 15.2, 332, "Europe", 0.0),
    ("Cyprus", "CY", "CYP", 35.1, 33.4, 400, "Europe", 1.0),
    ("Czechia", "CZ", "CZE", 49.8, 15.5, 430, "Europe", 0.0),
    ("Denmark", "DK", "DNK", 56.0, 9.5, 34, "Europe", 0.0),
    ("Estonia", "EE", "EST", 58.6, 25.0, 61, "Europe", 0.0),
    ("Finland", "FI", "FIN", 64.9, 26.0, 164, "Europe", -1.0),
    ("France", "FR", "FRA", 46.6, 2.2, 375, "Europe", 0.0),
    ("Germany", "DE", "DEU", 51.2, 10.2, 263, "Europe", 0.0),
    ("Greece", "GR", "GRC", 39.1, 21.8, 498, "Europe", 1.0),
    ("Hungary", "HU", "HUN", 47.2, 19.5, 143, "Europe", 0.0),
    ("Iceland", "IS", "ISL", 64.9, -19.0, 557, "Europe", 0.0),
    ("Ireland", "IE", "IRL", 53.4, -8.0, 118, "Europe", 1.0),
    ("Italy", "IT", "ITA", 41.9, 12.6, 538, "Europe", 0.0),
    ("Kosovo", "XK", "XKX", 42.6, 20.9, 600, "Europe", 0.0),
    ("Latvia", "LV", "LVA", 56.9, 24.6, 87, "Europe", 0.0),
    ("Liechtenstein", "LI", "LIE", 47.2, 9.6, 2160, "Europe", 0.0),
    ("Lithuania", "LT", "LTU", 55.2, 23.9, 110, "Europe", 0.0),
    ("Luxembourg", "LU", "LUX", 49.8, 6.1, 325, "Europe", 0.0),
    ("Malta", "MT", "MLT", 35.9, 14.4, 100, "Europe", 1.5),
    ("Moldova", "MD", "MDA", 47.4, 28.4, 139, "Europe", -0.5),
    ("Monaco", "MC", "MCO", 43.7, 7.4, 100, "Europe", 1.0),
    ("Montenegro", "ME", "MNE", 42.7, 19.4, 1086, "Europe", 0.0),
    ("Netherlands", "NL", "NLD", 52.1, 5.3, 30, "Europe", 0.0),
    ("North Macedonia", "MK", "MKD", 41.6, 21.7, 741, "Europe", 0.0),
    ("Norway", "NO", "NOR", 64.6, 11.5, 460, "Europe", 0.0),
    ("Poland", "PL", "POL", 51.9, 19.1, 211, "Europe", -0.5),
    ("Portugal", "PT", "PRT", 39.4, -8.2, 372, "Europe", 1.0),
    ("Romania", "RO", "ROU", 45.9, 24.9, 300, "Europe", -0.5),
    ("Russia", "RU", "RUS", 61.5, 90.0, 600, "Europe", -3.0),
    ("San Marino", "SM", "SMR", 43.9, 12.5, 550, "Europe", 0.0),
    ("Serbia", "RS", "SRB", 44.0, 21.0, 480, "Europe", 0.0),
    ("Slovakia", "SK", "SVK", 48.7, 19.7, 458, "Europe", 0.0),
    ("Slovenia", "SI", "SVN", 46.1, 14.8, 492, "Europe", 0.0),
    ("Spain", "ES", "ESP", 40.0, -3.7, 660, "Europe", 1.0),
    ("Sweden", "SE", "SWE", 62.2, 15.0, 320, "Europe", -1.0),
    ("Switzerland", "CH", "CHE", 46.8, 8.2, 1350, "Europe", -1.0),
    ("Ukraine", "UA", "UKR", 48.4, 31.2, 175, "Europe", -1.0),
    ("United Kingdom", "GB", "GBR", 54.0, -2.0, 162, "Europe", 1.0),
    ("Vatican City", "VA", "VAT", 41.9, 12.45, 60, "Europe", 1.0),
    # Asia
    ("Afghanistan", "AF", "AFG", 33.9, 67.7, 1880, "Asia", -2.0),
    ("Armenia", "AM", "ARM", 40.1, 45.0, 1795, "Asia", -1.0),
    ("Azerbaijan", "AZ", "AZE", 40.1, 47.6, 384, "Asia", 0.0),
    ("Bahrain", "BH", "BHR", 26.0, 50.6, 35, "Asia", 1.0),
    ("Bangladesh", "BD", "BGD", 23.7, 90.4, 85, "Asia", 0.0),
    ("Bhutan", "BT", "BTN", 27.5, 90.4, 2648, "Asia", -1.0),
    ("Brunei", "BN", "BRN", 4.5, 114.7, 500, "Asia", 0.0),
    ("Cambodia", "KH", "KHM", 12.6, 104.9, 126, "Asia", 0.0),
    ("China", "CN", "CHN", 35.9, 104.2, 1840, "Asia", -1.5),
    ("Georgia", "GE", "GEO", 42.3, 43.4, 1430, "Asia", -1.0),
    ("India", "IN", "IND", 22.0, 79.0, 605, "Asia", 0.0),
    ("Indonesia", "ID", "IDN", -2.5, 118.0, 320, "Asia", 0.0),
    ("Iran", "IR", "IRN", 32.4, 53.7, 1300, "Asia", -1.5),
    ("Iraq", "IQ", "IRQ", 33.2, 43.7, 312, "Asia", -1.0),
    ("Israel", "IL", "ISR", 31.0, 34.8, 508, "Asia", 1.0),
    ("Japan", "JP", "JPN", 36.2, 138.3, 438, "Asia", 0.0),
    ("Jordan", "JO", "JOR", 30.6, 36.2, 900, "Asia", 0.0),
    ("Kazakhstan", "KZ", "KAZ", 48.0, 67.0, 387, "Asia", -2.5),
    ("Kuwait", "KW", "KWT", 29.3, 47.5, 108, "Asia", 0.0),
    ("Kyrgyzstan", "KG", "KGZ", 41.2, 74.8, 2988, "Asia", -2.0),
    ("Laos", "LA", "LAO", 19.9, 102.5, 710, "Asia", 0.0),
    ("Lebanon", "LB", "LBN", 33.9, 35.9, 1200, "Asia", 0.0),
    ("Malaysia", "MY", "MYS", 4.2, 109.0, 419, "Asia", 0.0),
    ("Mongolia", "MN", "MNG", 46.9, 103.8, 1520, "Asia", -3.0),
    ("Myanmar", "MM", "MMR", 21.9, 95.96, 702, "Asia", 0.0),
    ("Nepal", "NP", "NPL", 28.4, 84.1, 3265, "Asia", -1.0),
    ("North Korea", "KP", "PRK", 40.3, 127.5, 440, "Asia", -1.0),
    ("Oman", "OM", "OMN", 21.5, 55.9, 310, "Asia", 1.0),
    ("Pakistan", "PK", "PAK", 30.4, 69.3, 900, "Asia", -1.0),
    ("Palestine", "PS", "PSE", 31.9, 35.2, 680, "Asia", 0.0),
    ("Philippines", "PH", "PHL", 12.9, 121.8, 442, "Asia", 0.0),
    ("Qatar", "QA", "QAT", 25.3, 51.2, 28, "Asia", 1.0),
    ("Saudi Arabia", "SA", "SAU", 23.9, 45.1, 665, "Asia", 0.0),
    ("Singapore", "SG", "SGP", 1.35, 103.8, 15, "Asia", 1.0),
    ("South Korea", "KR", "KOR", 36.5, 127.8, 280, "Asia", 0.0),
    ("Sri Lanka", "LK", "LKA", 7.9, 80.8, 228, "Asia", 0.0),
    ("Syria", "SY", "SYR", 34.8, 39.0, 514, "Asia", -0.5),
    ("Taiwan", "TW", "TWN", 23.7, 121.0, 1150, "Asia", 0.0),
    ("Tajikistan", "TJ", "TJK", 38.9, 71.3, 3191, "Asia", -2.0),
    ("Thailand", "TH", "THA", 15.9, 100.99, 287, "Asia", 0.0),
    ("Timor-Leste", "TL", "TLS", -8.9, 125.7, 1220, "Asia", 0.0),
    ("Turkey", "TR", "TUR", 38.96, 35.2, 1132, "Asia", -0.5),
    ("Turkmenistan", "TM", "TKM", 39.1, 59.6, 230, "Asia", -1.5),
    ("United Arab Emirates", "AE", "ARE", 23.4, 53.8, 150, "Asia", 1.0),
    ("Uzbekistan", "UZ", "UZB", 41.4, 64.6, 299, "Asia", -1.5),
    ("Vietnam", "VN", "VNM", 14.06, 108.3, 398, "Asia", 0.0),
    ("Yemen", "YE", "YEM", 15.6, 48.5, 999, "Asia", 0.5),
    # North America
    ("Antigua and Barbuda", "AG", "ATG", 17.1, -61.8, 100, "North America", 1.0),
    ("Bahamas", "BS", "BHS", 25.0, -77.4, 30, "North America", 1.0),
    ("Barbados", "BB", "BRB", 13.2, -59.5, 50, "North America", 1.5),
    ("Belize", "BZ", "BLZ", 17.2, -88.5, 180, "North America", 0.0),
    ("Canada", "CA", "CAN", 56.1, -106.3, 487, "North America", -3.0),
    ("Costa Rica", "CR", "CRI", 9.7, -83.8, 800, "North America", 0.0),
    ("Cuba", "CU", "CUB", 21.5, -77.8, 110, "North America", 1.0),
    ("Dominica", "DM", "DMA", 15.4, -61.4, 300, "North America", 1.0),
    ("Dominican Republic", "DO", "DOM", 18.7, -70.2, 424, "North America", 1.0),
    ("El Salvador", "SV", "SLV", 13.8, -88.9, 442, "North America", 0.0),
    ("Greenland", "GL", "GRL", 71.7, -42.6, 1900, "North America", -4.0),
    ("Grenada", "GD", "GRD", 12.1, -61.7, 200, "North America", 1.5),
    ("Guatemala", "GT", "GTM", 15.8, -90.2, 1090, "North America", 0.0),
    ("Haiti", "HT", "HTI", 19.0, -72.3, 460, "North America", 0.0),
    ("Honduras", "HN", "HND", 15.2, -86.2, 950, "North America", 0.0),
    ("Jamaica", "JM", "JAM", 18.1, -77.3, 300, "North America", 1.0),
    ("Mexico", "MX", "MEX", 23.6, -102.5, 1110, "North America", 0.0),
    ("Nicaragua", "NI", "NIC", 12.9, -85.2, 560, "North America", 0.0),
    ("Panama", "PA", "PAN", 8.5, -80.8, 360, "North America", 0.0),
    ("Saint Kitts and Nevis", "KN", "KNA", 17.4, -62.8, 100, "North America", 1.0),
    ("Saint Lucia", "LC", "LCA", 13.9, -60.98, 150, "North America", 1.5),
    ("Saint Vincent and the Grenadines", "VC", "VCT", 13.0, -61.2, 200, "North America", 1.5),
    ("Trinidad and Tobago", "TT", "TTO", 10.7, -61.2, 83, "North America", 1.0),
    ("United States", "US", "USA", 37.1, -95.7, 760, "North America", -1.0),
    # South America
    ("Argentina", "AR", "ARG", -38.4, -63.6, 595, "South America", -1.0),
    ("Bolivia", "BO", "BOL", -16.3, -63.6, 1192, "South America", -1.0),
    ("Brazil", "BR", "BRA", -10.8, -52.9, 320, "South America", 0.0),
    ("Chile", "CL", "CHL", -35.7, -71.5, 1870, "South America", -1.0),
    ("Colombia", "CO", "COL", 4.6, -74.3, 593, "South America", 0.0),
    ("Ecuador", "EC", "ECU", -1.8, -78.2, 1150, "South America", 0.0),
    ("Guyana", "GY", "GUY", 4.9, -58.9, 280, "South America", 0.0),
    ("Paraguay", "PY", "PRY", -23.4, -58.4, 178, "South America", -0.5),
    ("Peru", "PE", "PER", -9.2, -75.0, 1555, "South America", -0.5),
    ("Suriname", "SR", "SUR", 4.0, -56.0, 246, "South America", 0.0),
    ("Uruguay", "UY", "URY", -32.5, -55.8, 117, "South America", 0.0),
    ("Venezuela", "VE", "VEN", 6.4, -66.6, 450, "South America", 0.0),
    # Oceania
    ("Australia", "AU", "AUS", -25.3, 133.8, 300, "Oceania", -0.5),
    ("Fiji", "FJ", "FJI", -17.7, 178.1, 200, "Oceania", 1.0),
    ("Kiribati", "KI", "KIR", 1.9, -157.4, 10, "Oceania", 1.0),
    ("Marshall Islands", "MH", "MHL", 9.0, 168.0, 10, "Oceania", 1.0),
    ("Micronesia", "FM", "FSM", 7.4, 150.5, 100, "Oceania", 1.0),
    ("Nauru", "NR", "NRU", -0.5, 166.9, 30, "Oceania", 1.0),
    ("New Zealand", "NZ", "NZL", -41.0, 174.0, 388, "Oceania", 0.0),
    ("Palau", "PW", "PLW", 7.5, 134.6, 100, "Oceania", 1.0),
    ("Papua New Guinea", "PG", "PNG", -6.3, 143.9, 667, "Oceania", 0.0),
    ("Samoa", "WS", "WSM", -13.8, -172.1, 200, "Oceania", 1.0),
    ("Solomon Islands", "SB", "SLB", -9.6, 160.2, 300, "Oceania", 1.0),
    ("Tonga", "TO", "TON", -21.2, -175.2, 100, "Oceania", 1.0),
    ("Tuvalu", "TV", "TUV", -8.5, 179.2, 10, "Oceania", 1.0),
    ("Vanuatu", "VU", "VUT", -15.4, 166.9, 300, "Oceania", 1.0),
]


def climate_tweak(name, lat, elev, region, tweak):
    """Correct the continentality tweak.

    The base latitude/elevation formula already captures most of the gradient.
    The manual tweak must reflect *real* continental/interior effect, NOT a
    blanket cold penalty. Hot deserts and Mediterranean coasts are warm, so a
    negative tweak there was wrong and is removed/relaxed. Only genuinely cold
    high-latitude interiors keep a negative nudge; hot arid lands get a small
    positive one (desert warmth).
    """
    hot_desert = {
        "Egypt", "Libya", "Tunisia", "Algeria", "Mali", "Niger", "Chad",
        "Sudan", "Mauritania", "Iraq", "Syria", "Jordan", "Saudi Arabia",
        "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen",
        "Iran", "Pakistan", "Afghanistan", "Turkmenistan", "Uzbekistan",
        "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Mongolia",
    }
    cold_continental = {
        "Greenland", "Russia", "Canada", "Mongolia", "Kazakhstan",
        "Finland", "Sweden", "Belarus", "Ukraine", "Switzerland",
    }
    if name in hot_desert:
        return 1.5                       # deserts run warmer than raw formula
    if name in cold_continental:
        if name in ("Greenland", "Russia", "Canada"):
            return -3.0
        if name in ("Mongolia", "Kazakhstan"):
            return -2.0
        return -1.5
    if elev >= 1500:                     # high mountains are cold even at equator
        return min(tweak, -1.5)
    return 0.0                           # trust latitude/elevation formula


def model_temp(lat, elev, tweak):
    """Transparent climatology model. See module docstring."""
    t = 27.0 - 0.0145 * (abs(lat) ** 1.8) - 0.0065 * elev + tweak
    return round(max(-35.0, min(33.0, t)), 1)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, "data")
    os.makedirs(out_dir, exist_ok=True)

    countries = []
    for name, iso2, iso3, lat, lon, elev, region, tweak in COUNTRIES:
        tweak = climate_tweak(name, lat, elev, region, tweak)
        countries.append({
            "name": name,
            "iso2": iso2,
            "iso3": iso3,
            "lat": lat,
            "lon": lon,
            "elevation_m": elev,
            "region": region,
            "temp_c": model_temp(lat, elev, tweak),
        })

    countries.sort(key=lambda c: c["temp_c"], reverse=True)

    doc = {
        "meta": {
            "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "title": "Worldwide Temperature Climatology (modeled)",
            "source_note": (
                "MODELED climatology — NOT live observations. Annual-mean "
                "temperature reconstructed from public reference inputs "
                "(latitude, mean elevation) via a transparent, reproducible "
                "formula. Use the clearly-marked live-API hook for real-time data."
            ),
            "model": "T = 27.0 - 0.0145*|lat|^1.8 - 0.0065*elev_m + continentality_tweak",
            "units": "celsius",
            "country_count": len(countries),
            "references": [
                "World Bank / CIA World Factbook — approximate country coordinates and mean elevations",
                "Standard environmental lapse rate -6.5 C per 1000 m",
                "Latitude-isolation relationship for annual mean temperature",
            ],
        },
        "countries": countries,
    }

    out_path = os.path.join(out_dir, "temperatures.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)

    # quick sanity report
    hot = countries[0]
    cold = countries[-1]
    print(f"Wrote {out_path}")
    print(f"Countries: {len(countries)}")
    print(f"Hottest (modeled): {hot['name']} {hot['temp_c']} C")
    print(f"Coldest (modeled): {cold['name']} {cold['temp_c']} C")
    print(f"Range: {hot['temp_c'] - cold['temp_c']} C")


if __name__ == "__main__":
    main()
