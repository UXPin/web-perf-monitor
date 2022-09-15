import puppeteer from "puppeteer";

export async function login(browser: puppeteer.Browser, url: string) {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  if (!email) throw new Error("No email setup");
  if (!password) throw new Error("No password setup");
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector('input[id="login-login"]', { visible: true });

  const emailInput = await page.$('input[id="login-login"]');
  await emailInput!.type(email);
  const passwordInput = await page.$('input[id="login-password"]');
  await passwordInput!.type(password);
  
  await Promise.all([
    page.$eval("#login-form", (form) => (form as any).submit()),
    page.waitForNavigation(),
  ]);

  await page.close();
  console.log("Login OK", email);
  
}