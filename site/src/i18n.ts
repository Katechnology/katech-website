export type Lang = 'vi' | 'en'

export const CONTACT = {
  phone: '0847 091 357',
  phoneHref: 'tel:+84847091357',
  zalo: 'https://zalo.me/0847091357',
  email: 'akaphan2302@gmail.com',
  city: 'Huế, Việt Nam',
}

export type ServiceKey = 'web' | 'app' | 'video' | 'ai'

const vi = {
  meta: {
    title: 'Katech — Website, app, video và AI cho doanh nghiệp ở Huế',
    desc: 'Katech làm website, ứng dụng, video ra mắt sản phẩm, video marketing và đưa AI vào quy trình làm việc cho doanh nghiệp ở Huế.',
  },
  loader: 'Đang chèo đò ra giữa sông…',
  loaderHint: 'Cuộn để bắt đầu',
  nav: { services: 'Dịch vụ', process: 'Cách làm', contact: 'Liên hệ' },
  pill: { label: 'Nhắn Katech', copy: 'Chép số', copied: 'Đã chép' },
  scrollDown: 'Cuộn xuống',
  readMore: 'Xem thêm',
  chapters: ['Bình minh', 'Gió sớm', 'Hồ sen', 'Quán chiều', 'Hoa đăng'],
  hero: {
    title: 'Kinh doanh,\nnhẹ gánh.',
    sub: 'Website, app, video và AI cho doanh nghiệp ở Huế. Bạn lo chuyện kinh doanh — chuyện công nghệ, có Katech.',
  },
  wind: {
    title: 'Khách tìm bạn\nở mọi nơi.',
    words: ['Website', 'Ứng dụng', 'Video', 'AI'],
    sub: 'Trên Google, trên điện thoại, trên Facebook và TikTok — và cả lúc bạn đang bận.',
  },
  pond: {
    title: 'Biết lắng nghe.',
    sub: 'AI trả lời những câu khách hỏi mỗi ngày, ghi đơn vào sổ và báo cho bạn — đúng giọng của quán.',
    ask: 'Thử hỏi quán mẫu:',
    note: 'Câu trả lời mẫu của một quán ví dụ.',
    customer: 'Khách',
    shop: 'Quán',
    qa: [
      { q: 'Tối nay còn bàn không?', a: 'Dạ còn ạ! Bàn mấy người, mấy giờ để quán giữ chỗ ạ?' },
      { q: 'Mấy giờ quán mở cửa?', a: 'Quán mở từ 6 giờ sáng đến 10 giờ tối, cả tuần ạ.' },
      { q: 'Có giao hàng không?', a: 'Có ạ, trong nội thành Huế. Anh chị gửi địa chỉ giúp quán nha.' },
    ],
  },
  cafe: {
    typeName: 'Gõ tên quán của bạn',
    namePlaceholder: 'Quán của bạn',
    siteTagline: 'Bún bò · Cà phê muối · Bánh khoái',
    siteNav: ['Thực đơn', 'Đặt bàn', 'Liên hệ'],
    siteCta: 'Đặt bàn ngay',
    devices: [
      { key: 'web', title: 'Website', line: 'Một trang của riêng bạn: thực đơn, đặt bàn, chỉ đường — đẹp trên mọi điện thoại.' },
      { key: 'app', title: 'Ứng dụng', line: 'Khách quen tự đặt lịch, tích điểm, nhận ưu đãi — không cần gọi điện.' },
      { key: 'video', title: 'Video', line: 'Video ra mắt sản phẩm và video quảng cáo ngắn, kể đúng chuyện của quán.' },
    ] as { key: ServiceKey; title: string; line: string }[],
    phone: { title: 'Đặt lịch', booked: 'Đã giữ chỗ ✓', days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] },
  },
  night: {
    title: 'Bạn kể.\nKatech nghe.\nCùng làm.',
    sub: 'Thả một lời nhắn — Katech đọc từng chữ và sẽ liên hệ lại với bạn.',
    placeholder: 'Bạn đang kinh doanh gì, và đang vướng ở đâu?',
    contactPlaceholder: 'Số điện thoại hoặc Zalo của bạn',
    send: 'Thả đèn',
    call: 'Gọi',
    via: 'Gửi qua',
    sentZalo: 'Đã chép lời nhắn — dán vào Zalo là xong.',
    sentMail: 'Đang mở email…',
    empty: 'Viết vài chữ trước đã nhé.',
  },
  panels: {
    web: {
      kicker: '01 — Website',
      title: 'Website cho quán, cho hiệu, cho homestay',
      body: 'Trang giới thiệu, thực đơn, đặt bàn hoặc đặt phòng, bản đồ chỉ đường. Chạy nhanh trên điện thoại, có tiếng Việt và tiếng Anh cho khách du lịch, và bạn tự sửa được nội dung.',
      items: ['Thiết kế riêng theo câu chuyện của bạn', 'Đặt bàn / đặt phòng / đặt hàng', 'Lên Google Maps và Google Search', 'Hướng dẫn bạn tự cập nhật'],
    },
    app: {
      kicker: '02 — Ứng dụng',
      title: 'Ứng dụng cho khách quen',
      body: 'Ứng dụng di động hoặc web app để khách đặt lịch, tích điểm, nhận ưu đãi; bảng quản lý đơn giản cho chủ quán và nhân viên.',
      items: ['Đặt lịch, nhắc lịch tự động', 'Tích điểm, ưu đãi khách quen', 'Trang quản lý cho chủ quán', 'iOS, Android hoặc web'],
    },
    video: {
      kicker: '03 — Video',
      title: 'Video ra mắt và video marketing',
      body: 'Từ ý tưởng, kịch bản đến dựng hình và chuyển động: video ra mắt sản phẩm, video ngắn cho Facebook, TikTok, Reels, YouTube — đúng khung hình cho từng nơi đăng.',
      items: ['Kịch bản và bảng phân cảnh', 'Dựng hình, chữ chuyển động, nhạc', 'Bản dọc 9:16, vuông 1:1, ngang 16:9', 'Phụ đề tiếng Việt / tiếng Anh'],
    },
    ai: {
      kicker: '04 — AI trong công việc',
      title: 'Đưa AI vào việc hằng ngày',
      body: 'Những việc lặp lại mỗi ngày — trả lời tin nhắn thường gặp, ghi đơn, nhắc lịch, tổng hợp đánh giá — để máy làm, còn bạn giữ phần cần con người.',
      items: ['Trả lời tin nhắn Zalo / Facebook theo giọng của quán', 'Ghi đơn và lịch hẹn vào bảng tính', 'Báo cáo cuối ngày gửi về điện thoại', 'Bạn luôn duyệt được trước khi gửi'],
    },
    process: {
      kicker: 'Cách Katech làm',
      title: 'Bốn bước, không vòng vo',
      steps: [
        ['Bạn kể', 'Một buổi cà phê hoặc gọi điện: bạn bán gì, khách là ai, đang vướng ở đâu.'],
        ['Katech đề xuất', 'Một kế hoạch ngắn gọn: làm gì trước, làm gì sau, chi phí và thời gian cụ thể.'],
        ['Cùng làm', 'Bạn xem bản nháp sớm, góp ý thẳng; Katech sửa đến khi vừa ý.'],
        ['Bàn giao', 'Hướng dẫn bạn và nhân viên dùng; Katech vẫn ở Huế khi bạn cần.'],
      ] as [string, string][],
    },
    cta: 'Bàn với Katech',
    close: 'Đóng',
  },
  footer: {
    tagline: 'Dịch vụ công nghệ tại Huế.',
    services: 'Dịch vụ',
    scenes: 'Các cảnh',
    contact: 'Liên hệ',
    top: 'Lên đầu trang',
    rights: '© 2026 Katech. Làm ở Huế với nhiều cà phê muối.',
  },
}

type Dict = typeof vi

const en: Dict = {
  meta: {
    title: 'Katech — Websites, apps, video and AI for businesses in Huế',
    desc: 'Katech builds websites, apps, product launch videos, video marketing and AI workflows for businesses in Huế, Vietnam.',
  },
  loader: 'Rowing out to the river…',
  loaderHint: 'Scroll to begin',
  nav: { services: 'Services', process: 'Process', contact: 'Contact' },
  pill: { label: 'Message Katech', copy: 'Copy number', copied: 'Copied' },
  scrollDown: 'Scroll down',
  readMore: 'Read more',
  chapters: ['Dawn', 'Morning wind', 'Lotus pond', 'Afternoon café', 'Lantern night'],
  hero: {
    title: 'Business,\nlighter.',
    sub: 'Websites, apps, video and AI for businesses in Huế. You run the business — Katech carries the tech.',
  },
  wind: {
    title: 'Found\neverywhere.',
    words: ['Website', 'App', 'Video', 'AI'],
    sub: 'On Google, on phones, on Facebook and TikTok — even while you are busy.',
  },
  pond: {
    title: 'It listens.',
    sub: 'AI answers the questions customers ask every day, logs orders and tells you — in your shop’s own voice.',
    ask: 'Ask the sample shop:',
    note: 'Sample replies from an example shop.',
    customer: 'Guest',
    shop: 'Shop',
    qa: [
      { q: 'Any tables free tonight?', a: 'Yes! How many people, and what time should we hold it for?' },
      { q: 'What time do you open?', a: 'We’re open 6 am to 10 pm, every day of the week.' },
      { q: 'Do you deliver?', a: 'We do, anywhere in central Huế. Just send us your address.' },
    ],
  },
  cafe: {
    typeName: 'Type your shop’s name',
    namePlaceholder: 'Your Shop',
    siteTagline: 'Beef noodles · Salt coffee · Huế pancakes',
    siteNav: ['Menu', 'Book', 'Contact'],
    siteCta: 'Book a table',
    devices: [
      { key: 'web', title: 'Website', line: 'A page of your own: menu, bookings, directions — beautiful on every phone.' },
      { key: 'app', title: 'App', line: 'Regulars book, collect points and get offers themselves — no phone calls.' },
      { key: 'video', title: 'Video', line: 'Launch films and short ads that tell your shop’s real story.' },
    ],
    phone: { title: 'Booking', booked: 'Table held ✓', days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] },
  },
  night: {
    title: 'You tell.\nKatech listens.\nWe build.',
    sub: 'Float us a message — Katech reads every word and will get back to you.',
    placeholder: 'What do you run, and where are you stuck?',
    contactPlaceholder: 'Your phone or Zalo',
    send: 'Float it',
    call: 'Call',
    via: 'Send via',
    sentZalo: 'Message copied — paste it into Zalo.',
    sentMail: 'Opening email…',
    empty: 'Write a few words first.',
  },
  panels: {
    web: {
      kicker: '01 — Website',
      title: 'Websites for cafés, shops and homestays',
      body: 'About page, menu, table or room booking, directions. Fast on phones, in Vietnamese and English for travellers, and you can edit the content yourself.',
      items: ['Designed around your story', 'Table / room / order booking', 'On Google Maps and Search', 'We teach you to update it'],
    },
    app: {
      kicker: '02 — App',
      title: 'An app for your regulars',
      body: 'A mobile or web app where customers book, collect points and get offers; a simple dashboard for you and your staff.',
      items: ['Bookings with automatic reminders', 'Points and offers for regulars', 'Owner dashboard', 'iOS, Android or web'],
    },
    video: {
      kicker: '03 — Video',
      title: 'Launch films and video marketing',
      body: 'From idea and script to edit and motion: product launch films and short videos for Facebook, TikTok, Reels and YouTube — in the right frame for each.',
      items: ['Script and storyboard', 'Edit, motion type, music', 'Vertical 9:16, square 1:1, wide 16:9', 'Vietnamese / English subtitles'],
    },
    ai: {
      kicker: '04 — AI at work',
      title: 'AI in your daily workflow',
      body: 'The things you repeat every day — answering common messages, logging orders, reminders, review summaries — let the machine do them, and keep the human part for you.',
      items: ['Replies on Zalo / Facebook in your shop’s voice', 'Orders and bookings into a spreadsheet', 'End-of-day report to your phone', 'You can always approve before it sends'],
    },
    process: {
      kicker: 'How Katech works',
      title: 'Four steps, no detours',
      steps: [
        ['You tell', 'Over coffee or a call: what you sell, who buys, where you’re stuck.'],
        ['Katech proposes', 'A short plan: what first, what later, with clear cost and timing.'],
        ['We build', 'You see early drafts and say what you think; we refine until it fits.'],
        ['Handover', 'We train you and your staff — and Katech is still here in Huế.'],
      ],
    },
    cta: 'Talk to Katech',
    close: 'Close',
  },
  footer: {
    tagline: 'Technology services in Huế.',
    services: 'Services',
    scenes: 'Scenes',
    contact: 'Contact',
    top: 'Back to top',
    rights: '© 2026 Katech. Made in Huế on a lot of salt coffee.',
  },
}

export const DICT: Record<Lang, Dict> = { vi, en }
export type { Dict }
