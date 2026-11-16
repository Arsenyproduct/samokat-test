import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// «3 по цене 2» at /promo/. Сценарий 1: card → the card turns into the set →
// replace by tag → «Добавить за 178 ₽» → cart (replace popup, set sheet, quantities).
// Сценарий 2: two bars with «+» → tray → empty cell → «Выбрать» → one set in the cart.
// Fails on any console error, failed request or a frame over 50 ms while the card turns into the set.

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
  // The card scrolls down to the details
  await page.getByRole('heading', { name: 'Состав', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByText('В 100 граммах')).toBeVisible();
  await shot('product-details');

  // Сценарий 1: a tap on the set row turns the card into the set
  await page.evaluate('window.__long = []');
  await page.getByRole('button', { name: /3 вкуса по цене 2/ }).click();
  await expect(page.getByRole('heading', { name: '3 вкуса по цене 2', exact: true })).toBeVisible();
  await page.waitForTimeout(1300);
  const long = await page.evaluate<number[]>('window.__long');
  expect(long, `long frames: ${long.join(', ')}`).toHaveLength(0);
  await shot('set-card');

  // A flavour tag opens the list; «Белый» is a paid slot, so the prices are 89 ₽
  await page.getByRole('button', { name: 'Заменить «Белый»' }).click();
  const list = page.getByRole('dialog', { name: '3 вкуса по цене 2' });
  await expect(list.getByRole('button', { name: /больше арахиса/ })).toContainText(nb('89 ₽'));
  await shot('set-card-replace');
  await list.getByRole('button', { name: /больше арахиса/ }).click();
  await expect(list).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Заменить «Белый»' })).toHaveCount(0);

  // «Добавить за 178 ₽»: the set flies into the button, then the cart opens
  await page.getByRole('button', { name: nb('Добавить за 178 ₽') }).click();
  const cart = page.getByRole('dialog', { name: 'Корзина' });
  await expect(cart.getByText('3 вкуса по цене 2', { exact: true })).toBeVisible({ timeout: 3000 });
  await expect(cart.getByRole('switch', { name: 'СберСпасибо' })).toHaveAttribute('aria-checked', 'false');
  await expect(cart.getByText(nb('Итого, со скидкой 89 ₽'))).toBeVisible();
  await expect(cart.getByText(nb('227 ₽'))).toBeVisible();
  const old = cart.getByText(nb('267 ₽')).first();
  await expect(old).toHaveCSS('text-decoration-line', 'line-through');
  await expect(old).toHaveCSS('color', 'rgb(154, 154, 158)');
  await shot('cart');

  // A tag in the cart opens the list as a popup
  await cart.getByRole('button', { name: 'Заменить «Лесной орех»' }).click();
  const popup = page.getByRole('dialog', { name: '3 вкуса по цене 2' });
  await popup.getByRole('button', { name: /белый/ }).click();
  await expect(popup).toHaveCount(0);
  await expect(cart.getByRole('button', { name: 'Заменить «Белый»' })).toBeVisible();
  await shot('cart-replaced');

  // The set sheet from the cart
  await cart.getByRole('button', { name: 'Открыть набор' }).click();
  await expect(popup.getByRole('button', { name: 'Вернуться в корзину' })).toBeVisible();
  await shot('cart-set-sheet');
  await popup.getByRole('button', { name: 'Вернуться в корзину' }).click();
  await expect(popup).toHaveCount(0);
  await cart.getByRole('button', { name: 'Добавить: набор Snickers' }).click();
  await expect(cart.getByText(nb('Итого, со скидкой 178 ₽'))).toBeVisible();
  await cart.getByRole('button', { name: 'Убрать: набор Snickers' }).click();
  await expect(cart.getByText(nb('227 ₽'))).toBeVisible();

  // Back to the catalog: tap above the sheet
  await cart.locator('xpath=..').locator('[class*=backdrop]').click({ position: { x: 100, y: 10 } });
  await expect(cart).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Корзина/ })).toHaveAccessibleName(nb('Корзина, 178 ₽'));

  // Сценарий 2: two bars with «+», the tray, the empty cell, the third for 0 ₽
  await page.getByRole('button', { name: 'Шоколадный батончик Snickers, белый' }).first().click();
  await page.getByRole('button', { name: nb('89 ₽'), exact: true }).click();
  await expect(page.getByText('Ещё 2, и третий за 0 ₽')).toBeVisible();
  await page.getByRole('button', { name: 'Лесной орех', exact: true }).click();
  await page.getByRole('button', { name: nb('89 ₽'), exact: true }).click();
  await expect(page.getByText('Ещё 1, и он за 0 ₽')).toBeVisible();
  await expect(page.getByText(nb('1 х 89 ₽'))).toBeVisible();
  await shot('tray');
  await page.getByRole('button', { name: 'Выбрать вкус за 0 ₽' }).click();
  const build = page.getByRole('dialog', { name: '3 вкуса по цене 2' });
  await expect(build.getByText('Ещё один товар и акция сработает')).toBeVisible();
  await expect(build.getByRole('button', { name: 'Добавить набор' })).toBeVisible();
  await shot('build');
  await build.getByRole('button', { name: 'Выбрать', exact: true }).click();
  await build.getByRole('button', { name: /больше арахиса/ }).click();
  await expect(build.getByRole('button', { name: nb('Добавить за 178 ₽') })).toBeVisible();
  await shot('build-full');
  await build.getByRole('button', { name: nb('Добавить за 178 ₽') }).click();

  // The two bars and the third became one set: two sets, no single rows
  await expect(cart).toBeVisible({ timeout: 3000 });
  await expect(cart.getByText('3 вкуса по цене 2', { exact: true })).toHaveCount(2);
  await expect(cart.locator('[data-open="true"] [class*=rowName]')).toHaveCount(0);
  await expect(cart.getByText(nb('Итого, со скидкой 178 ₽'))).toBeVisible();
  await expect(cart.getByText(nb('405 ₽'))).toBeVisible();
  await cart.getByRole('switch', { name: 'СберСпасибо' }).click();
  await expect(cart.getByText(nb('251 ₽'))).toBeVisible();
  await shot('cart-two-sets');

  const closeCart = async () => {
    await cart.locator('xpath=..').locator('[class*=backdrop]').click({ position: { x: 100, y: 10 } });
    await expect(cart).toHaveCount(0);
  };
  const setRows = cart.getByText('3 вкуса по цене 2', { exact: true });

  // The tray counts any flavours; the third «+» turns the card into the set
  await closeCart();
  await page.getByRole('button', { name: 'Шоколадный батончик Snickers, белый' }).first().click();
  await page.getByRole('button', { name: nb('89 ₽'), exact: true }).click();
  await page.getByRole('button', { name: 'Лесной орех', exact: true }).click();
  await page.getByRole('button', { name: nb('89 ₽'), exact: true }).click();
  await page.getByRole('button', { name: 'Больше арахиса', exact: true }).click();
  await expect(page.getByText('Ещё 1, и он за 0 ₽')).toBeVisible();
  await page.getByRole('button', { name: nb('89 ₽'), exact: true }).click();
  await expect(page.getByRole('heading', { name: '3 вкуса по цене 2', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Заменить «Больше арахиса»' })).toBeVisible();
  await page.waitForTimeout(1200);
  await shot('tray-to-set');
  await page.getByRole('button', { name: nb('Добавить за 178 ₽') }).click();
  await expect(cart).toBeVisible({ timeout: 3000 });
  await expect(setRows).toHaveCount(3);
  await expect(cart.locator('[data-open="true"] [class*=rowName]')).toHaveCount(0);

  // Any three bars in the cart become a set by themselves
  await closeCart();
  await page.getByRole('button', { name: 'Шоколадный батончик Snickers, лесной орех' }).first().click();
  await page.getByRole('button', { name: nb('89 ₽'), exact: true }).click();
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await page.getByRole('button', { name: /^Корзина/ }).click();
  await expect(cart.locator('[data-open="true"] [class*=rowName]')).toHaveCount(1);
  await cart.getByRole('button', { name: 'Добавить: Лесной орех' }).click();
  await cart.getByRole('button', { name: 'Добавить: Лесной орех' }).click();
  await expect(setRows).toHaveCount(4);
  await expect(cart.locator('[data-open="true"] [class*=rowName]')).toHaveCount(0);
  await shot('cart-auto-set');

  // Catalog: the price chip adds to the cart without opening the card, the tray shows up
  await closeCart();
  await page.getByRole('button', { name: nb('В корзину: Белый, 89 ₽') }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Ещё 2, и третий за 0 ₽')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Убрать: Белый' }).first()).toBeVisible();
  await shot('catalog-chip-tray');
  await page.getByRole('button', { name: 'Добавить: Белый' }).first().click();
  await expect(page.getByText('Ещё 1, и он за 0 ₽')).toBeVisible();

  // The tray is swiped away to the left and stays hidden until the next set
  const tray = page.getByRole('group', { name: /Набор: 3 по цене 2/ });
  const box = (await tray.boundingBox())!;
  await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width - 40 - i * 25, box.y + box.height / 2);
  await page.mouse.up();
  await expect(tray).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Убрать: Белый' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Добавить: Белый' }).first().click();
  // The third bar made a set: the tray leaves, the chip is back to «89 ₽ +»
  await expect(page.getByText(/и он за 0 ₽|и третий за 0 ₽/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: nb('В корзину: Белый, 89 ₽') }).first()).toBeVisible();
  await page.getByRole('button', { name: /^Корзина/ }).click();
  await expect(setRows).toHaveCount(5);

  expect(problems).toEqual([]);
});
