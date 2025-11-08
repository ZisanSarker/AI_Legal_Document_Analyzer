import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Upload document and extract text
export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axios.post(`${API_BASE}/docs/extract`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

// Analyze extracted text
export async function analyzeText(text: string) {
  const { data } = await axios.post(`${API_BASE}/semantic/analyze`, {
    text,
  });

  return data;
}

// Run fraud detection by sending the original file to backend
export async function detectFraud(file: File) {
  const form = new FormData();
  // Backend route currently uses multer.array('file') so 'file' is correct
  form.append("file", file);

  const { data } = await axios.post(`${API_BASE}/fraud`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    // Fraud analysis might take longer due to remote call
    timeout: 120000,
  });

  return data;
}
