import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { LEGAL_PAGES } from '../lib/legalContent'

export function LegalScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams<{ slug: string }>()
  const page = slug ? LEGAL_PAGES[slug] : undefined

  // If there's no browser history to go back to (e.g. someone opened the
  // URL directly, which is exactly how Paystack/reviewers will land here),
  // fall back to /welcome instead of navigate(-1) doing nothing.
  const canGoBack = location.key !== 'default'

  if (!page) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center" style={{ background: '#F5F5F7' }}>
        <div className="text-[15px] font-bold text-ink mb-2">Page not found</div>
        <p className="text-[13px] mb-5" style={{ color: '#8A8A8E' }}>That policy doesn't exist.</p>
        <button
          onClick={() => navigate('/welcome')}
          className="sp-press rounded-[14px] px-5 py-2.5 text-[13px] font-bold text-white"
          style={{ background: '#00C6BE' }}
        >
          Go to SplashPass
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      <div className="flex items-center gap-3 bg-white px-4 py-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <button
          onClick={() => (canGoBack ? navigate(-1) : navigate('/welcome'))}
          className="sp-press flex h-9 w-9 items-center justify-center rounded-[11px] text-lg text-ink"
          style={{ background: '#F5F5F7' }}
        >
          ←
        </button>
        <div className="text-[16px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>
          {page.title}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-10">
        <div className="rounded-[18px] bg-white p-5" style={{ border: '1px solid #EBEBED' }}>
          <div className="text-[11px] font-bold uppercase mb-4" style={{ color: '#8A8A8E', letterSpacing: '0.5px' }}>
            Last updated: {page.updated}
          </div>

          <p className="text-[13.5px] leading-relaxed mb-6" style={{ color: '#3A3A3C' }}>
            {page.intro}
          </p>

          {page.sections.map((section) => (
            <div key={section.heading} className="mb-6 last:mb-0">
              <h2 className="text-[14.5px] font-extrabold text-ink mb-2.5" style={{ letterSpacing: '-0.2px' }}>
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-[13.5px] leading-relaxed mb-2.5 last:mb-0 whitespace-pre-line"
                  style={{ color: '#3A3A3C' }}
                >
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4 mb-2 justify-center">
          {Object.entries(LEGAL_PAGES).map(([key, p]) => (
            <button
              key={key}
              onClick={() => navigate(`/legal/${key}`)}
              disabled={key === slug}
              className="sp-press rounded-[12px] px-3.5 py-2 text-[12px] font-bold"
              style={
                key === slug
                  ? { background: '#00C6BE', color: '#fff' }
                  : { background: '#fff', color: '#3A3A3C', border: '1px solid #EBEBED' }
              }
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
