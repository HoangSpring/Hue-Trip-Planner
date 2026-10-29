import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

const mockPlaces = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'dai-noi-hue',
    name: 'Đại Nội Huế (Hoàng thành)',
    category: 'heritage' as const,
    shortDescription: 'Quần thể di tích Cố đô Huế, Hoàng thành triều Nguyễn.',
    area: 'Thuận Hòa',
    lat: 16.4697,
    lng: 107.5786,
    coverImageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f',
    coverImageAlt: 'Đại Nội Huế',
    imageCredit: 'Wikimedia Commons',
    imageLicense: 'CC BY-SA 4.0',
    tags: [{ slug: 'heritage', name: 'Di sản' }],
    verified: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    slug: 'bun-bo-hue-ba-tuyet',
    name: 'Bún Bò Huế Bà Tuyết',
    category: 'food' as const,
    shortDescription: 'Bún bò Huế truyền thống thơm ngon đậm đà.',
    area: 'Phú Nhuận',
    lat: 16.4678,
    lng: 107.5925,
    coverImageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43',
    coverImageAlt: 'Bún bò Huế',
    imageCredit: null,
    imageLicense: null,
    tags: [{ slug: 'food', name: 'Ẩm thực' }],
    verified: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    slug: 'chua-thien-mu',
    name: 'Chùa Thiên Mụ',
    category: 'sightseeing' as const,
    shortDescription: 'Ngôi chùa cổ kính hơn 400 năm bên bờ sông Hương.',
    area: 'Kim Long',
    lat: 16.4528,
    lng: 107.5446,
    coverImageUrl: 'https://images.unsplash.com/photo-1578922746465-3a80a228f223',
    coverImageAlt: 'Chùa Thiên Mụ',
    imageCredit: 'Wikimedia Commons',
    imageLicense: 'CC BY 3.0',
    tags: [{ slug: 'culture', name: 'Văn hóa' }],
    verified: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    slug: 'pho-di-bo-nguyen-dinh-chieu',
    name: 'Phố đi bộ Nguyễn Đình Chiểu',
    category: 'sightseeing' as const,
    shortDescription: 'Tuyến phố đi bộ sầm uất ven bờ sông Hương ngắm cầu Tràng Tiền.',
    area: 'Phú Hội',
    lat: 16.4682,
    lng: 107.5878,
    coverImageUrl: null,
    coverImageAlt: null,
    imageCredit: null,
    imageLicense: null,
    tags: [{ slug: 'nightlife', name: 'Về đêm' }],
    verified: true,
  },
];

const sampleDraft = {
  clientDraftId: 'c2c8f0e0-1111-4000-8000-000000000001',
  title: 'Chuyến đi Huế 2 ngày 1 đêm',
  startDate: '2026-11-01',
  numDays: 2,
  generatedBy: 'fallback',
  llmModel: null,
  start: { label: 'Trung tâm thành phố Huế', lat: 16.4637, lng: 107.5909 },
  input: {
    numDays: 2,
    startDate: '2026-11-01',
    companion: 'couple',
    groupSize: 2,
    interests: ['heritage', 'cuisine'],
    pace: 'moderate',
    budget: 'mid',
    transport: 'motorbike',
    start: { label: 'Trung tâm thành phố Huế', lat: 16.4637, lng: 107.5909 },
    notes: null,
  },
  days: [
    {
      id: '11111111-d001-4000-8000-000000000001',
      dayIndex: 1,
      date: '2026-11-01',
      note: null,
      items: [
        {
          id: '11111111-0001-4000-8000-000000000001',
          placeId: mockPlaces[0].id,
          place: mockPlaces[0],
          position: 0,
          slot: 'morning',
          startTime: '08:00',
          durationMin: 150,
          travelMinFromPrev: null,
          travelDistanceM: null,
          reason: 'Di sản thế giới biểu tượng của triều Nguyễn',
          note: 'Thuê tai nghe thuyết minh tại Ngọ Môn',
          isLocked: true,
          addedBy: 'fallback',
        },
        {
          id: '11111111-0002-4000-8000-000000000002',
          placeId: mockPlaces[1].id,
          place: mockPlaces[1],
          position: 1,
          slot: 'noon',
          startTime: '11:15',
          durationMin: 60,
          travelMinFromPrev: 15,
          travelDistanceM: 1800,
          reason: 'Bữa trưa bún bò Huế đậm đà chuẩn vị',
          note: null,
          isLocked: false,
          addedBy: 'fallback',
        },
        {
          id: '11111111-0003-4000-8000-000000000003',
          placeId: mockPlaces[2].id,
          place: mockPlaces[2],
          position: 2,
          slot: 'afternoon',
          startTime: '14:00',
          durationMin: 90,
          travelMinFromPrev: 20,
          travelDistanceM: 4500,
          reason: 'Ngôi chùa cổ kính hơn 400 năm soi bóng sông Hương',
          note: null,
          isLocked: false,
          addedBy: 'fallback',
        },
        {
          id: '11111111-0004-4000-8000-000000000004',
          placeId: mockPlaces[3].id,
          place: mockPlaces[3],
          position: 3,
          slot: 'evening',
          startTime: '18:30',
          durationMin: 120,
          travelMinFromPrev: 18,
          travelDistanceM: 4000,
          reason: 'Dạo phố đêm ngắm cầu Tràng Tiền rực rỡ',
          note: null,
          isLocked: false,
          addedBy: 'fallback',
        },
      ],
    },
    {
      id: '11111111-d002-4000-8000-000000000002',
      dayIndex: 2,
      date: '2026-11-02',
      note: null,
      items: [
        {
          id: '22222222-0001-4000-8000-000000000001',
          placeId: '00000000-0000-4000-8000-000000000005',
          place: {
            id: '00000000-0000-4000-8000-000000000005',
            slug: 'lang-tu-duc',
            name: 'Lăng Tự Đức (Khiêm Lăng)',
            category: 'heritage',
            shortDescription: 'Lăng tẩm mang vẻ đẹp thi vị hài hòa.',
            area: 'Thủy Xuân',
            lat: 16.4328,
            lng: 107.5654,
            coverImageUrl: null,
            coverImageAlt: null,
            imageCredit: null,
            imageLicense: null,
            tags: [{ slug: 'heritage', name: 'Di sản' }],
            verified: true,
          },
          position: 0,
          slot: 'morning',
          startTime: '08:30',
          durationMin: 120,
          travelMinFromPrev: null,
          travelDistanceM: null,
          reason: 'Lăng tẩm mang kiến trúc tinh tế nhất triều Nguyễn',
          note: null,
          isLocked: false,
          addedBy: 'fallback',
        },
      ],
    },
  ],
};

async function main() {
  const screensDir = path.resolve(process.cwd(), 'docs/reports/phase-2c-screens');
  fs.mkdirSync(screensDir, { recursive: true });

  console.log('Starting preview server on port 4173...');
  const preview = spawn('pnpm', ['preview', '--port', '4173'], {
    shell: true,
    stdio: 'pipe',
  });

  await new Promise<void>((resolve) => {
    preview.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('4173') || msg.includes('Local:')) {
        resolve();
      }
    });
    setTimeout(() => resolve(), 3000);
  });

  console.log('Launching browser...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '1024', width: 1024, height: 768 },
    { name: '768', width: 768, height: 1024 },
    { name: '390', width: 390, height: 844 },
  ];

  const results: Record<string, boolean> = {};

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Set localStorage BEFORE page load
    await page.addInitScript((draft) => {
      window.localStorage.setItem('trip_draft_v1', JSON.stringify(draft));
      window.localStorage.setItem(
        'trip_notices_v1',
        JSON.stringify([{ code: 'FEW_CANDIDATES', message: 'Số lượng ứng viên phù hợp ít hơn dự kiến.' }])
      );
    }, sampleDraft);

    // Mock API routes
    await page.route('**/api/places**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: '00000000-0000-4000-8000-000000000010',
              slug: 'lang-khai-dinh',
              name: 'Lăng Khải Định',
              category: 'heritage',
              shortDescription: 'Lăng tẩm Á-Âu kết hợp.',
              area: 'Thủy Bằng',
              lat: 16.3989,
              lng: 107.5905,
              coverImageUrl: null,
              coverImageAlt: null,
              imageCredit: null,
              imageLicense: null,
              tags: [{ slug: 'heritage', name: 'Di sản' }],
              verified: true,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
      });
    });

    await page.route('**/api/trips/alternatives', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              place: {
                id: '00000000-0000-4000-8000-000000000020',
                slug: 'quan-com-am-phu',
                name: 'Quán Cơm Âm Phủ',
                category: 'food',
                shortDescription: 'Quán ăn lâu đời với món cơm trộn thập cẩm.',
                area: 'Phú Hội',
                lat: 16.465,
                lng: 107.59,
                coverImageUrl: null,
                coverImageAlt: null,
                imageCredit: null,
                imageLicense: null,
                tags: [{ slug: 'food', name: 'Ẩm thực' }],
                verified: true,
              },
              distanceM: 1200,
              reasonTag: 'Cùng loại: Ẩm thực',
            },
          ],
        }),
      });
    });

    await page.route('**/api/meta', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tags: [], startPoints: [] }),
      });
    });

    await page.goto('http://localhost:4173/trip/draft', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    console.log(`Viewport ${vp.name}px URL:`, page.url());

    // Check overflow
    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      return docW <= winW;
    });
    results[`overflow-${vp.name}`] = overflow;
    console.log(`Viewport ${vp.name}px horizontal overflow check: ${overflow ? 'PASS' : 'FAIL'}`);

    if (vp.name === '1440' || vp.name === '390') {
      // 1. Capture main editor screen
      await page.screenshot({
        path: path.join(screensDir, `trip-draft-${vp.name}.png`),
        fullPage: false,
      });
      console.log(`Saved trip-draft-${vp.name}.png`);

      // 2. Open Alternatives Sheet
      const altButtons = page.locator('button:has-text("Thay thế")');
      if ((await altButtons.count()) > 0) {
        await altButtons.first().click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(screensDir, `alternatives-${vp.name}.png`),
          fullPage: false,
        });
        console.log(`Saved alternatives-${vp.name}.png`);

        // Close sheet
        const closeAlt = page.locator('button[aria-label="Đóng"]');
        if ((await closeAlt.count()) > 0) {
          await closeAlt.first().click();
          await page.waitForTimeout(400);
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);
        }
      }

      // 3. Open Add Place Sheet
      const addButtons = page.locator('button:has-text("Thêm địa điểm")');
      if ((await addButtons.count()) > 0) {
        await addButtons.first().click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(screensDir, `add-place-${vp.name}.png`),
          fullPage: false,
        });
        console.log(`Saved add-place-${vp.name}.png`);

        // Close sheet
        const closeAdd = page.locator('button[aria-label="Đóng"]');
        if ((await closeAdd.count()) > 0) {
          await closeAdd.first().click();
          await page.waitForTimeout(400);
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);
        }
      }

      // 4. Open Regenerate Day Dialog
      const regenButtons = page.locator('button:has-text("Tạo lại ngày này")');
      if ((await regenButtons.count()) > 0) {
        await regenButtons.first().click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(screensDir, `regenerate-dialog-${vp.name}.png`),
          fullPage: false,
        });
        console.log(`Saved regenerate-dialog-${vp.name}.png`);

        // Close dialog
        const closeRegen = page.locator('button[aria-label="Đóng"]');
        if ((await closeRegen.count()) > 0) {
          await closeRegen.first().click();
          await page.waitForTimeout(400);
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);
        }
      }
    }

    await context.close();
  }

  await browser.close();
  preview.kill();
  console.log('Finished capturing screenshots and overflow checks!');
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
