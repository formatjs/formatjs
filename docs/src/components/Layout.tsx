import * as React from 'react'
import {useState} from 'react'
import {Box, Drawer, IconButton, Toolbar} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HomeHeader from './home/HomeHeader'
import Sidebar from './Sidebar'
import Breadcrumbs from './Breadcrumbs'

interface LayoutProps {
  children: React.ReactNode
}

const drawerWidth = 280

export default function Layout({children}: LayoutProps): React.ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <HomeHeader />

      <Box sx={{display: 'flex', flexGrow: 1, overflow: 'hidden'}}>
        {/* Mobile Sidebar Toggle Button */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 60,
            left: 10,
            zIndex: 1200,
            display: {xs: 'flex', md: 'none'},
            bgcolor: 'primary.main',
            '&:hover': {bgcolor: 'primary.dark'},
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Temporary Drawer for Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: {xs: 'block', md: 'none'},
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              top: {xs: 56, sm: 64},
              height: {xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)'},
            },
          }}
        >
          <Sidebar />
        </Drawer>

        {/* Permanent Drawer for Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: {xs: 'none', md: 'block'},
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              top: 64,
              height: 'calc(100% - 64px)',
              borderRight: '1px solid',
              borderColor: 'divider',
              zIndex: 1000,
              overflow: 'auto',
            },
          }}
        >
          <Sidebar />
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: {md: `calc(100% - ${drawerWidth}px)`},
            overflow: 'auto',
          }}
        >
          <Breadcrumbs />
          {children}
        </Box>
      </Box>
    </Box>
  )
}
