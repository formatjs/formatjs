import * as React from 'react'
import {Link as WouterLink, useLocation} from 'wouter'
import {Breadcrumbs as MuiBreadcrumbs, Link, Typography} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

// Convert kebab-case to Title Case
function toTitleCase(str: string): string {
  return str
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function Breadcrumbs(): React.ReactNode {
  const [location] = useLocation()
  const pathParts = location.split('/').filter(Boolean)

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{mb: 2}}
    >
      <Link component={WouterLink} href="/" color="inherit" underline="hover">
        Home
      </Link>
      {pathParts.map((part, index) => {
        const path = `/${pathParts.slice(0, index + 1).join('/')}`
        const label = toTitleCase(part)
        const isLast = index === pathParts.length - 1

        if (isLast) {
          return (
            <Typography key={path} color="text.primary">
              {label}
            </Typography>
          )
        }

        return (
          <Link
            key={path}
            component={WouterLink}
            href={path}
            color="inherit"
            underline="hover"
          >
            {label}
          </Link>
        )
      })}
    </MuiBreadcrumbs>
  )
}
