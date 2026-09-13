import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const {registerVersioningStrategy} = require('release-please')
const {
  PrereleaseVersioningStrategy,
} = require('release-please/build/src/versioning-strategies/prerelease')
const {Version} = require('release-please/build/src/version')

class PrereleaseVersioning extends PrereleaseVersioningStrategy {
  bump(version, commits) {
    const next = super.bump(version, commits)
    // release-please 17.6 drops the suffix when a prerelease changes bump level.
    if (this.prerelease && !next.preRelease) {
      return new Version(
        next.major,
        next.minor,
        next.patch,
        this.prereleaseType,
        next.build
      )
    }
    return next
  }
}

export function registerPrereleaseVersioning(): void {
  registerVersioningStrategy(
    'prerelease',
    options => new PrereleaseVersioning(options)
  )
}
