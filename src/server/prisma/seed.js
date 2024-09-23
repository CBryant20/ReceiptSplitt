const prisma = require("../prisma");
const { faker } = require("@faker-js/faker");

// Helper to create random receipt items
const generateReceiptItems = (numItems) => {
  const items = [];
  let subtotal = 0;

  for (let i = 0; i < numItems; i++) {
    const price = faker.number.int({ min: 100, max: 5000 }); // Price in cents
    const description = faker.commerce.productName();

    items.push({ description, price });
    subtotal += price;
  }

  return { items, subtotal };
};

// Main seed function
const seed = async () => {
  for (let i = 0; i < 5; i++) {
    // Create 5 random users
    const userEmail = faker.internet.email();
    const userPassword = faker.internet.password();

    // Create receipts for each user
    const receiptsData = [];
    for (let j = 0; j < faker.number.int({ min: 1, max: 3 }); j++) {
      // 1-3 receipts per user
      const { items, subtotal } = generateReceiptItems(
        faker.number.int({ min: 2, max: 5 })
      ); // 2-5 items per receipt
      const tax = Math.floor(subtotal * 0.08); // 8% tax
      const tip = faker.number.int({ min: 100, max: 1000 }); // Random tip between 1.00 and 10.00
      const total = subtotal + tax + tip;

      receiptsData.push({
        subtotal,
        tax,
        tip, // Added tip
        total,
        items: {
          create: items,
        },
        selectedItems: {
          create: items.map((item, index) => ({
            receiptItemId: index + 1, // Assuming the receipt items start from ID 1
            quantity: faker.number.int({ min: 1, max: 3 }), // Random quantity for selected items
          })),
        },
      });
    }

    // Upsert user and create associated receipts
    await prisma.user.upsert({
      where: {
        email: userEmail,
      },
      update: {},
      create: {
        email: userEmail,
        password: userPassword, // Ideally, you should hash this
        receipts: {
          create: receiptsData,
        },
      },
    });
  }
};

seed()
  .then(async () => {
    console.log("Seed data created successfully!");
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("Error while seeding:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
