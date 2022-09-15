import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import dotEnv from "dotenv";
import fs from "fs-extra";
import path from "path";
import sumBy from "lodash/sumBy.js";

import prettyBytes from "pretty-bytes";

import { login } from "./login.js";

dotEnv.config();

const ROOT_URL = "https://app.uxpin.com";

async function main() {
  // This port will be used by Lighthouse later. The specific port is arbitrary.
  const PORT = 8041;
  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${PORT}`],
    headless: false, // set to false to see the tests in action
    // slowMo: 50,
  });

  await login(browser, ROOT_URL + "/");

  const page = await browser.newPage();
  await page.goto(`${ROOT_URL}/dashboard/projects`);

  await runLighthouse(`${ROOT_URL}/dashboard/projects`, PORT);

  await switchAccount(page, "justyna.kantyka+400");
  await page.waitForSelector("[data-test=project-box-2527170]");

  await runLighthouse(`${ROOT_URL}/edit/9087936#?id_page=153253716`, PORT);

  await runLighthouse(
    `https://preview.uxpin.com/68c06c73fa971d1f8bcd9cf672d40ef44ac1c59c#/pages/153253716?mode=i`,
    PORT
  );


  await browser.close();
  console.log("Done!");
}


async function runLighthouse(url: string, port: number) {
  const options = {
    logLevel: "error",
    output: "json",
    onlyCategories: ["performance"],
    // onlyAudits: ["speed-index", "network-requests"],
    // disableStorageReset: true,
    port,
  };
  console.log("Running Lighthouse", url);
  // @ts-ignore
  const result = await lighthouse(url, options);
  console.log("Performance score", result.lhr.categories.performance.score);
  // checkRequests(result);
  await saveReport(result);
  return result;
}

async function switchAccount(page: puppeteer.Page, accountName: string) {
  await page.waitForSelector(".accounts-panel .account-avatar");
  const links = await page.$$(".accounts-panel .account-avatar");
  await wait(2000); // we need to wait until links are available on the avatars
  for await (const link of links) {
    let valueHandle = await link.getProperty("innerHTML");
    const text = await valueHandle.jsonValue();
    if (text.includes(accountName)) {
      link.click();
      return;
    }
  }
  throw new Error(`Account not found: ${accountName}`);
}

function wait(delay: number = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(delay), delay));
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
  const filepath = path.join(process.cwd(), "reports", "report.json");
  await fs.outputJSON(filepath, result);
}

main();
