# Changelog

## [2.0.1](https://github.com/formatjs/formatjs/compare/formatjs_temporal_v2.0.0...formatjs_temporal_v2.0.1) (2026-11-23)


### Bug Fixes

* **@formatjs/temporal:** align fold probes and keep spec links inline ([d50198b](https://github.com/formatjs/formatjs/commit/d50198b52a506d527955b8f60dde0f0431217d8b))
* **@formatjs/temporal:** check calendar rounding boundaries after zero time ([d4a30a8](https://github.com/formatjs/formatjs/commit/d4a30a8a7ec02f2f29060753df62a952ee98454e))
* **@formatjs/temporal:** correct borrowed date windows and range equality ([0023097](https://github.com/formatjs/formatjs/commit/0023097ebb6ef33e793ba10a2ac6708cc06b62f9))
* **@formatjs/temporal:** cover footer handoffs and upper day starts ([12051e3](https://github.com/formatjs/formatjs/commit/12051e324918a16c0e754c0b34236fc94248aeb2))
* **@formatjs/temporal:** defer zoned string range checks until after options ([#8077](https://github.com/formatjs/formatjs/issues/8077)) ([4f11936](https://github.com/formatjs/formatjs/commit/4f11936c7ad16bd53b0cc70525bfc367f6d127ad))
* **@formatjs/temporal:** enforce intermediate year-month addition bounds ([#8128](https://github.com/formatjs/formatjs/issues/8128)) ([abbfbc0](https://github.com/formatjs/formatjs/commit/abbfbc0c9cad6ead86669eba55a08611ea903c70))
* **@formatjs/temporal:** find exact day retries and validate host hooks ([b9899ff](https://github.com/formatjs/formatjs/commit/b9899ff86469b01e4bf5c2f52b43a4ac690b475c))
* **@formatjs/temporal:** guard date probes and formatter records ([828dab6](https://github.com/formatjs/formatjs/commit/828dab6a7d6d92261e460816792c0b765daa39a8))
* **@formatjs/temporal:** isolate locale provider and distance operations ([e542907](https://github.com/formatjs/formatjs/commit/e5429077ebe384c7b193741da69a44627833c74a))
* **@formatjs/temporal:** isolate private clock field lists ([#8082](https://github.com/formatjs/formatjs/issues/8082)) ([ee972cb](https://github.com/formatjs/formatjs/commit/ee972cbef290ed34134cc6f2e3b8eb832fe77c1c))
* **@formatjs/temporal:** keep best-fit locale caches and results private ([733a978](https://github.com/formatjs/formatjs/commit/733a97897b9a93a586a9e68cc30673089f890c68))
* **@formatjs/temporal:** keep fractional formatting intrinsic ([#8092](https://github.com/formatjs/formatjs/issues/8092)) ([3161aff](https://github.com/formatjs/formatjs/commit/3161affe85a90ced091f5d0f21630e38efbbfdf5))
* **@formatjs/temporal:** keep native date snapshots private ([f0bcba6](https://github.com/formatjs/formatjs/commit/f0bcba699683f59d010392eb9d6dca54782decef))
* **@formatjs/temporal:** never throw from Temporal.Now.timeZoneId() ([#8050](https://github.com/formatjs/formatjs/issues/8050)) ([d52bef4](https://github.com/formatjs/formatjs/commit/d52bef495ad4d76b722f47b41680e053694f9631))
* **@formatjs/temporal:** parse UTC offsets without mutable hooks ([#8094](https://github.com/formatjs/formatjs/issues/8094)) ([65a04ca](https://github.com/formatjs/formatjs/commit/65a04cad69c7bd7222f2e1f2c909a2e276f920a1))
* **@formatjs/temporal:** preserve calendar slots between package entries ([79ca1e2](https://github.com/formatjs/formatjs/commit/79ca1e202ce0004a624ad6f7369574c4a9037970))
* **@formatjs/temporal:** preserve private locale and interval operations ([63a94b0](https://github.com/formatjs/formatjs/commit/63a94b021ce97afe8b414f7e4301777ff59e9ac5))
* **@formatjs/temporal:** preserve private preparation and validate rounding early ([#8119](https://github.com/formatjs/formatjs/issues/8119)) ([b0b39e0](https://github.com/formatjs/formatjs/commit/b0b39e07731690ab0a60dcbbe2b8e3342816f42d))
* **@formatjs/temporal:** rebase retained day and month rounding bounds ([143298b](https://github.com/formatjs/formatjs/commit/143298b6c24b815fc8f0e72d46da67715b1dfc93))
* **@formatjs/temporal:** rebase retained week rounding bounds ([5654ccf](https://github.com/formatjs/formatjs/commit/5654ccf7888ec902d003d32bf27b9a2d59dba85e))
* **@formatjs/temporal:** resolve clipped gaps and extended footer offsets ([61de01b](https://github.com/formatjs/formatjs/commit/61de01b8de753f803058395f6e78910eb5e8f40a))
* **@formatjs/temporal:** resolve day starts across the maximum Instant ([a07d420](https://github.com/formatjs/formatjs/commit/a07d4200909d3f563429c83ee3165a5dea3cad37))
* **@formatjs/temporal:** resolve day starts across the minimum Instant ([01a22c5](https://github.com/formatjs/formatjs/commit/01a22c56f0946b30b335b2e26a13135edee83885))
* **@formatjs/temporal:** resolve exact week retries and minimum wall gaps ([bc25948](https://github.com/formatjs/formatjs/commit/bc259486c1fc8be7c306b7e6fa77b410723e59ff))
* **@formatjs/temporal:** resolve overlapping timezone boundaries ([2780423](https://github.com/formatjs/formatjs/commit/2780423b2c9bbe296d1ce7c79176eb49a2d6f184))
* **@formatjs/temporal:** resolve wide windows and overlapping gaps ([942556d](https://github.com/formatjs/formatjs/commit/942556df7b5adb2c307a8a8683dc921e4f6d2463))
* **@formatjs/temporal:** retain minimum Rust timezone transitions ([2f38bff](https://github.com/formatjs/formatjs/commit/2f38bff4f720694dcf4751b32feae96938c32828))
* **@formatjs/temporal:** retain numeric intrinsics during arithmetic ([#8074](https://github.com/formatjs/formatjs/issues/8074)) ([0c6c76e](https://github.com/formatjs/formatjs/commit/0c6c76ed6e61150bf9773cdea46cafdb7ce15d62))
* **@formatjs/temporal:** retry rebased rounding across overlapping gaps ([ee00fb2](https://github.com/formatjs/formatjs/commit/ee00fb28c7c66eb74b04dcdfca565d2aeb208bdf))
* **@formatjs/temporal:** round exact clock differences before Number conversion ([#8116](https://github.com/formatjs/formatjs/issues/8116)) ([53aef8d](https://github.com/formatjs/formatjs/commit/53aef8dc2a61eeec65b2927984066f50297af261))
* **@formatjs/temporal:** share validated epochs between package entries ([5746088](https://github.com/formatjs/formatjs/commit/574608815712b3eaa92111506bbe59554b7d992a))
* **@formatjs/temporal:** validate and isolate MonthDay preparation ([07b1faf](https://github.com/formatjs/formatjs/commit/07b1fafbcaf6d41f1494cb5862ac30b9cd7da4de))
* **@formatjs/temporal:** validate bound revocation and isolate best-fit operations ([de7c671](https://github.com/formatjs/formatjs/commit/de7c671b38dc0025264f4f540cf7a8e71caf46b4))
* **@formatjs/temporal:** validate calendar total window bounds ([#8063](https://github.com/formatjs/formatjs/issues/8063)) ([41f5d27](https://github.com/formatjs/formatjs/commit/41f5d278805e59acb56501abfd43065a09408b4d))
* **@formatjs/temporal:** validate duration comparison date prefixes ([83c3713](https://github.com/formatjs/formatjs/commit/83c3713222815f2c27c1ffa2edfe46029ba6780e))
* **@formatjs/temporal:** validate exact week rounding windows ([#8126](https://github.com/formatjs/formatjs/issues/8126)) ([c57685f](https://github.com/formatjs/formatjs/commit/c57685fa55fcca13c272b5839d5b97aa74f93add))
* **@formatjs/temporal:** validate mixed candidates and retained week bounds ([5e7aee5](https://github.com/formatjs/formatjs/commit/5e7aee52f3b73fd02755ac5beb738975b4997dc4))
* **@formatjs/temporal:** validate native zoned rounding candidates ([d5ae1a0](https://github.com/formatjs/formatjs/commit/d5ae1a07c08868c97b4f290a7c1c5c27841075b7))
* **@formatjs/temporal:** validate plain relative destination bounds ([97cf4c2](https://github.com/formatjs/formatjs/commit/97cf4c2f853645aa982f76436576146f5488b113))
* **@formatjs/temporal:** validate zoned rounding windows and fold carry ([#8125](https://github.com/formatjs/formatjs/issues/8125)) ([ac71d40](https://github.com/formatjs/formatjs/commit/ac71d4027ff95f2edb0b4142101695ad77d92135))
* **@formatjs/temporal:** verify fresh duration locale construction ([87d5bc9](https://github.com/formatjs/formatjs/commit/87d5bc9eeffaba96f2c1ef61d8142a3e06df3242))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat_calendars bumped from 1.0.0 to 1.0.1

## [2.0.0](https://github.com/formatjs/formatjs/compare/formatjs_temporal_v1.1.0...formatjs_temporal_v2.0.0) (2026-11-19)


### ⚠ BREAKING CHANGES

* **@formatjs/temporal:** removes @formatjs/temporal/wasm.js, wasm-native.js, temporal-backend.wasm, and Rust's WASM binary module.

### Performance Improvements

* **@formatjs/temporal:** drop WASM and speed up Rust and TS ([1e56b50](https://github.com/formatjs/formatjs/commit/1e56b50d533d08c1c2d6a05e909d4414c2562eaa))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat_calendars bumped from 0.3.0 to 1.0.0

## [1.1.0](https://github.com/formatjs/formatjs/compare/formatjs_temporal_v1.0.0...formatjs_temporal_v1.1.0) (2026-11-17)


### Features

* **@formatjs/temporal:** add Temporal for TypeScript, Rust and Hermes ([#8016](https://github.com/formatjs/formatjs/issues/8016)) ([8d5f2a4](https://github.com/formatjs/formatjs/commit/8d5f2a4064cd0bb6e9310b9d91f4daf4f1399582))
* **@formatjs/temporal:** publish npm and Rust packages ([#8023](https://github.com/formatjs/formatjs/issues/8023)) ([6403c3f](https://github.com/formatjs/formatjs/commit/6403c3fa94a9e2b57272a163534e1fe18af2572e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat_calendars bumped from 0.2.3 to 0.3.0
