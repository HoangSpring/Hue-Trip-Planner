# 08 — Stitch UI Prompt Pack

> File này thay cho `08-ui-ux-guidelines.md`. Nó có **hai mục đích**:
> 1. Cung cấp các prompt để dán vào **Stitch** và tạo giao diện cho từng màn hình.
> 2. Làm **design tokens + quy tắc giao diện** để agent dựng lại bằng React + Tailwind sau khi đã có thiết kế.
>
> Phạm vi màn hình: `docs/04-routes-and-pages.md`. Chức năng: `docs/02-features.md`. **Không thiết kế** trải nghiệm 3D/bảo tàng số và trang khẩn cấp.

---

## PHẦN A — Hướng dẫn sử dụng (dành cho bạn, không dán vào Stitch)

### Cách làm việc đề xuất

1. **Trạng thái:** thiết kế đã đủ cho giai đoạn MVP. Bản **desktop (1440×900)** có cho S01, S02, S03, S04, S07, S12, S15, S17, S18–S21; các màn còn lại (S05, S06, S08–S11, S13, S14, S16) chỉ có bản mobile và được dựng responsive. Muốn bổ sung hoặc sửa thêm, dùng prompt ở mục D5.
2. Dán **Master Prompt (mục B)** vào lần đầu hoặc vào ô mô tả/ngữ cảnh chung của dự án để Stitch hiểu phong cách xuyên suốt.
3. Với **mỗi màn hình**, dán một prompt ở **mục C**. Mỗi lần chỉ một màn hình; không gộp nhiều màn hình vào một prompt.
4. Làm theo thứ tự ưu tiên: **S01 → S02 → S03 → S05–S10 (wizard) → S12 (trình chỉnh lịch trình) → S04 (bản đồ)**, rồi các màn còn lại.
5. Sau khi một màn hình ổn, các màn sau hãy nhắc "keep consistent with the previous screens" nếu Stitch lệch phong cách.
6. Sửa nhỏ bằng câu lệnh ngắn tại chỗ (ví dụ: "make the primary button larger", "reduce card shadow") thay vì viết lại prompt dài.

### Mẹo để kết quả tốt

- Prompt viết bằng **tiếng Anh** (công cụ tạo giao diện thường hiểu tiếng Anh tốt hơn), nhưng **toàn bộ chữ hiển thị trong giao diện để tiếng Việt**: mỗi prompt đã kèm sẵn nội dung tiếng Việt trong dấu ngoặc kép. Nếu Stitch tự dịch sang tiếng Anh, hãy nhắc: *"All UI text must remain in Vietnamese exactly as quoted."*
- Kiểm tra **dấu tiếng Việt** hiển thị đúng (font phải hỗ trợ).
- Nếu Stitch chèn ảnh stock lạ, chấp nhận làm **ảnh giữ chỗ**; ảnh thật sẽ lấy từ dữ liệu địa điểm.
- Nếu Stitch thêm chức năng thừa (3D viewer, khẩn cấp/SOS, đặt vé, thanh toán, đánh giá sao): yêu cầu xóa.

### Khi bàn giao thiết kế cho agent

- Xuất thiết kế theo cách bạn thấy thuận tiện (mã HTML/CSS hoặc sang công cụ thiết kế) và đặt vào `docs/stitch/` trong repo, mỗi màn một thư mục gồm `screen.png` và `code.html`.
- Thiết kế là **tài liệu tham chiếu**. Agent phải **dựng lại thành component React + Tailwind** theo tokens ở mục D, không dán nguyên mã xuất ra, và dùng dữ liệu thật thay cho nội dung mẫu.
- Ghi chú trong tên thư mục mã màn hình (`S01`, `S12`...) để khớp với mục C và `docs/04-routes-and-pages.md`.

---

## PHẦN B — MASTER PROMPT (dán vào Stitch trước tiên)

```text
Design a desktop-first responsive web app (primary 1440x900, must also work on mobile) called "Hue Trip Planner" (working name),
a personalized trip-itinerary planner for tourists visiting Hue, Vietnam.
Users answer a short wizard about their trip and interests, then receive a
day-by-day itinerary of real places (heritage sites, local food, cafes, river
walks, souvenir shops) that they can edit, save on a map, and share by link.

LANGUAGE
All UI text is in Vietnamese. Use the exact Vietnamese strings I quote.
Vietnamese diacritics must render correctly.

MOOD AND STYLE
Calm, elegant, warm and trustworthy. Inspired by Hue's imperial heritage:
ivory paper tones, Hue purple (the color of traditional ao dai), imperial gold
accents, and a soft jade green. Refined and modern, not kitschy: no dragons, no
heavy ornaments. Use at most one very subtle lattice/pattern motif as a faint
background texture in hero areas. Generous whitespace, large photography,
rounded cards, soft shadows. Friendly and editorial, like a premium travel guide.

COLOR PALETTE
- Primary (Hue purple): #5B3A8C   (hover #4A2E75, light tint #EFE9F7)
- Accent (imperial gold): #C8963E (light tint #F8EEDB)
- Secondary (jade green): #2F6F5E (light tint #E3F1EC)
- Background (warm ivory): #FAF6EE ; Surface (cards): #FFFFFF
- Text main (ink): #1F1A24 ; Text muted: #6B6475 ; Border: #E7E0D3
- Success #2F6F5E ; Warning #B7791F ; Error #B3261E
Contrast must meet WCAG AA. Dark mode is NOT required.

TYPOGRAPHY
- Headings: "Source Serif 4" (serif), semi-bold, elegant.
- Body and UI: "Be Vietnam Pro" (sans-serif), both with full Vietnamese support.
- Scale: H1 32/40 (mobile) 48/56 (desktop), H2 24/32, H3 20/28, body 16/24, small 14/20.

SHAPE AND SPACING
8px spacing grid. Cards radius 16px. Buttons radius 12px, min height 48px for
primary touch targets. Chips fully rounded. Soft shadow:
0 2px 8px rgba(31,26,36,0.08). Images use radius 12-16px.

COMPONENTS (keep consistent everywhere)
- Primary button: filled purple, white text. Secondary: white with purple border.
  Tertiary: text only. Destructive: red text/outline.
- Place card: photo on top (4:3), category chip, place name, one-line meta,
  heart (save) icon button in the corner.
- Chips for categories and interests; selected state = purple fill.
- Bottom sheet for mobile secondary actions; side panel on desktop.
- Toasts at the bottom. Skeleton loaders. Friendly empty states with a simple
  line illustration.

NAVIGATION
- Mobile: bottom tab bar with 5 items: "Trang chủ", "Khám phá",
  a prominent center button "Tạo lịch trình", "Bản đồ", "Tôi".
- Desktop: top header with logo, links "Khám phá", "Bản đồ",
  a highlighted button "Tạo lịch trình", "Chuyến đi của tôi", and "Đăng nhập"
  (or avatar when signed in).

DO NOT INCLUDE
3D viewers or museum/artifact experiences, emergency/SOS or hotline pages,
booking or payment, star ratings or user reviews, social feed, chatbot.

CONTENT STYLE
Use realistic Hue content in mockups: Dai Noi (Imperial City), Chua Thien Mu,
Lang Tu Duc, Lang Khai Dinh, Cho Dong Ba, Cau Truong Tien, Song Huong
(Perfume River), bun bo Hue, banh khoai, che Hue. Use photo placeholders.
Frame sizes: mobile 390x844, desktop 1440x900.
```

---

## PHẦN C — PROMPT TỪNG MÀN HÌNH

> Mỗi prompt dán riêng. Mã `S..` khớp với route trong `docs/04-routes-and-pages.md`.

### S01 — Landing `/` (mobile + desktop)

```text
Design the Landing page for Hue Trip Planner (mobile 390px first, then desktop).

HERO: full-bleed photo of Thien Mu Pagoda by the Perfume River at golden hour
with a soft dark gradient for text legibility. Over it:
Eyebrow: "Cẩm nang du lịch Huế"
Title (serif, large): "Lịch trình Huế, đúng gu của bạn"
Subtitle: "Chọn điều bạn thích, nhận gợi ý từng ngày: nơi nên đến, món nên ăn, kèm bản đồ."
Primary button: "Tạo lịch trình"   Secondary button: "Khám phá Huế"

SECTION "Cách hoạt động" - 3 steps with simple icons:
1 "Chọn sở thích" - "Cho chúng tôi biết bạn thích gì và đi mấy ngày."
2 "Nhận lịch trình" - "Gợi ý theo từng ngày, có lý do cho mỗi điểm đến."
3 "Chỉnh sửa & chia sẻ" - "Đổi chỗ, thêm bớt, lưu và gửi cho bạn bè."

SECTION "Nơi nên biết trước khi đến": horizontal scroll of 6 place cards
(Đại Nội Huế, Chùa Thiên Mụ, Lăng Tự Đức, Lăng Khải Định, Chợ Đông Ba,
Cầu Tràng Tiền) with category chips, plus link "Xem tất cả".

SECTION "Lịch trình mẫu": a sample one-day itinerary timeline card:
Buổi sáng - Đại Nội Huế; Giữa ngày - Bún bò Huế; Buổi chiều - Lăng Tự Đức;
Hoàng hôn - Dạo bên sông Hương. Caption: "Chỉ là ví dụ. Gợi ý thật sẽ theo lựa chọn của bạn."

SECTION FAQ (accordion): "Dùng thử có mất tiền không?" - "Không. Chọn sở thích và nhận gợi ý đều miễn phí."
"Có cần đăng ký tài khoản không?" - "Không. Muốn lưu hoặc chia sẻ thì đăng nhập sau."

FOOTER: links "Giới thiệu", "Chính sách bảo mật", and small credit line
"Ảnh: Wikimedia Commons, Pexels · Bản đồ © OpenStreetMap contributors".
Bottom tab bar on mobile. Optional "Tiếp tục chuyến đi của bạn" resume card state.
```

### S02 — Khám phá `/explore`

```text
Design the "Khám phá" (Explore) page, mobile first then desktop.

Header title: "Khám phá Huế". Search field with placeholder "Tìm địa điểm, món ăn...".
Horizontally scrollable category chips: "Tất cả", "Di sản", "Ẩm thực",
"Cà phê", "Dạo & ngắm cảnh", "Quà & mua sắm". A "Bộ lọc" button opens a
bottom sheet (mobile) with interest tag chips and "Sắp xếp: Nổi bật / Tên A-Z",
buttons "Xóa bộ lọc" and "Áp dụng".

Results: grid of place cards (1 column mobile with large photo, 2-3 columns tablet,
3-4 desktop). Each card: photo, category chip, name, short meta (area), heart icon.
Show a result count "Có 48 địa điểm". Include a "Xem thêm" load-more button.

Also show the EMPTY state variant: line illustration, text
"Chưa có địa điểm phù hợp", button "Xóa bộ lọc".
And a skeleton loading variant.
```

### S03 — Chi tiết địa điểm `/place/:slug`

```text
Design a Place Detail page for "Chùa Thiên Mụ", mobile first then desktop.

Top: large photo carousel with small caption "Ảnh: Lưu Ly · Public domain",
back button, heart (save) and share buttons overlaid.
Below: category chip "Chùa", name H1 "Chùa Thiên Mụ", area "Phường Hương Long".
Key facts row (icons): "Giờ mở cửa: 07:00 - 17:30", "Giá vé: Miễn phí",
"Thời gian tham quan: ~60 phút", "Nên đi: Sáng, hoàng hôn".
Tag chips: "Chùa chiền & tâm linh", "Sông Hương", "Chụp ảnh".
Description paragraph (3-4 lines) with "Xem thêm".
Mini map card with pin and button "Chỉ đường".
Notice banner (soft gold): "Thông tin có thể thay đổi, vui lòng kiểm tra lại trước khi đến. Cập nhật: 10/2025."
Section "Gần đây": horizontal cards of 4 nearby places.
Sticky bottom action bar on mobile: primary "Thêm vào chuyến đi", secondary heart "Lưu".
Desktop: two columns, sticky side card with the actions and mini map.
```

### S04 — Bản đồ `/map`

```text
Design a full-screen map page, mobile first then desktop. Map of Hue city
with numbered/category-colored pins and clustering. Top overlay: search field
"Tìm trên bản đồ..." and category chips (Di sản, Ẩm thực, Cà phê, Dạo & ngắm cảnh, Quà).
Tapping a pin shows a compact bottom card (mobile) with photo thumb, name,
category, buttons "Xem chi tiết" and "Lưu". Small attribution at the bottom
right: "© OpenStreetMap contributors". A "my location" button.
Desktop: left list panel with scrollable place list synced to the map.
Keep the bottom card from covering more than 30% of the screen on mobile.
```

### Wizard `/plan/new` — S05 đến S10 (6 bước)

**Quy tắc chung cho cả 6 màn (dán kèm vào mỗi prompt):**

```text
Wizard layout: minimal top bar with a close (X) button and "Bước X/6" text,
a thin progress bar in purple, a large friendly question in serif, content,
and a sticky bottom bar with "Quay lại" (tertiary) and "Tiếp tục" (primary).
Disable "Tiếp tục" until required fields are valid and show inline error text in red.
No bottom tab bar in the wizard.
```

#### S05 — Bước 1: Thời gian

```text
Wizard step 1/6. Question: "Bạn đi Huế mấy ngày?"
A large stepper (minus / number / plus) range 1 to 5 days, default 2, with helper
text "Tối đa 5 ngày". Optional date picker field: "Ngày bắt đầu (không bắt buộc)"
with helper "Giúp chúng tôi tránh những nơi nghỉ vào ngày đó."
```

#### S06 — Bước 2: Người đi

```text
Wizard step 2/6. Question: "Bạn đi cùng ai?"
Single-select large option cards with icons: "Một mình", "Cặp đôi",
"Gia đình có trẻ nhỏ", "Nhóm bạn", "Người lớn tuổi". Selected card has purple
border and tinted background with a check icon. Optional field "Số người" (number stepper).
```

#### S07 — Bước 3: Sở thích

```text
Wizard step 3/6. Question: "Bạn thích điều gì?" Helper: "Chọn từ 2 đến 6 mục."
Grid (2 columns mobile) of interest cards with a photo background, icon and label:
"Di sản & cung đình", "Lịch sử & lăng tẩm", "Chùa chiền & tâm linh",
"Sông Hương & ngắm cảnh", "Ẩm thực Huế", "Cà phê & thư giãn",
"Chụp ảnh & check-in", "Thiên nhiên & ngoại ô", "Đời sống địa phương", "Quà & mua sắm".
Selected = purple overlay + check badge. Show counter "Đã chọn 3/6".
Show error state: "Hãy chọn ít nhất 2 mục".
```

#### S08 — Bước 4: Phong cách

```text
Wizard step 4/6. Question: "Chuyến đi của bạn theo phong cách nào?"
Three groups:
1) "Nhịp độ" segmented cards: "Thong thả" (3-4 điểm/ngày), "Vừa phải" (4-5 điểm/ngày), "Dày" (6-7 điểm/ngày). Default "Vừa phải".
2) "Ngân sách" chips: "Tiết kiệm", "Vừa", "Thoải mái".
3) "Phương tiện" chips with icons: "Xe máy", "Taxi / Grab", "Đi bộ / xe đạp", "Xe tour".
Groups 2 and 3 are optional (label "Không bắt buộc").
```

#### S09 — Bước 5: Xuất phát

```text
Wizard step 5/6. Question: "Bạn sẽ xuất phát từ đâu mỗi ngày?"
Radio list of preset starting points: "Trung tâm thành phố", "Gần Đại Nội",
"Gần cầu Tràng Tiền / phố đi bộ", "Khu phố Tây". Option "Chọn trên bản đồ" opens
a map with a draggable pin. Below: optional multiline field "Điều cần lưu ý thêm"
with placeholder "Ví dụ: mẹ đi lại khó khăn, muốn dậy muộn..." and a counter "0/300".
```

#### S10 — Bước 6: Xác nhận

```text
Wizard step 6/6. Question: "Kiểm tra lại trước khi tạo nhé"
A summary card list, each row editable (pencil icon): "Thời gian: 2 ngày, bắt đầu 20/12",
"Đi cùng: Cặp đôi", "Sở thích: Di sản, Ẩm thực, Sông Hương", "Nhịp độ: Vừa phải · Ngân sách: Vừa",
"Xuất phát: Gần Đại Nội". Primary full-width button "Tạo lịch trình" with a sparkle icon.
Small text under it: "Mất khoảng vài giây".
```

### S11 — Đang tạo lịch trình `/plan/generating`

```text
Design a loading/generating screen. Centered calm animation (a river-wave or
lotus line animation, subtle). Headline "Đang tạo lịch trình cho bạn..."
and a stepped status list where one item is active:
"✓ Chọn địa điểm hợp gu bạn", "• Sắp xếp theo từng ngày", "○ Viết lý do gợi ý".
A text button "Hủy". Also design the ERROR variant: icon, text
"Chưa tạo được lịch trình", subtext "Kiểm tra kết nối rồi thử lại nhé.",
buttons "Thử lại" and "Quay lại chỉnh thông tin"; and the RATE-LIMIT variant:
"Bạn tạo lịch trình hơi nhanh. Thử lại sau 30 giây."
```

### S12 — Lịch trình `/trip/draft` & `/trip/:id` (màn quan trọng nhất)

```text
Design the Trip Editor, the most important screen. Desktop first (split view: timeline + map), then mobile.

HEADER: back arrow, editable title "Huế 2 ngày cho cặp đôi", save status text
"Đã lưu" (and a guest variant banner: "Đăng nhập để lưu lịch trình và chia sẻ" with button "Đăng nhập"),
buttons "Chia sẻ" and a "..." menu.
DAY TABS: horizontally scrollable pills "Ngày 1", "Ngày 2" with dates.
MAP: collapsed map strip at the top (mobile) with numbered pins and a button
"Xem bản đồ" to expand full screen; on desktop the map sits in the right column.
TIMELINE (day 1): grouped by slot with small headers and time:
"Buổi sáng · 08:00" Đại Nội Huế, 120 phút, reason: "Bạn thích di sản nên bắt đầu ở khu hoàng thành triều Nguyễn."
"Buổi trưa · 11:45" Quán bún bò Huế, 60 phút
"Buổi chiều · 14:00" Lăng Tự Đức, 90 phút
"Buổi tối · 18:00" Dạo bên sông Hương, 60 phút.
Between items show travel connectors: "🛵 12 phút · 3,2 km".
EACH ITEM CARD: thumbnail, number badge, name, category chip, time and duration,
reason text (2 lines), small actions: drag handle (desktop) / up-down buttons (mobile),
lock icon, "Thay thế", delete icon. One item shows a yellow warning chip
"Có thể đóng cửa lúc này".
Below each day: "+ Thêm địa điểm" and "Tạo lại ngày này" buttons.
Show an undo toast: "Đã xóa Chợ Đông Ba · Hoàn tác".
Desktop: two columns (timeline left ~55%, sticky map right ~45%).
```

### S13 — Bottom sheet: Thay thế / Thêm địa điểm

```text
Design two bottom sheets for the trip editor (mobile) and equivalent side panels (desktop).
A) "Gợi ý thay thế" : title, sub "Thay cho Lăng Tự Đức", list of 4 compact place
cards (photo, name, category, distance "cách 2,1 km", reason chip "Cùng loại: lăng tẩm")
each with button "Chọn". Empty state: "Chưa có gợi ý thay thế" + button "Tìm trong danh sách".
B) "Thêm địa điểm": search field "Tìm địa điểm...", category chips, results list;
items already in the trip show a disabled "Đã thêm" label; slot selector chips
"Sáng / Trưa / Chiều / Tối" at the bottom with primary button "Thêm vào Ngày 1".
Also a dialog "Tạo lại ngày này" explaining that locked items (lock icon) stay,
buttons "Hủy" and "Tạo lại".
```

### S14 — Đăng nhập / Đăng ký

```text
Design Login and Register screens (mobile + desktop), clean and light.
Logo on top, serif title "Chào mừng bạn trở lại" / "Tạo tài khoản".
Button "Tiếp tục với Google". Divider "hoặc". Fields: "Email", "Mật khẩu" (show/hide),
register adds "Tên hiển thị". Primary button "Đăng nhập" / "Đăng ký".
Links: "Quên mật khẩu?", "Chưa có tài khoản? Đăng ký", "Đã có tài khoản? Đăng nhập".
Inline error example: "Email hoặc mật khẩu chưa đúng".
Small text: "Bằng việc tiếp tục, bạn đồng ý với Chính sách bảo mật."
Also a "Kiểm tra email của bạn" confirmation state.
Desktop: split layout with a Hue photo on one side.
```

### S15 — Chuyến đi của tôi `/account/trips`

```text
Design "Chuyến đi của tôi". Header with title, button "+ Tạo chuyến đi mới".
List of trip cards: cover photo (from first place), title "Huế 2 ngày cho cặp đôi",
"2 ngày · bắt đầu 20/12 · cập nhật hôm qua", a small "Đang chia sẻ" chip on one,
and a "..." menu: "Mở", "Đổi tên", "Nhân bản", "Chia sẻ", "Xóa".
Delete confirmation dialog: "Xóa chuyến đi này?" "Hành động này không thể hoàn tác." buttons "Hủy", "Xóa".
Empty state: illustration, "Bạn chưa có chuyến đi nào", button "Tạo chuyến đi đầu tiên".
Account sub-navigation tabs: "Chuyến đi", "Đã lưu", "Cài đặt".
```

### S16 — Đã lưu & Cài đặt

```text
Design two screens in the account area.
A) "Địa điểm đã lưu": category chips filter and a grid of saved place cards with
filled hearts; each card has a small button "Thêm vào chuyến đi". Empty state
"Bạn chưa lưu địa điểm nào" with button "Khám phá Huế".
B) "Cài đặt tài khoản": fields "Tên hiển thị", read-only "Email", button "Lưu thay đổi",
a "Đăng xuất" button, and a danger zone card "Xóa tài khoản" with warning text
"Toàn bộ chuyến đi và địa điểm đã lưu sẽ bị xóa vĩnh viễn." and a red outline button;
confirmation dialog asks the user to type "XOA".
```

### S17 — Lịch trình được chia sẻ `/s/:token`

```text
Design the read-only shared itinerary page (mobile first, desktop too).
Top bar with logo only. Title "Huế 2 ngày cho cặp đôi", subtitle "Một lịch trình được chia sẻ cho bạn".
Same day tabs, timeline and map as the Trip Editor but WITHOUT edit controls.
Sticky bottom bar: primary "Tạo bản sao của tôi", secondary "Tạo lịch trình riêng".
Also design the invalid state: icon, "Lịch trình không còn được chia sẻ",
button "Tạo lịch trình của riêng bạn". Share sheet from the editor: toggle
"Cho phép ai có link xem", read-only link field with button "Sao chép link"
and toast "Đã sao chép".
```

### S18 — Admin: danh sách địa điểm `/admin/places` (desktop)

```text
Design an admin dashboard page (desktop 1440, functional and clean).
Left sidebar: "Địa điểm", "Import CSV". Main: title "Quản lý địa điểm",
buttons "+ Thêm địa điểm" and "Import CSV". Filters: search, select "Trạng thái"
(Tất cả / Nháp / Đã xuất bản / Lưu trữ), "Đã duyệt" toggle, "Loại" select.
Data table columns: Ảnh nhỏ, Tên, Loại, Trạng thái (chip), Đã duyệt (icon),
Thiếu dữ liệu (warning chip e.g. "Thiếu giờ mở cửa"), Cập nhật, Thao tác.
Bulk actions bar: "Xuất bản", "Gỡ", "Duyệt". Pagination at bottom.
```

### S19 — Admin: form địa điểm

```text
Design the admin place form (desktop). Sticky top bar with title,
status chip, buttons "Lưu nháp", "Xuất bản", and "Duyệt thông tin" (separate).
Form in grouped cards: "Thông tin cơ bản" (tên, slug, loại, mô tả ngắn, mô tả),
"Vị trí" (địa chỉ, khu vực, lat/lng + small map with draggable pin),
"Giờ giấc & chi phí" (giờ mở, giờ đóng, ngày nghỉ chips Thứ 2..CN, thời gian tham quan phút,
mức giá, giá vé, nên đi chips Sáng/Trưa/Chiều/Tối, phù hợp với chips),
"Phân loại" (tag multi-select with weight 1-3),
"Ảnh" (upload, required fields "Tác giả ảnh", "Giấy phép ảnh"),
"Nguồn dữ liệu". Inline validation list: "Thiếu: thời gian tham quan".
```

### S20 — Admin: Import CSV

```text
Design the CSV import page (desktop) as a 3-step flow:
1) Upload: dashed dropzone "Kéo thả file CSV vào đây", link "Tải file mẫu".
2) Preview: summary chips "48 hợp lệ · 5 cảnh báo · 2 lỗi", table of rows with
green/yellow/red status and a reason column ("Thiếu image_credit"),
button "Import các dòng hợp lệ".
3) Report: "Đã tạo mới 40, cập nhật 8, bỏ qua 2" with button "Tải file dòng lỗi (CSV)"
and link "Xem địa điểm nháp".
```

### S21 — Trạng thái hệ thống & trang tĩnh

```text
Design a set of small system screens (mobile + desktop), consistent style:
1) 404: line illustration, "Không tìm thấy trang", buttons "Về trang chủ", "Tạo lịch trình".
2) Lỗi chung: "Có lỗi xảy ra", "Thử lại", "Về trang chủ".
3) Không có quyền: "Bạn không có quyền truy cập trang này".
4) Offline banner: "Bạn đang offline. Thay đổi sẽ được đồng bộ khi có mạng."
5) A static text page template for "Giới thiệu" and "Chính sách bảo mật":
readable column (max width 720px), serif H1, section headings, table of contents on desktop.
```

---

## PHẦN D — Design tokens và quy tắc giao diện cho agent

> Agent dùng phần này khi dựng React + Tailwind. Nếu thiết kế cuối cùng từ Stitch khác các giá trị dưới đây, **thiết kế đã được chủ dự án duyệt thắng** và agent cập nhật tokens + file này.

### D1. Tokens (Tailwind)

```ts
// tailwind.config.ts (phần theme.extend)
colors: {
  primary:   { DEFAULT: '#5B3A8C', hover: '#4A2E75', tint: '#EFE9F7' },
  accent:    { DEFAULT: '#C8963E', tint: '#F8EEDB' },   // "Imperial Gold" (tertiary trong DESIGN.md)
  secondary: { DEFAULT: '#2F6F5E', tint: '#E3F1EC' },
  bg:        '#FAF6EE',
  surface:   '#FFFFFF',
  ink:       { DEFAULT: '#1F1A24', muted: '#6B6475' },
  line:      '#E7E0D3',
  success:   '#2F6F5E',
  warning:   '#B7791F',
  danger:    '#B3261E',
},
fontFamily: {
  serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
  sans:  ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
},
borderRadius: { card: '16px', control: '12px' },
boxShadow:    { card: '0 2px 8px rgba(31,26,36,0.08)' },
```

- Nguồn chuẩn: `docs/stitch/stitch_file_analysis_assistant/hue_imperial_editorial/DESIGN.md` (đã duyệt). Phông tiêu đề là **Source Serif 4** (thay cho Lora trong bản prompt đầu). Thang chữ: display 40/48, headline 28/36 · 22/28 · 18/24 (mobile nhỏ hơn: 32/40, 24/32), body 16/26 · 14/22 · 12/18, label 14 · 12 · 11. Khoảng cách: gutter 16px (desktop 24px), margin 16/32/48px theo mobile/tablet/desktop. Đổ bóng thẻ `0 2px 8px rgba(31,26,36,0.06)` + viền `1px #E7E0D3`; hover/kéo `0 8px 24px rgba(31,26,36,0.10)`; lớp phủ modal `rgba(31,26,36,0.45)`. Bo góc: thẻ/modal 16px, nút 12px, chip/badge tròn hẳn.
- Tải font với tập ký tự **vietnamese** (Google Fonts: `subset=vietnamese,latin`), dùng `font-display: swap`.
- Mọi màu dùng qua token, **không** viết mã hex trực tiếp trong component.

**Chuyển lớp Tailwind của `code.html` sang token của dự án** (khi dựng lại component):

| Trong `code.html` (Stitch) | Dùng trong dự án |
|---|---|
| `bg-primary-container`, `bg-primary` (nút chính) | `bg-primary` (#5B3A8C); hover `bg-primary-hover` |
| `bg-surface`, `bg-background` | `bg-bg` |
| `bg-surface-container-lowest` | `bg-surface` (thẻ, trắng) |
| `text-on-surface`, `text-on-surface-variant` | `text-ink`, `text-ink-muted` |
| `border-outline-variant` | `border-line` |
| `bg-tertiary-fixed`, `text-tertiary` (vàng) | `bg-accent-tint`, `text-accent` |
| `bg-secondary-container`, `text-secondary` (xanh ngọc) | `bg-secondary-tint`, `text-secondary` |
| `bg-error-container`, `text-error` | nền nhạt của `danger`, `text-danger` |
| `rounded-xl` / `rounded-2xl` | `rounded-control` (nút, ô nhập) / `rounded-card` (thẻ, hộp thoại) |
| `font-headline-*`, `font-display-*` | `font-serif` với cỡ chữ theo thang ở trên |
| `font-body-*`, `font-label-*` | `font-sans` |

Màu nền dùng `#FAF6EE` (theo `DESIGN.md`); ảnh mockup hiển thị `#FDF9F1`, chênh lệch nhỏ, không cần khớp từng điểm ảnh.

### D2. Component dùng chung (đặt trong `src/components/`)

| Component | Ghi chú |
|---|---|
| `Button` | Biến thể: primary, secondary, tertiary, danger; kích thước md (cao 48px) và sm; có trạng thái loading/disabled |
| `PlaceCard` | Ảnh 4:3, chip loại, tên, khu vực, nút tim; dùng ở explore, saved, gần đây |
| `Chip` / `ChipGroup` | Chọn một hoặc nhiều; trạng thái chọn = nền primary |
| `BottomSheet` / `SidePanel` | Sheet trên mobile, panel bên trên desktop (một API chung) |
| `Toast` | Có hành động (ví dụ "Hoàn tác") |
| `Skeleton` | Cho thẻ, danh sách, timeline |
| `EmptyState` | Minh họa đường nét + tiêu đề + nút hành động |
| `WizardShell` | Thanh trên, tiến trình, thanh dưới cố định |
| `TimelineItem` | Thẻ mục lịch trình + kết nối thời gian di chuyển |
| `MapView` | Bao bọc thư viện bản đồ, có ghi công OSM |
| `Dialog` | Xác nhận, có tiêu đề, nội dung, 2 nút |

### D3. Quy tắc

- **Desktop-first, responsive:** thiết kế chuẩn 1440×900, nội dung tối đa 1200px, lưới 12 cột; thu gọn bằng breakpoint `lg` (< 1024px: tablet, lưới 8 cột) và `md` (< 768px: mobile, lưới 4 cột, thanh tab dưới). Phải dùng được từ 360px.
- **Vùng chạm** tối thiểu 44×44px; nút chính cao 48px.
- Nút hành động chính trên mobile (< 768px) đặt trong **thanh dưới cố định**; chừa `padding-bottom` + `env(safe-area-inset-bottom)` để không bị che.
- **Truy cập (a11y):** nút biểu tượng phải có `aria-label` tiếng Việt; focus nhìn thấy rõ; hộp thoại/sheet bẫy focus và đóng bằng `Esc`; không dùng màu làm tín hiệu duy nhất (kèm biểu tượng/chữ).
- **Ảnh:** luôn có `alt`, kích thước cố định (tránh nhảy bố cục), `loading="lazy"` trừ ảnh đầu trang; hiển thị ghi công khi có `image_credit`.
- **Chuyển động:** ngắn (150–250ms), tôn trọng `prefers-reduced-motion`.
- **Giọng văn tiếng Việt:** thân thiện, xưng "bạn", câu ngắn, động từ rõ ràng; thông báo lỗi nói **nguyên nhân + cách xử lý**, không dùng thuật ngữ kỹ thuật.
- **Chuỗi giao diện:** gom vào `src/lib/strings/vi.ts` (không viết cứng rải rác) để dễ dịch giai đoạn 2.
- **Định dạng:** ngày `dd/MM/yyyy`; giờ 24h `HH:mm`; tiền `200.000 ₫`; khoảng cách `3,2 km` (dấu phẩy thập phân), thời gian `12 phút`.

### D4. Bảng map: màn hình ↔ route ↔ tính năng

| Mã | Màn hình | Route | Tính năng |
|---|---|---|---|
| S01 | Landing | `/` | F-01 |
| S02 | Khám phá | `/explore` | F-02 |
| S03 | Chi tiết địa điểm | `/place/:slug` | F-03 |
| S04 | Bản đồ | `/map` | F-04 |
| S05–S10 | Wizard 6 bước | `/plan/new?step=1..6` | F-05 |
| S11 | Đang tạo | `/plan/generating` | F-06 |
| S12 | Trình chỉnh lịch trình | `/trip/draft`, `/trip/:id` | F-07 |
| S13 | Sheet thay thế/thêm, hộp thoại tạo lại ngày | (trong S12) | F-07 |
| S14 | Đăng nhập/Đăng ký | `/login`, `/register` | F-08 |
| S15 | Chuyến đi của tôi | `/account/trips` | F-09 |
| S16 | Đã lưu, Cài đặt | `/account/saved`, `/account/settings` | F-10, F-08 |
| S17 | Lịch trình chia sẻ + sheet chia sẻ | `/s/:token` | F-11 |
| S18–S20 | Admin | `/admin/*` | F-12 |
| S21 | Lỗi, 404, offline, trang tĩnh | `*`, `/about`, `/privacy` | F-13, F-14 |

### D5. Bố cục desktop (1440×900) cho các màn chính

Bản desktop đã có trong `docs/stitch/` cho: S01, S02, S03, S04, S07, S12, S15, S17 (thư mục `*_desktop`) và S18–S21.

| Màn | Bố cục desktop |
|---|---|
| S01 Landing | Hero 2 cột (chữ trái, ảnh lớn phải); "Cách hoạt động" 3 cột; địa điểm nổi bật 4 cột |
| S02 Khám phá | Thanh lọc cố định bên trái; lưới thẻ 3–4 cột |
| S03 Chi tiết địa điểm | Cột trái: thư viện ảnh + nội dung; cột phải: thẻ hành động cố định kèm bản đồ nhỏ |
| S04 Bản đồ | Danh sách 380px bên trái, bản đồ chiếm phần còn lại |
| S07 Wizard (đại diện S05–S10) | Khung giữa rộng ~720px, thanh tiến trình ngang, lưới sở thích 5 cột |
| S12 Trình chỉnh lịch trình | Timeline 55% bên trái, bản đồ cố định 45% bên phải; S13 là ngăn bên (`SidePanel`) |
| S15 Chuyến đi của tôi | Lưới thẻ 3 cột |
| S17 Lịch trình chia sẻ | Như S12 nhưng chỉ đọc, nút "Tạo bản sao" ở thanh trên |

Các màn còn lại (S05, S06, S08–S11, S14, S16, S21) dùng chung khung wizard hoặc trang tài khoản; agent suy ra từ bản mobile và tokens. Điều hướng desktop là header (Logo · Khám phá · Bản đồ · **Tạo lịch trình** · Chuyến đi của tôi · Đăng nhập), không dùng thanh tab dưới.

Prompt mẫu cho Stitch (một màn mỗi lần, dán thêm dòng bố cục ở bảng trên):

```text
Create the DESKTOP version (1440x900) of this existing screen. Keep the same design system
(Hue Imperial Editorial: colors, Source Serif 4 + Be Vietnam Pro, radius, shadows), the same
Vietnamese copy and the same components. Do not add new features or sections.
Adapt the layout for a wide screen: top header navigation (logo, "Khám phá", "Bản đồ",
highlighted "Tạo lịch trình", "Chuyến đi của tôi", "Đăng nhập") instead of the bottom tab bar;
max content width 1200px; use multi-column grids; side panels instead of bottom sheets.
Layout for this screen: <dòng bố cục tương ứng>.
```

## Câu hỏi còn mở

- [x] Bảng màu và font: đã chốt theo Stitch (tím Huế + vàng cung đình + xanh ngọc; Source Serif 4 + Be Vietnam Pro).
- [ ] Tên sản phẩm và logo chính thức (mockup đang dùng "Cổ Đô" / "Hue Trip Planner"); xem `docs/10-decisions.md` D-01.
- [x] Bản desktop: đã có cho 12 màn quan trọng (xem D5); các màn còn lại dựng responsive.
