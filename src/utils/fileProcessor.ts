import path from 'path';
import fs from 'fs/promises';

// 图片转 base64
async function imageToBase64(imagePath: string): Promise<string> {
  const imageBuffer = await fs.readFile(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp'
  };
  const mimeType = mimeTypes[ext] || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

// 文件类型常量
const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
  TEXT: ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml'],
  DOC: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  EXCEL: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
};

const MAX_CONTENT_LENGTH = 10000;

interface FileRecord {
  id: number;
  originalName: string;
  path: string;
  mimetype: string;
}

interface ProcessedFiles {
  images: string[];
  textContents: string[];
  otherFiles: string[];
}

/**
 * 处理图片文件
 */
async function processImageFile(file: FileRecord): Promise<string | null> {
  try {
    return await imageToBase64(file.path);
  } catch (err) {
    console.error('图片转换失败:', file.originalName, err);
    return null;
  }
}

/**
 * 处理文本文件
 */
async function processTextFile(file: FileRecord): Promise<string | null> {
  try {
    const content = await fs.readFile(file.path, 'utf-8');
    const truncated = content.length > MAX_CONTENT_LENGTH 
      ? content.substring(0, MAX_CONTENT_LENGTH) + '\n...(已截断)'
      : content;
    return `[${file.originalName}]\n\`\`\`\n${truncated}\n\`\`\``;
  } catch (err) {
    console.error('文本文件读取失败:', file.originalName, err);
    return null;
  }
}

/**
 * 处理 Word 文档
 */
async function processWordFile(file: FileRecord): Promise<string | null> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: file.path });
    const truncated = result.value.length > MAX_CONTENT_LENGTH 
      ? result.value.substring(0, MAX_CONTENT_LENGTH) + '\n...(已截断)'
      : result.value;
    return `[${file.originalName}]\n\`\`\`\n${truncated}\n\`\`\``;
  } catch (err) {
    console.error('Word文档解析失败:', file.originalName, err);
    return null;
  }
}

/**
 * 处理 Excel 文件
 */
async function processExcelFile(file: FileRecord): Promise<string | null> {
  try {
    const xlsx = await import('xlsx');
    const workbook = xlsx.readFile(file.path);
    
    const sheets = workbook.SheetNames.map((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_csv(sheet);
      return `工作表 ${index + 1}: ${sheetName}\n${data}`;
    });
    
    const content = sheets.join('\n\n');
    const truncated = content.length > MAX_CONTENT_LENGTH 
      ? content.substring(0, MAX_CONTENT_LENGTH) + '\n...(已截断)'
      : content;
    
    return `[${file.originalName}]\n\`\`\`\n${truncated}\n\`\`\``;
  } catch (err) {
    console.error('Excel文件解析失败:', file.originalName, err);
    return null;
  }
}

/**
 * 判断文件类型
 */
function getFileType(file: FileRecord): 'image' | 'text' | 'doc' | 'excel' | 'other' {
  if (FILE_TYPES.IMAGE.includes(file.mimetype)) return 'image';
  if (FILE_TYPES.TEXT.includes(file.mimetype) || file.originalName.endsWith('.log')) return 'text';
  if (FILE_TYPES.DOC.includes(file.mimetype)) return 'doc';
  if (FILE_TYPES.EXCEL.includes(file.mimetype)) return 'excel';
  return 'other';
}

/**
 * 处理多个文件
 */
export async function processFiles(files: FileRecord[]): Promise<ProcessedFiles> {
  const images: string[] = [];
  const textContents: string[] = [];
  const otherFiles: string[] = [];

  // 并行处理所有文件（提高性能）
  await Promise.all(files.map(async (file) => {
    const type = getFileType(file);

    switch (type) {
      case 'image': {
        const base64 = await processImageFile(file);
        if (base64) images.push(base64);
        break;
      }
      case 'text': {
        const content = await processTextFile(file);
        if (content) textContents.push(content);
        else otherFiles.push(file.originalName);
        break;
      }
      case 'doc': {
        const content = await processWordFile(file);
        if (content) textContents.push(content);
        else otherFiles.push(file.originalName);
        break;
      }
      case 'excel': {
        const content = await processExcelFile(file);
        if (content) textContents.push(content);
        else otherFiles.push(file.originalName);
        break;
      }
      default:
        otherFiles.push(file.originalName);
    }
  }));

  return { images, textContents, otherFiles };
}
