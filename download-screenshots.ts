import { readFileSync, existsSync, mkdirSync, promises as fs } from "fs";
import { join } from "path";

interface ScreenshotInfo {
  filename: string;
  width: number;
  height: number;
}

interface ScreenshotsData {
  [key: string]: ScreenshotInfo[];
}

// 读取 JSON 文件
const jsonData = JSON.parse(
  readFileSync("screenshots.json", "utf-8")
) as ScreenshotsData;

// 创建下载目录
const downloadDir = join(process.cwd(), "images");
if (!existsSync(downloadDir)) {
  mkdirSync(downloadDir);
}

// 下载单个文件
async function downloadFile(filename: string) {
  const filePath = join(downloadDir, filename);

  // 检查文件是否已存在
  if (existsSync(filePath)) {
    console.log(`文件已存在，跳过下载: ${filename}`);
    return;
  }

  try {
    const url = `https://flash-screenshots.zczc.cz/${filename}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    console.log(`下载完成: ${filename}`);
  } catch (error) {
    console.error(`下载出错 ${filename}:`, error);
  }
}

// 逐个下载所有文件
async function downloadAll() {
  const entries = Object.entries(jsonData);
  console.log(`开始下载 ${entries.length} 个截图...`);

  const concurrency = 30; // 并发数量
  let downloadedCount = 0;

  for (const [_, screenshots] of entries) {
    // 将当前条目的所有截图转换为下载任务
    const tasks = screenshots.map(
      (screenshot) => () => downloadFile(screenshot.filename)
    );

    // 分批处理下载任务
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      await Promise.all(batch.map((task) => task()));

      downloadedCount += batch.length;
      console.log(`进度: ${downloadedCount}/${entries.length}`);
    }
  }

  console.log("所有下载任务完成");
}

// 开始下载
downloadAll();
