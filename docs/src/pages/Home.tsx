import * as React from 'react'
import HomeHeader from '../components/home/HomeHeader'
import HeroSection from '../components/home/HeroSection'
import PluralShowcase from '../components/home/PluralShowcase'
import WorkflowSection from '../components/home/WorkflowSection'
import LibrariesSection from '../components/home/LibrariesSection'
import TrustedBySection from '../components/home/TrustedBySection'
import InstallSection from '../components/home/InstallSection'
import HomeFooter from '../components/home/HomeFooter'
import '../styles/home.css'

/** Adds `is-in` to every `[data-reveal]` element once it scrolls into view. */
function useScrollReveal(root: React.RefObject<HTMLElement | null>): void {
  React.useEffect(() => {
    const targets = Array.from(
      root.current?.querySelectorAll<HTMLElement>('[data-reveal]') ?? []
    )
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-in'))
      return
    }
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            observer.unobserve(entry.target)
          }
        }
      },
      {rootMargin: '0px 0px -10% 0px', threshold: 0.1}
    )
    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [root])
}

export default function Home(): React.ReactNode {
  const root = React.useRef<HTMLDivElement>(null)
  useScrollReveal(root)

  return (
    <div
      ref={root}
      className="home relative bg-home-bg font-display text-lg leading-normal text-home-ink"
    >
      <HomeHeader />
      <main>
        <HeroSection />
        <PluralShowcase />
        <WorkflowSection />
        <LibrariesSection />
        <TrustedBySection />
        <InstallSection />
      </main>
      <HomeFooter />
    </div>
  )
}
