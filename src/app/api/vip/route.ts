/**
 * BABIRYE v10.0.0 — VIP Protection API Routes
 * Profiles, drones, vehicles, wearables, incidents, and SOS triggering.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ---------------------------------------------------------------------------
// GET — List VIP data by ?view= param
//   profiles  : all VIP profiles with counts (drones/vehicles/wearables/incidents)
//   drones    : all drones
//   vehicles  : all vehicles
//   wearables : all wearables
//   incidents : all incidents
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'profiles';

    switch (view) {
      // ---- Profiles with counts ------------------------------------------------
      case 'profiles': {
        const profiles = await db.vipProfile.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { drones: true, vehicles: true, wearables: true, incidents: true },
            },
          },
        });
        const result = profiles.map((p) => ({
          id: p.id,
          name: p.name,
          designation: p.designation,
          threatLevel: p.threatLevel,
          protectionLevel: p.protectionLevel,
          status: p.status,
          bleTagId: p.bleTagId,
          emergencyContact: p.emergencyContact,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          droneCount: p._count.drones,
          vehicleCount: p._count.vehicles,
          wearableCount: p._count.wearables,
          incidentCount: p._count.incidents,
        }));
        return NextResponse.json({ profiles: result, total: result.length });
      }

      // ---- Drones --------------------------------------------------------------
      case 'drones': {
        const vipId = searchParams.get('vipId');
        const where = vipId ? { vipId } : {};
        const drones = await db.vipDrone.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ drones, total: drones.length });
      }

      // ---- Vehicles ------------------------------------------------------------
      case 'vehicles': {
        const vipId = searchParams.get('vipId');
        const where = vipId ? { vipId } : {};
        const vehicles = await db.vipVehicle.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ vehicles, total: vehicles.length });
      }

      // ---- Wearables -----------------------------------------------------------
      case 'wearables': {
        const vipId = searchParams.get('vipId');
        const where = vipId ? { vipId } : {};
        const wearables = await db.vipWearable.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ wearables, total: wearables.length });
      }

      // ---- Incidents -----------------------------------------------------------
      case 'incidents': {
        const vipId = searchParams.get('vipId');
        const where = vipId ? { vipId } : {};
        const incidents = await db.vipIncident.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ incidents, total: incidents.length });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid view. Use: profiles, drones, vehicles, wearables, incidents' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('VIP GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create VIP entity based on ?type= param
//   ?type=profile|drone|vehicle|wearable|incident
//   ?action=trigger_sos — triggers SOS on a wearable
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const action = searchParams.get('action');

    // ---- SOS trigger ----------------------------------------------------------
    if (action === 'trigger_sos') {
      const body = await request.json();
      const { wearableId } = body;

      if (!wearableId) {
        return NextResponse.json({ error: 'wearableId is required' }, { status: 400 });
      }

      const wearable = await db.vipWearable.findUnique({
        where: { id: wearableId },
        include: { vip: true },
      });

      if (!wearable) {
        return NextResponse.json({ error: 'Wearable not found' }, { status: 404 });
      }

      const updated = await db.vipWearable.update({
        where: { id: wearableId },
        data: {
          sosTriggered: true,
          status: 'alert',
        },
      });

      // Create an SOS incident
      const incident = await db.vipIncident.create({
        data: {
          vipId: wearable.vipId,
          type: 'sos',
          severity: 'critical',
          description: `SOS triggered via ${wearable.deviceName} (${wearable.type})`,
        },
      });

      // Create a notification
      await db.notification.create({
        data: {
          type: 'vip',
          title: `SOS Alert — ${wearable.vip.name}`,
          message: `SOS triggered by ${wearable.deviceName} for ${wearable.vip.name}`,
          severity: 'critical',
          metadata: JSON.stringify({
            vipId: wearable.vipId,
            wearableId: wearable.id,
            incidentId: incident.id,
          }),
        },
      });

      await db.auditLog.create({
        data: {
          userId: auth.payload.userId,
          action: 'trigger_sos',
          resource: 'vip_wearable',
          details: JSON.stringify({ wearableId, vipId: wearable.vipId, incidentId: incident.id }),
          statusCode: 200,
        },
      });

      return NextResponse.json({ wearable: updated, incident });
    }

    // ---- Create entity by type ------------------------------------------------
    if (!type) {
      return NextResponse.json(
        { error: '?type= param required (profile, drone, vehicle, wearable, incident)' },
        { status: 400 }
      );
    }

    const body = await request.json();

    switch (type) {
      // ---- Create VIP profile -------------------------------------------------
      case 'profile': {
        const { name, designation, threatLevel, protectionLevel, bleTagId, emergencyContact, medicalInfo, travelSchedule } = body;

        if (!name || !designation) {
          return NextResponse.json({ error: 'name and designation are required' }, { status: 400 });
        }

        const validThreat = ['low', 'medium', 'high', 'critical'];
        const validProtection = ['standard', 'elevated', 'maximum'];

        const profile = await db.vipProfile.create({
          data: {
            name,
            designation,
            threatLevel: validThreat.includes(threatLevel) ? threatLevel : 'medium',
            protectionLevel: validProtection.includes(protectionLevel) ? protectionLevel : 'standard',
            bleTagId: bleTagId || null,
            emergencyContact: emergencyContact || null,
            medicalInfo: medicalInfo || null,
            travelSchedule: travelSchedule ? JSON.stringify(travelSchedule) : null,
          },
        });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'create_vip_profile',
            resource: 'vip_profile',
            details: JSON.stringify({ profileId: profile.id, name }),
            statusCode: 201,
          },
        });

        return NextResponse.json({ profile }, { status: 201 });
      }

      // ---- Create drone -------------------------------------------------------
      case 'drone': {
        const { vipId, name, model, batteryLevel, cameraActive, thermalActive, mission } = body;

        if (!vipId || !name || !model) {
          return NextResponse.json({ error: 'vipId, name, and model are required' }, { status: 400 });
        }

        const vip = await db.vipProfile.findUnique({ where: { id: vipId } });
        if (!vip) {
          return NextResponse.json({ error: 'VIP profile not found' }, { status: 404 });
        }

        const drone = await db.vipDrone.create({
          data: {
            vipId,
            name,
            model,
            batteryLevel: batteryLevel ?? 100,
            cameraActive: cameraActive ?? false,
            thermalActive: thermalActive ?? false,
            mission: mission ? JSON.stringify(mission) : null,
          },
        });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'create_vip_drone',
            resource: 'vip_drone',
            details: JSON.stringify({ droneId: drone.id, vipId, name }),
            statusCode: 201,
          },
        });

        return NextResponse.json({ drone }, { status: 201 });
      }

      // ---- Create vehicle -----------------------------------------------------
      case 'vehicle': {
        const { vipId, name, type, plate, driverId, route } = body;

        if (!vipId || !name || !type) {
          return NextResponse.json({ error: 'vipId, name, and type are required' }, { status: 400 });
        }

        const validVehicleTypes = ['sedan', 'suv', 'armored', 'motorcycle'];
        if (!validVehicleTypes.includes(type)) {
          return NextResponse.json(
            { error: `Invalid type. Must be: ${validVehicleTypes.join(', ')}` },
            { status: 400 }
          );
        }

        const vip = await db.vipProfile.findUnique({ where: { id: vipId } });
        if (!vip) {
          return NextResponse.json({ error: 'VIP profile not found' }, { status: 404 });
        }

        const vehicle = await db.vipVehicle.create({
          data: {
            vipId,
            name,
            type,
            plate: plate || null,
            driverId: driverId || null,
            route: route ? JSON.stringify(route) : null,
          },
        });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'create_vip_vehicle',
            resource: 'vip_vehicle',
            details: JSON.stringify({ vehicleId: vehicle.id, vipId, name, type }),
            statusCode: 201,
          },
        });

        return NextResponse.json({ vehicle }, { status: 201 });
      }

      // ---- Create wearable ----------------------------------------------------
      case 'wearable': {
        const { vipId, type, deviceName, batteryLevel } = body;

        if (!vipId || !type || !deviceName) {
          return NextResponse.json({ error: 'vipId, type, and deviceName are required' }, { status: 400 });
        }

        const validWearableTypes = ['smartwatch', 'health_monitor', 'panic_button', 'gps_tracker'];
        if (!validWearableTypes.includes(type)) {
          return NextResponse.json(
            { error: `Invalid type. Must be: ${validWearableTypes.join(', ')}` },
            { status: 400 }
          );
        }

        const vip = await db.vipProfile.findUnique({ where: { id: vipId } });
        if (!vip) {
          return NextResponse.json({ error: 'VIP profile not found' }, { status: 404 });
        }

        const wearable = await db.vipWearable.create({
          data: {
            vipId,
            type,
            deviceName,
            batteryLevel: batteryLevel ?? 100,
            lastPingAt: new Date(),
          },
        });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'create_vip_wearable',
            resource: 'vip_wearable',
            details: JSON.stringify({ wearableId: wearable.id, vipId, type, deviceName }),
            statusCode: 201,
          },
        });

        return NextResponse.json({ wearable }, { status: 201 });
      }

      // ---- Create incident ----------------------------------------------------
      case 'incident': {
        const { vipId, type, severity, description, response } = body;

        if (!vipId || !type || !description) {
          return NextResponse.json({ error: 'vipId, type, and description are required' }, { status: 400 });
        }

        const validIncidentTypes = ['threat', 'medical', 'route_deviation', 'perimeter_breach', 'sos'];
        const validSeverities = ['low', 'medium', 'high', 'critical'];

        if (!validIncidentTypes.includes(type)) {
          return NextResponse.json(
            { error: `Invalid type. Must be: ${validIncidentTypes.join(', ')}` },
            { status: 400 }
          );
        }

        const vip = await db.vipProfile.findUnique({ where: { id: vipId } });
        if (!vip) {
          return NextResponse.json({ error: 'VIP profile not found' }, { status: 404 });
        }

        const incident = await db.vipIncident.create({
          data: {
            vipId,
            type,
            severity: validSeverities.includes(severity) ? severity : 'medium',
            description,
            response: response || null,
          },
        });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'create_vip_incident',
            resource: 'vip_incident',
            details: JSON.stringify({ incidentId: incident.id, vipId, type, severity }),
            statusCode: 201,
          },
        });

        return NextResponse.json({ incident }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: profile, drone, vehicle, wearable, incident' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('VIP POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update VIP entity based on ?type= param
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: '?type= param required (profile, drone, vehicle, wearable, incident)' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entity id is required' }, { status: 400 });
    }

    switch (type) {
      case 'profile': {
        const data: Record<string, unknown> = {};
        if (fields.name !== undefined) data.name = fields.name;
        if (fields.designation !== undefined) data.designation = fields.designation;
        if (fields.threatLevel !== undefined) data.threatLevel = fields.threatLevel;
        if (fields.protectionLevel !== undefined) data.protectionLevel = fields.protectionLevel;
        if (fields.status !== undefined) data.status = fields.status;
        if (fields.bleTagId !== undefined) data.bleTagId = fields.bleTagId;
        if (fields.emergencyContact !== undefined) data.emergencyContact = fields.emergencyContact;
        if (fields.medicalInfo !== undefined) data.medicalInfo = fields.medicalInfo;
        if (fields.travelSchedule !== undefined) data.travelSchedule = JSON.stringify(fields.travelSchedule);

        if (Object.keys(data).length === 0) {
          return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const updated = await db.vipProfile.update({ where: { id }, data });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'update_vip_profile',
            resource: 'vip_profile',
            details: JSON.stringify({ id, fields: Object.keys(data) }),
            statusCode: 200,
          },
        });

        return NextResponse.json({ profile: updated });
      }

      case 'drone': {
        const data: Record<string, unknown> = {};
        if (fields.name !== undefined) data.name = fields.name;
        if (fields.model !== undefined) data.model = fields.model;
        if (fields.status !== undefined) data.status = fields.status;
        if (fields.batteryLevel !== undefined) data.batteryLevel = fields.batteryLevel;
        if (fields.altitude !== undefined) data.altitude = fields.altitude;
        if (fields.speed !== undefined) data.speed = fields.speed;
        if (fields.gpsCoords !== undefined) data.gpsCoords = JSON.stringify(fields.gpsCoords);
        if (fields.cameraActive !== undefined) data.cameraActive = fields.cameraActive;
        if (fields.thermalActive !== undefined) data.thermalActive = fields.thermalActive;
        if (fields.mission !== undefined) data.mission = JSON.stringify(fields.mission);

        if (Object.keys(data).length === 0) {
          return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const updated = await db.vipDrone.update({ where: { id }, data });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'update_vip_drone',
            resource: 'vip_drone',
            details: JSON.stringify({ id, fields: Object.keys(data) }),
            statusCode: 200,
          },
        });

        return NextResponse.json({ drone: updated });
      }

      case 'vehicle': {
        const data: Record<string, unknown> = {};
        if (fields.name !== undefined) data.name = fields.name;
        if (fields.type !== undefined) data.type = fields.type;
        if (fields.plate !== undefined) data.plate = fields.plate;
        if (fields.status !== undefined) data.status = fields.status;
        if (fields.fuelLevel !== undefined) data.fuelLevel = fields.fuelLevel;
        if (fields.gpsCoords !== undefined) data.gpsCoords = JSON.stringify(fields.gpsCoords);
        if (fields.driverId !== undefined) data.driverId = fields.driverId;
        if (fields.route !== undefined) data.route = JSON.stringify(fields.route);
        if (fields.speed !== undefined) data.speed = fields.speed;
        if (fields.heading !== undefined) data.heading = fields.heading;

        if (Object.keys(data).length === 0) {
          return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const updated = await db.vipVehicle.update({ where: { id }, data });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'update_vip_vehicle',
            resource: 'vip_vehicle',
            details: JSON.stringify({ id, fields: Object.keys(data) }),
            statusCode: 200,
          },
        });

        return NextResponse.json({ vehicle: updated });
      }

      case 'wearable': {
        const data: Record<string, unknown> = {};
        if (fields.type !== undefined) data.type = fields.type;
        if (fields.deviceName !== undefined) data.deviceName = fields.deviceName;
        if (fields.status !== undefined) data.status = fields.status;
        if (fields.batteryLevel !== undefined) data.batteryLevel = fields.batteryLevel;
        if (fields.heartRate !== undefined) data.heartRate = fields.heartRate;
        if (fields.bloodPressure !== undefined) data.bloodPressure = JSON.stringify(fields.bloodPressure);
        if (fields.temperature !== undefined) data.temperature = fields.temperature;
        if (fields.sosTriggered !== undefined) data.sosTriggered = fields.sosTriggered;
        if (fields.lastPingAt !== undefined) data.lastPingAt = fields.lastPingAt ? new Date(fields.lastPingAt) : new Date();

        if (Object.keys(data).length === 0) {
          return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const updated = await db.vipWearable.update({ where: { id }, data });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'update_vip_wearable',
            resource: 'vip_wearable',
            details: JSON.stringify({ id, fields: Object.keys(data) }),
            statusCode: 200,
          },
        });

        return NextResponse.json({ wearable: updated });
      }

      case 'incident': {
        const data: Record<string, unknown> = {};
        if (fields.type !== undefined) data.type = fields.type;
        if (fields.severity !== undefined) data.severity = fields.severity;
        if (fields.description !== undefined) data.description = fields.description;
        if (fields.response !== undefined) data.response = fields.response;
        if (fields.resolvedAt !== undefined) data.resolvedAt = fields.resolvedAt ? new Date(fields.resolvedAt) : null;

        if (Object.keys(data).length === 0) {
          return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const updated = await db.vipIncident.update({ where: { id }, data });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'update_vip_incident',
            resource: 'vip_incident',
            details: JSON.stringify({ id, fields: Object.keys(data) }),
            statusCode: 200,
          },
        });

        return NextResponse.json({ incident: updated });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: profile, drone, vehicle, wearable, incident' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('VIP PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Remove VIP entity based on ?type= param
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: '?type= and ?id= params are required' }, { status: 400 });
    }

    const validTypes = ['profile', 'drone', 'vehicle', 'wearable', 'incident'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Use: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    switch (type) {
      case 'profile': {
        const existing = await db.vipProfile.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        await db.vipProfile.delete({ where: { id } });
        await db.auditLog.create({
          data: { userId: auth.payload.userId, action: 'delete_vip_profile', resource: 'vip_profile', details: JSON.stringify({ id, name: existing.name }), statusCode: 200 },
        });
        return NextResponse.json({ success: true, message: 'VIP profile deleted' });
      }

      case 'drone': {
        const existing = await db.vipDrone.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Drone not found' }, { status: 404 });
        await db.vipDrone.delete({ where: { id } });
        await db.auditLog.create({
          data: { userId: auth.payload.userId, action: 'delete_vip_drone', resource: 'vip_drone', details: JSON.stringify({ id, name: existing.name }), statusCode: 200 },
        });
        return NextResponse.json({ success: true, message: 'Drone deleted' });
      }

      case 'vehicle': {
        const existing = await db.vipVehicle.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        await db.vipVehicle.delete({ where: { id } });
        await db.auditLog.create({
          data: { userId: auth.payload.userId, action: 'delete_vip_vehicle', resource: 'vip_vehicle', details: JSON.stringify({ id, name: existing.name }), statusCode: 200 },
        });
        return NextResponse.json({ success: true, message: 'Vehicle deleted' });
      }

      case 'wearable': {
        const existing = await db.vipWearable.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Wearable not found' }, { status: 404 });
        await db.vipWearable.delete({ where: { id } });
        await db.auditLog.create({
          data: { userId: auth.payload.userId, action: 'delete_vip_wearable', resource: 'vip_wearable', details: JSON.stringify({ id, name: existing.deviceName }), statusCode: 200 },
        });
        return NextResponse.json({ success: true, message: 'Wearable deleted' });
      }

      case 'incident': {
        const existing = await db.vipIncident.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        await db.vipIncident.delete({ where: { id } });
        await db.auditLog.create({
          data: { userId: auth.payload.userId, action: 'delete_vip_incident', resource: 'vip_incident', details: JSON.stringify({ id }), statusCode: 200 },
        });
        return NextResponse.json({ success: true, message: 'Incident deleted' });
      }
    }

    return NextResponse.json({ error: 'Unhandled type' }, { status: 400 });
  } catch (error) {
    console.error('VIP DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}