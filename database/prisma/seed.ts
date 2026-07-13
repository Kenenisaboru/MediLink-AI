import { PrismaClient, Role, AppointmentStatus, SOSStatus, PaymentGateway, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Hash passwords
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Super Admin
  const adminUser = await prisma.user.upsert({
    where: { phone: '+251911000000' },
    update: {},
    create: {
      phone: '+251911000000',
      email: 'admin@medilink.et',
      passwordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true,
    },
  });
  console.log('Created Super Admin User:', adminUser.email);

  // 2. Create Hospitals
  const hospitalsData = [
    {
      name: 'Black Lion (Tikur Anbessa) Hospital',
      address: 'Zewditu St, Addis Ababa',
      city: 'Addis Ababa',
      latitude: 9.0182,
      longitude: 38.7490,
      contactNumber: '+251115511211',
      isEmergencyAvailable: true,
      totalBeds: 800,
      occupiedBeds: 720,
      totalICUBeds: 45,
      occupiedICUBeds: 42,
      queueLength: 25,
      rating: 4.5,
    },
    {
      name: 'St. Paul Specialized Hospital',
      address: 'Swaziland St, Gullele, Addis Ababa',
      city: 'Addis Ababa',
      latitude: 9.0494,
      longitude: 38.7412,
      contactNumber: '+251112750125',
      isEmergencyAvailable: true,
      totalBeds: 500,
      occupiedBeds: 450,
      totalICUBeds: 30,
      occupiedICUBeds: 28,
      queueLength: 18,
      rating: 4.3,
    },
    {
      name: 'Hawassa Referral Hospital',
      address: 'University Road, Hawassa',
      city: 'Hawassa',
      latitude: 7.0483,
      longitude: 38.4820,
      contactNumber: '+251462201456',
      isEmergencyAvailable: true,
      totalBeds: 400,
      occupiedBeds: 310,
      totalICUBeds: 20,
      occupiedICUBeds: 15,
      queueLength: 12,
      rating: 4.2,
    },
  ];

  const hospitals = [];
  for (const h of hospitalsData) {
    const hosp = await prisma.hospital.create({ data: h });
    hospitals.push(hosp);
  }
  console.log(`Created ${hospitals.length} Hospitals.`);

  // Seed Blood Stocks for Black Lion Hospital
  await prisma.bloodStock.createMany({
    data: [
      { bloodGroup: 'A+', bagsCount: 15, hospitalId: hospitals[0].id },
      { bloodGroup: 'O+', bagsCount: 22, hospitalId: hospitals[0].id },
      { bloodGroup: 'B-', bagsCount: 5, hospitalId: hospitals[0].id },
      { bloodGroup: 'AB+', bagsCount: 8, hospitalId: hospitals[0].id },
    ],
  });
  console.log('Seeded Blood Stock for Black Lion Hospital.');

  // 3. Create Hospital Admins
  const hospAdminUser = await prisma.user.create({
    data: {
      phone: '+251911111111',
      email: 'hospadmin@medilink.et',
      passwordHash,
      role: Role.HOSPITAL_ADMIN,
      isVerified: true,
    },
  });
  await prisma.hospitalAdminProfile.create({
    data: {
      userId: hospAdminUser.id,
      fullName: 'Abebe Kebede',
      hospitalId: hospitals[0].id,
    },
  });
  console.log('Created Hospital Admin Profile.');

  // 4. Create Doctors
  const doctorsData = [
    {
      phone: '+251911222222',
      email: 'dr.selam@medilink.et',
      fullName: 'Dr. Selamawit Hailu',
      specialty: 'Pediatrics',
      licenseNumber: 'DOC-ET-78901',
      experienceYears: 10,
      bio: 'Consultant Pediatrician specializing in critical newborn care and childhood illnesses.',
      languagesSpoken: ['Amharic', 'English', 'Afaan Oromo'],
      hospitalId: hospitals[0].id,
    },
    {
      phone: '+251911333333',
      email: 'dr.chala@medilink.et',
      fullName: 'Dr. Chala Beyene',
      specialty: 'Cardiology',
      licenseNumber: 'DOC-ET-12345',
      experienceYears: 12,
      bio: 'Expert Cardiologist experienced in diagnostic angiography and heart failure management.',
      languagesSpoken: ['Afaan Oromo', 'Amharic', 'English'],
      hospitalId: hospitals[0].id,
    },
    {
      phone: '+251911444444',
      email: 'dr.yonas@medilink.et',
      fullName: 'Dr. Yonas Tariku',
      specialty: 'General Medicine',
      licenseNumber: 'DOC-ET-54321',
      experienceYears: 6,
      bio: 'Dedicated General Practitioner focusing on preventive care and routine checkups.',
      languagesSpoken: ['Amharic', 'English'],
      hospitalId: hospitals[1].id,
    },
  ];

  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        phone: doc.phone,
        email: doc.email,
        passwordHash,
        role: Role.DOCTOR,
        isVerified: true,
      },
    });

    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        fullName: doc.fullName,
        specialty: doc.specialty,
        licenseNumber: doc.licenseNumber,
        experienceYears: doc.experienceYears,
        bio: doc.bio,
        languagesSpoken: doc.languagesSpoken,
        hospitalId: doc.hospitalId,
      },
    });
  }
  console.log('Seeded Doctor Profiles.');

  // 5. Create Nurses
  const nurseUser = await prisma.user.create({
    data: {
      phone: '+251911555555',
      email: 'nurse.aster@medilink.et',
      passwordHash,
      role: Role.NURSE,
      isVerified: true,
    },
  });
  await prisma.nurseProfile.create({
    data: {
      userId: nurseUser.id,
      fullName: 'Aster Tolossa',
      department: 'Pediatric ICU',
      hospitalId: hospitals[0].id,
    },
  });
  console.log('Created Nurse Profile.');

  // 6. Create Pharmacy
  const pharmUser = await prisma.user.create({
    data: {
      phone: '+251911666666',
      email: 'kenema.pharmacy@medilink.et',
      passwordHash,
      role: Role.PHARMACY,
      isVerified: true,
    },
  });
  const pharmacy = await prisma.pharmacyProfile.create({
    data: {
      userId: pharmUser.id,
      name: 'Kenema Pharmacy Branch No. 4',
      address: 'Piazza, Churchill Ave, Addis Ababa',
      contactNumber: '+251111553044',
      latitude: 9.0305,
      longitude: 38.7525,
    },
  });
  console.log('Created Pharmacy Profile.');

  // Seed Pharmacy Inventory
  const today = new Date();
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const expiredDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

  await prisma.inventoryItem.createMany({
    data: [
      {
        pharmacyId: pharmacy.id,
        name: 'Paracetamol 500mg',
        quantity: 1200,
        price: 5.50,
        expirationDate: nextYear,
        batchNumber: 'BTCH-PARA-001',
        category: 'Analgesics',
      },
      {
        pharmacyId: pharmacy.id,
        name: 'Amoxicillin 500mg Capsule',
        quantity: 450,
        price: 18.00,
        expirationDate: nextYear,
        batchNumber: 'BTCH-AMOX-092',
        category: 'Antibiotics',
      },
      {
        pharmacyId: pharmacy.id,
        name: 'Metformin 850mg',
        quantity: 800,
        price: 12.00,
        expirationDate: nextYear,
        batchNumber: 'BTCH-MET-850',
        category: 'Antidiabetics',
      },
      {
        pharmacyId: pharmacy.id,
        name: 'Expiring Pain Relief Syrup',
        quantity: 30,
        price: 45.00,
        expirationDate: expiredDate,
        batchNumber: 'BTCH-EXP-999',
        category: 'Analgesics',
      },
    ],
  });
  console.log('Seeded Pharmacy Inventory Items.');

  // 7. Create Laboratory
  const labUser = await prisma.user.create({
    data: {
      phone: '+251911777777',
      email: 'wudase.lab@medilink.et',
      passwordHash,
      role: Role.LAB_STAFF,
      isVerified: true,
    },
  });
  await prisma.labProfile.create({
    data: {
      userId: labUser.id,
      name: 'Wudase Diagnostic Laboratory',
      address: 'Bole Road, Addis Ababa',
      contactNumber: '+251116630310',
    },
  });
  console.log('Created Laboratory Profile.');

  // 8. Create Ambulance Driver
  const ambUser = await prisma.user.create({
    data: {
      phone: '+251911888888',
      email: 'driver.mulu@medilink.et',
      passwordHash,
      role: Role.AMBULANCE_DRIVER,
      isVerified: true,
    },
  });
  await prisma.ambulanceDriverProfile.create({
    data: {
      userId: ambUser.id,
      driverName: 'Mulugeta Tesfaye',
      vehicleNumber: 'CODE-3-A34980-ET',
      isAvailable: true,
      latitude: 9.0125,
      longitude: 38.7595,
    },
  });
  console.log('Created Ambulance Driver Profile.');

  // 9. Create Patients & Medical History
  const patientUser1 = await prisma.user.create({
    data: {
      phone: '+251911999999',
      email: 'patient.tewodros@gmail.com',
      passwordHash,
      role: Role.PATIENT,
      isVerified: true,
    },
  });
  const patient1 = await prisma.patientProfile.create({
    data: {
      userId: patientUser1.id,
      fullName: 'Tewodros Assefa',
      gender: 'Male',
      dateOfBirth: new Date('1985-05-15'),
      bloodGroup: 'O+',
      emergencyContactName: 'Almaz Assefa',
      emergencyContactPhone: '+251911999901',
      allergies: ['Penicillin'],
      chronicDiseases: ['Hypertension'],
      surgeries: ['Appendectomy (2018)'],
      vaccinations: ['BCG', 'HepB', 'COVID-19 Booster'],
    },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      phone: '+251922111111',
      email: 'patient.chaltu@gmail.com',
      passwordHash,
      role: Role.PATIENT,
      isVerified: true,
    },
  });
  const patient2 = await prisma.patientProfile.create({
    data: {
      userId: patientUser2.id,
      fullName: 'Chaltu Olani',
      gender: 'Female',
      dateOfBirth: new Date('1992-09-22'),
      bloodGroup: 'A-',
      emergencyContactName: 'Tolera Olani',
      emergencyContactPhone: '+251922111102',
      allergies: ['Dust Mites'],
      chronicDiseases: [],
      surgeries: [],
      vaccinations: ['BCG', 'MMR', 'COVID-19'],
    },
  });
  console.log('Created Patient Profiles.');

  // Retrieve doctors to map appointments
  const doctors = await prisma.doctorProfile.findMany();

  // 10. Create Appointments
  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctors[0].id, // Dr Selam (Pediatrics)
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0),
      status: AppointmentStatus.ACCEPTED,
      notes: 'Routine checkup for patient blood pressure control.',
      telemedicineRoomId: 'room-tewodros-selam-999',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctors[1].id, // Dr Chala (Cardiology)
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 30),
      status: AppointmentStatus.PENDING,
      notes: 'Consultation regarding heart palpitations.',
    },
  });
  console.log('Seeded Appointments.');

  // 11. Create a Medical Record (History)
  const medRecord = await prisma.medicalRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctors[2].id, // Dr Yonas (General Medicine)
      date: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
      diagnosis: 'Essential Hypertension',
      notes: 'Patient presented with elevated BP of 145/95. Recommended low-sodium diet and lifestyle modifications.',
      prescriptions: [
        { name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once Daily', days: 30 },
      ],
      labRequests: [
        { name: 'Serum Creatinine', instructions: 'Fasting preferred', result: '0.9 mg/dL', status: 'Completed' },
        { name: 'Lipid Profile', instructions: '12 hour fasting', result: 'Pending', status: 'Requested' },
      ],
    },
  });
  console.log('Seeded Medical Record.');

  // 12. Seed a Payment Transaction
  await prisma.transaction.create({
    data: {
      patientId: patient1.id,
      medicalRecordId: medRecord.id,
      amount: 150.00,
      currency: 'ETB',
      status: PaymentStatus.SUCCESS,
      reference: 'TX-CHAPA-MOCK-8392109',
      gateway: PaymentGateway.CHAPA,
    },
  });
  console.log('Seeded Billing Transaction.');

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
