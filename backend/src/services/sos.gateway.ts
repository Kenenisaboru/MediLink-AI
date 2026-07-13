import { Server, Socket } from 'socket.io';
import { PrismaClient, SOSStatus } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory registry of active driver sockets and coordinates
interface ActiveDriver {
  socketId: string;
  driverId: string;
  fullName: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
}

const activeDrivers = new Map<string, ActiveDriver>(); // key: driverId

export function initSOSGateway(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room (e.g. patients join 'patient-{patientId}' room, drivers join 'ambulance-drivers')
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // 1. Patient Triggers SOS
    socket.on('trigger-sos', async (data: { patientId: string; latitude: number; longitude: number }) => {
      const { patientId, latitude, longitude } = data;
      console.log(`SOS Triggered by patient ${patientId} at [${latitude}, ${longitude}]`);

      try {
        // Create emergency record in database
        const sos = await prisma.emergencySOS.create({
          data: {
            patientId,
            latitude,
            longitude,
            status: SOSStatus.PENDING,
          },
          include: {
            patient: true,
          },
        });

        // Broadcast SOS alert to all ambulance drivers
        io.to('ambulance-drivers').emit('new-sos-alert', {
          sosId: sos.id,
          patientId,
          patientName: sos.patient.fullName,
          bloodGroup: sos.patient.bloodGroup,
          allergies: sos.patient.allergies,
          latitude,
          longitude,
          createdAt: sos.createdAt,
        });

        // Inform the patient socket that the SOS is registered
        socket.emit('sos-registered', { sosId: sos.id, status: SOSStatus.PENDING });
      } catch (err) {
        console.error('Error saving emergency SOS:', err);
        socket.emit('error', { message: 'Failed to process emergency request.' });
      }
    });

    // 2. Ambulance Register Location
    socket.on('register-driver', (data: { driverId: string; fullName: string; vehicleNumber: string; latitude: number; longitude: number }) => {
      const { driverId, fullName, vehicleNumber, latitude, longitude } = data;
      activeDrivers.set(driverId, {
        socketId: socket.id,
        driverId,
        fullName,
        vehicleNumber,
        latitude,
        longitude,
      });
      socket.join('ambulance-drivers');
      console.log(`Ambulance Driver ${fullName} registered.`);
    });

    // 3. Driver Updates Live Coordinates
    socket.on('driver-location-update', (data: { driverId: string; latitude: number; longitude: number; activeSOSId?: string }) => {
      const { driverId, latitude, longitude, activeSOSId } = data;
      const driver = activeDrivers.get(driverId);
      if (driver) {
        driver.latitude = latitude;
        driver.longitude = longitude;
        activeDrivers.set(driverId, driver);
      }

      // If driver is heading to an active SOS, update the patient
      if (activeSOSId) {
        io.to(`patient-sos-${activeSOSId}`).emit('driver-location', {
          driverId,
          latitude,
          longitude,
        });
      }
    });

    // 4. Driver Accepts SOS
    socket.on('accept-sos', async (data: { sosId: string; driverId: string }) => {
      const { sosId, driverId } = data;
      console.log(`Driver ${driverId} accepted SOS ${sosId}`);

      try {
        // Find driver profile in db
        const driverProfile = await prisma.ambulanceDriverProfile.findUnique({
          where: { userId: driverId },
        });

        if (!driverProfile) {
          return socket.emit('error', { message: 'Driver profile not found.' });
        }

        // Update SOS status in DB
        const updatedSOS = await prisma.emergencySOS.update({
          where: { id: sosId },
          data: {
            status: SOSStatus.ACTIVE,
            dispatchedDriverId: driverProfile.id,
          },
          include: {
            patient: true,
          },
        });

        // Mark driver as busy
        await prisma.ambulanceDriverProfile.update({
          where: { id: driverProfile.id },
          data: { isAvailable: false },
        });

        // Notify patient that an ambulance has accepted and is on the way
        io.to(`patient-sos-${sosId}`).emit('sos-accepted', {
          sosId,
          status: SOSStatus.ACTIVE,
          driverName: driverProfile.driverName,
          vehicleNumber: driverProfile.vehicleNumber,
          driverLatitude: driverProfile.latitude,
          driverLongitude: driverProfile.longitude,
        });

        // Broadcast to other drivers that the alert is claimed
        io.to('ambulance-drivers').emit('sos-claimed', { sosId });
      } catch (err) {
        console.error('Error accepting SOS:', err);
        socket.emit('error', { message: 'Failed to accept SOS.' });
      }
    });

    // 5. Driver Resolves SOS
    socket.on('resolve-sos', async (data: { sosId: string; driverId: string }) => {
      const { sosId, driverId } = data;
      try {
        const updatedSOS = await prisma.emergencySOS.update({
          where: { id: sosId },
          data: { status: SOSStatus.RESOLVED },
        });

        // Mark driver as available again
        const driverProfile = await prisma.ambulanceDriverProfile.findUnique({
          where: { userId: driverId },
        });
        if (driverProfile) {
          await prisma.ambulanceDriverProfile.update({
            where: { id: driverProfile.id },
            data: { isAvailable: true },
          });
        }

        io.to(`patient-sos-${sosId}`).emit('sos-resolved', { sosId, status: SOSStatus.RESOLVED });
      } catch (err) {
        console.error('Error resolving SOS:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Clean up active driver references if needed
      for (const [driverId, driver] of activeDrivers.entries()) {
        if (driver.socketId === socket.id) {
          activeDrivers.delete(driverId);
          console.log(`Removed active driver tracker for ${driver.fullName}`);
          break;
        }
      }
    });
  });
}
