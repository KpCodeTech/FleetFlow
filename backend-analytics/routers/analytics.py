import csv
import io
from typing import List
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER
import datetime

from database import get_db
from models import Vehicle, Driver, Trip, MaintenanceLog, Expense, TripStatus

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── GET /analytics/summary ───────────────────────────────────────────────────
@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    """Fleet command center summary for the dashboard."""
    total_vehicles    = db.query(Vehicle).count()
    active_vehicles   = db.query(Vehicle).filter(Vehicle.status == "ON_TRIP").count()
    in_shop_vehicles  = db.query(Vehicle).filter(Vehicle.status == "IN_SHOP").count()
    available_vehicles= db.query(Vehicle).filter(Vehicle.status == "AVAILABLE").count()

    total_drivers  = db.query(Driver).count()
    active_drivers = db.query(Driver).filter(Driver.status == "ON_DUTY").count()

    total_revenue    = db.query(func.sum(Trip.revenue)).filter(Trip.status == TripStatus.COMPLETED).scalar() or 0
    total_fuel_cost  = db.query(func.sum(Expense.fuelCost)).scalar() or 0
    total_maint_cost = db.query(func.sum(MaintenanceLog.cost)).scalar() or 0

    completed_trips  = db.query(Trip).filter(Trip.status == TripStatus.COMPLETED).count()
    active_trips     = db.query(Trip).filter(Trip.status == TripStatus.DISPATCHED).count()
    pending_cargo    = db.query(Trip).filter(Trip.status == TripStatus.DRAFT).count()

    avg_safety = db.query(func.avg(Driver.safetyScore)).scalar() or 0

    utilization_rate = round((active_vehicles / total_vehicles * 100) if total_vehicles else 0, 1)

    # Dead stock count (Available + No trips in 14 days)
    fourteen_days_ago = datetime.datetime.now() - datetime.timedelta(days=14)
    dead_stock_query = db.query(Vehicle).filter(Vehicle.status == "AVAILABLE")
    dead_stock_count = 0
    for v in dead_stock_query.all():
        last_trip = db.query(Trip).filter(Trip.vehicleId == v.id, Trip.status == TripStatus.COMPLETED).order_by(Trip.endDate.desc()).first()
        if not last_trip or (last_trip.endDate and last_trip.endDate < fourteen_days_ago):
            dead_stock_count += 1

    return {
        "fleet": {
            "total": total_vehicles,
            "active": active_vehicles,
            "inShop": in_shop_vehicles,
            "available": available_vehicles,
            "utilizationRate": utilization_rate,
            "deadStockCount": dead_stock_count,
        },
        "drivers": {
            "total": total_drivers,
            "onDuty": active_drivers,
            "avgSafetyScore": round(float(avg_safety), 1),
        },
        "financials": {
            "totalRevenue": round(float(total_revenue), 2),
            "totalFuelCost": round(float(total_fuel_cost), 2),
            "totalMaintenanceCost": round(float(total_maint_cost), 2),
            "netProfit": round(float(total_revenue) - float(total_fuel_cost) - float(total_maint_cost), 2),
        },
        "trips": {
            "completed": completed_trips,
            "active": active_trips,
            "pendingCargo": pending_cargo,
        },
    }


# ── GET /analytics/fuel-efficiency ──────────────────────────────────────────
@router.get("/fuel-efficiency")
def get_fuel_efficiency(db: Session = Depends(get_db)):
    """
    Calculate km/L fuel efficiency per vehicle.
    Uses total fuel consumed and odometer readings for estimation.
    """
    vehicles = db.query(Vehicle).all()
    results  = []

    for v in vehicles:
        total_fuel = db.query(func.sum(Expense.fuelLiters)).filter(Expense.vehicleId == v.id).scalar() or 0
        total_cost = db.query(func.sum(Expense.fuelCost)).filter(Expense.vehicleId == v.id).scalar() or 0
        trips_done = db.query(Trip).filter(
            Trip.vehicleId == v.id,
            Trip.status == TripStatus.COMPLETED
        ).count()

        # Estimate km driven based on odometer (subtract reasonable initial offset)
        km_driven = v.odometer  # full odometer as a proxy for total distance

        efficiency = round(km_driven / total_fuel, 2) if total_fuel > 0 else None

        results.append({
            "vehicleId":    v.id,
            "nameModel":    v.nameModel,
            "licensePlate": v.licensePlate,
            "status":       v.status,
            "odometer":     v.odometer,
            "totalFuelLiters": round(float(total_fuel), 2),
            "totalFuelCost":   round(float(total_cost), 2),
            "kmPerLiter":      efficiency,
            "completedTrips":  trips_done,
        })

    results.sort(key=lambda x: x["kmPerLiter"] or 0, reverse=True)
    return results


# ── GET /analytics/dead-stock ────────────────────────────────────────────────
@router.get("/dead-stock")
def get_dead_stock(db: Session = Depends(get_db)):
    """
    Find vehicles that are AVAILABLE but haven't been on a trip in 14+ days.
    """
    fourteen_days_ago = datetime.datetime.now() - datetime.timedelta(days=14)
    available_vehicles = db.query(Vehicle).filter(Vehicle.status == "AVAILABLE").all()
    
    dead_stock = []
    for v in available_vehicles:
        last_trip = db.query(Trip).filter(
            Trip.vehicleId == v.id,
            Trip.status == TripStatus.COMPLETED
        ).order_by(Trip.endDate.desc()).first()
        
        is_dead = False
        days_idle = None
        
        if not last_trip:
            is_dead = True
            days_idle = 999 # never used
        elif last_trip.endDate and last_trip.endDate < fourteen_days_ago:
            is_dead = True
            days_idle = (datetime.datetime.now() - last_trip.endDate).days
            
        if is_dead:
            dead_stock.append({
                "vehicleId":    v.id,
                "nameModel":    v.nameModel,
                "licensePlate": v.licensePlate,
                "daysIdle":     days_idle,
                "lastTripEnd":  last_trip.endDate if last_trip else None,
            })
            
    return dead_stock


# ── GET /analytics/vehicle-roi/{vehicle_id} ──────────────────────────────────
@router.get("/vehicle-roi/{vehicle_id}")
def get_vehicle_roi(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Vehicle not found")

    total_revenue = db.query(func.sum(Trip.revenue)).filter(
        Trip.vehicleId == vehicle_id,
        Trip.status    == TripStatus.COMPLETED
    ).scalar() or 0

    total_maintenance = db.query(func.sum(MaintenanceLog.cost)).filter(
        MaintenanceLog.vehicleId == vehicle_id
    ).scalar() or 0

    total_fuel = db.query(func.sum(Expense.fuelCost)).filter(
        Expense.vehicleId == vehicle_id
    ).scalar() or 0

    total_costs = float(total_maintenance) + float(total_fuel)
    net_profit  = float(total_revenue) - total_costs

    roi = round(net_profit / float(vehicle.acquisitionCost) * 100, 2) if vehicle.acquisitionCost else 0

    return {
        "vehicleId":          vehicle.id,
        "nameModel":          vehicle.nameModel,
        "licensePlate":       vehicle.licensePlate,
        "acquisitionCost":    vehicle.acquisitionCost,
        "totalRevenue":       round(float(total_revenue), 2),
        "totalMaintenanceCost": round(float(total_maintenance), 2),
        "totalFuelCost":      round(float(total_fuel), 2),
        "totalCosts":         round(total_costs, 2),
        "netProfit":          round(net_profit, 2),
        "roiPercent":         roi,
    }


# ── GET /analytics/all-roi ───────────────────────────────────────────────────
@router.get("/all-roi")
def get_all_roi(db: Session = Depends(get_db)):
    """ROI for every vehicle – used by the FinancialAnalytics dashboard."""
    vehicles = db.query(Vehicle).all()
    return [_compute_roi(v.id, v, db) for v in vehicles]

def _compute_roi(vehicle_id: int, vehicle: Vehicle, db: Session) -> dict:
    total_revenue     = db.query(func.sum(Trip.revenue)).filter(Trip.vehicleId == vehicle_id, Trip.status == TripStatus.COMPLETED).scalar() or 0
    total_maintenance = db.query(func.sum(MaintenanceLog.cost)).filter(MaintenanceLog.vehicleId == vehicle_id).scalar() or 0
    total_fuel        = db.query(func.sum(Expense.fuelCost)).filter(Expense.vehicleId == vehicle_id).scalar() or 0
    total_costs       = float(total_maintenance) + float(total_fuel)
    net_profit        = float(total_revenue) - total_costs
    roi               = round(net_profit / float(vehicle.acquisitionCost) * 100, 2) if vehicle.acquisitionCost else 0
    return {
        "vehicleId": vehicle.id, "nameModel": vehicle.nameModel,
        "licensePlate": vehicle.licensePlate, "acquisitionCost": vehicle.acquisitionCost,
        "totalRevenue": round(float(total_revenue), 2),
        "totalMaintenanceCost": round(float(total_maintenance), 2),
        "totalFuelCost": round(float(total_fuel), 2),
        "totalCosts": round(total_costs, 2),
        "netProfit": round(net_profit, 2), "roiPercent": roi,
    }


# ── GET /analytics/export ────────────────────────────────────────────────────
@router.get("/export")
def export_fleet_audit(db: Session = Depends(get_db)):
    """
    Generate and return a downloadable CSV of the fleet health & financial audit.
    """
    vehicles = db.query(Vehicle).all()
    output   = io.StringIO()
    writer   = csv.writer(output)

    # Header
    writer.writerow([
        "Vehicle ID", "Model", "License Plate", "Status", "Odometer (km)",
        "Acquisition Cost (₹)", "Total Revenue (₹)", "Maintenance Cost (₹)",
        "Fuel Cost (₹)", "Net Profit (₹)", "ROI (%)",
        "Total Trips", "Avg Safety Score (Drivers)",
    ])

    for v in vehicles:
        data = _compute_roi(v.id, v, db)
        trips_count = db.query(Trip).filter(Trip.vehicleId == v.id, Trip.status == TripStatus.COMPLETED).count()
        driver_scores = [
            t.driver.safetyScore for t in
            db.query(Trip).filter(Trip.vehicleId == v.id).all()
            if t.driver
        ]
        avg_score = round(sum(driver_scores) / len(driver_scores), 1) if driver_scores else "N/A"

        writer.writerow([
            v.id, v.nameModel, v.licensePlate, v.status, v.odometer,
            v.acquisitionCost, data["totalRevenue"], data["totalMaintenanceCost"],
            data["totalFuelCost"], data["netProfit"], data["roiPercent"],
            trips_count, avg_score,
        ])


    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fleetflow_audit.csv"},
    )


# ── GET /analytics/export-pdf ─────────────────────────────────────────────────
@router.get("/export-pdf")
def export_fleet_pdf(db: Session = Depends(get_db)):
    """
    Generate and return a downloadable PDF fleet health & financial audit report.
    """
    vehicles = db.query(Vehicle).all()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=landscape(A4),
        rightMargin=1.5*cm, leftMargin=1.5*cm,
        topMargin=1.5*cm, bottomMargin=1.5*cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('title', fontSize=16, fontName='Helvetica-Bold',
                                 alignment=TA_CENTER, spaceAfter=6)
    sub_style   = ParagraphStyle('sub', fontSize=9, fontName='Helvetica',
                                 alignment=TA_CENTER, textColor=colors.grey, spaceAfter=12)

    elements = [
        Paragraph("FleetFlow — Fleet Audit Report", title_style),
        Paragraph(f"Generated on {datetime.date.today().strftime('%d %B %Y')}", sub_style),
        Spacer(1, 0.3*cm),
    ]

    # Table header
    header = ["Vehicle", "Plate", "Status", "Odo (km)", "Acq. Cost (₹)",
              "Revenue (₹)", "Maint. (₹)", "Fuel (₹)", "Net Profit (₹)", "ROI %"]
    table_data = [header]

    total_rev = total_maint = total_fuel = total_net = 0

    for v in vehicles:
        d = _compute_roi(v.id, v, db)
        table_data.append([
            v.nameModel, v.licensePlate, v.status,
            f"{v.odometer:,.0f}",
            f"{v.acquisitionCost:,.0f}",
            f"{d['totalRevenue']:,.0f}",
            f"{d['totalMaintenanceCost']:,.0f}",
            f"{d['totalFuelCost']:,.0f}",
            f"{d['netProfit']:,.0f}",
            f"{d['roiPercent']:.2f}%",
        ])
        total_rev   += d['totalRevenue']
        total_maint += d['totalMaintenanceCost']
        total_fuel  += d['totalFuelCost']
        total_net   += d['netProfit']

    # Totals row
    table_data.append([
        "TOTALS", "", "", "", "",
        f"{total_rev:,.0f}",
        f"{total_maint:,.0f}",
        f"{total_fuel:,.0f}",
        f"{total_net:,.0f}", "",
    ])

    col_widths = [4.5*cm, 2.8*cm, 2.2*cm, 2.2*cm, 3.0*cm, 3.0*cm, 2.8*cm, 2.8*cm, 3.0*cm, 2.0*cm]
    t = Table(table_data, colWidths=col_widths, repeatRows=1)

    t.setStyle(TableStyle([
        # Header
        ('BACKGROUND',   (0, 0), (-1, 0), colors.HexColor('#161b22')),
        ('TEXTCOLOR',    (0, 0), (-1, 0), colors.HexColor('#58a6ff')),
        ('FONTNAME',     (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0, 0), (-1, 0), 8),
        ('ALIGN',        (0, 0), (-1, 0), 'CENTER'),
        # Body
        ('FONTSIZE',     (0, 1), (-1, -2), 8),
        ('ALIGN',        (3, 1), (-1, -2), 'RIGHT'),
        ('TEXTCOLOR',    (0, 1), (-1, -2), colors.HexColor('#e6edf3')),
        ('BACKGROUND',   (0, 1), (-1, -2), colors.HexColor('#0d1117')),
        ('ROWBACKGROUNDS',(0, 1), (-1, -2), [colors.HexColor('#0d1117'), colors.HexColor('#1c2333')]),
        ('GRID',         (0, 0), (-1, -1), 0.25, colors.HexColor('#30363d')),
        # Totals row
        ('BACKGROUND',   (0, -1), (-1, -1), colors.HexColor('#21262d')),
        ('FONTNAME',     (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR',    (0, -1), (-1, -1), colors.HexColor('#e3b341')),
        ('FONTSIZE',     (0, -1), (-1, -1), 8),
        ('ALIGN',        (3, -1), (-1, -1), 'RIGHT'),
    ]))
    elements.append(t)
    doc.build(elements)

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=fleetflow_audit_{datetime.date.today()}.pdf"},
    )


# ── GET /analytics/export-payroll ─────────────────────────────────────────────
@router.get("/export-payroll")
def export_payroll(db: Session = Depends(get_db)):
    """
    Monthly Driver Payroll & Performance Report — CSV download.
    Columns: Driver Name, Total Trips, Completed Trips, Completion Rate (%),
             Revenue Generated (₹), Avg Safety Score, License Expiry, Status.
    """
    drivers = db.query(Driver).all()
    output  = io.StringIO()
    writer  = csv.writer(output)

    writer.writerow([
        "Driver ID", "Driver Name", "Status",
        "Total Trips", "Completed Trips", "Completion Rate (%)",
        "Revenue Generated (₹)", "Avg Safety Score",
        "License Expiry Date", "License Status",
    ])

    for d in drivers:
        total_trips     = db.query(Trip).filter(Trip.driverId == d.id).count()
        completed_trips = db.query(Trip).filter(
            Trip.driverId == d.id,
            Trip.status   == TripStatus.COMPLETED,
        ).count()

        completion_rate = round((completed_trips / total_trips) * 100, 1) if total_trips > 0 else 0

        revenue_generated = db.query(func.sum(Trip.revenue)).filter(
            Trip.driverId == d.id,
            Trip.status   == TripStatus.COMPLETED,
        ).scalar() or 0

        license_status = "EXPIRED" if d.licenseExpiryDate and d.licenseExpiryDate < datetime.datetime.now() else "VALID"
        expiry_str     = d.licenseExpiryDate.strftime("%d-%m-%Y") if d.licenseExpiryDate else "N/A"

        writer.writerow([
            d.id, d.name, d.status,
            total_trips, completed_trips, f"{completion_rate}%",
            round(float(revenue_generated), 2), d.safetyScore,
            expiry_str, license_status,
        ])

    output.seek(0)
    filename = f"fleetflow_payroll_{datetime.date.today()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

