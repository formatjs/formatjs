import * as React from 'react'
import {Box, Container, Typography} from '@mui/material'

export default function BrowserSection(): React.ReactNode {
  return (
    <Container maxWidth="xl" sx={{py: {xs: 4, md: 8}}}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{fontWeight: 600, fontSize: {xs: '1.25rem', md: '1.5rem'}}}
      >
        Runs in the browser and Node.js.
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
        sx={{fontSize: {xs: '0.9rem', md: '1rem'}}}
      >
        FormatJS has been tested in all the major browsers (IE11, Chrome, FF &
        Safari) on both desktop and mobile devices. For many web apps rendering
        happens on the server, so we made sure FormatJS works perfectly in
        Node.js. This allows developers to use FormatJS on both the server and
        client-side of their apps.
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: {xs: 2, md: 4},
          my: 4,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Box
          component="img"
          src="/img/chrome.png"
          alt="Chrome"
          sx={{height: {xs: 40, md: 60}}}
        />
        <Box
          component="img"
          src="/img/firefox.png"
          alt="Firefox"
          sx={{height: {xs: 40, md: 60}}}
        />
        <Box
          component="img"
          src="/img/safari.png"
          alt="Safari"
          sx={{height: {xs: 40, md: 60}}}
        />
        <Box
          component="img"
          src="/img/edge.png"
          alt="Edge"
          sx={{height: {xs: 40, md: 60}}}
        />
        <Box
          component="img"
          src="/img/ie11.png"
          alt="IE11"
          sx={{height: {xs: 40, md: 60}}}
        />
        <Box
          component="img"
          src="/img/node.svg"
          alt="Node.js"
          sx={{height: {xs: 40, md: 60}}}
        />
      </Box>
    </Container>
  )
}
