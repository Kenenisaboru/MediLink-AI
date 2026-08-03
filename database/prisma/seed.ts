import { PrismaClient, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const NUM_HOSPITALS = 10;
const NUM_PATIENTS = 100;
const NUM_DOCTORS = 100;
const NUM_ADMINS = 10;
const NUM_PHARMACISTS = 10;
const NUM_LABS = 10;
const NUM_NURSES = 10;
const NUM_AMBULANCE_DRIVERS = 10;

async function main() {
  // Delete existing data
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.emergencySOS.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.medicalRecord.deleteMany(),
    prisma.bloodStock.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.ambulanceDriverProfile.deleteMany(),
    prisma.pharmacyProfile.deleteMany(),
    prisma.labProfile.deleteMany(),
    prisma.nurseProfile.deleteMany(),
    prisma.doctorProfile.deleteMany(),
    prisma.hospitalAdminProfile.deleteMany(),
    prisma.patientProfile.deleteMany(),
    prisma.hospital.deleteMany(),
    prisma.user.deleteMany(),
    prisma.refreshToken.deleteMany(),
  ]);

  // Hospitals
  const hospitals = [];
  for (let i = 0; i < NUM_HOSPITALS; i++) {
    const hospital = await prisma.hospital.create({
      data: {
        name: `${faker.company.name()} Hospital`,
        address: faker.address.streetAddress(),
        city: faker.address.city(),
        latitude: parseFloat(faker.address.latitude()),
        longitude: parseFloat(faker.address.longitude()),
        contactNumber: faker.phone.number(),
        isEmergencyAvailable: faker.datatype.boolean(),
        totalBeds: faker.datatype.number({ min: 50, max: 300 }),
        occupiedBeds: faker.datatype.number({ min: 0, max: 50 }),
        totalICUBeds: faker.datatype.number({ min: 10, max: 50 }),
        occupiedICUBeds: faker.datatype.number({ min: 0, max: 10 }),
        queueLength: faker.datatype.number({ min: 0, max: 20 }),
        rating: parseFloat(faker.datatype.float({ min: 3, max: 5, precision: 0.1 }).toFixed(1)),
      },
    });
    hospitals.push(hospital);
  }
  const randomHospital = () => hospitals[faker.datatype.number({ min: 0, max: hospitals.length - 1 })];

  // Patients
  for (let i = 0; i < NUM_PATIENTS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        passwordHash: faker.internet.password(),
        role: Role.PATIENT,
        isVerified: true,
      },
    });
    await prisma.patientProfile.create({
      data: {
        userId: user.id,
        fullName: faker.name.fullName(),
        gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
        dateOfBirth: faker.date.past(60, new Date('2005-01-01')),
        bloodGroup: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        emergencyContactName: faker.name.fullName(),
        emergencyContactPhone: faker.phone.number('##########'),
      },
    });
  }

  // Doctors
  for (let i = 0; i < NUM_DOCTORS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        passwordHash: faker.internet.password(),
        role: Role.DOCTOR,
        isVerified: true,
      },
    });
    const hospital = randomHospital();
    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        fullName: faker.name.fullName(),
        specialty: faker.helpers.arrayElement(['Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'General Practice']),
        licenseNumber: faker.datatype.uuid(),
        experienceYears: faker.datatype.number({ min: 1, max: 30 }),
        rating: parseFloat(faker.datatype.float({ min: 3, max: 5, precision: 0.1 }).toFixed(1)),
        waitingTimeMinutes: faker.datatype.number({ min: 5, max: 30 }),
        hospitalId: hospital.id,
      },
    });
  }

  // Hospital Admins
  for (let i = 0; i < NUM_ADMINS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        passwordHash: faker.internet.password(),
        role: Role.HOSPITAL_ADMIN,
        isVerified: true,
      },
    });
    const hospital = randomHospital();
    await prisma.hospitalAdminProfile.create({
      data: {
        userId: user.id,
        hospitalId: hospital.id,
        fullName: faker.name.fullName(),
      },
    });
  }

  // Pharmacists
  for (let i = 0; i < NUM_PHARMACISTS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        passwordHash: faker.internet.password(),
        role: Role.PHARMACY,
        isVerified: true,
      },
    });
    await prisma.pharmacyProfile.create({
      data: {
        userId: user.id,
        name: `${faker.company.name()} Pharmacy`,
        address: faker.address.streetAddress(),
        contactNumber: faker.phone.number(),
        latitude: parseFloat(faker.address.latitude()),
        longitude: parseFloat(faker.address.longitude()),
      },
    });
  }

  // Lab Technicians
  for (let i = 0; i < NUM_LABS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        passwordHash: faker.internet.password(),
        role: Role.LAB_STAFF,
        isVerified: true,
      },
    });
    await prisma.labProfile.create({
      data: {
        userId: user.id,
        name: `${faker.company.name()} Lab`,
        address: faker.address.streetAddress(),
        contactNumber: faker.phone.number(),
      },
    });
  }

  // Nurses
  for (let i = 0; i < NUM_NURSES; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        passwordHash: faker.internet.password(),
        role: Role.NURSE,
        isVerified: true,
      },
    });
    const hospital = randomHospital();
    await prisma.nurseProfile.create({
      data: {
        userId: user.id,
        fullName: faker.name.fullName(),
        department: faker.helpers.arrayElement(['Emergency', 'ICU', 'Pediatrics', 'General']),
        hospitalId: hospital.id,
      },
    });
  }

  // Ambulance Drivers
  for (let i = 0; i < NUM_AMBULANCE_DRIVERS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        passwordHash: faker.internet.password(),
        role: Role.AMBULANCE_DRIVER,
        isVerified: true,
      },
    });
    await prisma.ambulanceDriverProfile.create({
      data: {
        userId: user.id,
        driverName: faker.name.fullName(),
        vehicleNumber: faker.vehicle.vin(),
        isAvailable: true,
        latitude: parseFloat(faker.address.latitude()),
        longitude: parseFloat(faker.address.longitude()),
      },
    });
  }

  console.log('Seeding completed successfully');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
