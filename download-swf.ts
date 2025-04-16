import { readFileSync, existsSync, mkdirSync, promises as fs } from "fs";
import { join } from "path";

interface FlashRef {
  author?: string;
  description?: string;
  email?: string;
  id?: number;
  name?: string;
  original?: boolean;
  uploader?: string;
  url?: string;
}

interface FlashInfo {
  sha256: string;
  size: number;
  original: string;
  ref: {
    flashempire?: FlashRef;
    flash8?: FlashRef;
  };
}

interface FlashData {
  [key: string]: FlashInfo;
}

// 读取 JSON 文件
const jsonData = JSON.parse(readFileSync("flash.json", "utf-8")) as FlashData;

// 创建下载目录
const downloadDir = join(process.cwd(), "downloads");
if (!existsSync(downloadDir)) {
  mkdirSync(downloadDir);
}

// 下载单个文件
async function downloadFile(sha256: string, info: FlashInfo) {
  const filePath = join(downloadDir, `${sha256}.swf`);

  // 检查文件是否已存在
  if (existsSync(filePath)) {
    console.log(`文件已存在，跳过下载: ${sha256}.swf`);
    return;
  }

  try {
    const url = `https://flash-swf.zczc.cz/${sha256}.swf`;
    const response = await fetch(url);
    console.log(`开始下载: ${url}`);

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }
    console.log(`下载完成，开始写入: ${sha256}.swf`);

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    console.log(`写入完成: ${sha256}.swf`);
  } catch (error) {
    console.error(`下载出错 ${sha256}.swf:`, error);
  }
}

// 逐个下载所有文件
async function downloadAll() {
  const entries = Object.entries(jsonData);
  console.log(`开始下载 ${entries.length} 个文件...`);

  // 将数组分成多个子数组，每个子数组包含3个元素
  const count = 10;
  for (let i = 0; i < entries.length; i += count) {
    const chunk = entries.slice(i, i + count);
    const downloadPromises = chunk.map(([sha256, info], index) => {
      console.log(`开始下载 ${i + index + 1}/${entries.length}`);
      return downloadFile(sha256, info);
    });

    // 并发下载当前批次的文件
    await Promise.all(downloadPromises);
  }

  console.log("所有下载任务完成");
}

// 开始下载
downloadAll();
