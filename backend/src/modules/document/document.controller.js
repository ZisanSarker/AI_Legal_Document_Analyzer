import { extractText } from "../../utils/extract.js";

export const extractData = async (req, res, next) => {
  try {
    const filePath = req.file.path;
    const text = await extractText(filePath);

    res.status(200).json({
      success: true,
      message: "Data extracted successfully",
      text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error extracting data",
      error: error.message,
    });
  }
};
