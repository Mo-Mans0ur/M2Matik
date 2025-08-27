import { test, expect } from "@playwright/test";

// Helper to pick a card by label text
async function clickCard(page, label: string) {
  // Cards expose role=button with aria-label like: "Tilføj {label}"
  await page
    .getByRole("button", { name: new RegExp(`Tilføj\\s+${label}`, "i") })
    .first()
    .click();
}

test("basic flow: set meta, go to renovation, add items, verify prices and rounding", async ({
  page,
}) => {
  await page.goto("/");

  // Fill front page meta
  await page.getByPlaceholder("fx 120").fill("120");
  await page.getByPlaceholder("0000").fill("2100");
  await page.getByRole("button", { name: "Videre" }).click();

  // On ground type choose Renovering
  await page.getByRole("button", { name: "Renovering" }).click();

  // Add Maling
  await clickCard(page, "Indvendigt malerarbejde");

  // Ensure one card appears with a price
  const firstPrice = page
    .locator("[id^=proj-] .font-semibold", { hasText: "kr." })
    .first();
  await expect(firstPrice).toBeVisible();

  // Toggle Stuk and ensure price increases
  await page.getByText("Stuk", { exact: true }).click();

  // Add Terrasse and set area + quality
  await clickCard(page, "Terrasse");
  // Select the last added card (terrasse), adjust sliders by keyboard
  const cards = page.locator("[id^=proj-]");
  const lastCard = cards.last();
  await expect(lastCard).toBeVisible();
  // Move terrace area slider to ~20 m2
  const areaSlider = lastCard.locator('input[title*="terrasse" i]');
  await areaSlider.first().focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowRight");

  // Check total rounding ends with .000 kr.
  const totalEl = page.locator("aside .font-bold", { hasText: "kr." }).last();
  const txt = (await totalEl.textContent()) || "";
  // Expect thousands formatting and rounding to nearest 1000
  expect(txt).toMatch(/\d{1,3}(\.\d{3})*\s+kr\./);
  expect(txt).toMatch(/\.000\s+kr\.$/);
});
