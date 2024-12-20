import db from '../../../db/models/index.js';
import { readFile } from 'fs/promises';
// import { unlinkSync } from 'fs';
// import { join, dirname } from 'path'; // Correct way to import from 'path'

const User = db.User;
const Sector = db.Sector;
const Brokerage = db.Brokerage;
const UserStocks = db.UserStocks;
const StockMaster = db.StockMaster;
const StockReference = db.StockReference;

export default async (user, filePath, brokerageName, date) => {
  // Read the CSV file
  const data = await readFile(filePath, 'utf8');

  // Split the data into rows by newlines
  const rows = data.split('\n');

  // Split each row into columns by commas
  const parsedData = rows.map((row) => {
    // Assuming each row is comma-separated
    return row.split(',');
  });

  // Remove the first row (header row)
  parsedData.shift();

  // Remove the last row (empty row)
  parsedData.pop();

  // Insert the data into the database
  for (const row of parsedData) {
    let [symbol, _a, quantity, price] = row;
    symbol = symbol.replace(/^"(.*)"$/, '$1');
    quantity = parseInt(quantity);
    price = parseFloat(price);
    // console.log('symbol: ', symbol + ' ' + typeof symbol);
    // console.log('quantity: ', quantity + ' ' + typeof quantity);
    // console.log('price: ', price + ' ' + typeof price);

    if (!symbol || !quantity || !price) {
      // console.log('Invalid data');
      continue;
    }

    // Find the brokerage by name
    const brokerage = await Brokerage.findOne({
      where: { name: brokerageName },
    });
    // console.log('brokerage: ', brokerage);

    let stockReference;
    if (user.defaultBrokerageId === brokerage.id) {
      const unknownSector = await Sector.findOrCreate({
        where: { name: 'Unknown', UserId: user.id },
      });
      // console.log('unknownSector: ', unknownSector);

      stockReference = await StockReference.findOrCreate({
        where: {
          UserId: user.id,
          name: symbol,
          code: symbol,
          SectorId: unknownSector[0].id,
        },
      });
    }

    // Find the stock by symbol
    const stock = await StockMaster.findOrCreate({
      where: {
        UserId: user.id,
        BrokerageCode: symbol,
        BrokerageId: brokerage.id,
      },
    });
    // console.log('stock: ', stock[0].id);

    // Update the stock with the StockReferenceId
    stock[0].update({
      StockReferenceId: stockReference ? stockReference[0].id : null,
    });

    const portfolioDate = new Date(date);

    // Perform upsert operation
    const [record, created] = await UserStocks.upsert({
      UserId: user.id,
      StockMasterId: stock[0].id,
      Qty: quantity,
      AvgCost: price,
      Date: portfolioDate, // Ensure exact Date match
    });

    // if (!created) {
    // console.log('Record already exists: ', record);
    // }
  }
};
