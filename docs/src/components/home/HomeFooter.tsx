import * as React from 'react'
import {Link as WouterLink} from 'wouter'
import {Box, Container, Typography} from '@mui/material'
import Grid from '@mui/material/Grid2'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

export default function HomeFooter(): React.ReactNode {
  return (
    <Box
      sx={{
        bgcolor: 'grey.900',
        color: 'grey.400',
        py: {xs: 4, md: 6},
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{xs: 3, md: 4}}>
          <Grid size={{xs: 12, sm: 6, md: 4}}>
            <Typography variant="h6" gutterBottom sx={{color: 'white'}}>
              Docs
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
              <Typography
                component={WouterLink}
                href="/docs/getting-started/installation"
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {color: 'white', textDecoration: 'underline'},
                }}
              >
                Getting Started
              </Typography>
              <Typography
                component={WouterLink}
                href="/docs/polyfills"
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {color: 'white', textDecoration: 'underline'},
                }}
              >
                Polyfills
              </Typography>
              <Typography
                component={WouterLink}
                href="/docs/react-intl"
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {color: 'white', textDecoration: 'underline'},
                }}
              >
                Libraries
              </Typography>
              <Typography
                component={WouterLink}
                href="/docs/tooling/cli"
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {color: 'white', textDecoration: 'underline'},
                }}
              >
                Tooling
              </Typography>
            </Box>
          </Grid>

          <Grid size={{xs: 12, sm: 6, md: 4}}>
            <Typography variant="h6" gutterBottom sx={{color: 'white'}}>
              Community
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
              <Typography
                component="a"
                href="https://stackoverflow.com/questions/tagged/formatjs"
                target="_blank"
                rel="noopener"
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {color: 'white', textDecoration: 'underline'},
                }}
              >
                Stack Overflow
                <OpenInNewIcon sx={{fontSize: 16}} />
              </Typography>
              <Typography
                component="a"
                href="#"
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {color: 'white', textDecoration: 'underline'},
                }}
              >
                Slack
                <OpenInNewIcon sx={{fontSize: 16}} />
              </Typography>
            </Box>
          </Grid>

          <Grid size={{xs: 12, sm: 12, md: 4}}>
            <Typography variant="h6" gutterBottom sx={{color: 'white'}}>
              Social
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
              <Typography
                component="a"
                href="https://github.com/formatjs/formatjs"
                target="_blank"
                rel="noopener"
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {color: 'white', textDecoration: 'underline'},
                }}
              >
                GitHub
                <OpenInNewIcon sx={{fontSize: 16}} />
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography
          variant="body2"
          align="center"
          sx={{color: 'grey.600', mt: 6}}
        >
          Copyright © {new Date().getFullYear()} FormatJS.
        </Typography>
      </Container>
    </Box>
  )
}
