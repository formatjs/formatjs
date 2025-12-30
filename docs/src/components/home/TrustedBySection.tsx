import * as React from 'react'
import {Box, Container, Typography} from '@mui/material'

export default function TrustedBySection(): React.ReactNode {
  return (
    <Box
      sx={{
        bgcolor: 'grey.900',
        py: {xs: 4, md: 8},
      }}
    >
      <Container maxWidth="xl">
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 600,
            textAlign: 'center',
            mb: 4,
            fontSize: {xs: '1.25rem', md: '1.5rem'},
          }}
        >
          Trusted by industry leaders.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: {xs: 4, md: 6},
          }}
        >
          <Box
            component="img"
            src="/img/yahoo.svg"
            alt="Yahoo"
            sx={{
              height: {xs: 30, md: 40},
              filter: 'brightness(0.8)',
            }}
          />
          <Box
            component="img"
            src="/img/dropbox.svg"
            alt="Dropbox"
            sx={{
              height: {xs: 30, md: 40},
              filter: 'brightness(0.8)',
            }}
          />
          <Box
            component="img"
            src="/img/tinder.svg"
            alt="Tinder"
            sx={{
              height: {xs: 30, md: 40},
              filter: 'brightness(0.8)',
            }}
          />
          <Box
            component="img"
            src="/img/ethereum.svg"
            alt="Ethereum"
            sx={{
              height: {xs: 30, md: 40},
              filter: 'brightness(0.8)',
            }}
          />
          <Box
            component="img"
            src="/img/mozilla.svg"
            alt="Mozilla"
            sx={{
              height: {xs: 30, md: 40},
              filter: 'brightness(0.8)',
            }}
          />
          <Box
            component="img"
            src="/img/coinbase_white.svg"
            alt="Coinbase"
            sx={{
              height: {xs: 30, md: 40},
            }}
          />
        </Box>
      </Container>
    </Box>
  )
}
