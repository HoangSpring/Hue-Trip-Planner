export interface AssistantAction {
  label: string
  to?: string
  prompt?: string
}

export interface AssistantReply {
  text: string
  actions?: AssistantAction[]
}

export interface QuickSuggestion {
  id: string
  label: string
  prompt: string
}

export const INITIAL_GREETING: AssistantReply = {
  text: `Xin chào! Mình là **Trợ lý Cố Đô** 🌸.\n\nRất vui được đồng hành cùng bạn khám phá Huế. Bạn cần gợi ý món ngon, điểm tham quan, lăng tẩm hay muốn tự động tạo lịch trình du lịch hôm nay?`,
  actions: [
    { label: '✨ Tạo lịch trình tự động', to: '/plan/new' },
    { label: '🗺️ Mở bản đồ du lịch', to: '/map' },
  ],
}

export const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { id: 'bun-bo', label: '🍜 Bún bò Huế chuẩn vị', prompt: 'Gợi ý quán bún bò Huế ngon chuẩn vị' },
  { id: 'dai-noi', label: '🏯 Lịch trình 1 ngày tham quan', prompt: 'Gợi ý lịch trình 1 ngày khám phá Huế' },
  { id: 'lang-tam', label: '👑 Nên đi lăng tẩm nào?', prompt: 'Ở Huế có những lăng vua nào đẹp nhất?' },
  { id: 'banh-hue', label: '🥢 Bánh bèo, nậm, lọc', prompt: 'Quán bánh bèo nậm lọc Huế nào ngon?' },
  { id: 'sunset', label: '🌅 Ngắm hoàng hôn & cà phê', prompt: 'Điểm ngắm hoàng hôn và quán cà phê đẹp ở Huế' },
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function getAssistantResponse(query: string): AssistantReply {
  const q = normalize(query)

  // 1. Tạo lịch trình / lên kế hoạch
  if (
    q.includes('tao lich trinh') ||
    q.includes('len lich trinh') ||
    q.includes('ke hoach') ||
    q.includes('itinerary') ||
    q.includes('plan')
  ) {
    return {
      text: `Để tạo lịch trình tối ưu theo sở thích (văn hóa, ẩm thực, số ngày, nhịp độ), bạn hãy dùng tính năng **Tạo lịch trình AI** của Cố Đô:\n\n1. Chọn số ngày du lịch (1 - 5 ngày).\n2. Chọn gu trải nghiệm: di sản, ẩm thực, thiên nhiên, thư thả hay dày đặc.\n3. Hệ thống sẽ tự động tối ưu hóa đường đi và sắp xếp bữa ăn hợp lý!`,
      actions: [
        { label: '🚀 Tạo lịch trình ngay', to: '/plan/new' },
        { label: '🗺️ Xem bản đồ các điểm', to: '/map' },
      ],
    }
  }

  // 2. Bún bò Huế
  if (q.includes('bun bo') || q.includes('bun bo hue')) {
    return {
      text: `🍜 **Các quán Bún bò Huế nức tiếng người địa phương yêu thích:**\n\n- **Quán Bún bò O Cương Điệp** (Trần Thúc Nhẫn): Nước dùng đậm đà, thơm mùi sả ruốc, thịt nạm giòn thơm.\n- **Bún bò Mụ Rơi** (Nguyễn Du): Quán lâu đời, chả cua tự làm béo ngậy, giá bình dân.\n- **Bún bò Cẩm** (Lê Lợi): Không gian sạch sẽ, vị thanh vừa miệng khách phương xa.\n- **Bún bò Bà Tuyết** (Nguyễn Công Trứ): Phục vụ nhanh, mở sáng sớm, rất đông khách sành ăn.\n\n*Mẹo nhỏ:* Bún bò Huế thường dùng sợi tròn nhỏ hoặc vừa, ăn kèm rau sống hoa chuối và ớt chưng cay nồng nhé!`,
      actions: [
        { label: '🔍 Tìm quán ăn trên Bản đồ', to: '/map' },
        { label: '✨ Khám phá địa điểm ẩm thực', to: '/explore?category=food' },
      ],
    }
  }

  // 3. Bánh bèo, nậm, lọc, ram ít, bánh khoái, cơm hến
  if (
    q.includes('banh beo') ||
    q.includes('banh nam') ||
    q.includes('banh loc') ||
    q.includes('banh khoai') ||
    q.includes('com hen') ||
    q.includes('bun hen') ||
    q.includes('an vat') ||
    q.includes('an gi') ||
    q.includes('dac san')
  ) {
    return {
      text: `🥢 **Đặc sản Huế nhất định phải thử:**\n\n1. **Bánh bèo, nậm, lọc, ram ít:**\n   - *Quán Hàng Me Mẹ* (12 Võ Thị Sáu) - đa dạng món bánh gia truyền.\n   - *Quán Bà Đỏ* (8 Nguyễn Bỉnh Khiêm) - bánh lọc gói lá chuối tôm thịt đậm đà.\n2. **Cơm hến / Bún hến:**\n   - *Quán Hoa Đông* hoặc *Quán Nhỏ* (Cồn Hến, Vĩ Dạ) - hến xào cay nồng, ăn kèm tóp mỡ giòn rụm và nước hến nóng hổi.\n3. **Bánh khoái & Nem lụi:**\n   - *Bánh khoái Lạc Thiện* hoặc *Hồng Mai* (đường Đinh Tiên Hoàng) - vỏ bánh vàng ươm chấm nước lèo gan đậu phộng béo bùi.\n4. **Chè Huế:**\n   - *Chè Hẻm* (đường Hùng Vương) hoặc *Chè Mợ Tôn Đích* (chè bột lọc bọc heo quay độc đáo).`,
      actions: [
        { label: '📍 Xem danh sách quán ăn', to: '/explore?category=food' },
      ],
    }
  }

  // 4. Lăng tẩm (Khải Định, Tự Đức, Minh Mạng, Gia Long...)
  if (
    q.includes('lang') ||
    q.includes('lang tam') ||
    q.includes('khai dinh') ||
    q.includes('tu duc') ||
    q.includes('minh mang') ||
    q.includes('gia long')
  ) {
    return {
      text: `👑 **Top 3 lăng tẩm tiêu biểu nhất nên ghé:**\n\n1. **Lăng Khải Định (Ứng Lăng):**\n   - Đỉnh cao nghệ thuật ghép sành sứ và thủy tinh, kiến trúc kết hợp Đông - Tây lộng lẫy.\n2. **Lăng Tự Đức (Khiêm Lăng):**\n   - Không gian non nước hữu tình, hồ sen Khiêm Cung, đượm nét thơ mộng và triết lý phương Đông.\n3. **Lăng Minh Mạng (Hiếu Lăng):**\n   - Bố cục đối xứng trục thần đạo uy nghiêm, nằm giữa rừng thông và hồ sen phẳng lặng.\n\n*Mẹo tiết kiệm:* Bạn có thể mua vé tuyến gộp (Đại Nội + 3 Lăng) tại quầy vé để được giảm giá đáng kể!`,
      actions: [
        { label: '🏛️ Xem chi tiết các di tích', to: '/explore?category=cultural' },
        { label: '🗺️ Xem vị trí các lăng trên bản đồ', to: '/map' },
      ],
    }
  }

  // 5. Đại Nội / Hoàng Thành
  if (
    q.includes('dai noi') ||
    q.includes('hoang thanh') ||
    q.includes('ngo mon') ||
    q.includes('tu cam thanh')
  ) {
    return {
      text: `🏯 **Kinh nghiệm tham quan Đại Nội Huế:**\n\n- **Thời gian lý tưởng:** Dành ít nhất **2.5 - 3 tiếng**. Nên đi vào sáng sớm (7:30 - 10:30) hoặc chiều mát (14:30 - 17:30) để tránh nắng.\n- **Các điểm nhấn:** Cổng Ngọ Môn, Điện Thái Hòa, Cung Diên Thọ, Thế Miếu, Vườn Thiệu Phương.\n- **Trang phục:** Ăn mặc lịch sự, kín đáo (quần/váy qua gối); mang giày bệt thoải mái vì diện tích đi bộ rất rộng.\n- **Check-in:** Cung Diên Thọ và khu vực Trường Lang sơn son thếp vàng là những góc chụp ảnh cổ trang tuyệt đẹp!`,
      actions: [
        { label: '📌 Xem thông tin Đại Nội', to: '/place/dai-noi-hue' },
        { label: '✨ Tự động xếp vào lịch trình', to: '/plan/new' },
      ],
    }
  }

  // 6. Lịch trình gợi ý (1 ngày, 2 ngày, 3 ngày)
  if (q.includes('1 ngay') || q.includes('mot ngay') || q.includes('lich trinh')) {
    return {
      text: `📅 **Gợi ý lịch trình 1 ngày trọn vẹn khám phá Huế:**\n\n- **Buổi sáng (07:30 - 11:30):**\n  - Thưởng thức Bún bò Huế chuẩn vị.\n  - Tham quan **Đại Nội** (Ngọ Môn, Điện Thái Hòa).\n  - Ghé **Chùa Thiên Mụ** ngắm sông Hương.\n- **Buổi trưa (11:45 - 13:30):**\n  - Ăn trưa đặc sản Bánh bèo - nậm - lọc hoặc Cơm niêu.\n  - Nghỉ trưa, uống Cà phê Muối.\n- **Buổi chiều (14:00 - 17:30):**\n  - Tham quan **Lăng Tự Đức** và check-in **Làng hương Thủy Xuân** rực rỡ.\n  - Ngắm hoàng hôn tại **Đồi Vọng Cảnh**.\n- **Buổi tối (18:30 - 21:30):**\n  - Dạo cầu Tràng Tiền, nghe Ca Huế trên sông Hương hoặc ăn chè hẻm phố đêm.`,
      actions: [
        { label: '🚀 Bắt đầu tạo lịch trình chi tiết', to: '/plan/new' },
      ],
    }
  }

  // 7. Check-in / Hoàng hôn / Cà phê
  if (
    q.includes('hoang hon') ||
    q.includes('ca phe') ||
    q.includes('cafe') ||
    q.includes('check in') ||
    q.includes('chup anh') ||
    q.includes('song huong') ||
    q.includes('doi vong canh')
  ) {
    return {
      text: `🌅 **Các điểm ngắm hoàng hôn & cà phê Huế tuyệt đẹp:**\n\n1. **Đồi Vọng Cảnh:** Điểm ngắm khúc cua sông Hương đẹp nhất lúc chiều tà, rừng thông rì rào thơ mộng.\n2. **Bến thuyền Chùa Thiên Mụ:** Ánh chiều buông trên dòng Hương Giang cổ kính.\n3. **Cà phê Muối:** Thức uống đặc sản độc đáo ra đời tại Huế (quán gốc ở đường Nguyễn Huệ hoặc Đặng Thái Thân).\n4. **Tiệm Cà Phê Mắt Biếc:** Nằm ở phố cổ Bao Vinh, góc hoài niệm bình yên.\n5. **Làng hương Thủy Xuân:** Những bó hương hoa xòe quạt đa sắc màu rực rỡ cho bộ ảnh kỷ niệm tuyệt đẹp.`,
      actions: [
        { label: '🗺️ Mở bản đồ khám phá', to: '/map' },
        { label: '📷 Khám phá địa điểm check-in', to: '/explore?category=entertainment' },
      ],
    }
  }

  // 8. Thời tiết / Đi mùa nào đẹp
  if (
    q.includes('thoi tiet') ||
    q.includes('mua nao') ||
    q.includes('mua') ||
    q.includes('troi mua') ||
    q.includes('thang nao')
  ) {
    return {
      text: `🌤️ **Kinh nghiệm thời tiết du lịch Huế:**\n\n- **Tháng 1 - Tháng 4 (Mùa xuân):** Mùa đẹp nhất! Thời tiết mát mẻ, nắng nhẹ, trăm hoa đua nở, rất thích hợp dạo bộ lăng tẩm và phố cổ.\n- **Tháng 5 - Tháng 8 (Mùa hè):** Nắng vàng rực rỡ, thích hợp kết hợp đi biển Thuận An, Lăng Cô, phá Tam Giang.\n- **Tháng 9 - Tháng 12 (Mùa thu - đông):** Mùa mưa Huế mang nét tĩnh lặng, trầm mặc đặc trưng. Đi thời gian này bạn nhớ mang theo ô (dù) và áo ấm mỏng nhé!`,
      actions: [
        { label: '✨ Lên kế hoạch cho chuyến đi', to: '/plan/new' },
      ],
    }
  }

  // 9. Đi lại / Phương tiện
  if (
    q.includes('xe may') ||
    q.includes('di chuyen') ||
    q.includes('phuong tien') ||
    q.includes('taxi') ||
    q.includes('xich lo') ||
    q.includes('thuyen')
  ) {
    return {
      text: `🛵 **Phương tiện di chuyển thuận tiện ở Huế:**\n\n- **Thuê xe máy:** Phổ biến nhất (khoảng 100.000đ - 150.000đ/ngày), đường Huế bằng phẳng, rợp bóng cây, rất dễ đi.\n- **Xích lô:** Trải nghiệm thư thả dạo quanh bờ bắc Hoàng Thành hoặc ngắm phố ven sông Hương (nên hỏi giá trước khi lên xe).\n- **Thuyền rồng sông Hương:** Du ngoạn nghe ca Huế ban đêm hoặc đi thuyền lên chùa Thiên Mụ.\n- **Grab / Taxi:** Rất sẵn sàng tại trung tâm TP Huế và sân bay Phú Bài.`,
    }
  }

  // 10. Chào hỏi
  const isGreeting =
    q === 'hi' ||
    q.startsWith('hi ') ||
    q.endsWith(' hi') ||
    q.includes('hello') ||
    q.includes('xin chao') ||
    q.includes('chao ban')

  if (isGreeting) {
    return {
      text: `Dạ xin chào bạn! Cố Đô Huế mến chào bạn. Hôm nay bạn đang muốn tìm hiểu về ẩm thực, các địa điểm di tích lăng tẩm, hay cần gợi ý lịch trình vi vu Huế?`,
      actions: [
        { label: '🍜 Món ngon Huế', prompt: 'Gợi ý món ngon Huế nên thử' },
        { label: '🏯 Lịch trình tham quan', prompt: 'Gợi ý lịch trình 1 ngày khám phá Huế' },
      ],
    }
  }

  // 11. Cảm ơn
  if (q.includes('cam on') || q.includes('thank')) {
    return {
      text: `Rất vui được hỗ trợ bạn! Chúc bạn có một chuyến đi Huế ngập tràn kỷ niệm đẹp và thưởng thức thật nhiều món ngon. Nếu cần thêm thông tin gì, bạn cứ nhắn mình nhé! 🌸`,
    }
  }

  // Default fallback
  return {
    text: `Mình là **Trợ lý Cố Đô** 🌸. Bạn có thể hỏi mình chi tiết về:\n\n- 🍜 **Món ngon đặc sản:** Bún bò, bánh bèo, nem lụi, chè hẻm...\n- 🏯 **Điểm tham quan:** Đại Nội, chùa Thiên Mụ, các lăng vua, làng hương Thủy Xuân...\n- 📅 **Lịch trình du lịch:** 1 ngày, 2 ngày, gợi ý theo sở thích...\n- 🗺️ **Tính năng:** Tự động tạo lịch trình cá nhân hóa tại trang Tạo lịch trình.`,
    actions: [
      { label: '✨ Tạo lịch trình tự động', to: '/plan/new' },
      { label: '🗺️ Xem bản đồ Huế', to: '/map' },
      { label: '🔍 Khám phá địa điểm', to: '/explore' },
    ],
  }
}
