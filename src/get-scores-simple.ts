import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import dotEnv from "dotenv";
import fs from "fs-extra";
import path from "path";
import sumBy from "lodash/sumBy.js";

import prettyBytes from "pretty-bytes";

import { login } from "./login.js";
import { getAverageSummary, getSummary, Summary } from "./lighthouse-utils.js";

dotEnv.config();

const ROOT_URL = "https://app.uxpin.com";

async function main() {
  // This port will be used by Lighthouse later. The specific port is arbitrary.
  const PORT = 8041;
  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${PORT}`],
    headless: false, // set to false to see the tests in action
  });

  await login(browser, ROOT_URL + "/");

  const page = await browser.newPage();
  await page.goto(`${ROOT_URL}/dashboard/projects`);

  // Dashboard
  await generateAverageSummary(`${ROOT_URL}/dashboard/projects`, PORT);

  // Editor
  await generateAverageSummary(`${ROOT_URL}/edit/9087936#?id_page=153253716`, PORT);

  // Preview
  await generateAverageSummary(`https://preview.uxpin.com/62cb3f9da32062e24f85ec02d6300c8b25f9b27a#/pages//simulate/no-panels?mode=i`, PORT);

  await browser.close();
  console.log("Done!");
}

async function generateAverageSummary(
  url: string,
  port: number
): Promise<Summary> {
  const COUNT = 1;
  const summaries: Summary[] = [];
  for (let index = 0; index < COUNT; index++) {
    console.log(`Iteration ${index + 1}/${COUNT}`);
    const result = await runLighthouse(url, port);
    const summary = getSummary(result);
    console.log(summary);
    summaries.push(summary);
  }
  const report = getAverageSummary(summaries);
  console.log("Average results", report);

  return report;
}


async function runLighthouse(url: string, port: number) {
  const options = {
    logLevel: "error",
    output: "html",
    onlyCategories: ["performance"],
    // onlyAudits: ["speed-index", "network-requests"],
    // disableStorageReset: true,
    port,
  };
  console.log("Running Lighthouse", url);
  const result = await lighthouse(url, options);
  // checkRequests(result);
  await saveReport(result);
  return result;
}

function checkRequests(result: any) {
  const speedIndexValue = result.lhr.audits["speed-index"].numericValue;
  console.log(speedIndexValue);

  const jsRequests = result.lhr.audits["network-requests"].details.items.filter(
    (item) => item.mimeType.includes("javascript")
  );

  jsRequests.forEach((item) => {
    console.log(
      item.url,
      prettyBytes(item.transferSize),
      prettyBytes(item.resourceSize)
    );
  });

  const size = sumBy(
    jsRequests,
    (item: any) => item.transferSize || item.resourceSize
  );
  console.log(jsRequests.length, prettyBytes(size));
}

async function saveReport(result: any) {
  const filepath = path.join(process.cwd(), "reports", "report.html");
  await fs.outputJSON(filepath, result);
}

main();
