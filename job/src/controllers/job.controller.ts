import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import AWS from 'aws-sdk'; 
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import { allOrders } from '../orders/fetch.orders';
import { S3_BUCKET } from '../utils/config.utils'; 

// Configure AWS S3
const s3 = new AWS.S3();

export const post = async (_request: Request, response: Response) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const fileName = `orders_${today}.csv`;
    const filePath = path.join(__dirname, `../../csv/${fileName}`);

    // Get the orders for today
    const orders = await allOrders({ where: `createdAt >= "${today}T00:00:00Z" and createdAt <= "${today}T23:59:59Z"` });

    // Extract order IDs and write to a CSV
    const orderIds = orders.results.map(order => order.id);
    writeOrdersToLocalCSV(filePath, orderIds);

    // Upload CSV to AWS S3
    await uploadCSVToS3(filePath, fileName);

    logger.info(`Orders for ${today} have been written to ${fileName} in S3 bucket ${S3_BUCKET}`);
    response.status(200).send(`Orders for ${today} have been written to ${fileName} in S3 bucket ${S3_BUCKET}`);
  } catch (error) {
    throw new CustomError(
      500,
      `Internal Server Error - Error retrieving all orders from the commercetools SDK`
    );
  }
};

// Function to write orders to a local CSV file
const writeOrdersToLocalCSV = (filePath: string, orderIds: string[]) => {
  const csvContent = 'OrderID\n' + orderIds.join('\n');
  fs.writeFileSync(filePath, csvContent, { encoding: 'utf8' });
};

// Function to upload the CSV file to AWS S3
const uploadCSVToS3 = async (filePath: string, fileName: string) => {
  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: S3_BUCKET, 
    Key: `ashwin/${fileName}`, // Specify the path in your S3 bucket
    Body: fileStream,
    ContentType: 'text/csv', // Optional: specify content type
  };

  // Perform the upload to S3
  await s3.upload(uploadParams).promise();
};
