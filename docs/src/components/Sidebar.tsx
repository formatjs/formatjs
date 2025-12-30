import * as React from 'react'
import {Link as WouterLink, useLocation} from 'wouter'
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from '@mui/material'
import {getNavigationTree} from '../utils/navigation'

export default function Sidebar(): React.ReactNode {
  const [location] = useLocation()
  const navTree = getNavigationTree()

  return (
    <Box sx={{overflow: 'auto', height: '100%'}}>
      {navTree.map((section, index) => (
        <React.Fragment key={section.title}>
          <List
            dense
            subheader={
              <ListSubheader component="div">{section.title}</ListSubheader>
            }
          >
            {section.items.map(item => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={WouterLink}
                  href={`/docs/${item.path}`}
                  selected={location === `/docs/${item.path}`}
                >
                  <ListItemText primary={item.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {index < navTree.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </Box>
  )
}
