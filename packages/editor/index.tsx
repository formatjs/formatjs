import React from 'react'
import {
  useMediaQuery,
  createMuiTheme,
  ThemeProvider,
  CssBaseline,
  Grid,
  TextField,
  AppBar,
  Toolbar,
  Box,
  Typography,
  ButtonGroup,
  Button,
  Tabs,
  Tab,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core'
import {Menu, AddAlert, NotificationsOff} from '@material-ui/icons'
import Header from './header'
import {IntlProvider, useIntl} from 'react-intl'
import {TranslatedMessage} from './types'
import Messages from './messages'
const messages: TranslatedMessage[] = [
  {id: '1', defaultMessage: 'test', translatedMessage: 'test2'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {
    id: '2',
    defaultMessage: 'testasd',
    translatedMessage:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus in leo vulputate, mollis felis consectetur, gravida metus. Donec finibus orci a sem mollis ultrices. Maecenas posuere convallis semper. Donec faucibus non eros a tincidunt. Praesent dictum nisi eu nisi elementum, eu varius diam rutrum.',
  },
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
  {id: '2', defaultMessage: 'testasd', translatedMessage: 'test2dfasd'},
]

export function CoreApp() {
  const intl = useIntl()

  return (
    <>
      <CssBaseline />
      <Box height="100vh">
        <AppBar position="static">
          <Toolbar variant="dense">
            <IconButton edge="start" color="inherit" aria-label="menu">
              <Menu />
            </IconButton>
            <Drawer anchor="left">
              <List>
                {['Inbox', 'Starred', 'Send email', 'Drafts'].map(text => (
                  <ListItem button key={text}>
                    <ListItemText primary={text} />
                  </ListItem>
                ))}
              </List>
            </Drawer>
            <Header />
            <AddAlert />
            <NotificationsOff />
          </Toolbar>
        </AppBar>

        <Grid container spacing={0}>
          <Grid xs={3}>
            <form noValidate autoComplete="off">
              <TextField
                type="search"
                fullWidth
                margin="none"
                size="small"
                variant="filled"
                label={intl.formatMessage({
                  id: 'search-bar-label',
                  defaultMessage: 'Search message',
                  description: 'label in search bar',
                })}
              />
            </form>
            <Box borderRight={1} overflow="auto" height="calc(100vh - 108px)">
              <Messages messages={messages} />
            </Box>
          </Grid>
          <Grid xs={6}>
            <Box borderRight={1} overflow="auto" height="calc(100vh - 48px)">
              <Box p={2}>
                <Typography variant="h6" component="h6">
                  English message
                </Typography>
                <Typography variant="body2" component="span">
                  Description{' '}
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    component="span"
                  >
                    This is a description
                  </Typography>
                </Typography>
              </Box>
              <TextField
                multiline
                fullWidth
                margin="dense"
                size="small"
                variant="filled"
                rows={4}
                label={intl.formatMessage({
                  id: 'translated-box-label',
                  defaultMessage: 'Translate',
                  description: 'translated box label',
                })}
              />
              <Box
                px={2}
                py={1}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" component="span">
                  71 / 101
                </Typography>
                <Box>
                  <ButtonGroup
                    variant="text"
                    color="primary"
                    aria-label="text primary button group"
                  >
                    <Button>Copy</Button>
                    <Button>Clear</Button>
                  </ButtonGroup>
                  <Button variant="contained" color="primary">
                    Translate
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid xs={3}>
            <Tabs
              indicatorColor="primary"
              textColor="primary"
              centered
              aria-label="disabled tabs example"
              value={0}
              variant="fullWidth"
            >
              <Tab label="Active" />

              <Tab label="Active" />
            </Tabs>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode]
  )
  return (
    <IntlProvider locale="en" messages={{}}>
      <ThemeProvider theme={theme}>
        <CoreApp />
      </ThemeProvider>
    </IntlProvider>
  )
}
