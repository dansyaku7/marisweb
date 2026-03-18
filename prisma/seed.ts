// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Ekstraksi data CSV lo ke dalam format array JSON agar mudah di-seed
// Gua ambil 3 perusahaan sampel dari data lu untuk testing
const equipmentData = [
  {
    companyName: "PT INDOLAKTO (C3)",
    equipments: [
      { location: null, name: "KETEL UAP - PIPA API", permitNumber: "566/002-WAS/2017", serialNumber: "74380", inspectionDate: new Date("2025-01-01"), expiryDate: new Date("2026-01-01") },
      { location: null, name: "MOTOR DIESEL (GENSET)", permitNumber: "SERTIFIKASI", serialNumber: "DGBM0052S - 13444E", inspectionDate: new Date("2025-01-08"), expiryDate: new Date("2026-01-08") },
      { location: null, name: "PENYALUR PETIR", permitNumber: "188/332 Tahun 2015", serialNumber: "2.24 ohm", inspectionDate: new Date("2025-07-29"), expiryDate: new Date("2026-07-29") }
    ]
  },
  {
    companyName: "PT TIRTA INVESTAMA (MEKARSARI)",
    equipments: [
      { location: null, name: "ELECTRIC SCISSOR LIFT", permitNumber: "SERTIFIKASI", serialNumber: "DPL10-1849", inspectionDate: new Date("2025-01-04"), expiryDate: new Date("2026-01-04") },
      { location: null, name: "INSTALASI LISTRIK", permitNumber: "028/IL/KW.3/KD.6/2001", serialNumber: "N/A", inspectionDate: new Date("2025-06-10"), expiryDate: new Date("2026-06-10") }
    ]
  },
  {
    companyName: "PT BASF CARE CHEMICALS INDONESIA",
    equipments: [
      { location: "PLANT CIMANGGIS", name: "BEJANA UAP - CONVERTER TOWER", permitNumber: "4988/TK.04.03.02/PK-WIL.I.BGR", serialNumber: "20-164", inspectionDate: new Date("2025-01-06"), expiryDate: new Date("2026-01-06") },
      { location: "PLANT CIMANGGIS", name: "VERTICAL FALL ARRESTER", permitNumber: "16366/TK.04.03.01/PK-WIL.I.BGR", serialNumber: "30 VFA 05", inspectionDate: new Date("2025-08-14"), expiryDate: new Date("2026-08-14") }
    ]
  }
];

async function main() {
  console.log('🚀 Memulai Seeding Database M-Track...');

  // 1. Bersihkan database sebelum seeding (Hati-hati, ini menghapus semua data)
  await prisma.emailLog.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const defaultPassword = await bcrypt.hash('password123', 10);

  // ==========================================
  // 2. Buat PT. Marusindo (Superadmin)
  // ==========================================
  console.log('🏢 Membuat Data PT. Marusindo...');
  const marusindo = await prisma.company.create({
    data: {
      name: 'PT. Marusindo',
      emailPic: 'admin@marusindo.com',
      isActive: true,
      users: {
        create: {
          email: 'admin@marusindo.com',
          password: defaultPassword,
          role: Role.SUPERADMIN
        }
      }
    }
  });

  // ==========================================
  // 3. Buat Perusahaan Klien & Data Alatnya
  // ==========================================
  console.log('🏭 Mengimpor Data Klien dan Alat dari CSV...');
  
  for (const data of equipmentData) {
    // Generate email dummy untuk klien login
    const clientEmail = `pic@${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    const company = await prisma.company.create({
      data: {
        name: data.companyName,
        emailPic: clientEmail,
        isActive: true,
        // Sekalian buatkan akun login untuk PIC klien tersebut
        users: {
          create: {
            email: clientEmail,
            password: defaultPassword,
            role: Role.CLIENT
          }
        },
        // Sekalian masukkan data alat berat mereka (Relasi One-to-Many)
        equipments: {
          create: data.equipments
        }
      }
    });
    console.log(`✅ Klien dibuat: ${company.name} | Akun: ${clientEmail}`);
  }

  console.log('🎯 Seeding Selesai! Lo bisa login pakai admin@marusindo.com atau email klien di atas dengan password: password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });