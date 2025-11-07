import prisma from '../src/common/prisma/client';
import bcrypt from 'bcrypt';
import 'dotenv/config';

(async () => {
  const url = new URL(process.env.DATABASE_URL!);
  console.log('🔌 Seeding DB:', {
    host: url.host,            // localhost:5432 등
    db: url.pathname.slice(1), // project
    search: url.search,        // ?schema=public
  });

  const info = await prisma.$queryRawUnsafe<
    { db: string; usr: string; sch: string }[]
  >(`SELECT current_database() AS db,
            current_user AS usr,
            current_schema() AS sch;`);
  console.log('🎯 Connected to:', info[0]);
async function main() {
  // 공통 ID 상수
  const sellerId = 'cmfw4ai860000a8v489fa5cqy';
  const buyerId  = 'cmfw4ai860000a8v489fa5cqz';

  // 1) 등급
  const grades = [
    { id: 'grade_green',  name: 'green',  rate: 5,  minAmount: 0 },
    { id: 'grade_orange', name: 'orange', rate: 7,  minAmount: 100000 },
    { id: 'grade_red',    name: 'red',    rate: 9,  minAmount: 300000 },
    { id: 'grade_black',  name: 'black',  rate: 11, minAmount: 500000 },
    { id: 'grade_vip',    name: 'vip',    rate: 13, minAmount: 1000000 },
  ];
  for (const grade of grades) {
    await prisma.grade.upsert({
      where: { id: grade.id },
      update: grade,
      create: grade,
    });
  }

  // 2) 사용자 - SELLER
  await prisma.user.upsert({
    where: { id: sellerId },
    update: {},
    create: {
      id: sellerId,
      name: '옷팜',
      email: 'test01@test.com',
      password: await bcrypt.hash('12345678', 10),
      type: 'SELLER',
      grade: { connect: { id: 'grade_green' } },
    },
  });

  // 2-1) 사용자 - BUYER (추가)
  await prisma.user.upsert({
    where: { id: buyerId },
    update: {},
    create: {
      id: buyerId,
      name: '테스트 바이어',
      email: 'buyer@codit.com',
      password: await bcrypt.hash('12345678', 10),
      type: 'BUYER',
      grade: { connect: { id: 'grade_green' } },
    },
  });

  // 3) 카테고리
  const categories = ['TOP', 'BOTTOM', 'DRESS', 'OUTER', 'SKIRT', 'SHOES', 'ACC'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 4) 스토어 (셀러 연결)
  const stores = [
    {
      id: 'store1',
      userId: sellerId,
      name: '하이버',
      address: '서울시 강남구',
      detailAddress: '역삼동 123-45',
      phoneNumber: '010-1234-5678',
      content: '최고의 상품을 판매하는 스토어입니다.',
      image: 'https://example.com/store1.png',
      productCount: 0,
      favoriteCount: 0,
      monthFavoriteCount: 0,
      totalSoldCount: 0,
      isDeleted: false,
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { userId: store.userId },
      update: {
        name: store.name,
        address: store.address,
        detailAddress: store.detailAddress,
        phoneNumber: store.phoneNumber,
        content: store.content,
        image: store.image,
        productCount: store.productCount,
        favoriteCount: store.favoriteCount,
        monthFavoriteCount: store.monthFavoriteCount,
        totalSoldCount: store.totalSoldCount,
        isDeleted: store.isDeleted,
      },
      create: store,
    });
  }

  // 5) 사이즈
  const sizes = [
    { id: 1, name: 'xs',   ko: '엑스스몰', en: 'XS' },
    { id: 2, name: 's',    ko: '스몰',     en: 'S'  },
    { id: 3, name: 'm',    ko: '미디엄',   en: 'M'  },
    { id: 4, name: 'l',    ko: '라지',     en: 'L'  },
    { id: 5, name: 'xl',   ko: '엑스라지', en: 'XL' },
    { id: 6, name: 'free', ko: '프리',     en: 'FREE' },
  ];
  await prisma.size.createMany({
    data: sizes,
    skipDuplicates: true,
  });
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
  })
})();
