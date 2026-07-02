/**
 * OcrService.js
 * -------------
 * Mock OCR service that simulates extracting fuel receipt data from an image URL.
 * In production this would call a real OCR provider (e.g., AWS Textract, Google Vision).
 *
 * Simulates a ~300ms network/processing delay.
 */

/**
 * Simulate OCR extraction from a receipt image URL.
 * @param {string} imageUrl - Public or pre-signed URL of the receipt image.
 * @returns {Promise<{
 *   liters:      string,
 *   total_cost:  string,
 *   fuel_type:   string,
 *   cnpj:        string,
 *   confidence:  number
 * }>}
 */
async function extractData(imageUrl) {
  // Simulate OCR processing latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In production: send imageUrl to OCR provider and parse response
  console.log(`[OcrService] Processing receipt: ${imageUrl}`);

  const fuelTypes = ['gasoline', 'diesel', 'ethanol'];

  return {
    liters:     (Math.random() * 60 + 20).toFixed(2),
    total_cost: (Math.random() * 400 + 100).toFixed(2),
    fuel_type:  fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
    cnpj:       '12.345.678/0001-99',
    confidence: 0.94,
  };
}

module.exports = { extractData };
