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

    avg_safety = db.query(func.avg(Driver.safetyScore)).scalar() or 0

    utilization_rate = round((active_vehicles / total_vehicles * 100) if total_vehicles else 0, 1)

    return {
        "fleet": {
            "total": total_vehicles,
            "active": active_vehicles,
            "inShop": in_shop_vehicles,
            "available": available_vehicles,
            "utilizationRate": utilization_rate,
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
