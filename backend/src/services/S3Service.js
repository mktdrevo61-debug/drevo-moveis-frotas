/**
 * S3Service.js
 * ------------
 * Mock S3 service that simulates uploading a receipt image to AWS S3.
 * In production this would use the AWS SDK (@aws-sdk/client-s3) with
 * real credentials and a real bucket.
 */

/**
 * Simulate uploading a base64-encoded image to S3.
 * @param {string} base64data - Base64-encoded image string (with or without data-URI prefix).
 * @returns {Promise<string>} The public URL of the uploaded receipt.
 */
async function uploadReceipt(base64data) {
  // In production:
  //   1. Strip data-URI prefix if present: base64data.replace(/^data:image\/\w+;base64,/, '')
  //   2. Convert to Buffer: Buffer.from(strippedData, 'base64')
  //   3. Use PutObjectCommand to upload to S3 with a unique key
  //   4. Return the resulting S3 URL or pre-signed URL

  // Simulate upload latency (~200ms)
  await new Promise((resolve) => setTimeout(resolve, 200));

  const filename = `${Date.now()}.jpg`;
  const url = `https://drevo-bucket.s3.amazonaws.com/receipts/${filename}`;

  console.log(`[S3Service] Receipt uploaded: ${url}`);

  return url;
}

module.exports = { uploadReceipt };
