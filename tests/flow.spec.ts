import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Full «Ползунок» flow: home → story → catalog → collection → product sheets →
// cart → checkout (all three slider positions) → payment → tracking → delay.
// Runs on 390×844 and 1440×900, fails on any console error or warning and
// saves a screenshot of every screen to tests/screenshots/<project>/.

function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()}`));
  return problems;
}

function shooter(page: Page, project: string) {
  const dir = `tests/screenshots/${project}`;
  mkdirSync(dir, { recursive: true });
  let step = 0;
  return async (name: string, settle = 450) => {
    step += 1;
    // Let enter animations settle before the picture.
    await page.waitForTimeout(settle);
    await page.screenshot({ path: `${dir}/${String(step).padStart(2, '0')}-${name}.png` });
  };
}

/** The 300 ms skeleton is shown on enter and then replaced by content. */
async function expectSkeletonThenContent(page: Page) {
  const busy = page.locator('[aria-busy="true"]').first();
  await expect(busy).toBeAttached({ timeout: 250 });
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 1500 });
}

const price = (value: string) => new RegExp(`^${value.replace(' ', '\\s')}\\s₽$`);

test('whole flow from home to the delay', async ({ page }, testInfo) => {
  const problems = watchConsole(page);
  const shot = shooter(page, testInfo.project.name);

  // 1. Home, variant A
  await page.goto('#/home');
  await expect(page.getByText('Аптека, зоомагазин и кафе теперь в Самокате')).toBeVisible();
  await expect(page.getByText('Ооооострова с призами')).toBeVisible();
  await shot('home');

  // News → story, variant B
  await page.getByRole('button', { name: /Аптека, зоомагазин и кафе/ }).click();
  await expect(page.getByRole('heading', { name: 'Что привезём первым' })).toBeVisible();
  await shot('story');

  // Back gesture returns to home, then forward again
  await page.goBack();
  await expect(page.getByText('Ооооострова с призами')).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Что привезём первым' })).toBeVisible();

  // 2. Catalog
  await page.getByRole('button', { name: 'К товарам' }).click();
  await expectSkeletonThenContent(page);
  await expect(page.getByRole('heading', { name: 'Партнёры' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Подборка на вечер' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Открыть: Гречневая/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Поиск' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Корзина,/ })).toBeVisible();
  await shot('catalog');

  // Partners collection
  await page.getByRole('button', { name: /Аптеки/ }).click();
  await expectSkeletonThenContent(page);
  await expect(page.getByRole('heading', { name: 'Подборка на вечер' })).toBeVisible();
  await expect(page.getByText('для хвостиков')).toBeVisible();
  await shot('collection');

  // Every card opens; Самокат products have no partner delivery block
  await page.getByRole('button', { name: /Открыть: Молоко/ }).click();
  await expect(page.getByRole('heading', { name: /Молоко Самокат/ })).toBeVisible();
  await expect(page.getByText(/^Привезёт/)).toHaveCount(0);
  await page.goBack();
  await page.getByRole('button', { name: /Открыть: Игрушка/ }).click();
  await expect(page.getByText('Привезёт 4 лапы, около часа')).toBeVisible();
  await page.goBack();

  // Adding keeps the chip the same size, it only turns bright (пломбир is already in the cart)
  await page.getByRole('button', { name: /^Убрать: Пломбир/ }).click();
  const addChip = page.getByRole('button', { name: /Добавить в корзину: Пломбир/ });
  const addBox = await addChip.boundingBox();
  await addChip.click();
  const countBox = await page.getByRole('button', { name: /^Убрать: Пломбир/ }).locator('..').boundingBox();
  expect(Math.round(countBox?.height ?? 0)).toBe(Math.round(addBox?.height ?? -1));

  // 3. Product sheet: еАптека
  await page.getByRole('button', { name: /Открыть: Нурофен/ }).click();
  await expect(page.getByText('Привезёт еАптека, около 10 минут')).toBeVisible();
  await shot('product-eapteka');
  await page.getByRole('button', { name: /Добавить в корзину: Нурофен/ }).click();
  await expect(page.getByRole('button', { name: /Убрать: Нурофен/ })).toBeVisible();
  await shot('product-eapteka-added');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Подборка на вечер' })).toBeVisible();

  // Product sheet: Шоколадница
  await page.getByRole('button', { name: /Открыть: Комбо/ }).click();
  await expect(page.getByText('Привезёт Шоколадница, около часа')).toBeVisible();
  await page.getByRole('button', { name: /Добавить в корзину: Комбо/ }).click();
  await shot('product-shokoladnitsa-added');
  await page.getByRole('button', { name: 'Закрыть' }).click();

  // 4. Cart
  await page.getByRole('button', { name: /^Корзина,/ }).click();
  await expectSkeletonThenContent(page);
  await expect(page.getByRole('heading', { name: 'От партнёров' })).toBeVisible();
  await expect(page.getByText(price('2 065'))).toBeVisible();
  await shot('cart');

  // Steppers recount the total, and the cart survives a reload within the session
  await page.getByRole('button', { name: 'Добавить: Гречневая крупа Лента, 800 г' }).click();
  await expect(page.getByText(price('2 184'))).toBeVisible();
  await page.getByRole('button', { name: 'Убрать: Гречневая крупа Лента, 800 г' }).click();
  await expect(page.getByText(price('2 065'))).toBeVisible();
  await page.reload();
  await expect(page.getByText(price('2 065'))).toBeVisible();
  // Swipe down closes the cart and returns to the collection
  const grab = await page.getByRole('heading', { name: 'Зеленоград, к828' }).boundingBox();
  if (!grab) throw new Error('cart header is not visible');
  await page.mouse.move(grab.x + 20, grab.y + 10);
  await page.mouse.down();
  await page.mouse.move(grab.x + 20, grab.y + 260, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Подборка на вечер' })).toBeVisible();
  await page.getByRole('button', { name: /^Корзина,/ }).click();
  await expect(page.getByText(price('2 065'))).toBeVisible();

  await page.getByRole('button', { name: 'Перейти к оформлению' }).scrollIntoViewIfNeeded();
  await shot('cart-bottom');

  // 5. Checkout, default «Стандарт»
  await page.getByRole('button', { name: 'Перейти к оформлению' }).click();
  await expectSkeletonThenContent(page);
  const slider = page.getByRole('slider', { name: 'Как привезти' });
  await expect(slider).toHaveAttribute('aria-valuetext', 'Стандарт');
  await expect(page.getByText('аптека едет с Самокатом')).toBeVisible();
  await expect(page.getByText(price('2 164'))).toBeVisible();
  await shot('checkout-balance');

  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveAttribute('aria-valuetext', 'Скорее');
  await expect(page.getByText('доставки', { exact: true })).toBeVisible();
  await expect(page.getByText('за доставку', { exact: true })).toBeVisible();
  await expect(page.getByText('приедет Самокат', { exact: true })).toBeVisible();
  await expect(page.getByText(price('2 264'))).toBeVisible();
  await shot('checkout-fast');

  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuetext', 'Всё сразу');
  await expect(page.getByText('Самокат тоже в 17:30. Нужно раньше? Сдвиньте влево')).toBeVisible();
  await expect(page.getByText(price('2 065'))).toBeVisible();
  await shot('checkout-all');

  // Drag the thumb back to the middle with the pointer
  const box = await slider.boundingBox();
  if (!box) throw new Error('slider is not visible');
  await page.mouse.move(box.x + box.width - 22, box.y + 26);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 26, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuetext', 'Стандарт');
  await expect(page.getByText(price('2 164'))).toBeVisible();

  // 6. One-button payment with the loading state
  const pay = page.getByRole('button', { name: 'Оплатить' });
  await pay.scrollIntoViewIfNeeded();
  await pay.click();
  await expect(pay).toHaveAttribute('aria-busy', 'true');
  await shot('pay-loading', 0);

  // 7. Tracking
  await expectSkeletonThenContent(page);
  await expect(page.getByRole('heading', { name: 'Первым приедет Самокат с аптекой через 15 минут' })).toBeVisible();
  await expect(page.getByText('Собираем и везём вместе')).toBeVisible();
  await shot('tracking');

  // 8. Delay after 6 seconds, then merge
  await expect(page.getByRole('heading', { name: '4 лапы задерживаются' })).toBeVisible({ timeout: 9000 });
  await expect(page.getByText('На складе нет игрушки')).toBeVisible();
  await shot('delay');
  await page.getByRole('button', { name: 'Объединить' }).click();
  await expect(page.getByText('4 лапы, Лента')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Объединить' })).toHaveCount(0);
  await shot('merged');

  // Bars keep running; every trip ends with «Заказ у двери»
  await expect(page.getByText('Заказ у двери', { exact: true })).toHaveCount(3, { timeout: 40_000 });
  await expect(page.getByRole('heading', { name: 'Весь заказ у двери' })).toBeVisible();
  await shot('delivered');

  // System back from tracking goes to the previous screen
  await page.goBack();
  await expect(page.getByRole('slider', { name: 'Как привезти' })).toBeVisible();

  expect(problems, problems.join('\n')).toEqual([]);
});

test('delay proposal can be dismissed with «Оставить»', async ({ page }, testInfo) => {
  const problems = watchConsole(page);
  await page.goto('#/collection');
  await page.getByRole('button', { name: /Открыть: Нурофен/ }).click();
  await page.getByRole('button', { name: /Добавить в корзину: Нурофен/ }).click();
  await page.goto('#/checkout');
  await page.getByRole('button', { name: 'Оплатить' }).click();
  await expect(page.getByRole('heading', { name: '4 лапы задерживаются' })).toBeVisible({ timeout: 9000 });
  await page.getByRole('button', { name: 'Оставить' }).click();
  await expect(page.getByRole('button', { name: 'Оставить' })).toHaveCount(0);
  await expect(page.getByText('задержка', { exact: true })).toBeVisible();
  await expect(page.getByText('Заказ у двери', { exact: true })).toHaveCount(3, { timeout: 40_000 });
  // When everything is at the door, a close button leads home
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await expect(page.getByText('Ооооострова с призами')).toBeVisible();
  await page.goBack();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `tests/screenshots/${testInfo.project.name}/17-delay-kept.png` });
  expect(problems, problems.join('\n')).toEqual([]);
});

test('change the order while stores have not started, then the button disappears', async ({ page }, testInfo) => {
  const problems = watchConsole(page);
  const dir = `tests/screenshots/${testInfo.project.name}`;
  await page.goto('#/collection');
  await page.getByRole('button', { name: /Открыть: Нурофен/ }).click();
  await page.getByRole('button', { name: /Добавить в корзину: Нурофен/ }).click();
  await page.goBack();
  await page.getByRole('button', { name: /Открыть: Комбо/ }).click();
  await page.getByRole('button', { name: /Добавить в корзину: Комбо/ }).click();
  await page.goto('#/checkout');
  await page.getByRole('button', { name: 'Оплатить' }).click();

  // One button for the whole order
  const change = page.getByRole('button', { name: 'Изменить заказ' });
  await expect(change).toBeVisible();
  await change.click();
  await expect(page.getByRole('heading', { name: 'Изменить заказ' })).toBeVisible();
  await expect(page.getByText('Что ещё можно менять')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dir}/20-edit.png` });

  // Remove the buckwheat: Лента is still open for changes
  await page.getByRole('button', { name: /Убрать товар/ }).click();
  await expect(page.getByRole('heading', { name: 'Состав заказа' })).toBeVisible();
  await page.getByRole('button', { name: 'Убрать: Гречневая крупа Лента, 800 г' }).click();
  await expect(page.getByText(/^\+\s119\s₽ на карту$/)).toBeVisible();
  await page.screenshot({ path: `${dir}/21-edit-items.png` });
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(page.getByRole('heading', { name: /Первым приедет/ })).toBeVisible();
  await expect(page.getByText('Лента', { exact: true })).toHaveCount(0);

  // Cancel is not possible: Самокат is already on its way
  await page.getByRole('button', { name: 'Изменить заказ' }).click();
  await page.getByRole('button', { name: /Отменить заказ/ }).click();
  await expect(page.getByRole('heading', { name: 'Отменить весь заказ?' })).toBeVisible();
  await page.screenshot({ path: `${dir}/22-cancel.png` });
  await page.getByRole('button', { name: 'Отменить заказ' }).last().click();
  await expect(page.getByRole('heading', { name: 'Заказ уже собирают' })).toBeVisible();
  await page.screenshot({ path: `${dir}/23-cancel-blocked.png` });
  await page.getByRole('button', { name: 'Вернуться к заказу' }).click();
  await expect(page.getByRole('heading', { name: /Первым приедет/ })).toBeVisible();

  // The clock stood still on the change screens, so Шоколадница can still be changed
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Изменить заказ' })).toBeVisible();
  // Once every store has started, the button is gone
  await expect(page.getByRole('button', { name: 'Изменить заказ' })).toHaveCount(0, { timeout: 25_000 });
  expect(problems, problems.join('\n')).toEqual([]);
});

test('an order from one store has no slider', async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto('#/cart');
  await page.getByRole('button', { name: 'Убрать: Игрушка для собак «Лиса» с канатом' }).click();
  await page.getByRole('button', { name: 'Убрать: Гречневая крупа Лента, 800 г' }).click();
  await page.getByRole('button', { name: 'Перейти к оформлению' }).click();
  await expect(page.getByRole('heading', { name: 'Оформление' })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole('slider')).toHaveCount(0);
  await expect(page.getByText('Как привезти?')).toHaveCount(0);
  await expect(page.getByText(price('318'))).toBeVisible();
  await page.getByRole('button', { name: 'Оплатить' }).click();
  await expect(page.getByRole('heading', { name: 'Самокат приедет в 14:26' })).toBeVisible();
  expect(problems, problems.join('\n')).toEqual([]);
});
