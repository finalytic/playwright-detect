import { Page } from 'playwright-core';
import { path } from 'ghost-cursor';
import { random, waitFor } from '@finalytic/utils';

export async function initMouse(page: Page) {
  const mousePos = {
    scrollY: 0,
    x: random(0, page.viewportSize()?.width || 0),
    y: random(0, page.viewportSize()?.height || 0),
  };
  (page as any).mousePos = mousePos;
  page.on('load', async () => {
    /*
     * add global variable mousePos to page with init mouse position
     * add event listener for mousemove which update mousePos
     */
    await page.mouse.move(mousePos.x, mousePos.y);
    page
      .evaluate(
        ([x, y]) => {
          (window as any).mousePos = { x, y };
          document.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            (window as any).mousePos.x = clientX;
            (window as any).mousePos.y = clientY;
          });
        },
        [mousePos.x, mousePos.y]
      )
      .catch(() => undefined);
  });

  await page.mouse.move(mousePos.x, mousePos.y);
}
export async function move(
  page: Page,
  target: string | { x: number; y: number; width?: number; height?: number },
  enableScroll = false
) {
  console.log(`Moving mouse to ${target}`);
  const mousePos: { x: number; y: number; scrollY: number } = (page as any)
    .mousePos;
  const current = (await page.evaluate(() => window['mousePos'])) || mousePos;
  mousePos.x = current.x;
  mousePos.y = current.y;
  let targetElement =
    typeof target === 'string'
      ? await page.$(target).then(async (x) => {
          return x?.boundingBox();
        })
      : target;

  if (!targetElement) throw new Error(`Target ${target} not found in DOM`);

  if (enableScroll) {
    const halfViewHeight = (page.viewportSize()?.height || 0) / 2;
    const desiredY = mousePos.scrollY + targetElement.y - halfViewHeight;
    const deltaY = targetElement.y - halfViewHeight;

    if (Math.abs(deltaY) > halfViewHeight) {
      while (Math.abs(desiredY - mousePos.scrollY) > 40) {
        const lastPos = mousePos.scrollY;
        if (deltaY > 0) await page.keyboard.press('ArrowDown');
        else await page.keyboard.press('ArrowUp');
        const pos = await page.evaluate(() => window.scrollY);
        mousePos.scrollY = pos;
        await waitFor(80);

        console.log(lastPos, pos, deltaY, desiredY, mousePos);
      }
    }
    targetElement =
      typeof target === 'string'
        ? await page.$(target).then(async (x) => {
            return x?.boundingBox();
          })
        : target;
    if (!targetElement) throw new Error(`Target ${target} not found in DOM`);
  }

  if (targetElement.height) {
    const height = targetElement.height / 2;
    // add random height to not click exactly on center
    targetElement.y =
      targetElement.y + height + random(-height / 2, height / 2);
  }
  if (targetElement.width) {
    const width = targetElement.width / 2;
    // add random width to not click exactly on center
    targetElement.x = targetElement.x + width + random(-width / 2, width / 2);
  }
  if (current.x === targetElement.x && current.y === targetElement.y)
    return mousePos;
  const poss = path(current, targetElement);

  for (const pos of poss) {
    await page.mouse.move(pos.x, pos.y, {
      steps: 10,
    });
    mousePos.x = pos.x;
    mousePos.y = pos.y;
  }
  console.log(`Moving mouse success`);
  return mousePos;
}
