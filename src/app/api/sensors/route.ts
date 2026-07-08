/**
 * BABIRYE v10.0.0 — Sensors API Routes
 * CRUD for sensors + reading submission. Latest reading included per sensor.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ---------------------------------------------------------------------------
// GET — List sensors with optional ?type= filter. Includes latest reading.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (typeFilter) where.type = typeFilter;
    if (statusFilter) where.status = statusFilter;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [sensors, total] = await Promise.all([
      db.sensor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          readings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      db.sensor.count({ where }),
    ]);

    const result = sensors.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      subtype: s.subtype,
      description: s.description,
      status: s.status,
      config: s.config,
      location: s.location,
      range: s.range,
      frequency: s.frequency,
      sensitivity: s.sensitivity,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      latestReading: s.readings[0]
        ? {
            id: s.readings[0].id,
            value: s.readings[0].value,
            unit: s.readings[0].unit,
            metadata: s.readings[0].metadata,
            confidence: s.readings[0].confidence,
            isAnomaly: s.readings[0].isAnomaly,
            anomalyScore: s.readings[0].anomalyScore,
            createdAt: s.readings[0].createdAt,
          }
        : null,
    }));

    return NextResponse.json({
      sensors: result,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Sensors GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create sensor (admin only)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, subtype, description, config, location, range, frequency, sensitivity } = body;

    if (!name || !type || !description) {
      return NextResponse.json(
        { error: 'name, type, and description are required' },
        { status: 400 }
      );
    }

    const validTypes = ['radar', 'sonar', 'lidar', 'acoustic', 'ew'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const sensor = await db.sensor.create({
      data: {
        name,
        type,
        subtype: subtype || null,
        description,
        config: config ? JSON.stringify(config) : '{}',
        location: location || null,
        range: range ?? null,
        frequency: frequency || null,
        sensitivity: sensitivity ?? 0.5,
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'create_sensor',
        resource: 'sensor',
        details: JSON.stringify({ sensorId: sensor.id, name, type }),
        statusCode: 201,
      },
    });

    return NextResponse.json({ sensor }, { status: 201 });
  } catch (error) {
    console.error('Sensors POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update sensor status/config. Also submits a reading when body has 'value'.
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, value, unit, metadata, confidence, isAnomaly, anomalyScore, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Sensor id is required' }, { status: 400 });
    }

    const existing = await db.sensor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Sensor not found' }, { status: 404 });
    }

    // If 'value' is present, create a new reading
    if (value !== undefined) {
      const reading = await db.sensorReading.create({
        data: {
          sensorId: id,
          value: typeof value === 'number' ? value : parseFloat(value),
          unit: unit || null,
          metadata: metadata ? JSON.stringify(metadata) : '{}',
          confidence: confidence ?? 1.0,
          isAnomaly: isAnomaly ?? false,
          anomalyScore: anomalyScore ?? null,
        },
      });

      // If there are also update fields, apply them
      if (Object.keys(updateFields).length > 0) {
        const data: Record<string, unknown> = {};
        if (updateFields.status) data.status = updateFields.status;
        if (updateFields.config !== undefined)
          data.config = JSON.stringify(updateFields.config);
        if (updateFields.location !== undefined) data.location = updateFields.location;
        if (updateFields.range !== undefined) data.range = updateFields.range;
        if (updateFields.frequency !== undefined) data.frequency = updateFields.frequency;
        if (updateFields.sensitivity !== undefined) data.sensitivity = updateFields.sensitivity;
        if (updateFields.subtype !== undefined) data.subtype = updateFields.subtype;
        if (updateFields.description !== undefined) data.description = updateFields.description;
        if (updateFields.name !== undefined) data.name = updateFields.name;

        if (Object.keys(data).length > 0) {
          await db.sensor.update({ where: { id }, data });
        }
      }

      await db.auditLog.create({
        data: {
          userId: auth.payload.userId,
          action: 'sensor_reading',
          resource: 'sensor',
          details: JSON.stringify({ sensorId: id, value, unit }),
          statusCode: 200,
        },
      });

      return NextResponse.json({ reading });
    }

    // No 'value' — pure sensor update
    const data: Record<string, unknown> = {};
    if (updateFields.status) data.status = updateFields.status;
    if (updateFields.config !== undefined)
      data.config = JSON.stringify(updateFields.config);
    if (updateFields.location !== undefined) data.location = updateFields.location;
    if (updateFields.range !== undefined) data.range = updateFields.range;
    if (updateFields.frequency !== undefined) data.frequency = updateFields.frequency;
    if (updateFields.sensitivity !== undefined) data.sensitivity = updateFields.sensitivity;
    if (updateFields.subtype !== undefined) data.subtype = updateFields.subtype;
    if (updateFields.description !== undefined) data.description = updateFields.description;
    if (updateFields.name !== undefined) data.name = updateFields.name;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await db.sensor.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'update_sensor',
        resource: 'sensor',
        details: JSON.stringify({ sensorId: id, fields: Object.keys(data) }),
        statusCode: 200,
      },
    });

    return NextResponse.json({ sensor: updated });
  } catch (error) {
    console.error('Sensors PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Remove sensor (admin only)
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Sensor id is required' }, { status: 400 });
    }

    const existing = await db.sensor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Sensor not found' }, { status: 404 });
    }

    await db.sensor.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'delete_sensor',
        resource: 'sensor',
        details: JSON.stringify({ sensorId: id, name: existing.name }),
        statusCode: 200,
      },
    });

    return NextResponse.json({ success: true, message: 'Sensor deleted' });
  } catch (error) {
    console.error('Sensors DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}