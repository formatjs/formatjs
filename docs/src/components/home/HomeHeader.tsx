import * as React from 'react'
import {Link as WouterLink} from 'wouter'
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import {Menu as MenuIcon, OpenInNew as OpenInNewIcon} from '@mui/icons-material'
import {SearchBar} from '../SearchBar'

const navLinks = [
  {label: 'Docs', href: '/docs/getting-started/installation'},
  {label: 'API References', href: '/docs/react-intl'},
  {label: 'Polyfills', href: '/docs/polyfills'},
  {label: 'Tooling', href: '/docs/tooling/cli'},
]

export default function HomeHeader(): React.ReactNode {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null)

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Box
          component={WouterLink}
          href="/"
          sx={{height: 40, mr: 2, display: 'flex'}}
        >
          <Box
            component="img"
            src="/img/logo-icon.svg"
            alt="FormatJS"
            sx={{height: 40, cursor: 'pointer'}}
          />
        </Box>

        {/* Mobile Menu */}
        <Box sx={{flexGrow: 1, display: {xs: 'flex', md: 'none'}}}>
          <IconButton
            size="large"
            aria-label="navigation menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{
              display: {xs: 'block', md: 'none'},
            }}
          >
            {navLinks.map(link => (
              <MenuItem
                key={link.label}
                component={WouterLink}
                href={link.href}
                onClick={handleCloseNavMenu}
              >
                <Typography>{link.label}</Typography>
              </MenuItem>
            ))}
            <MenuItem
              onClick={() => {
                handleCloseNavMenu()
                window.open('https://github.com/formatjs/formatjs', '_blank')
              }}
            >
              <Typography
                sx={{display: 'flex', alignItems: 'center', gap: 0.5}}
              >
                GitHub
                <OpenInNewIcon sx={{fontSize: 16}} />
              </Typography>
            </MenuItem>
          </Menu>
        </Box>

        {/* Desktop Navigation */}
        <Box
          sx={{
            flexGrow: 1,
            display: {xs: 'none', md: 'flex'},
            gap: 3,
            alignItems: 'center',
          }}
        >
          {navLinks.map(link => (
            <Typography
              key={link.label}
              component={WouterLink}
              href={link.href}
              color="inherit"
              sx={{
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {textDecoration: 'underline'},
              }}
            >
              {link.label}
            </Typography>
          ))}
        </Box>

        {/* Search */}
        <Box sx={{mr: 2, flexGrow: {xs: 1, sm: 0}}}>
          <SearchBar />
        </Box>

        {/* GitHub Link */}
        <Typography
          component="a"
          href="https://github.com/formatjs/formatjs"
          target="_blank"
          color="inherit"
          sx={{
            display: {xs: 'none', md: 'flex'},
            alignItems: 'center',
            gap: 0.5,
            textDecoration: 'none',
          }}
        >
          GitHub
          <OpenInNewIcon sx={{fontSize: 16}} />
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
