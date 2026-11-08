
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { brand } from '@/lib/brand'
import { paths } from '@/app/paths'

const highlights = [
  {
    number: '01',
    title: 'Khám phá Huế',
    description:
      'Tìm hiểu các di tích lịch sử, danh lam thắng cảnh, không gian văn hóa và những địa điểm đặc sắc của cố đô.',
  },
  {
    number: '02',
    title: 'Lên kế hoạch dễ dàng',
    description:
      'Sắp xếp các điểm tham quan theo sở thích, quỹ thời gian và nhu cầu để xây dựng hành trình phù hợp.',
  },
  {
    number: '03',
    title: 'Linh hoạt theo hành trình',
    description:
      'Xem lại, điều chỉnh và hoàn thiện lịch trình trước khi lưu hoặc chia sẻ với bạn bè.',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <Helmet>
        <title>Về chúng tôi · {brand.name}</title>
        <meta
          name="description"
          content={`Tìm hiểu về ${brand.name}, nền tảng hỗ trợ khám phá Huế và lên kế hoạch cho những hành trình đáng nhớ tại cố đô.`}
        />
        <meta name="robots" content="index,follow" />
        <link
          rel="canonical"
          href={`${window.location.origin}${paths.about}`}
        />
      </Helmet>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #f5d99a 0, transparent 32%), radial-gradient(circle at 90% 80%, #bda5df 0, transparent 35%)',
          }}
        />

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
              Về dự án
            </p>

            <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl">
              Chạm vào nét đẹp Huế, theo cách của riêng bạn.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
              {brand.description} Chúng tôi mong muốn giúp mỗi chuyến đi
              đến cố đô trở nên dễ lên kế hoạch, thuận tiện khám phá và
              đáng nhớ hơn.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={paths.explore}
                className="inline-flex min-h-12 items-center justify-center rounded-control bg-white px-6 font-semibold text-primary transition hover:bg-white/90"
              >
                Khám phá Huế
              </Link>

              <Link
                to={paths.planNew}
                className="inline-flex min-h-12 items-center justify-center rounded-control border border-white/40 px-6 font-semibold text-white transition hover:bg-white/10"
              >
                Lên lịch trình
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
              <img
                src="/images/dai-noi-hue-hero.jpg"
                alt="Khung cảnh Đại Nội Huế, biểu tượng lịch sử của cố đô"
                className="aspect-[4/3] w-full rounded-2xl object-cover"
                loading="lazy"
              />
            </div>

            <div className="absolute -bottom-5 -left-2 rounded-2xl border border-white/20 bg-white px-5 py-4 shadow-xl sm:-left-5">
              <p className="font-serif text-xl font-semibold text-primary">
                Huế
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Di sản · Văn hóa · Trải nghiệm
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Sứ mệnh của chúng tôi
            </p>

            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              Một hành trình tốt bắt đầu từ một kế hoạch phù hợp.
            </h2>
          </div>

          <div className="space-y-4 text-base leading-8 text-ink-muted">
            <p>
              Huế có sức hấp dẫn riêng từ những công trình kiến trúc cổ,
              dòng sông Hương thơ mộng đến nhịp sống văn hóa và ẩm thực
              đặc trưng. Tuy nhiên, việc lựa chọn điểm đến và sắp xếp
              thời gian đôi khi khiến du khách mất nhiều công sức chuẩn bị.
            </p>

            <p>
              {brand.name} được xây dựng với mong muốn đơn giản hóa quá
              trình đó. Thay vì chỉ tìm kiếm từng địa điểm riêng lẻ, bạn
              có thể chủ động khám phá các lựa chọn và xây dựng lịch trình
              phù hợp với chuyến đi của mình.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Trải nghiệm của bạn
            </p>

            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              Khám phá theo cách bạn muốn
            </h2>

            <p className="mt-4 leading-7 text-ink-muted">
              Những công cụ hỗ trợ bạn chuẩn bị chuyến đi và tận hưởng
              thời gian tại Huế một cách chủ động hơn.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.number}
                className="rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {item.number}
                </span>

                <h3 className="mt-5 font-serif text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-ink-muted">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Data transparency */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Minh bạch thông tin
            </p>

            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              Thông tin rõ ràng, hành trình chủ động
            </h2>

            <p className="mt-5 leading-8 text-ink-muted">
              Chúng tôi hướng đến việc cung cấp thông tin địa điểm được
              biên tập rõ ràng, giúp bạn tham khảo và lựa chọn điểm đến
              trước khi bắt đầu chuyến đi.
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-line p-5">
              <h3 className="font-semibold">Nguồn dữ liệu địa điểm</h3>
              <p className="mt-2 leading-7 text-ink-muted">
                Thông tin địa điểm được dự án tổng hợp và biên tập từ
                các nguồn phù hợp. Bạn nên kiểm tra thông tin thực tế
                trước chuyến đi vì giờ mở cửa, giá vé và dịch vụ có thể
                thay đổi.
              </p>
            </div>

            <div className="rounded-2xl border border-line p-5">
              <h3 className="font-semibold">Bản đồ và ghi công</h3>
              <p className="mt-2 leading-7 text-ink-muted">
                Bản đồ sử dụng OpenStreetMap khi được tích hợp và cần
                hiển thị ghi công © OpenStreetMap contributors theo
                yêu cầu của nguồn dữ liệu.
              </p>
            </div>

            <div className="rounded-2xl border border-line p-5">
              <h3 className="font-semibold">Quyền chủ động của du khách</h3>
              <p className="mt-2 leading-7 text-ink-muted">
                Lịch trình gợi ý chỉ mang tính tham khảo. Bạn có thể
                xem xét và điều chỉnh các điểm ghé thăm theo nhu cầu,
                thời gian và điều kiện thực tế.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-4 pb-16 sm:px-6 md:pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            Bắt đầu chuyến đi
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-semibold text-white sm:text-4xl">
            Huế đang chờ bạn khám phá.
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-white/80">
            Tìm những điểm đến bạn yêu thích và bắt đầu tạo hành trình
            cho chuyến đi tiếp theo.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to={paths.explore}
              className="inline-flex min-h-12 items-center justify-center rounded-control bg-white px-6 font-semibold text-primary transition hover:bg-white/90"
            >
              Xem địa điểm
            </Link>

            <Link
              to={paths.planNew}
              className="inline-flex min-h-12 items-center justify-center rounded-control border border-white/40 px-6 font-semibold text-white transition hover:bg-white/10"
            >
              Tạo lịch trình
            </Link>
          </div>

          {brand.contact && (
            <p className="mt-6 text-sm text-white/75">
              Cần hỗ trợ?{' '}
              <a
                href={brand.contact.href}
                className="font-semibold text-white underline underline-offset-4"
              >
                {brand.contact.label}
              </a>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
