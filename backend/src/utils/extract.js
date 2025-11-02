import fs from "fs";
import {
  DetectDocumentTextCommand,
  TextractClient,
} from "@aws-sdk/client-textract";

const textract = new TextractClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const extractText = async (filePath) => {
  const fileBytes = fs.readFileSync(filePath);

  const params = {
    Document: { Bytes: fileBytes },
  };

  const command = new DetectDocumentTextCommand(params);
  const response = await textract.send(command);

  // Combine all detected lines into one text
  const text = response.Blocks.filter((block) => block.BlockType === "LINE")
    .map((block) => block.Text)
    .join("\n");

  return text;
};
