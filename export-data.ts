// export-data.ts
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const customers = await prisma.customer.findMany()
  // Convert data jadi JSON string
  const data = JSON.stringify(customers, null, 2)

  // Tulis ke file customers.json
  fs.writeFileSync('customers.json', data)
  console.log('Data customer berhasil di-convert ke customers.json!')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())