import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const adminPassword = await bcrypt.hash("Admin1234!", 10);

  const admin = await prisma.systemAdmin.upsert({
    where: { email: "superadmin" },
    update: {},
    create: {
      email: "superadmin",
      password: adminPassword,
      name: "Super Admin",
    },
  });

  console.log(`✓ SystemAdmin:  ${admin.email} / Admin1234!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
