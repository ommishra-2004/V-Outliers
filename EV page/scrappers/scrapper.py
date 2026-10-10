
import time
import requests
import pandas as pd

from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# ============================================================
# CONFIGURATION
# ============================================================

BASE_URL = "https://analytics.parivahan.gov.in/analytics"

RTO_URL = f"{BASE_URL}/json_rtos"
MONTHLY_URL = (
    f"{BASE_URL}/publicdashboard/vahandashboard/"
    "durationWiseRegistrationTable"
)

FROM_YEAR = 2024
TO_YEAR = 2026

OUTPUT_FILE = "India_RTO_Monthly_EV_Registrations.xlsx"

# VAHAN state codes. Verify the current dashboard dropdown
# for newly merged UTs or codes that may no longer be supported.
STATE_CODES = {
    "AN": "Andaman and Nicobar Islands",
    "AP": "Andhra Pradesh",
    "AR": "Arunachal Pradesh",
    "AS": "Assam",
    "BR": "Bihar",
    "CH": "Chandigarh",
    "CG": "Chhattisgarh",
    "DL": "Delhi",
    "GA": "Goa",
    "GJ": "Gujarat",
    "HR": "Haryana",
    "HP": "Himachal Pradesh",
    "JK": "Jammu and Kashmir",
    "JH": "Jharkhand",
    "KA": "Karnataka",
    "KL": "Kerala",
    "LA": "Ladakh",
    "LD": "Lakshadweep",
    "MP": "Madhya Pradesh",
    "MH": "Maharashtra",
    "MN": "Manipur",
    "ML": "Meghalaya",
    "MZ": "Mizoram",
    "NL": "Nagaland",
    "OD": "Odisha",
    "PB": "Punjab",
    "PY": "Puducherry",
    "RJ": "Rajasthan",
    "SK": "Sikkim",
    "TN": "Tamil Nadu",
    "TS": "Telangana",
    "TR": "Tripura",
    "UP": "Uttar Pradesh",
    "UK": "Uttarakhand",
    "WB": "West Bengal",
}

VEHICLE_FUELS = [
    "ELECTRIC(BOV)",
    "PLUG-IN HYBRID EV",
    "PURE EV",
    "STRONG HYBRID EV",
]

EV_TYPES = [
    "ELECTRIC BOV",
    "PLUG IN HYBRID EV",
    "PURE EV",
    "STRONG HYBRID EV",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json, text/plain, */*",
    "Referer": (
        f"{BASE_URL}/publicdashboard/vahan?lang=en"
    ),
}

# True skips entries whose names look like dealerships.
# Review the master list before excluding anything permanently.
EXCLUDE_DEALER_ENTRIES = True


# ============================================================
# SESSION AND RETRIES
# ============================================================

def create_session():
    session = requests.Session()

    retry = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )

    adapter = HTTPAdapter(max_retries=retry)

    session.mount("https://", adapter)
    session.headers.update(HEADERS)

    return session


# ============================================================
# AUTOMATIC RTO DISCOVERY
# ============================================================

def get_rtos_for_state(session, state_code, state_name):
    response = session.get(
        RTO_URL,
        params={"stateCode": state_code},
        timeout=30,
    )
    response.raise_for_status()

    data = response.json()

    if not isinstance(data, list):
        raise ValueError("Unexpected RTO master response")

    rtos = []

    for item in data:
        rto_name = str(item.get("rtoName", "")).strip()
        rto_code = item.get("rtoCode")

        if rto_code is None or not rto_name:
            continue

        # Optional exclusion of dealer-type entries.
        if EXCLUDE_DEALER_ENTRIES:
            name_upper = rto_name.upper()

            if (
                "M/S " in name_upper
                or "M/S." in name_upper
                or "DEALER" in name_upper
            ):
                continue

        rtos.append({
            "stateCode": state_code,
            "stateName": state_name,
            "rtoCode": str(rto_code),
            "rtoName": rto_name,
            "rtoId": item.get("id"),
        })

    return rtos


# ============================================================
# MONTHLY API PARAMETERS
# ============================================================

def build_monthly_params(state_code, rto_code):
    # Use repeated query parameters to match the captured
    # dashboard request exactly.
    params = [
        ("stateCode", state_code),
        ("rtoCode", str(rto_code)),
        ("toYear", str(TO_YEAR)),
        ("fromYear", str(FROM_YEAR)),
        ("calendarType", "3"),
        ("timePeriod", "0"),
        ("fitnessCheck", "0"),
        ("vehicleType", ""),
        ("archiveTypeAC", "ACTIVE_COMPLIANT"),
        ("archiveTypeANC", "ACTIVE_NON_COMPLIANT"),
        ("archiveTypePA", ""),
        ("archiveTypeTA", ""),
        ("archiveTypeNA", ""),
    ]

    params.extend(
        ("vehicleFuels[]", fuel)
        for fuel in VEHICLE_FUELS
    )

    params.extend(
        ("evType[]", ev_type)
        for ev_type in EV_TYPES
    )

    return params


# ============================================================
# FETCH ONE RTO'S MONTHLY DATA
# ============================================================

def fetch_monthly_data(session, rto):
    response = session.get(
        MONTHLY_URL,
        params=build_monthly_params(
            rto["stateCode"],
            rto["rtoCode"],
        ),
        timeout=45,
    )
    response.raise_for_status()

    data = response.json()

    if not isinstance(data, list):
        raise ValueError("Unexpected monthly response format")

    rows = []

    for record in data:
        month_label = record.get("yearAsString")
        count = record.get("registeredVehicleCount")

        month_date = pd.to_datetime(
            month_label,
            format="%Y-%B",
            errors="coerce",
        )

        rows.append({
            "State": rto["stateName"],
            "State Code": rto["stateCode"],
            "RTO Name": rto["rtoName"],
            "RTO Code": rto["rtoCode"],
            "Month": (
                month_date.strftime("%Y-%m")
                if pd.notna(month_date)
                else month_label
            ),
            "Registrations": (
                int(count) if count is not None else None
            ),
            "Status": (
                "SUCCESS"
                if count is not None
                else "COUNT_MISSING"
            ),
        })

    return rows


# ============================================================
# MAIN PIPELINE
# ============================================================

def main():
    all_rtos = []
    all_rows = []
    failures = []

    with create_session() as session:

        # Phase 1: Discover all RTOs for configured states.
        print("PHASE 1: Discovering RTOs")

        for state_code, state_name in STATE_CODES.items():
            print(f"Discovering: {state_name} ({state_code})")

            try:
                rtos = get_rtos_for_state(
                    session,
                    state_code,
                    state_name,
                )

                all_rtos.extend(rtos)
                print(f"  Found {len(rtos)} RTO entries")

            except Exception as exc:
                print(f"  RTO discovery failed: {exc}")

                failures.append({
                    "Stage": "RTO_DISCOVERY",
                    "State": state_name,
                    "State Code": state_code,
                    "RTO Code": None,
                    "RTO Name": None,
                    "Error": str(exc),
                })

            time.sleep(0.4)

        # Avoid duplicate state/RTO pairs.
        rto_df = pd.DataFrame(all_rtos)

        if not rto_df.empty:
            rto_df = rto_df.drop_duplicates(
                subset=["stateCode", "rtoCode"]
            )

            all_rtos = rto_df.to_dict("records")

        print(f"\nTotal discovered RTOs: {len(all_rtos)}")

        # Phase 2: Collect monthly data for each RTO.
        print("\nPHASE 2: Downloading monthly registrations")

        for index, rto in enumerate(all_rtos, start=1):
            print(
                f"[{index}/{len(all_rtos)}] "
                f"{rto['stateCode']} | "
                f"{rto['rtoName']} | "
                f"RTO {rto['rtoCode']}"
            )

            try:
                rows = fetch_monthly_data(session, rto)
                all_rows.extend(rows)

                print(f"  Retrieved {len(rows)} records")

                if not rows:
                    failures.append({
                        "Stage": "MONTHLY_DATA",
                        "State": rto["stateName"],
                        "State Code": rto["stateCode"],
                        "RTO Code": rto["rtoCode"],
                        "RTO Name": rto["rtoName"],
                        "Error": "Empty response",
                    })

            except Exception as exc:
                print(f"  Failed: {exc}")

                failures.append({
                    "Stage": "MONTHLY_DATA",
                    "State": rto["stateName"],
                    "State Code": rto["stateCode"],
                    "RTO Code": rto["rtoCode"],
                    "RTO Name": rto["rtoName"],
                    "Error": str(exc),
                })

            time.sleep(0.5)

    # ========================================================
    # EXPORT EXCEL
    # ========================================================

    registrations_df = pd.DataFrame(all_rows)
    rto_master_df = pd.DataFrame(all_rtos)
    failures_df = pd.DataFrame(failures)

    if not registrations_df.empty:
        registrations_df["_sort"] = pd.to_datetime(
            registrations_df["Month"],
            format="%Y-%m",
            errors="coerce",
        )

        registrations_df = (
            registrations_df.sort_values(
                ["State", "RTO Name", "_sort"]
            )
            .drop(columns="_sort")
        )

    with pd.ExcelWriter(
        OUTPUT_FILE,
        engine="openpyxl",
    ) as writer:

        registrations_df.to_excel(
            writer,
            sheet_name="RTO Monthly Data",
            index=False,
        )

        rto_master_df.to_excel(
            writer,
            sheet_name="RTO Master",
            index=False,
        )

        failures_df.to_excel(
            writer,
            sheet_name="Failed Requests",
            index=False,
        )

    print("\n========================================")
    print("COLLECTION FINISHED")
    print(f"RTOs discovered: {len(all_rtos)}")
    print(f"Monthly data rows: {len(registrations_df)}")
    print(f"Failed requests: {len(failures_df)}")
    print(f"Excel saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()