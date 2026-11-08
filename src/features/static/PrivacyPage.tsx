import { Helmet } from 'react-helmet-async'
import { brand } from '@/lib/brand'
import { paths } from '@/app/paths'

const sections = [
  ['du-lieu', 'Dữ liệu chúng tôi thu thập'],
  ['muc-dich', 'Mục đích sử dụng'],
  ['luu-tru', 'Thời gian lưu trữ'],
  ['quyen-cua-ban', 'Quyền của bạn'],
  ['ben-thu-ba', 'Bên thứ ba'],
  ['ai', 'Khi tính năng AI được bật'],
  ['luu-tru-cuc-bo', 'Cookie và lưu trữ cục bộ'],
]

export default function PrivacyPage() {
  return <main className="mx-auto max-w-[720px] px-4 py-12 md:py-16">
    <Helmet><title>Chính sách bảo mật · {brand.name}</title><meta name="description" content={`Thông tin về dữ liệu và quyền riêng tư khi dùng ${brand.name}.`} /><meta name="robots" content="index,follow" /><link rel="canonical" href={`${window.location.origin}${paths.privacy}`} /></Helmet>
    <p className="text-sm font-semibold uppercase tracking-wider text-primary">{brand.name}</p>
    <h1 className="mt-3 font-serif text-4xl">Chính sách bảo mật</h1>
    <p className="mt-4 leading-7 text-ink-muted">Bản nháp chính sách này giải thích dữ liệu được xử lý khi sử dụng dịch vụ. Chủ dự án cần duyệt và cập nhật trước khi phát hành.</p>
    <nav aria-label="Mục lục chính sách bảo mật" className="mt-8 rounded-card border border-line bg-surface p-5 md:sticky md:top-24 md:float-right md:ml-6 md:w-56">
      <h2 className="font-semibold">Mục lục</h2><ol className="mt-3 list-inside list-decimal space-y-2 text-sm">{sections.map(([id, title]) => <li key={id}><a className="text-primary underline" href={`#${id}`}>{title}</a></li>)}</ol>
    </nav>
    <div className="mt-8 space-y-8 leading-7 text-ink-muted">
      <section id="du-lieu"><h2 className="font-serif text-2xl text-ink">Dữ liệu chúng tôi thu thập</h2><p className="mt-2">Tùy cách bạn dùng dịch vụ, dữ liệu gồm email và tên hiển thị của tài khoản; lịch trình, ngày đi, sở thích, ghi chú và các địa điểm đã lưu; cùng nhật ký kỹ thuật giới hạn như mã yêu cầu, trạng thái xử lý và số liệu vận hành.</p></section>
      <section id="muc-dich"><h2 className="font-serif text-2xl text-ink">Mục đích sử dụng</h2><p className="mt-2">Dữ liệu dùng để xác thực tài khoản, tạo và lưu lịch trình, cung cấp địa điểm đã lưu, chia sẻ theo yêu cầu của bạn, bảo vệ dịch vụ và khắc phục lỗi.</p></section>
      <section id="luu-tru"><h2 className="font-serif text-2xl text-ink">Thời gian lưu trữ</h2><p className="mt-2">Lịch trình và địa điểm đã lưu được giữ cho đến khi bạn xóa chúng hoặc xóa tài khoản. Nhật ký generation_events được dự kiến lưu tối đa 90 ngày rồi dọn theo chính sách vận hành.</p></section>
      <section id="quyen-cua-ban"><h2 className="font-serif text-2xl text-ink">Quyền của bạn</h2><p className="mt-2">Bạn có thể xem, sửa, xóa chuyến đi và yêu cầu xóa tài khoản cùng dữ liệu liên quan qua chức năng tài khoản hoặc liên hệ dự án. Việc xóa có thể không khôi phục được.</p></section>
      <section id="ben-thu-ba"><h2 className="font-serif text-2xl text-ink">Bên thứ ba</h2><p className="mt-2">Dịch vụ sử dụng Supabase cho cơ sở dữ liệu và xác thực, Vercel cho lưu trữ/chạy ứng dụng, OpenStreetMap cho bản đồ. Nhà cung cấp LLM chỉ được dùng khi tính năng AI được bật.</p></section>
      <section id="ai"><h2 className="font-serif text-2xl text-ink">Khi tính năng AI được bật</h2><p className="mt-2">Khi bạn yêu cầu tạo hoặc tạo lại lịch trình và tính năng AI đang bật, sở thích, ngày đi và phong cách hành trình có thể được gửi đến nhà cung cấp LLM để tạo gợi ý. Email và thông tin xác thực không được gửi trong yêu cầu tạo lịch trình. Nội dung ghi chú được xử lý theo cấu hình ứng dụng và cần được chủ dự án rà soát trước khi phát hành.</p></section>
      <section id="luu-tru-cuc-bo"><h2 className="font-serif text-2xl text-ink">Cookie và lưu trữ cục bộ</h2><p className="mt-2">Ứng dụng dùng localStorage của trình duyệt để giữ bản nháp lịch trình và lựa chọn cần thiết cho trải nghiệm. Xóa dữ liệu trình duyệt có thể xóa bản nháp chưa đồng bộ.</p></section>
    </div>
  </main>
}
