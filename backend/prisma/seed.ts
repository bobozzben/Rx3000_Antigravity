import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Products & Vendors...');

  // Seed Products
  const products = [
    { code: 'A001', name: '不鏽鋼螺絲 M6', spec: '10mm', price: 5.50, stock: 1200 },
    { code: 'A002', name: '六角螺帽 M6', spec: '6mm', price: 2.00, stock: 3500 },
    { code: 'A003', name: '高強度墊片', spec: 'M6厚型', price: 1.50, stock: 5000 },
    { code: 'A004', name: '膨脹螺栓', spec: '3/8" x 3"', price: 15.00, stock: 800 },
    { code: 'A005', name: '自攻螺絲', spec: '#8 x 1"', price: 3.20, stock: 2400 },
    { code: 'B001', name: 'PVC水管', spec: '2吋 4米', price: 180.00, stock: 150 },
    { code: 'B002', name: 'PVC彎頭', spec: '2吋 90度', price: 35.00, stock: 420 },
    { code: 'B003', name: '水管膠水', spec: '500g', price: 120.00, stock: 60 },
    { code: 'C001', name: '絕緣電線', spec: '2.0mm 100M', price: 1250.00, stock: 45 },
    { code: 'C002', name: '無熔絲開關', spec: '2P 20A', price: 320.00, stock: 90 },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { code: prod.code },
      update: prod,
      create: prod,
    });
  }

  // Seed Vendors
  const vendors = [
    { code: 'F001', name: '全聯五金工業股份有限公司' },
    { code: 'F002', name: '勝大水暖器材行' },
    { code: 'F003', name: '東亞電工材料有限公司' },
    { code: 'F004', name: '台鋼金屬精密實業' },
    { code: 'F005', name: '聯發包材批發中心' },
  ];

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { code: vendor.code },
      update: vendor,
      create: vendor,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
