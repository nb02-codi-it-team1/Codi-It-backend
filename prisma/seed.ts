import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const grades = [
    {
      id: 'grade_green',
      name: 'green',
      rate: 5,
      minAmount: 0, // 기본값
    },
    {
      id: 'grade_orange',
      name: 'orange',
      rate: 7,
      minAmount: 100000, // 누적 10만원 이상
    },
    {
      id: 'grade_red',
      name: 'red',
      rate: 9,
      minAmount: 300000, // 누적 30만원 이상
    },
    {
      id: 'grade_black',
      name: 'black',
      rate: 11,
      minAmount: 500000, // 누적 50만원 이상
    },
    {
      id: 'grade_vip',
      name: 'vip',
      rate: 13,
      minAmount: 1000000, // 누적 100만원 이상
    },
  ];

  for (const grade of grades) {
    await prisma.grade.upsert({
      where: { id: grade.id },
      update: {
        name: grade.name,
        rate: grade.rate,
        minAmount: grade.minAmount,
      },
      create: grade,
    });
  }
}

main()
  .then(() => {
    console.log('✅ seeding completed');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
