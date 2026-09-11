import path from 'node:path'
import {serveDirectory, type ServerAdapter} from '@rules-web-e2e/vrt/server'

const start: ServerAdapter = ({root}) =>
  serveDirectory(path.join(root, 'assets'))
export default start
