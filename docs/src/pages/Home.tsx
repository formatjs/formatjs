import * as React from 'react'
import {Box} from '@mui/material'
import HomeHeader from '../components/home/HomeHeader'
import HeroSection from '../components/home/HeroSection'
import FeaturesSection from '../components/home/FeaturesSection'
import BrowserSection from '../components/home/BrowserSection'
import TrustedBySection from '../components/home/TrustedBySection'
import HomeFooter from '../components/home/HomeFooter'

export default function Home(): React.ReactNode {
  return (
    <Box>
      <HomeHeader />
      <HeroSection />
      <FeaturesSection />
      <BrowserSection />
      <TrustedBySection />
      <HomeFooter />
    </Box>
  )
}
