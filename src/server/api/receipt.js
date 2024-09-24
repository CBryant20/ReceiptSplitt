const { ServerError } = require("../errors");
const prisma = require("../prisma");

const router = require("express").Router();
module.exports = router;

/** Get all receipts for the logged-in user */
router.get("/", async (req, res, next) => {
  try {
    // Ensure the user is authenticated
    if (!res.locals.user || !res.locals.user.id) {
      throw new ServerError(401, "Unauthorized. Please log in.");
    }

    // Fetch all receipts for the logged-in user
    const receipts = await prisma.receipt.findMany({
      where: {
        userId: res.locals.user.id,
      },
      include: {
        items: true,
      },
    });

    res.status(200).json(receipts);
  } catch (err) {
    next(err);
  }
});

/** Upload a new receipt */
router.post("/upload-receipt", async (req, res, next) => {
  try {
    let { items, subtotal, tax, tip, total } = req.body;

    // Check for missing fields
    if (!subtotal || !tax || !tip || !total) {
      throw new ServerError(400, "All receipt details must be provided.");
    }

    // Attempt to parse items if it's a string
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (e) {
        throw new ServerError(400, "Invalid JSON format for items.");
      }
    }

    // Ensure items is an array
    if (!Array.isArray(items)) {
      throw new ServerError(400, "Items must be an array.");
    }

    // Validate each item in the array
    items.forEach((item) => {
      if (!item.description || typeof item.price !== "number") {
        throw new ServerError(
          400,
          "Each item must have a description and a numeric price."
        );
      }
    });

    // Create the receipt and its associated items
    const receipt = await prisma.receipt.create({
      data: {
        userId: res.locals.user.id,
        subtotal,
        tax,
        tip,
        total,
        items: {
          create: items.map((item) => ({
            description: item.description,
            price: item.price,
          })),
        },
      },
    });

    res.status(201).json(receipt);
  } catch (err) {
    next(err);
  }
});

/** Update an existing receipt */
router.put("/receipt/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let { items, subtotal, tax, tip, total } = req.body;

    // Ensure the receipt exists and belongs to the logged-in user
    const receipt = await prisma.receipt.findUnique({ where: { id: +id } });
    if (!receipt) {
      throw new ServerError(404, "Receipt not found.");
    }
    if (receipt.userId !== res.locals.user.id) {
      throw new ServerError(403, "This receipt does not belong to you.");
    }

    // Validate items format
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (e) {
        throw new ServerError(400, "Invalid JSON format for items.");
      }
    }
    if (!Array.isArray(items)) {
      throw new ServerError(400, "Items must be an array.");
    }

    // Update the receipt and its items
    const updatedReceipt = await prisma.receipt.update({
      where: { id: +id },
      data: {
        subtotal,
        tax,
        tip,
        total,
        items: {
          deleteMany: {}, // Delete existing items
          create: items.map((item) => ({
            description: item.description,
            price: item.price,
          })),
        },
      },
    });

    res.status(200).json(updatedReceipt);
  } catch (err) {
    next(err);
  }
});
