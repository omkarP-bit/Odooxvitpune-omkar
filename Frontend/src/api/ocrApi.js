import { ocrApi } from './axiosInstance';

/**
 * Upload a receipt image to the OCR service.
 * @param {File} file - image/pdf file
 * @returns {Promise<object>} - parsed receipt data
 */
export async function processReceipt(file) {
  const formData = new FormData();
  formData.append('receipt', file);

  const { data } = await ocrApi.post('/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { success, data: { amount, currency, date, vendor_name, ... } }
}
