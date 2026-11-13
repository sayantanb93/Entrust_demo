from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Printer Console Demo API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRINTERS: list[dict[str, Any]] = [
    {
        "id": "p-18312", "name": "0_R4 NM18312", "printer_type": "CR805",
        "device_id": "9D4414A3960DEC80", "status": "Idle", "cards_printed": 8249,
        "model": "CR805", "serial_number": "NM18312", "ip_address": "10.0.0.38",
        "quiet_mode": False, "supplies": [{"name": "Retransfer Film", "percent": 74}, {"name": "CMYK", "percent": 96}],
        "cleaning_percent": 82, "cards_until_cleaning": 433, "activity": [], "hoppers": ["Hopper 1"],
        "firmware": "D4.5.1-13", "last_checked": "Nov 10, 2026 9:15 AM",
    },
    {
        "id": "p-0ds2c", "name": "0_DS2C", "printer_type": "Sigma DS2C",
        "device_id": "CB630251B8B6F471", "status": "Timeout", "cards_printed": 126,
        "model": "Sigma DS2C", "serial_number": "CB630251", "ip_address": "10.0.0.42",
        "quiet_mode": None, "supplies": [], "cleaning_percent": 22,
        "cards_until_cleaning": 1500, "activity": [], "hoppers": [], "firmware": "D4.5.0-2",
        "last_checked": "Nov 10, 2026 8:42 AM",
    },
    {
        "id": "p-xc10051", "name": "irfan home", "printer_type": "Sigma DS3",
        "device_id": "EA3F903908254251", "status": "Idle", "cards_printed": 3793,
        "model": "Sigma DS3", "serial_number": "XC10051", "ip_address": "10.0.0.51",
        "quiet_mode": True, "supplies": [{"name": "Ribbon", "percent": 61}],
        "cleaning_percent": 90, "cards_until_cleaning": 433, "activity": ["Job 8372 — Completed"],
        "hoppers": ["Hopper 1"], "firmware": "D4.5.1-13", "last_checked": "Nov 9, 2026 4:32 PM",
    },
    {
        "id": "p-fwdex", "name": "fwdev XC10028", "printer_type": "SIGMA",
        "device_id": "E1FEC3042A91D551", "status": "Busy", "cards_printed": 2815,
        "model": "Sigma DS3", "serial_number": "XC10028", "ip_address": "10.0.0.60",
        "quiet_mode": False, "supplies": [{"name": "Ribbon", "percent": 45}],
        "cleaning_percent": 70, "cards_until_cleaning": 205, "activity": ["Job 8368 — Printing"],
        "hoppers": ["Hopper 1", "Hopper 2"], "firmware": "D4.5.1-12", "last_checked": "Nov 8, 2026 11:10 AM",
    },
]

CREDENTIALS = [
    {"id": f"cred-{i}", "name": name, "kind": kind}
    for i, (name, kind) in enumerate([
        ("00KNFileSystem", "Employee badge"), ("00compositeStatic", "Access card"),
        ("00JapanUpload", "Visitor pass"), ("Staff Access", "Employee badge"),
        ("Temporary ID", "Visitor pass"), ("Campus Standard", "Access card"),
        ("Contractor Blue", "Contractor badge"), ("Regional Access", "Access card"),
    ], start=1)
]

DETAILS: dict[str, dict[str, Any]] = {
    "p-18312": {
        "product_data": [
            ("Printer Name", "0_R4 NM18312"), ("Manufacturer", "Printer Console Demo"),
            ("Model", "CR805"), ("Agency Model", "CR805"), ("Part Number", "529773-004"),
            ("Serial Number", "NM18312"), ("State", "IDLE"), ("Seconds On", "392808"),
        ],
        "network": [("IPv4 Address", "10.0.0.38"), ("Gateway", "10.0.0.1"), ("Netmask", "255.255.255.0"), ("MAC Address", "d8:80:39:49:64:68")],
        "serial_numbers": [("Printer Name", "0_R4 NM18312"), ("Serial Number", "NM18312"), ("Part Number", "529773-004"), ("Device ID", "9D4414A3960DEC80")],
        "versions": [("DPCL", "1.8-1"), ("BuildDate", "Jun 5, 2026 14:25:06"), ("BootLoader", "U-Boot 2025.01"), ("App", "D4.5.1-13"), ("Bsp", "D4.1.25-4"), ("Platform", "DS3"), ("MainBoardType", "0"), ("MainBoardRevision", "0"), ("Fpga", "534"), ("Auth", "1"), ("CyanTable", "6D0E2B7A"), ("MagentaTable", "6D0E2B7A"), ("YellowTable", "6D0E2B7A"), ("BlackTable", "CBF2BECF"), ("TopcoatTable", "CDB6CB69")],
        "options": ["ActivityLogExternal", "ActivityLogInternal", "AutoCleaningCard", "AutoDuplex", "Canvas_Color300x300", "SmartCardReader"],
    }
}

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "printer-console-demo"}

@app.get("/api/printers")
def list_printers() -> dict[str, Any]:
    return {"printers": PRINTERS, "count": len(PRINTERS)}

@app.get("/api/printers/{printer_id}")
def get_printer(printer_id: str) -> dict[str, Any]:
    printer = next((item for item in PRINTERS if item["id"] == printer_id), None)
    if printer is None:
        raise HTTPException(status_code=404, detail="Printer not found")
    return printer

@app.get("/api/printers/{printer_id}/details")
def get_printer_details(printer_id: str) -> dict[str, Any]:
    printer = get_printer(printer_id)
    if printer_id in DETAILS:
        return DETAILS[printer_id]
    return {
        "product_data": [
            ("Printer Name", printer["name"]), ("Manufacturer", "Printer Console Demo"),
            ("Model", printer["model"]), ("Agency Model", printer["model"]),
            ("Serial Number", printer["serial_number"]), ("State", printer["status"].upper()),
        ],
        "network": [("IPv4 Address", printer["ip_address"]), ("Gateway", "10.0.0.1"), ("Netmask", "255.255.255.0")],
        "serial_numbers": [("Printer Name", printer["name"]), ("Serial Number", printer["serial_number"]), ("Device ID", printer["device_id"])],
        "versions": [("App", printer["firmware"]), ("Platform", printer["model"]), ("MainBoardRevision", "0")],
        "options": ["ActivityLogExternal", "AutoCleaningCard", "AutoDuplex"],
    }

@app.get("/api/credentials")
def list_credentials() -> dict[str, Any]:
    return {"credentials": CREDENTIALS, "count": len(CREDENTIALS)}
