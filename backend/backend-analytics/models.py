from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from database import Base
import enum


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ON_TRIP   = "ON_TRIP"
    IN_SHOP   = "IN_SHOP"
    RETIRED   = "RETIRED"


class TripStatus(str, enum.Enum):
    DRAFT      = "DRAFT"
    DISPATCHED = "DISPATCHED"
    COMPLETED  = "COMPLETED"
    CANCELLED  = "CANCELLED"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id              = Column(Integer, primary_key=True, index=True)
    nameModel       = Column(String(255))
    licensePlate    = Column(String(100), unique=True)
    maxCapacityKg   = Column(Integer)
    odometer        = Column(Float, default=0)
    status          = Column(Enum(VehicleStatus), default=VehicleStatus.AVAILABLE)
    acquisitionCost = Column(Float)

    trips           = relationship("Trip",           back_populates="vehicle")
    maintenance_logs= relationship("MaintenanceLog", back_populates="vehicle")
    expenses        = relationship("Expense",        back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id                = Column(Integer, primary_key=True, index=True)
    name              = Column(String(255))
    licenseExpiryDate = Column(DateTime)
    status            = Column(String(50))
    safetyScore       = Column(Integer, default=100)

    trips             = relationship("Trip", back_populates="driver")


class Trip(Base):
    __tablename__ = "trips"

    id          = Column(Integer, primary_key=True, index=True)
    vehicleId   = Column(Integer, ForeignKey("vehicles.id"))
    driverId    = Column(Integer, ForeignKey("drivers.id"))
    cargoWeight = Column(Float)
    status      = Column(Enum(TripStatus), default=TripStatus.DRAFT)
    revenue     = Column(Float, default=0)
    startDate   = Column(DateTime)
    endDate     = Column(DateTime, nullable=True)

    vehicle     = relationship("Vehicle", back_populates="trips")
    driver      = relationship("Driver",  back_populates="trips")
    expenses    = relationship("Expense", back_populates="trip")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id          = Column(Integer, primary_key=True, index=True)
    vehicleId   = Column(Integer, ForeignKey("vehicles.id"))
    description = Column(String(500))
    cost        = Column(Float)
    date        = Column(DateTime)

    vehicle     = relationship("Vehicle", back_populates="maintenance_logs")


class Expense(Base):
    __tablename__ = "expenses"

    id         = Column(Integer, primary_key=True, index=True)
    tripId     = Column(Integer, ForeignKey("trips.id"), nullable=True)
    vehicleId  = Column(Integer, ForeignKey("vehicles.id"))
    fuelLiters = Column(Float)
    fuelCost   = Column(Float)
    date       = Column(DateTime)

    trip       = relationship("Trip",    back_populates="expenses")
    vehicle    = relationship("Vehicle", back_populates="expenses")
