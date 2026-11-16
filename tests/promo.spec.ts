import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// «3 по цене 2» at /promo/: catalog → product → singles with the stepper and the
// tooltip → set sheet → replace → «Добавить за 178 ₽» with the bars animation →
// cart → flavour replace in the row → set sheet from the cart → quantities.
// Fails on any console error, failed request or a frame over 50 ms during the set animation.

function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
  return problems;
}

function shooter(page: Page, project: string) {
  const dir = `tests/screenshots/promo-${project}`;
  mkdirSync(dir, { recursive: true });
  let step = 0;
  return async (name: string, settle = 650) => {
    step += 1;
    await page.waitForTimeout(settle);
    await page.screenshot({ path: `${dir}/${String(step).padStart(2, '0')}-${name}.png` });
  };
}

const nb = (s: string) => s.replace(/ /g, ' ');

test('3 по цене 2: from the catalog to the cart', async ({ page }, testInfo) => {
  const problems = watchConsole(page);
  const shot = shooter(page, testInfo.project.name);

  await page.goto('promo/');
  // Counts frames longer than 50 ms (the spec runs in Node, so the page code is a string)
  await page.evaluate(`(() => {
    window.__long = [];
    let last = performance.now();
    const tick = (t) => { if (t - last > 50) window.__long.push(t - last); last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  })()`);
  await expect(page.getByRole('heading', { name: 'Сладкое' })).toBeVisible();
  // No cart button until Snickers are added (E1 has none)
  await expect(page.getByRole('button', { name: /^Корзина/ })).toHaveCount(0);
  await shot('catalog');

  // E2: product card
  await page.getByRole('button', { name: 'Шоколадный батончик Snickers, лесной орех' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Шоколадный батончик Snickers, лесной орех' });
  await expect(dialog).toBeVisible();
  await shot('product');

  // Flavour chips switch the photo and the title
  await dialog.getByRole('button', { name: 'Белый', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Шоколадный батончик Snickers, белый' })).toBeVisible();
  await page.getByRole('button', { name: 'Лесной орех', exact: true }).click();

  // «89 ₽ +» → stepper with «Еще 2 до скидки» and the tooltip
  await page.getByRole('button', { name: nb('89 ₽') }).click();
  await expect(page.getByText(nb('1 х 89 ₽'))).toBeVisible();
  await expect(page.getByText('Еще 2 до скидки')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Любые 3 вкуса');
  await page.getByRole('button', { name: 'Добавить ещё' }).click();
  await expect(page.getByText(nb('2 х 89 ₽'))).toBeVisible();
  await expect(page.getByText('Еще 1 до скидки')).toBeVisible();
  await shot('stepper-tooltip');
  await page.getByRole('button', { name: 'Скрыть подсказку' }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Убрать одну' }).click();
  await page.getByRole('button', { name: 'Убрать одну' }).click();
  await expect(page.getByRole('button', { name: nb('89 ₽') })).toBeVisible();

  // E3: the set sheet, replace the free third flavour
  await page.getByRole('button', { name: /3 вкуса по цене 2/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Snickers: 3 вкуса' });
  await expect(sheet.getByText('Третий за 0 ₽')).toBeVisible();
  await shot('set-sheet');
  await sheet.getByRole('button', { name: 'Заменить' }).nth(2).click();
  await shot('replace');
  await sheet.getByRole('button', { name: /Шоколадный батончик Snickers, лесной орех/ }).click();
  // Third position is now «лесной орех»: «больше арахиса» stays only in the (hidden) list
  await expect(sheet.getByText('Шоколадный батончик Snickers, лесной орех', { exact: true })).toHaveCount(3);
  await expect(sheet.getByText('Шоколадный батончик Snickers, больше арахиса', { exact: true })).toHaveCount(1);

  // «Добавить за 178 ₽»: the card turns into the set, the set lands in the add bar
  await page.evaluate('window.__long = []');
  await sheet.getByRole('button', { name: nb('Добавить за 178 ₽') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Snickers, 3 вкуса по цене 2' })).toBeVisible();
  // The set has landed: the add bar turns into the stepper of sets
  await expect(page.locator('[data-landed="1"]')).toBeAttached({ timeout: 3000 });
  await expect(page.getByText('Набор в корзине')).toBeVisible();
  await expect(page.getByText(nb('1 х 178 ₽'))).toBeVisible();
  await page.waitForTimeout(400);
  // The whole add-set animation runs without dropped frames
  const long = await page.evaluate<number[]>('window.__long');
  expect(long, `long frames: ${long.join(', ')}`).toHaveLength(0);
  await shot('set-added');

  await page.getByRole('button', { name: 'Закрыть' }).click();
  const cartButton = page.getByRole('button', { name: /^Корзина/ });
  await expect(cartButton).toHaveAccessibleName(nb('Корзина, 293 ₽'));
  await shot('catalog-cart-button');

  // E4: cart
  await cartButton.click();
  const cart = page.getByRole('dialog', { name: 'Корзина' });
  await expect(cart.getByText('Snickers, 3 вкуса по цене 2')).toBeVisible();
  await expect(cart.getByText(nb('Итого, со скидкой 243 ₽'))).toBeVisible();
  await expect(cart.getByText(nb('188 ₽'))).toBeVisible();
  await shot('cart');

  // E5: replace a flavour right in the row
  await cart.getByRole('button', { name: 'Белый', exact: true }).first().click();
  await expect(cart.getByText('Заменить «Белый» на')).toBeVisible();
  await shot('cart-replace');
  await cart.getByRole('button', { name: 'Больше арахиса', exact: true }).last().click();
  await expect(cart.getByText('Заменить «Белый» на')).toBeHidden();

  // The set sheet over the cart
  await cart.getByRole('button', { name: 'Открыть набор' }).click();
  const cartSheet = page.getByRole('dialog', { name: 'Snickers: 3 вкуса' });
  await expect(cartSheet.getByRole('button', { name: 'Вернуться в корзину' })).toBeVisible();
  await shot('cart-set-sheet');
  await cartSheet.getByRole('button', { name: 'Вернуться в корзину' }).click();
  await expect(cartSheet).toHaveCount(0);

  // Quantities and the total
  await cart.getByRole('button', { name: 'Добавить: набор Snickers' }).click();
  await expect(cart.getByText(nb('Итого, со скидкой 332 ₽'))).toBeVisible();
  await cart.getByRole('button', { name: 'Убрать: Печенье' }).click();
  await expect(cart.getByText(nb('251 ₽'))).toBeVisible();
  await cart.getByRole('switch', { name: 'СберСпасибо' }).click();
  await expect(cart.getByText(nb('405 ₽'))).toBeVisible();
  await shot('cart-changed');

  expect(problems).toEqual([]);
});
