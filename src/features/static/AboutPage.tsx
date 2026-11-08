import { Helmet } from 'react-helmet-async'
import { brand } from '@/lib/brand'
import { paths } from '@/app/paths'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  return <main className="mx-auto max-w-[720px] px-4 py-12 md:py-16">
    <Helmet><title>Về dự án · {brand.name}</title><meta name="description" content={`Mục tiêu, cách hoạt động và nguồn dữ liệu của ${brand.name}.`} /><meta name="robots" content="index,follow" /><link rel="canonical" href={`${window.location.origin}${paths.about}`} /></Helmet>
    <p className="text-sm font-semibold uppercase tracking-wider text-primary">{brand.name}</p>
    <h1 className="mt-3 font-serif text-4xl">Về dự án</h1>
    <section className="mt-8 space-y-4 leading-7 text-ink-muted">
      <h2 className="font-serif text-2xl text-ink">Mục tiêu</h2>
      <p>{brand.description} Chúng tôi giúp du khách khám phá Huế và sắp xếp các điểm ghé thăm thành hành trình phù hợp.</p>
      <h2 className="pt-4 font-serif text-2xl text-ink">Cách gợi ý hoạt động</h2>
      <p>Hệ thống dựa trên sở thích, thời gian và dữ liệu địa điểm đã được biên tập. Lịch trình có thể được chỉnh sửa trước khi lưu hoặc chia sẻ.</p>
      <h2 className="pt-4 font-serif text-2xl text-ink">Nguồn dữ liệu và ghi công</h2>
      <p>Thông tin địa điểm do dự án biên tập từ các nguồn được phép sử dụng. Ảnh hiển thị ghi công và giấy phép tại địa điểm tương ứng. Bản đồ sử dụng OpenStreetMap và ghi công © OpenStreetMap contributors.</p>
      <h2 className="pt-4 font-serif text-2xl text-ink">Liên hệ</h2>
      <p>{brand.contact ? <a className="text-primary underline" href={brand.contact.href}>{brand.contact.label}</a> : 'Kênh liên hệ chính thức chưa được cấu hình.'}</p>
      <Link className="inline-flex min-h-11 items-center rounded-control bg-primary px-4 font-semibold text-white" to={paths.explore}>Khám phá địa điểm</Link>
    </section>
  </main>
}
