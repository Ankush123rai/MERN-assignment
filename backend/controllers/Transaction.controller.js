import Transaction from "../models/Transaction.model.js";

const initializeDB = async (req, res) => {
  try {
    const transactions = await fetch(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    ).then((res) => res.json());
    await Transaction.deleteMany({});
    await Transaction.insertMany(transactions);
    res.status(201).json({ message: "Database Initialized with Seed Data" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMonthNumber = (month) => {
  const months = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };
  return months[month];
};

// const filterByDateOfSale = (query, month) => {
//     if (month) {
//         const monthNumber = getMonthNumber(month);
//         if (!monthNumber) {
//             return res.status(400).json({ message: "Invalid month provided." });
//         }
//         query.dateOfSale = { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } };
//     }
//     return query;
// };

const getTransactions = async (req, res) => {
    try {
      const { page = 1, perPage = 10, search = "", month } = req.query;
      const regex = new RegExp(search, "i");
      const monthNumber = getMonthNumber(month);
  
      if (!monthNumber) {
        return res.status(400).json({ message: "Invalid month provided." });
      }
  
      const transactions = await Transaction.find({
        $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] },
        $or: [{ title: regex }, { description: regex }, { category: regex }],
      })
        .skip((page - 1) * perPage)
        .limit(Number(perPage));
  
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const getStatistics = async (req, res) => {
    try {
      const { month } = req.query;
      const monthNumber = getMonthNumber(month);
  
      if (!monthNumber) {
        return res.status(400).json({ message: "Invalid month provided." });
      }
  
      const transactions = await Transaction.find({
        $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] },
      });
      const totalSaleAmount = transactions.reduce(
        (sum, transaction) => sum + transaction.price,
        0
      );
      const totalSoldItems = transactions.filter(
        (transaction) => transaction.sold
      ).length;
      const totalNotSoldItems = transactions.length - totalSoldItems;
      console.log(totalSaleAmount, totalSoldItems, totalNotSoldItems);
      res.json({ totalSaleAmount, totalSoldItems, totalNotSoldItems });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


const getBarChart = async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = getMonthNumber(month);

    if (!monthNumber) {
      return res.status(400).json({ message: "Invalid month provided." });
    }

    const transactions = await Transaction.find({
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] },
    });

    const priceRanges = [
      { range: "0-100", count: 0 },
      { range: "101-200", count: 0 },
      { range: "201-300", count: 0 },
      { range: "301-400", count: 0 },
      { range: "401-500", count: 0 },
      { range: "501-600", count: 0 },
      { range: "601-700", count: 0 },
      { range: "701-800", count: 0 },
      { range: "801-900", count: 0 },
      { range: "901-above", count: 0 },
    ];

    transactions.forEach((transaction) => {
      if (transaction.price <= 100) priceRanges[0].count++;
      else if (transaction.price <= 200) priceRanges[1].count++;
      else if (transaction.price <= 300) priceRanges[2].count++;
      else if (transaction.price <= 400) priceRanges[3].count++;
      else if (transaction.price <= 500) priceRanges[4].count++;
      else if (transaction.price <= 600) priceRanges[5].count++;
      else if (transaction.price <= 700) priceRanges[6].count++;
      else if (transaction.price <= 800) priceRanges[7].count++;
      else if (transaction.price <= 900) priceRanges[8].count++;
      else priceRanges[9].count++;
    });

    res.json(priceRanges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Pie Chart Data
const getPieChart = async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = getMonthNumber(month);

    if (!monthNumber) {
      return res.status(400).json({ message: "Invalid month provided." });
    }

    const transactions = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCombinedData = async (req, res) => {
  try {
    const statistics = await getStatistics(req, res);
    const barChart = await getBarChart(req, res);
    const pieChart = await getPieChart(req, res);

    res.json({ statistics, barChart, pieChart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  initializeDB,
  getTransactions,
  getStatistics,
  getBarChart,
  getPieChart,
  getCombinedData,
};
