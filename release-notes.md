:robot: I have created a release *beep* *boop*
---


<details><summary>formatjs-hermes-intl: 2.0.1</summary>

## [2.0.1](https://github.com/formatjs/formatjs/compare/formatjs-hermes-intl_v2.0.0...formatjs-hermes-intl_v2.0.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** capture private cache operations ([#8107](https://github.com/formatjs/formatjs/issues/8107)) ([0d4ede7](https://github.com/formatjs/formatjs/commit/0d4ede7e982af51cf1875700202b5e7194f64bc9))
* **@formatjs/intl-datetimeformat:** keep timestamp clipping on Numbers ([#8096](https://github.com/formatjs/formatjs/issues/8096)) ([8f68859](https://github.com/formatjs/formatjs/commit/8f688596db2aa01c22c03a0932639a85307f7bf7))
* **@formatjs/intl-durationformat:** keep field conversion primitive ([#8100](https://github.com/formatjs/formatjs/issues/8100)) ([75c9128](https://github.com/formatjs/formatjs/commit/75c9128d18ea6a3f72ac106eaaab3f587345a1da))
* **@formatjs/intl-segmenter:** only suppress sentence breaks after whole-word abbreviations ([#8147](https://github.com/formatjs/formatjs/issues/8147)) ([04977c4](https://github.com/formatjs/formatjs/commit/04977c431cac3d930e095f2f8bf06ceea7df4e06))
* **@formatjs/temporal:** capture floor for date and calendar arithmetic ([#8073](https://github.com/formatjs/formatjs/issues/8073)) ([6c1006e](https://github.com/formatjs/formatjs/commit/6c1006e52b5c234afab6ed1d4e08e537f179044f))
* **@formatjs/temporal:** capture intrinsic object allocation ([#8067](https://github.com/formatjs/formatjs/issues/8067)) ([0c865cc](https://github.com/formatjs/formatjs/commit/0c865cc7c48ff4f2fe707f32b47cbf89f900cc32))
* **@formatjs/temporal:** defer zoned string range checks until after options ([#8077](https://github.com/formatjs/formatjs/issues/8077)) ([4f11936](https://github.com/formatjs/formatjs/commit/4f11936c7ad16bd53b0cc70525bfc367f6d127ad))
* **@formatjs/temporal:** fall back when host clock lookups fail ([a6099a3](https://github.com/formatjs/formatjs/commit/a6099a3f28a8db4008eda56a87ef762e30edd752))
* **@formatjs/temporal:** fix array allocation and value comparison ([#8101](https://github.com/formatjs/formatjs/issues/8101)) ([2dcd6d9](https://github.com/formatjs/formatjs/commit/2dcd6d94993b81e4127d0f9289449fce040e3c03))
* **@formatjs/temporal:** isolate private clock field lists ([#8082](https://github.com/formatjs/formatjs/issues/8082)) ([ee972cb](https://github.com/formatjs/formatjs/commit/ee972cbef290ed34134cc6f2e3b8eb832fe77c1c))
* **@formatjs/temporal:** isolate private defaults from prototypes ([#8080](https://github.com/formatjs/formatjs/issues/8080)) ([0104ced](https://github.com/formatjs/formatjs/commit/0104ced29bff188e5be3b37ef431e6eb0c595390))
* **@formatjs/temporal:** isolate string unit options ([#8087](https://github.com/formatjs/formatjs/issues/8087)) ([9cfca22](https://github.com/formatjs/formatjs/commit/9cfca2258e7e5160831fdd30850a8dc855e6316e))
* **@formatjs/temporal:** keep fractional formatting intrinsic ([#8092](https://github.com/formatjs/formatjs/issues/8092)) ([3161aff](https://github.com/formatjs/formatjs/commit/3161affe85a90ced091f5d0f21630e38efbbfdf5))
* **@formatjs/temporal:** keep parsed fraction padding private ([#8093](https://github.com/formatjs/formatjs/issues/8093)) ([0274332](https://github.com/formatjs/formatjs/commit/02743321b2711923a9cb53dd13b45c1be6c1872a))
* **@formatjs/temporal:** match unit names without string hooks ([#8090](https://github.com/formatjs/formatjs/issues/8090)) ([f07d31a](https://github.com/formatjs/formatjs/commit/f07d31a05be0a344134ec026f80841a32887e94e))
* **@formatjs/temporal:** never throw from Temporal.Now.timeZoneId() ([#8050](https://github.com/formatjs/formatjs/issues/8050)) ([d52bef4](https://github.com/formatjs/formatjs/commit/d52bef495ad4d76b722f47b41680e053694f9631))
* **@formatjs/temporal:** parse calendar strings without date bounds ([#8066](https://github.com/formatjs/formatjs/issues/8066)) ([f6cc871](https://github.com/formatjs/formatjs/commit/f6cc8719f11b9ffcb4062cbe91e94e923937d06e))
* **@formatjs/temporal:** parse UTC offsets without mutable hooks ([#8094](https://github.com/formatjs/formatjs/issues/8094)) ([65a04ca](https://github.com/formatjs/formatjs/commit/65a04cad69c7bd7222f2e1f2c909a2e276f920a1))
* **@formatjs/temporal:** preserve intrinsic primitive coercion ([#8069](https://github.com/formatjs/formatjs/issues/8069)) ([4f43003](https://github.com/formatjs/formatjs/commit/4f43003eff18088d08c6b40143d55ef42dce616b))
* **@formatjs/temporal:** read date string options before range checks ([#8065](https://github.com/formatjs/formatjs/issues/8065)) ([7df2163](https://github.com/formatjs/formatjs/commit/7df21634cf780fa6f7ad712fcf033cd9e3d9a1e0))
* **@formatjs/temporal:** read short-date options before range checks ([#8064](https://github.com/formatjs/formatjs/issues/8064)) ([f1f3f0c](https://github.com/formatjs/formatjs/commit/f1f3f0c835b27750558b84cbcefc1aa9da4c54f8))
* **@formatjs/temporal:** retain intrinsic array predicates ([#8076](https://github.com/formatjs/formatjs/issues/8076)) ([0274516](https://github.com/formatjs/formatjs/commit/02745160c469d642d24600188ca7d1cc8e644157))
* **@formatjs/temporal:** retain numeric intrinsics during arithmetic ([#8074](https://github.com/formatjs/formatjs/issues/8074)) ([0c6c76e](https://github.com/formatjs/formatjs/commit/0c6c76ed6e61150bf9773cdea46cafdb7ce15d62))
* **@formatjs/temporal:** retain private list search intrinsics ([#8083](https://github.com/formatjs/formatjs/issues/8083)) ([8e1640b](https://github.com/formatjs/formatjs/commit/8e1640bff229a5eef33f797c3a4318fb471cddd8))
* **@formatjs/temporal:** use direct internal property reads ([#8068](https://github.com/formatjs/formatjs/issues/8068)) ([5474af0](https://github.com/formatjs/formatjs/commit/5474af056b895d241f3599ee45514766d27cb3b8))
* **@formatjs/temporal:** use internal date-time slots for relativeTo ([#8061](https://github.com/formatjs/formatjs/issues/8061)) ([b6464cc](https://github.com/formatjs/formatjs/commit/b6464cca51869baf272d0133d693d32773e223a4))
* **@formatjs/temporal:** use intrinsic constructor instance checks ([#8098](https://github.com/formatjs/formatjs/issues/8098)) ([f40473d](https://github.com/formatjs/formatjs/commit/f40473d9acb6f83a0ff7996f1bd87eefccb61f48))
* **@formatjs/temporal:** validate calendar total window bounds ([#8063](https://github.com/formatjs/formatjs/issues/8063)) ([41f5d27](https://github.com/formatjs/formatjs/commit/41f5d278805e59acb56501abfd43065a09408b4d))
</details>

<details><summary>formatjs_cli: 1.13.0</summary>

## [1.13.0](https://github.com/formatjs/formatjs/compare/formatjs_cli_v1.12.0...formatjs_cli_v1.13.0) (2026-11-23)


### Features

* **formatjs_cli:** reject unused Android plural quantities ([#8139](https://github.com/formatjs/formatjs/issues/8139)) ([d30bfd2](https://github.com/formatjs/formatjs/commit/d30bfd2b7648ea687fc7e76d8eaad449c9de6f03))


### Bug Fixes

* **deps:** update ruff to v0.17.5 ([#8047](https://github.com/formatjs/formatjs/issues/8047)) ([a02bfab](https://github.com/formatjs/formatjs/commit/a02bfabd7657e54102ea1656620195685c752327))
</details>

<details><summary>formatjs_intl_datetimeformat: 1.1.1</summary>

## [1.1.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v1.1.0...formatjs_intl_datetimeformat_v1.1.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** keep timestamp clipping on Numbers ([#8096](https://github.com/formatjs/formatjs/issues/8096)) ([8f68859](https://github.com/formatjs/formatjs/commit/8f688596db2aa01c22c03a0932639a85307f7bf7))
* **@formatjs/intl-datetimeformat:** normalize nonpositive display years ([#8106](https://github.com/formatjs/formatjs/issues/8106)) ([fe9fe72](https://github.com/formatjs/formatjs/commit/fe9fe722948a67ab1a4e0eecf719efed02c53241))
* **@formatjs/intl-datetimeformat:** preserve date pattern records ([#8104](https://github.com/formatjs/formatjs/issues/8104)) ([b14a361](https://github.com/formatjs/formatjs/commit/b14a3612991269d167984fee01025a4c9780e42a))
* **@formatjs/intl-datetimeformat:** preserve signed local-time years ([#8110](https://github.com/formatjs/formatjs/issues/8110)) ([0030a91](https://github.com/formatjs/formatjs/commit/0030a91feca676990ef7a826dcffd0427493afd1))
</details>

<details><summary>formatjs_intl_datetimeformat_calendars: 1.0.1</summary>

## [1.0.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_calendars_v1.0.0...formatjs_intl_datetimeformat_calendars_v1.0.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** normalize nonpositive display years ([#8106](https://github.com/formatjs/formatjs/issues/8106)) ([fe9fe72](https://github.com/formatjs/formatjs/commit/fe9fe722948a67ab1a4e0eecf719efed02c53241))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat bumped from 1.1.0 to 1.1.1
</details>

<details><summary>formatjs_intl_hermes: 0.4.2</summary>

## [0.4.2](https://github.com/formatjs/formatjs/compare/formatjs_intl_hermes_v0.4.1...formatjs_intl_hermes_v0.4.2) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_segmenter bumped from 1.0.0 to 1.0.1
    * formatjs_intl_datetimeformat bumped from 1.1.0 to 1.1.1
    * formatjs_intl_datetimeformat_calendars bumped from 1.0.0 to 1.0.1
</details>

<details><summary>formatjs_intl_segmenter: 1.0.1</summary>

## [1.0.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_segmenter_v1.0.0...formatjs_intl_segmenter_v1.0.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-segmenter:** only suppress sentence breaks after whole-word abbreviations ([#8147](https://github.com/formatjs/formatjs/issues/8147)) ([04977c4](https://github.com/formatjs/formatjs/commit/04977c431cac3d930e095f2f8bf06ceea7df4e06))
</details>

<details><summary>formatjs_temporal: 2.0.1</summary>

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
</details>

<details><summary>@formatjs/bigdecimal: 0.2.11</summary>

## [0.2.11](https://github.com/formatjs/formatjs/compare/@formatjs/bigdecimal@0.2.10...@formatjs/bigdecimal@0.2.11) (2026-11-23)


### Bug Fixes

* **@formatjs/temporal:** preserve private reader and calendar operations ([24fd91a](https://github.com/formatjs/formatjs/commit/24fd91a558f8e44f8cf1b726c7f4e964cf6a2647))
</details>

<details><summary>@formatjs/cli: 6.21.0</summary>

## [6.21.0](https://github.com/formatjs/formatjs/compare/@formatjs/cli@6.20.0...@formatjs/cli@6.21.0) (2026-11-23)


### Features

* **formatjs_cli:** reject unused Android plural quantities ([#8139](https://github.com/formatjs/formatjs/issues/8139)) ([d30bfd2](https://github.com/formatjs/formatjs/commit/d30bfd2b7648ea687fc7e76d8eaad449c9de6f03))


### Dependencies

* The following workspace dependencies were updated
  * optionalDependencies
    * @formatjs/cli-native-darwin-arm64 bumped to 1.1.38
    * @formatjs/cli-native-darwin-x64 bumped to 1.1.6
    * @formatjs/cli-native-linux-arm64 bumped to 1.2.38
    * @formatjs/cli-native-linux-arm64-musl bumped to 1.0.36
    * @formatjs/cli-native-linux-x64 bumped to 1.1.38
    * @formatjs/cli-native-linux-x64-musl bumped to 1.0.36
    * @formatjs/cli-native-win32-arm64 bumped to 1.1.6
    * @formatjs/cli-native-win32-x64 bumped to 1.1.39
</details>

<details><summary>@formatjs/cli-lib: 10.4.1</summary>

## [10.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/cli-lib@10.4.0...@formatjs/cli-lib@10.4.1) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * optionalDependencies
    * @formatjs/cli-native-darwin-arm64 bumped to 1.1.38
    * @formatjs/cli-native-darwin-x64 bumped to 1.1.6
    * @formatjs/cli-native-linux-arm64 bumped to 1.2.38
    * @formatjs/cli-native-linux-arm64-musl bumped to 1.0.36
    * @formatjs/cli-native-linux-x64 bumped to 1.1.38
    * @formatjs/cli-native-linux-x64-musl bumped to 1.0.36
    * @formatjs/cli-native-win32-arm64 bumped to 1.1.6
    * @formatjs/cli-native-win32-x64 bumped to 1.1.39
</details>

<details><summary>@formatjs/cli-native-darwin-arm64: 1.1.38</summary>

## [1.1.38](https://github.com/formatjs/formatjs/compare/@formatjs/cli-native-darwin-arm64@1.1.37...@formatjs/cli-native-darwin-arm64@1.1.38) (2026-11-23)
</details>

<details><summary>@formatjs/cli-native-darwin-x64: 1.1.6</summary>

## [1.1.6](https://github.com/formatjs/formatjs/compare/@formatjs/cli-native-darwin-x64@1.1.5...@formatjs/cli-native-darwin-x64@1.1.6) (2026-11-23)
</details>

<details><summary>@formatjs/cli-native-linux-arm64: 1.2.38</summary>

## [1.2.38](https://github.com/formatjs/formatjs/compare/@formatjs/cli-native-linux-arm64@1.2.37...@formatjs/cli-native-linux-arm64@1.2.38) (2026-11-23)
</details>

<details><summary>@formatjs/cli-native-linux-arm64-musl: 1.0.36</summary>

## [1.0.36](https://github.com/formatjs/formatjs/compare/@formatjs/cli-native-linux-arm64-musl@1.0.35...@formatjs/cli-native-linux-arm64-musl@1.0.36) (2026-11-23)
</details>

<details><summary>@formatjs/cli-native-linux-x64: 1.1.38</summary>

## [1.1.38](https://github.com/formatjs/formatjs/compare/@formatjs/cli-native-linux-x64@1.1.37...@formatjs/cli-native-linux-x64@1.1.38) (2026-11-23)
</details>

<details><summary>@formatjs/cli-native-linux-x64-musl: 1.0.36</summary>

## [1.0.36](https://github.com/formatjs/formatjs/compare/@formatjs/cli-native-linux-x64-musl@1.0.35...@formatjs/cli-native-linux-x64-musl@1.0.36) (2026-11-23)
</details>

<details><summary>@formatjs/cli-native-win32-arm64: 1.1.6</summary>

## [1.1.6](https://github.com/formatjs/formatjs/compare/@formatjs/cli-native-win32-arm64@1.1.5...@formatjs/cli-native-win32-arm64@1.1.6) (2026-11-23)
</details>

<details><summary>@formatjs/cli-native-win32-x64: 1.1.39</summary>

## [1.1.39](https://github.com/formatjs/formatjs/compare/@formatjs/cli-native-win32-x64@1.1.38...@formatjs/cli-native-win32-x64@1.1.39) (2026-11-23)
</details>

<details><summary>@formatjs/fast-memoize: 3.1.8</summary>

## [3.1.8](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.1.7...@formatjs/fast-memoize@3.1.8) (2026-11-23)


### Bug Fixes

* **@formatjs/fast-memoize:** isolate private serialization wrappers ([b63dde6](https://github.com/formatjs/formatjs/commit/b63dde675ac50dbfa2dc339546550dd52f3aed04))
* **@formatjs/temporal:** verify fresh duration locale construction ([87d5bc9](https://github.com/formatjs/formatjs/commit/87d5bc9eeffaba96f2c1ef61d8142a3e06df3242))
</details>

<details><summary>@formatjs/intl: 6.2.1</summary>

## [6.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@6.2.0...@formatjs/intl@6.2.1) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/fast-memoize bumped to 3.1.8
    * intl-messageformat bumped to 12.2.1
</details>

<details><summary>@formatjs/intl-collator: 0.3.3</summary>

## [0.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-collator@0.3.2...@formatjs/intl-collator@0.3.3) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-datetimeformat: 8.2.1</summary>

## [8.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@8.2.0...@formatjs/intl-datetimeformat@8.2.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** capture private cache operations ([#8107](https://github.com/formatjs/formatjs/issues/8107)) ([0d4ede7](https://github.com/formatjs/formatjs/commit/0d4ede7e982af51cf1875700202b5e7194f64bc9))
* **@formatjs/intl-datetimeformat:** correct Temporal gap bounds and range records ([8c97864](https://github.com/formatjs/formatjs/commit/8c978647f34c270b0f0890f849c94b8705be5e85))
* **@formatjs/intl-datetimeformat:** isolate private Temporal range traversal ([9bff74e](https://github.com/formatjs/formatjs/commit/9bff74e7e3fd1f0219eff6f105c075c6d12ce2e4))
* **@formatjs/intl-datetimeformat:** keep alternate style records private ([ffa4be5](https://github.com/formatjs/formatjs/commit/ffa4be5aeffc482a2739cbc4518f3e2929f3aa89))
* **@formatjs/intl-datetimeformat:** keep combined style construction private ([8a165b4](https://github.com/formatjs/formatjs/commit/8a165b48e296f5a0dc5a2af6525df5dc881567ac))
* **@formatjs/intl-datetimeformat:** keep owned bound formatter state private ([f3daf56](https://github.com/formatjs/formatjs/commit/f3daf56f1030160fd796d1e34e013ef3febc98bd))
* **@formatjs/intl-datetimeformat:** keep range precision lookup private ([d36aef0](https://github.com/formatjs/formatjs/commit/d36aef0519b901d5be6590e5d33ce2fb8399a775))
* **@formatjs/intl-datetimeformat:** keep timestamp clipping on Numbers ([#8096](https://github.com/formatjs/formatjs/issues/8096)) ([8f68859](https://github.com/formatjs/formatjs/commit/8f688596db2aa01c22c03a0932639a85307f7bf7))
* **@formatjs/intl-datetimeformat:** keep timezone lookup private ([cea6701](https://github.com/formatjs/formatjs/commit/cea6701a698f3411f3231c25a573f651a690a77e))
* **@formatjs/intl-datetimeformat:** normalize nonpositive display years ([#8106](https://github.com/formatjs/formatjs/issues/8106)) ([fe9fe72](https://github.com/formatjs/formatjs/commit/fe9fe722948a67ab1a4e0eecf719efed02c53241))
* **@formatjs/intl-datetimeformat:** preserve date pattern records ([#8104](https://github.com/formatjs/formatjs/issues/8104)) ([b14a361](https://github.com/formatjs/formatjs/commit/b14a3612991269d167984fee01025a4c9780e42a))
* **@formatjs/intl-datetimeformat:** preserve signed local-time years ([#8110](https://github.com/formatjs/formatjs/issues/8110)) ([0030a91](https://github.com/formatjs/formatjs/commit/0030a91feca676990ef7a826dcffd0427493afd1))
* **@formatjs/intl-datetimeformat:** protect Temporal local-time conversions ([#8112](https://github.com/formatjs/formatjs/issues/8112)) ([ffdc7b7](https://github.com/formatjs/formatjs/commit/ffdc7b77b009a3ca2a5d715cfcca145fcdebde84))
* **@formatjs/intl-datetimeformat:** share UTC offset scanner with Temporal ([#8111](https://github.com/formatjs/formatjs/issues/8111)) ([0f3ce0a](https://github.com/formatjs/formatjs/commit/0f3ce0a4fb57788223c3e18f8949dff3c1b77c36))
* **@formatjs/intl-datetimeformat:** throw intrinsic errors for missing range endpoints ([c1451d1](https://github.com/formatjs/formatjs/commit/c1451d161abf931e4e4bdc1a7472e94f10301891))
* **@formatjs/intl-datetimeformat:** use canonical rows for Temporal aliases ([fd2887b](https://github.com/formatjs/formatjs/commit/fd2887b1e7b633fdea0495aba561de5572127737))
* **@formatjs/intl-datetimeformat:** use intrinsic receiver errors ([ebc26bb](https://github.com/formatjs/formatjs/commit/ebc26bb4f0db5a0b048f03c56b4232824f383d7b))
* **@formatjs/intl-datetimeformat:** use intrinsics for Temporal formatter setup ([c6144f0](https://github.com/formatjs/formatjs/commit/c6144f0a173fb85648149271d969291417ea0047))
* **@formatjs/temporal:** align fold probes and keep spec links inline ([d50198b](https://github.com/formatjs/formatjs/commit/d50198b52a506d527955b8f60dde0f0431217d8b))
* **@formatjs/temporal:** correct borrowed date windows and range equality ([0023097](https://github.com/formatjs/formatjs/commit/0023097ebb6ef33e793ba10a2ac6708cc06b62f9))
* **@formatjs/temporal:** enumerate exact owned Intl timezone candidates ([65e1aea](https://github.com/formatjs/formatjs/commit/65e1aea0642133fceb195259c0152ee940214da8))
* **@formatjs/temporal:** fix array allocation and value comparison ([#8101](https://github.com/formatjs/formatjs/issues/8101)) ([2dcd6d9](https://github.com/formatjs/formatjs/commit/2dcd6d94993b81e4127d0f9289449fce040e3c03))
* **@formatjs/temporal:** guard date probes and formatter records ([828dab6](https://github.com/formatjs/formatjs/commit/828dab6a7d6d92261e460816792c0b765daa39a8))
* **@formatjs/temporal:** isolate private defaults from prototypes ([#8080](https://github.com/formatjs/formatjs/issues/8080)) ([0104ced](https://github.com/formatjs/formatjs/commit/0104ced29bff188e5be3b37ef431e6eb0c595390))
* **@formatjs/temporal:** isolate timezone and Intl internal operations ([43f4e2c](https://github.com/formatjs/formatjs/commit/43f4e2c08d5cbd10e9d38410b98ebb332ab7e4d6))
* **@formatjs/temporal:** preserve private locale and interval operations ([63a94b0](https://github.com/formatjs/formatjs/commit/63a94b021ce97afe8b414f7e4301777ff59e9ac5))
* **@formatjs/temporal:** preserve private reader and calendar operations ([24fd91a](https://github.com/formatjs/formatjs/commit/24fd91a558f8e44f8cf1b726c7f4e964cf6a2647))
* **@formatjs/temporal:** protect private formatter record copies ([#8088](https://github.com/formatjs/formatjs/issues/8088)) ([e889cf1](https://github.com/formatjs/formatjs/commit/e889cf185143814df2fdcce8c6a68ecfc34cf204))
* **@formatjs/temporal:** read exact owned timezone transitions ([f8ac7b5](https://github.com/formatjs/formatjs/commit/f8ac7b5f7d3eb14dca8dd3c6a90c6ce647f2792f))
* **@formatjs/temporal:** refresh host caches after timezone reload ([756082c](https://github.com/formatjs/formatjs/commit/756082c302fa74cd50e5fa93cdc23add40d95168))
* **@formatjs/temporal:** resolve clipped gaps and extended footer offsets ([61de01b](https://github.com/formatjs/formatjs/commit/61de01b8de753f803058395f6e78910eb5e8f40a))
* **@formatjs/temporal:** resolve day starts across the minimum Instant ([01a22c5](https://github.com/formatjs/formatjs/commit/01a22c56f0946b30b335b2e26a13135edee83885))
* **@formatjs/temporal:** resolve overlapping timezone boundaries ([2780423](https://github.com/formatjs/formatjs/commit/2780423b2c9bbe296d1ce7c79176eb49a2d6f184))
* **@formatjs/temporal:** resolve owned Intl gaps from exact boundaries ([07ae87c](https://github.com/formatjs/formatjs/commit/07ae87c16ec39cc1af21cecd26f203b381891e93))
* **@formatjs/temporal:** retain finite future timezone transitions ([0469dcc](https://github.com/formatjs/formatjs/commit/0469dcc1cb32350ba8dadf5ea297b3a40aa0c43f))
* **@formatjs/temporal:** retain intrinsic array predicates ([#8076](https://github.com/formatjs/formatjs/issues/8076)) ([0274516](https://github.com/formatjs/formatjs/commit/02745160c469d642d24600188ca7d1cc8e644157))
* **@formatjs/temporal:** retain private Intl invocation operations ([b8c46f7](https://github.com/formatjs/formatjs/commit/b8c46f7054bb7278b4db67404177ba5c9006f7cf))
* **@formatjs/temporal:** retain private list search intrinsics ([#8083](https://github.com/formatjs/formatjs/issues/8083)) ([8e1640b](https://github.com/formatjs/formatjs/commit/8e1640bff229a5eef33f797c3a4318fb471cddd8))
* **@formatjs/temporal:** use intrinsic constructor instance checks ([#8098](https://github.com/formatjs/formatjs/issues/8098)) ([f40473d](https://github.com/formatjs/formatjs/commit/f40473d9acb6f83a0ff7996f1bd87eefccb61f48))
* **@formatjs/temporal:** validate owned Intl candidates at Instant limits ([555ea7b](https://github.com/formatjs/formatjs/commit/555ea7b26cca0633d8c1c3633ed1766ea462b224))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-buddhist: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-buddhist@1.1.8...@formatjs/intl-datetimeformat-calendar-buddhist@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-chinese: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-chinese@1.1.8...@formatjs/intl-datetimeformat-calendar-chinese@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-coptic: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-coptic@1.1.8...@formatjs/intl-datetimeformat-calendar-coptic@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-dangi: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-dangi@1.1.8...@formatjs/intl-datetimeformat-calendar-dangi@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-ethioaa: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-ethioaa@1.1.8...@formatjs/intl-datetimeformat-calendar-ethioaa@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-ethiopic: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-ethiopic@1.1.8...@formatjs/intl-datetimeformat-calendar-ethiopic@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-hebrew: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-hebrew@1.1.8...@formatjs/intl-datetimeformat-calendar-hebrew@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-indian: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-indian@1.1.8...@formatjs/intl-datetimeformat-calendar-indian@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-islamic-civil: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-islamic-civil@1.1.8...@formatjs/intl-datetimeformat-calendar-islamic-civil@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-islamic-tbla: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-islamic-tbla@1.1.8...@formatjs/intl-datetimeformat-calendar-islamic-tbla@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-islamic-umalqura: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-islamic-umalqura@1.1.8...@formatjs/intl-datetimeformat-calendar-islamic-umalqura@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-japanese: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-japanese@1.1.8...@formatjs/intl-datetimeformat-calendar-japanese@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-persian: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-persian@1.1.8...@formatjs/intl-datetimeformat-calendar-persian@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-datetimeformat-calendar-roc: 1.1.9</summary>

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat-calendar-roc@1.1.8...@formatjs/intl-datetimeformat-calendar-roc@1.1.9) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @formatjs/intl-datetimeformat bumped to 8.2.1
</details>

<details><summary>@formatjs/intl-displaynames: 8.0.4</summary>

## [8.0.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-displaynames@8.0.3...@formatjs/intl-displaynames@8.0.4) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-durationformat: 0.13.1</summary>

## [0.13.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-durationformat@0.13.0...@formatjs/intl-durationformat@0.13.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-durationformat:** keep field conversion primitive ([#8100](https://github.com/formatjs/formatjs/issues/8100)) ([75c9128](https://github.com/formatjs/formatjs/commit/75c9128d18ea6a3f72ac106eaaab3f587345a1da))
* **@formatjs/temporal:** isolate timezone and Intl internal operations ([43f4e2c](https://github.com/formatjs/formatjs/commit/43f4e2c08d5cbd10e9d38410b98ebb332ab7e4d6))
* **@formatjs/temporal:** preserve private reader and calendar operations ([24fd91a](https://github.com/formatjs/formatjs/commit/24fd91a558f8e44f8cf1b726c7f4e964cf6a2647))
* **@formatjs/temporal:** retain formatter providers and private field entries ([91b5d75](https://github.com/formatjs/formatjs/commit/91b5d75d7539995a2fd7f652bbf6c9fc77b3e3b1))
* **@formatjs/temporal:** retain intrinsic array predicates ([#8076](https://github.com/formatjs/formatjs/issues/8076)) ([0274516](https://github.com/formatjs/formatjs/commit/02745160c469d642d24600188ca7d1cc8e644157))
* **@formatjs/temporal:** retain private Intl invocation operations ([b8c46f7](https://github.com/formatjs/formatjs/commit/b8c46f7054bb7278b4db67404177ba5c9006f7cf))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/bigdecimal bumped to 0.2.11
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-getcanonicallocales: 3.4.1</summary>

## [3.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.4.0...@formatjs/intl-getcanonicallocales@3.4.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** preserve locale-list input coercion ([#8084](https://github.com/formatjs/formatjs/issues/8084)) ([4ca8116](https://github.com/formatjs/formatjs/commit/4ca811641f2d85a53ef9bea8c6165d56e7f6df49))
* **@formatjs/intl-getcanonicallocales:** preserve private Locale brands ([#8085](https://github.com/formatjs/formatjs/issues/8085)) ([2104d63](https://github.com/formatjs/formatjs/commit/2104d63f22ab43d4a64b7a8eabb52056f243078d))
* **@formatjs/temporal:** retain intrinsic array predicates ([#8076](https://github.com/formatjs/formatjs/issues/8076)) ([0274516](https://github.com/formatjs/formatjs/commit/02745160c469d642d24600188ca7d1cc8e644157))
* **@formatjs/temporal:** retain private list search intrinsics ([#8083](https://github.com/formatjs/formatjs/issues/8083)) ([8e1640b](https://github.com/formatjs/formatjs/commit/8e1640bff229a5eef33f797c3a4318fb471cddd8))
</details>

<details><summary>@formatjs/intl-listformat: 9.1.1</summary>

## [9.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-listformat@9.1.0...@formatjs/intl-listformat@9.1.1) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-locale: 5.5.1</summary>

## [5.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-locale@5.5.0...@formatjs/intl-locale@5.5.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** preserve private Locale brands ([#8085](https://github.com/formatjs/formatjs/issues/8085)) ([2104d63](https://github.com/formatjs/formatjs/commit/2104d63f22ab43d4a64b7a8eabb52056f243078d))
* **@formatjs/temporal:** fix array allocation and value comparison ([#8101](https://github.com/formatjs/formatjs/issues/8101)) ([2dcd6d9](https://github.com/formatjs/formatjs/commit/2dcd6d94993b81e4127d0f9289449fce040e3c03))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl-getcanonicallocales bumped to 3.4.1
    * @formatjs/intl-supportedvaluesof bumped to 3.1.1
</details>

<details><summary>@formatjs/intl-localematcher: 0.10.2</summary>

## [0.10.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.10.1...@formatjs/intl-localematcher@0.10.2) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** capture private cache operations ([#8107](https://github.com/formatjs/formatjs/issues/8107)) ([0d4ede7](https://github.com/formatjs/formatjs/commit/0d4ede7e982af51cf1875700202b5e7194f64bc9))
* **@formatjs/temporal:** align fold probes and keep spec links inline ([d50198b](https://github.com/formatjs/formatjs/commit/d50198b52a506d527955b8f60dde0f0431217d8b))
* **@formatjs/temporal:** isolate fresh locale lists and extension records ([247d1a5](https://github.com/formatjs/formatjs/commit/247d1a5999af51d6012b9e0210ee38cbf0502a26))
* **@formatjs/temporal:** isolate locale provider and distance operations ([e542907](https://github.com/formatjs/formatjs/commit/e5429077ebe384c7b193741da69a44627833c74a))
* **@formatjs/temporal:** isolate private defaults from prototypes ([#8080](https://github.com/formatjs/formatjs/issues/8080)) ([0104ced](https://github.com/formatjs/formatjs/commit/0104ced29bff188e5be3b37ef431e6eb0c595390))
* **@formatjs/temporal:** keep best-fit locale caches and results private ([733a978](https://github.com/formatjs/formatjs/commit/733a97897b9a93a586a9e68cc30673089f890c68))
* **@formatjs/temporal:** preserve private locale and interval operations ([63a94b0](https://github.com/formatjs/formatjs/commit/63a94b021ce97afe8b414f7e4301777ff59e9ac5))
* **@formatjs/temporal:** reject revoked newTarget proxies and preserve locale lookup ([ea5c4cb](https://github.com/formatjs/formatjs/commit/ea5c4cbe0d8546a5e443b18fadbaadb7cc2a98f0))
* **@formatjs/temporal:** retain intrinsic array predicates ([#8076](https://github.com/formatjs/formatjs/issues/8076)) ([0274516](https://github.com/formatjs/formatjs/commit/02745160c469d642d24600188ca7d1cc8e644157))
* **@formatjs/temporal:** retain private Intl invocation operations ([b8c46f7](https://github.com/formatjs/formatjs/commit/b8c46f7054bb7278b4db67404177ba5c9006f7cf))
* **@formatjs/temporal:** retain private list search intrinsics ([#8083](https://github.com/formatjs/formatjs/issues/8083)) ([8e1640b](https://github.com/formatjs/formatjs/commit/8e1640bff229a5eef33f797c3a4318fb471cddd8))
* **@formatjs/temporal:** validate bound revocation and isolate best-fit operations ([de7c671](https://github.com/formatjs/formatjs/commit/de7c671b38dc0025264f4f540cf7a8e71caf46b4))
* **@formatjs/temporal:** verify fresh duration locale construction ([87d5bc9](https://github.com/formatjs/formatjs/commit/87d5bc9eeffaba96f2c1ef61d8142a3e06df3242))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/fast-memoize bumped to 3.1.8
</details>

<details><summary>@formatjs/intl-numberformat: 10.1.1</summary>

## [10.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-numberformat@10.1.0...@formatjs/intl-numberformat@10.1.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** capture private cache operations ([#8107](https://github.com/formatjs/formatjs/issues/8107)) ([0d4ede7](https://github.com/formatjs/formatjs/commit/0d4ede7e982af51cf1875700202b5e7194f64bc9))
* **@formatjs/temporal:** align fold probes and keep spec links inline ([d50198b](https://github.com/formatjs/formatjs/commit/d50198b52a506d527955b8f60dde0f0431217d8b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/bigdecimal bumped to 0.2.11
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-pluralrules: 7.1.1</summary>

## [7.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@7.1.0...@formatjs/intl-pluralrules@7.1.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** capture private cache operations ([#8107](https://github.com/formatjs/formatjs/issues/8107)) ([0d4ede7](https://github.com/formatjs/formatjs/commit/0d4ede7e982af51cf1875700202b5e7194f64bc9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/bigdecimal bumped to 0.2.11
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-relativetimeformat: 13.0.4</summary>

## [13.0.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-relativetimeformat@13.0.3...@formatjs/intl-relativetimeformat@13.0.4) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-segmenter: 12.3.3</summary>

## [12.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-segmenter@12.3.2...@formatjs/intl-segmenter@12.3.3) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-segmenter:** only suppress sentence breaks after whole-word abbreviations ([#8147](https://github.com/formatjs/formatjs/issues/8147)) ([04977c4](https://github.com/formatjs/formatjs/commit/04977c431cac3d930e095f2f8bf06ceea7df4e06))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl-localematcher bumped to 0.10.2
</details>

<details><summary>@formatjs/intl-supportedvaluesof: 3.1.1</summary>

## [3.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@3.1.0...@formatjs/intl-supportedvaluesof@3.1.1) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/fast-memoize bumped to 3.1.8
</details>

<details><summary>@formatjs/svelte-intl: 2.1.8</summary>

## [2.1.8](https://github.com/formatjs/formatjs/compare/@formatjs/svelte-intl@2.1.7...@formatjs/svelte-intl@2.1.8) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl bumped to 6.2.1
</details>

<details><summary>@formatjs/temporal: 2.0.1</summary>

## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/temporal@2.0.0...@formatjs/temporal@2.0.1) (2026-11-23)


### Bug Fixes

* **@formatjs/fast-memoize:** isolate private serialization wrappers ([b63dde6](https://github.com/formatjs/formatjs/commit/b63dde675ac50dbfa2dc339546550dd52f3aed04))
* **@formatjs/intl-datetimeformat:** correct Temporal gap bounds and range records ([8c97864](https://github.com/formatjs/formatjs/commit/8c978647f34c270b0f0890f849c94b8705be5e85))
* **@formatjs/intl-datetimeformat:** keep timestamp clipping on Numbers ([#8096](https://github.com/formatjs/formatjs/issues/8096)) ([8f68859](https://github.com/formatjs/formatjs/commit/8f688596db2aa01c22c03a0932639a85307f7bf7))
* **@formatjs/intl-datetimeformat:** share UTC offset scanner with Temporal ([#8111](https://github.com/formatjs/formatjs/issues/8111)) ([0f3ce0a](https://github.com/formatjs/formatjs/commit/0f3ce0a4fb57788223c3e18f8949dff3c1b77c36))
* **@formatjs/intl-datetimeformat:** use canonical rows for Temporal aliases ([fd2887b](https://github.com/formatjs/formatjs/commit/fd2887b1e7b633fdea0495aba561de5572127737))
* **@formatjs/intl-durationformat:** preserve host-exotic objects ([#8071](https://github.com/formatjs/formatjs/issues/8071)) ([710af14](https://github.com/formatjs/formatjs/commit/710af14a7393107436c4463d979a956772369f76))
* **@formatjs/intl-getcanonicallocales:** preserve locale-list input coercion ([#8084](https://github.com/formatjs/formatjs/issues/8084)) ([4ca8116](https://github.com/formatjs/formatjs/commit/4ca811641f2d85a53ef9bea8c6165d56e7f6df49))
* **@formatjs/temporal:** align fold probes and keep spec links inline ([d50198b](https://github.com/formatjs/formatjs/commit/d50198b52a506d527955b8f60dde0f0431217d8b))
* **@formatjs/temporal:** avoid observable field enumeration in since ([#8127](https://github.com/formatjs/formatjs/issues/8127)) ([a971ad9](https://github.com/formatjs/formatjs/commit/a971ad901556f09ea45799fdd76c7ca34ee7589f))
* **@formatjs/temporal:** borrow clocks in totals and recheck shifted gaps ([d7b74fd](https://github.com/formatjs/formatjs/commit/d7b74fdc8b2b4464531b9bf9b5da1c7bb18452d9))
* **@formatjs/temporal:** call no-Intl formatters directly ([095b3f0](https://github.com/formatjs/formatjs/commit/095b3f0fcc534d448ab2cbf46129788a4e89d2df))
* **@formatjs/temporal:** capture floor for date and calendar arithmetic ([#8073](https://github.com/formatjs/formatjs/issues/8073)) ([6c1006e](https://github.com/formatjs/formatjs/commit/6c1006e52b5c234afab6ed1d4e08e537f179044f))
* **@formatjs/temporal:** capture intrinsic object allocation ([#8067](https://github.com/formatjs/formatjs/issues/8067)) ([0c865cc](https://github.com/formatjs/formatjs/commit/0c865cc7c48ff4f2fe707f32b47cbf89f900cc32))
* **@formatjs/temporal:** capture native Intl bridge state operations ([#8108](https://github.com/formatjs/formatjs/issues/8108)) ([4697bf2](https://github.com/formatjs/formatjs/commit/4697bf26c0ecd627dc3f7c62558dfdaafc082c0b))
* **@formatjs/temporal:** check calendar rounding boundaries after zero time ([d4a30a8](https://github.com/formatjs/formatjs/commit/d4a30a8a7ec02f2f29060753df62a952ee98454e))
* **@formatjs/temporal:** coerce legacy Intl options through intrinsic ([e153039](https://github.com/formatjs/formatjs/commit/e153039bfa2308702522eba79d56bdf61793cea5))
* **@formatjs/temporal:** compare narrow month range identities ([08c4934](https://github.com/formatjs/formatjs/commit/08c49344acc5c52601e451a28e03818f51941372))
* **@formatjs/temporal:** compare relative rounding modes without String hooks ([#8118](https://github.com/formatjs/formatjs/issues/8118)) ([ffd1578](https://github.com/formatjs/formatjs/commit/ffd15781ac0d83cc055f9f91b43a6dce79a0acbe))
* **@formatjs/temporal:** correct borrowed date windows and range equality ([0023097](https://github.com/formatjs/formatjs/commit/0023097ebb6ef33e793ba10a2ac6708cc06b62f9))
* **@formatjs/temporal:** cover footer handoffs and upper day starts ([12051e3](https://github.com/formatjs/formatjs/commit/12051e324918a16c0e754c0b34236fc94248aeb2))
* **@formatjs/temporal:** defer zoned string range checks until after options ([#8077](https://github.com/formatjs/formatjs/issues/8077)) ([4f11936](https://github.com/formatjs/formatjs/commit/4f11936c7ad16bd53b0cc70525bfc367f6d127ad))
* **@formatjs/temporal:** enforce intermediate year-month addition bounds ([#8128](https://github.com/formatjs/formatjs/issues/8128)) ([abbfbc0](https://github.com/formatjs/formatjs/commit/abbfbc0c9cad6ead86669eba55a08611ea903c70))
* **@formatjs/temporal:** enumerate exact owned Intl timezone candidates ([65e1aea](https://github.com/formatjs/formatjs/commit/65e1aea0642133fceb195259c0152ee940214da8))
* **@formatjs/temporal:** fall back when host clock lookups fail ([a6099a3](https://github.com/formatjs/formatjs/commit/a6099a3f28a8db4008eda56a87ef762e30edd752))
* **@formatjs/temporal:** find exact day retries and validate host hooks ([b9899ff](https://github.com/formatjs/formatjs/commit/b9899ff86469b01e4bf5c2f52b43a4ac690b475c))
* **@formatjs/temporal:** include minimum transition in compact gap lookup ([2d71dc6](https://github.com/formatjs/formatjs/commit/2d71dc6b4cd1478414a10f61e80738edcad9a9bc))
* **@formatjs/temporal:** invoke captured host offset formatter ([e870294](https://github.com/formatjs/formatjs/commit/e87029481f0f80edf5a8b9a674f8405416691f5a))
* **@formatjs/temporal:** invoke legacy Intl methods directly ([df2f641](https://github.com/formatjs/formatjs/commit/df2f64183e72f25e1227a10a8e23587a86ff88b6))
* **@formatjs/temporal:** isolate calendar and zoned string preparation ([#8124](https://github.com/formatjs/formatjs/issues/8124)) ([d5d85a7](https://github.com/formatjs/formatjs/commit/d5d85a7cc81bbeb80a287b4ad50939337cab359f))
* **@formatjs/temporal:** isolate duration private operations ([#8115](https://github.com/formatjs/formatjs/issues/8115)) ([60bc792](https://github.com/formatjs/formatjs/commit/60bc792d91b14976f6d31b153dbae620269da9a5))
* **@formatjs/temporal:** isolate duration string parsing ([#8113](https://github.com/formatjs/formatjs/issues/8113)) ([0ffdf2c](https://github.com/formatjs/formatjs/commit/0ffdf2c106cef618585baf4db9f65dde35437d07))
* **@formatjs/temporal:** isolate fresh locale lists and extension records ([247d1a5](https://github.com/formatjs/formatjs/commit/247d1a5999af51d6012b9e0210ee38cbf0502a26))
* **@formatjs/temporal:** isolate host calendar operations ([#8130](https://github.com/formatjs/formatjs/issues/8130)) ([6782683](https://github.com/formatjs/formatjs/commit/6782683b81ce9d09c31e04e6669f77c9752bcc65))
* **@formatjs/temporal:** isolate ISO string parsing from mutable methods ([#8123](https://github.com/formatjs/formatjs/issues/8123)) ([d46f8f5](https://github.com/formatjs/formatjs/commit/d46f8f54dfaa4e48f46457200012ea02d99915e9))
* **@formatjs/temporal:** isolate locale provider and distance operations ([e542907](https://github.com/formatjs/formatjs/commit/e5429077ebe384c7b193741da69a44627833c74a))
* **@formatjs/temporal:** isolate primary zone and candidate lookups ([d36460d](https://github.com/formatjs/formatjs/commit/d36460d0859c4ed8ff7fa4935def1e36f19a63bf))
* **@formatjs/temporal:** isolate private calendar addition ([#8129](https://github.com/formatjs/formatjs/issues/8129)) ([62564d3](https://github.com/formatjs/formatjs/commit/62564d3e0c42d29a8e123ab86e83589d8bef77b8))
* **@formatjs/temporal:** isolate private clock field lists ([#8082](https://github.com/formatjs/formatjs/issues/8082)) ([ee972cb](https://github.com/formatjs/formatjs/commit/ee972cbef290ed34134cc6f2e3b8eb832fe77c1c))
* **@formatjs/temporal:** isolate private defaults from prototypes ([#8080](https://github.com/formatjs/formatjs/issues/8080)) ([0104ced](https://github.com/formatjs/formatjs/commit/0104ced29bff188e5be3b37ef431e6eb0c595390))
* **@formatjs/temporal:** isolate private difference preparation ([#8137](https://github.com/formatjs/formatjs/issues/8137)) ([8d9b837](https://github.com/formatjs/formatjs/commit/8d9b837333dbba36a8918e274d9658a452d4a78b))
* **@formatjs/temporal:** isolate string unit options ([#8087](https://github.com/formatjs/formatjs/issues/8087)) ([9cfca22](https://github.com/formatjs/formatjs/commit/9cfca2258e7e5160831fdd30850a8dc855e6316e))
* **@formatjs/temporal:** isolate timezone and Intl internal operations ([43f4e2c](https://github.com/formatjs/formatjs/commit/43f4e2c08d5cbd10e9d38410b98ebb332ab7e4d6))
* **@formatjs/temporal:** isolate timezone caches and relative string routing ([#8120](https://github.com/formatjs/formatjs/issues/8120)) ([5edd316](https://github.com/formatjs/formatjs/commit/5edd3161747ca5ff2f4e22eab583f58014b359ee))
* **@formatjs/temporal:** isolate timezone name and transition preparation ([#8121](https://github.com/formatjs/formatjs/issues/8121)) ([79b7cb2](https://github.com/formatjs/formatjs/commit/79b7cb2c9bfac93e8143e2ee6becc75c53083ba5))
* **@formatjs/temporal:** keep best-fit locale caches and results private ([733a978](https://github.com/formatjs/formatjs/commit/733a97897b9a93a586a9e68cc30673089f890c68))
* **@formatjs/temporal:** keep corrected lunar range parts private ([fe261e1](https://github.com/formatjs/formatjs/commit/fe261e13b775a5928ce05aba393cde1a944c6508))
* **@formatjs/temporal:** keep extended calendar label restoration private ([a3a29c4](https://github.com/formatjs/formatjs/commit/a3a29c49f6ebf66f9fe71d0852fe86e8a85ad649))
* **@formatjs/temporal:** keep extended Intl part lists private ([849f13d](https://github.com/formatjs/formatjs/commit/849f13dc74801039d8ede7cda2d005030ed9d239))
* **@formatjs/temporal:** keep fallback offset labels private ([874315e](https://github.com/formatjs/formatjs/commit/874315e6ab21743b19445661da1c86ce9d758156))
* **@formatjs/temporal:** keep fractional formatting intrinsic ([#8092](https://github.com/formatjs/formatjs/issues/8092)) ([3161aff](https://github.com/formatjs/formatjs/commit/3161affe85a90ced091f5d0f21630e38efbbfdf5))
* **@formatjs/temporal:** keep host offsets coherent across reloads ([8f72c6d](https://github.com/formatjs/formatjs/commit/8f72c6dbd3c8aebdaf637a7cd71dbc2ca2e253e0))
* **@formatjs/temporal:** keep host transition cache writes private ([dea264a](https://github.com/formatjs/formatjs/commit/dea264a39f3c5c98d4f8779d750fb12f29d2a8e2))
* **@formatjs/temporal:** keep legacy bound formatter state private ([26de6e9](https://github.com/formatjs/formatjs/commit/26de6e9decc1983c26eea5d51103fdde6a03b1df))
* **@formatjs/temporal:** keep legacy calendar field extraction private ([8dd2955](https://github.com/formatjs/formatjs/commit/8dd2955d32ea66788beb3e29b4348bd515b15878))
* **@formatjs/temporal:** keep legacy formatter field lists private ([dfe5d85](https://github.com/formatjs/formatjs/commit/dfe5d85cf0333e128bf8a4903b403ed426817d07))
* **@formatjs/temporal:** keep native date snapshots private ([f0bcba6](https://github.com/formatjs/formatjs/commit/f0bcba699683f59d010392eb9d6dca54782decef))
* **@formatjs/temporal:** keep parsed fraction padding private ([#8093](https://github.com/formatjs/formatjs/issues/8093)) ([0274332](https://github.com/formatjs/formatjs/commit/02743321b2711923a9cb53dd13b45c1be6c1872a))
* **@formatjs/temporal:** keep PlainDate conversion steps private ([58d0a67](https://github.com/formatjs/formatjs/commit/58d0a67107284cbca0d4a5783983d54a10c1a23a))
* **@formatjs/temporal:** keep PlainDateTime date slot cache private ([fa5affa](https://github.com/formatjs/formatjs/commit/fa5affad24401e59baaab7efd4a01c8b3fa9640b))
* **@formatjs/temporal:** keep sampled timezone candidates private ([3f07c2b](https://github.com/formatjs/formatjs/commit/3f07c2be456f1218b9a5952628b115042905cd4b))
* **@formatjs/temporal:** match unit names without string hooks ([#8090](https://github.com/formatjs/formatjs/issues/8090)) ([f07d31a](https://github.com/formatjs/formatjs/commit/f07d31a05be0a344134ec026f80841a32887e94e))
* **@formatjs/temporal:** never throw from Temporal.Now.timeZoneId() ([#8050](https://github.com/formatjs/formatjs/issues/8050)) ([d52bef4](https://github.com/formatjs/formatjs/commit/d52bef495ad4d76b722f47b41680e053694f9631))
* **@formatjs/temporal:** normalize native bridge display years ([#8109](https://github.com/formatjs/formatjs/issues/8109)) ([26b1834](https://github.com/formatjs/formatjs/commit/26b18348c75760098231a26e6812bf4d3f9db704))
* **@formatjs/temporal:** parse calendar strings without date bounds ([#8066](https://github.com/formatjs/formatjs/issues/8066)) ([f6cc871](https://github.com/formatjs/formatjs/commit/f6cc8719f11b9ffcb4062cbe91e94e923937d06e))
* **@formatjs/temporal:** parse UTC offsets without mutable hooks ([#8094](https://github.com/formatjs/formatjs/issues/8094)) ([65a04ca](https://github.com/formatjs/formatjs/commit/65a04cad69c7bd7222f2e1f2c909a2e276f920a1))
* **@formatjs/temporal:** preserve added fields in Buddhist day ranges ([15cb32e](https://github.com/formatjs/formatjs/commit/15cb32ef763b311810c6ded921f3259389abaf9a))
* **@formatjs/temporal:** preserve branded PlainDate conversion ([b27a6f3](https://github.com/formatjs/formatjs/commit/b27a6f3020de303febc149ca99729d851cd0d3cc))
* **@formatjs/temporal:** preserve calendar slots between package entries ([79ca1e2](https://github.com/formatjs/formatjs/commit/79ca1e202ce0004a624ad6f7369574c4a9037970))
* **@formatjs/temporal:** preserve default host offset formatting ([ae94b30](https://github.com/formatjs/formatjs/commit/ae94b3059d8e993df1a44fcb3d4885508402cfaa))
* **@formatjs/temporal:** preserve distinct years in legacy ranges ([d794960](https://github.com/formatjs/formatjs/commit/d794960c71e0e31caa8afb9aff0c5d3fae2c814b))
* **@formatjs/temporal:** preserve host calendar dates at TimeClip bounds ([0ae0a1b](https://github.com/formatjs/formatjs/commit/0ae0a1b6b375fc3234bf8da82f847123cd02007b))
* **@formatjs/temporal:** preserve host calendar datetime at TimeClip bounds ([b5f8e2b](https://github.com/formatjs/formatjs/commit/b5f8e2b5e5327da6c41f9d215041975626053740))
* **@formatjs/temporal:** preserve host numeric year range layout ([96ddf0a](https://github.com/formatjs/formatjs/commit/96ddf0a457d10679c14182da6c874efe2bedee2d))
* **@formatjs/temporal:** preserve host-exotic object semantics ([#8070](https://github.com/formatjs/formatjs/issues/8070)) ([3dcae45](https://github.com/formatjs/formatjs/commit/3dcae45af32f1ac346fa05d6a79b6953c9296b01))
* **@formatjs/temporal:** preserve intrinsic primitive coercion ([#8069](https://github.com/formatjs/formatjs/issues/8069)) ([4f43003](https://github.com/formatjs/formatjs/commit/4f43003eff18088d08c6b40143d55ef42dce616b))
* **@formatjs/temporal:** preserve lunisolar leap range punctuation ([c707fd9](https://github.com/formatjs/formatjs/commit/c707fd905cadf36bdc749e1d4053e0cbb9067aee))
* **@formatjs/temporal:** preserve lunisolar year and leap month boundaries ([ae6fdc9](https://github.com/formatjs/formatjs/commit/ae6fdc9b995a25b72f4ca438467906a4be28a578))
* **@formatjs/temporal:** preserve month labels in day-only leap ranges ([a9d927f](https://github.com/formatjs/formatjs/commit/a9d927ffdabb8e28f9c48f70f2b4d5691d34cdbd))
* **@formatjs/temporal:** preserve nanosecond zoned identity rounding ([#8114](https://github.com/formatjs/formatjs/issues/8114)) ([868222d](https://github.com/formatjs/formatjs/commit/868222d67d7c553e8064420c8d39545f6a687a8b))
* **@formatjs/temporal:** preserve native clock widths in leap ranges ([36a3c7c](https://github.com/formatjs/formatjs/commit/36a3c7c0016a8622939a6119c3482babf38f7d35))
* **@formatjs/temporal:** preserve private locale and interval operations ([63a94b0](https://github.com/formatjs/formatjs/commit/63a94b021ce97afe8b414f7e4301777ff59e9ac5))
* **@formatjs/temporal:** preserve private preparation and validate rounding early ([#8119](https://github.com/formatjs/formatjs/issues/8119)) ([b0b39e0](https://github.com/formatjs/formatjs/commit/b0b39e07731690ab0a60dcbbe2b8e3342816f42d))
* **@formatjs/temporal:** preserve private reader and calendar operations ([24fd91a](https://github.com/formatjs/formatjs/commit/24fd91a558f8e44f8cf1b726c7f4e964cf6a2647))
* **@formatjs/temporal:** preserve selected range field widths ([b83861f](https://github.com/formatjs/formatjs/commit/b83861f9940cf7cd065159b7025ed6a9a51e0c3b))
* **@formatjs/temporal:** preserve two-digit Buddhist year ranges ([24d072f](https://github.com/formatjs/formatjs/commit/24d072f11f45eeccc6c877b50afbcca81cb4b4bc))
* **@formatjs/temporal:** preserve verified lunisolar range days ([3a993b6](https://github.com/formatjs/formatjs/commit/3a993b683f64fbc5c225582c48fc85a9f4c31213))
* **@formatjs/temporal:** preserve verified textual month ranges ([8f6d404](https://github.com/formatjs/formatjs/commit/8f6d404eabdea1bc8c7b3934e59765cf431bc2e4))
* **@formatjs/temporal:** preserve verified weekdays in legacy ranges ([edae72b](https://github.com/formatjs/formatjs/commit/edae72bea358fbacc31f995630721072e62ad67e))
* **@formatjs/temporal:** protect private formatter record copies ([#8088](https://github.com/formatjs/formatjs/issues/8088)) ([e889cf1](https://github.com/formatjs/formatjs/commit/e889cf185143814df2fdcce8c6a68ecfc34cf204))
* **@formatjs/temporal:** read date string options before range checks ([#8065](https://github.com/formatjs/formatjs/issues/8065)) ([7df2163](https://github.com/formatjs/formatjs/commit/7df21634cf780fa6f7ad712fcf033cd9e3d9a1e0))
* **@formatjs/temporal:** read exact owned timezone transitions ([f8ac7b5](https://github.com/formatjs/formatjs/commit/f8ac7b5f7d3eb14dca8dd3c6a90c6ce647f2792f))
* **@formatjs/temporal:** read own host capability descriptors ([3e56ca3](https://github.com/formatjs/formatjs/commit/3e56ca3fbbea622584cc08a6bb7a053bdd196d28))
* **@formatjs/temporal:** read short-date options before range checks ([#8064](https://github.com/formatjs/formatjs/issues/8064)) ([f1f3f0c](https://github.com/formatjs/formatjs/commit/f1f3f0c835b27750558b84cbcefc1aa9da4c54f8))
* **@formatjs/temporal:** read zone options before rejecting auto precision ([d913097](https://github.com/formatjs/formatjs/commit/d913097a659d3bf48a8a28f4004f19ffbc7d4f69))
* **@formatjs/temporal:** rebase retained day and month rounding bounds ([143298b](https://github.com/formatjs/formatjs/commit/143298b6c24b815fc8f0e72d46da67715b1dfc93))
* **@formatjs/temporal:** rebase retained week rounding bounds ([5654ccf](https://github.com/formatjs/formatjs/commit/5654ccf7888ec902d003d32bf27b9a2d59dba85e))
* **@formatjs/temporal:** recover exact offset matches from host data ([05bc48f](https://github.com/formatjs/formatjs/commit/05bc48f573014b9ae540f2c87b77a330332cb913))
* **@formatjs/temporal:** recover leap date ranges and isolate the zoned locale cache ([8cb9de5](https://github.com/formatjs/formatjs/commit/8cb9de52a200d4537e132ce590e4caf928dbafbd))
* **@formatjs/temporal:** refresh host caches after timezone reload ([756082c](https://github.com/formatjs/formatjs/commit/756082c302fa74cd50e5fa93cdc23add40d95168))
* **@formatjs/temporal:** refresh installed legacy timezone samples ([d289bcf](https://github.com/formatjs/formatjs/commit/d289bcfd55524e214500eedd3f7976627fe8768b))
* **@formatjs/temporal:** reject revoked newTarget proxies and preserve locale lookup ([ea5c4cb](https://github.com/formatjs/formatjs/commit/ea5c4cbe0d8546a5e443b18fadbaadb7cc2a98f0))
* **@formatjs/temporal:** resolve day starts across the maximum Instant ([a07d420](https://github.com/formatjs/formatjs/commit/a07d4200909d3f563429c83ee3165a5dea3cad37))
* **@formatjs/temporal:** resolve day starts across the minimum Instant ([01a22c5](https://github.com/formatjs/formatjs/commit/01a22c56f0946b30b335b2e26a13135edee83885))
* **@formatjs/temporal:** resolve exact week retries and minimum wall gaps ([bc25948](https://github.com/formatjs/formatjs/commit/bc259486c1fc8be7c306b7e6fa77b410723e59ff))
* **@formatjs/temporal:** resolve overlapping timezone boundaries ([2780423](https://github.com/formatjs/formatjs/commit/2780423b2c9bbe296d1ce7c79176eb49a2d6f184))
* **@formatjs/temporal:** resolve owned Intl gaps from exact boundaries ([07ae87c](https://github.com/formatjs/formatjs/commit/07ae87c16ec39cc1af21cecd26f203b381891e93))
* **@formatjs/temporal:** resolve wide windows and overlapping gaps ([942556d](https://github.com/formatjs/formatjs/commit/942556df7b5adb2c307a8a8683dc921e4f6d2463))
* **@formatjs/temporal:** retain finite future timezone transitions ([0469dcc](https://github.com/formatjs/formatjs/commit/0469dcc1cb32350ba8dadf5ea297b3a40aa0c43f))
* **@formatjs/temporal:** retain formatter providers and private field entries ([91b5d75](https://github.com/formatjs/formatjs/commit/91b5d75d7539995a2fd7f652bbf6c9fc77b3e3b1))
* **@formatjs/temporal:** retain intrinsic array predicates ([#8076](https://github.com/formatjs/formatjs/issues/8076)) ([0274516](https://github.com/formatjs/formatjs/commit/02745160c469d642d24600188ca7d1cc8e644157))
* **@formatjs/temporal:** retain intrinsic error constructors ([#8075](https://github.com/formatjs/formatjs/issues/8075)) ([595d730](https://github.com/formatjs/formatjs/commit/595d730df0a0f6c8e93e1b00b3238390c79f9473))
* **@formatjs/temporal:** retain numeric intrinsics during arithmetic ([#8074](https://github.com/formatjs/formatjs/issues/8074)) ([0c6c76e](https://github.com/formatjs/formatjs/commit/0c6c76ed6e61150bf9773cdea46cafdb7ce15d62))
* **@formatjs/temporal:** retain private Intl invocation operations ([b8c46f7](https://github.com/formatjs/formatjs/commit/b8c46f7054bb7278b4db67404177ba5c9006f7cf))
* **@formatjs/temporal:** retain private list search intrinsics ([#8083](https://github.com/formatjs/formatjs/issues/8083)) ([8e1640b](https://github.com/formatjs/formatjs/commit/8e1640bff229a5eef33f797c3a4318fb471cddd8))
* **@formatjs/temporal:** retain raw offsets during zoned rounding ([#8122](https://github.com/formatjs/formatjs/issues/8122)) ([89b2ab1](https://github.com/formatjs/formatjs/commit/89b2ab12a320de150d436d7ed53e7aaaeecf12a6))
* **@formatjs/temporal:** retain verified numeric day range parts ([58a1280](https://github.com/formatjs/formatjs/commit/58a1280de366894dfe7080ad67423766b1127623))
* **@formatjs/temporal:** retain verified numeric month range parts ([6c37546](https://github.com/formatjs/formatjs/commit/6c375467a898d5751546e3c3485b1fa4e6ddda0e))
* **@formatjs/temporal:** retry rebased rounding across overlapping gaps ([ee00fb2](https://github.com/formatjs/formatjs/commit/ee00fb28c7c66eb74b04dcdfca565d2aeb208bdf))
* **@formatjs/temporal:** reuse exact legacy timezone tables ([bd46096](https://github.com/formatjs/formatjs/commit/bd460966975ff15235bfa739dcb932474171c6cf))
* **@formatjs/temporal:** round exact clock differences before Number conversion ([#8116](https://github.com/formatjs/formatjs/issues/8116)) ([53aef8d](https://github.com/formatjs/formatjs/commit/53aef8dc2a61eeec65b2927984066f50297af261))
* **@formatjs/temporal:** share validated epochs between package entries ([5746088](https://github.com/formatjs/formatjs/commit/574608815712b3eaa92111506bbe59554b7d992a))
* **@formatjs/temporal:** use direct internal property reads ([#8068](https://github.com/formatjs/formatjs/issues/8068)) ([5474af0](https://github.com/formatjs/formatjs/commit/5474af056b895d241f3599ee45514766d27cb3b8))
* **@formatjs/temporal:** use internal date-time slots for relativeTo ([#8061](https://github.com/formatjs/formatjs/issues/8061)) ([b6464cc](https://github.com/formatjs/formatjs/commit/b6464cca51869baf272d0133d693d32773e223a4))
* **@formatjs/temporal:** validate and isolate MonthDay preparation ([07b1faf](https://github.com/formatjs/formatjs/commit/07b1fafbcaf6d41f1494cb5862ac30b9cd7da4de))
* **@formatjs/temporal:** validate bound revocation and isolate best-fit operations ([de7c671](https://github.com/formatjs/formatjs/commit/de7c671b38dc0025264f4f540cf7a8e71caf46b4))
* **@formatjs/temporal:** validate calendar total window bounds ([#8063](https://github.com/formatjs/formatjs/issues/8063)) ([41f5d27](https://github.com/formatjs/formatjs/commit/41f5d278805e59acb56501abfd43065a09408b4d))
* **@formatjs/temporal:** validate difference unit spellings in order ([#8134](https://github.com/formatjs/formatjs/issues/8134)) ([1983c5f](https://github.com/formatjs/formatjs/commit/1983c5f72ed1e2da23755ae2699708156a1d1037))
* **@formatjs/temporal:** validate duration comparison date prefixes ([83c3713](https://github.com/formatjs/formatjs/commit/83c3713222815f2c27c1ffa2edfe46029ba6780e))
* **@formatjs/temporal:** validate exact week rounding windows ([#8126](https://github.com/formatjs/formatjs/issues/8126)) ([c57685f](https://github.com/formatjs/formatjs/commit/c57685fa55fcca13c272b5839d5b97aa74f93add))
* **@formatjs/temporal:** validate mixed candidates and retained week bounds ([5e7aee5](https://github.com/formatjs/formatjs/commit/5e7aee52f3b73fd02755ac5beb738975b4997dc4))
* **@formatjs/temporal:** validate month code grammar before later fields ([#8060](https://github.com/formatjs/formatjs/issues/8060)) ([6b13128](https://github.com/formatjs/formatjs/commit/6b13128f0d165c9db5758f1e17cc220de6432c4f))
* **@formatjs/temporal:** validate native zoned rounding candidates ([d5ae1a0](https://github.com/formatjs/formatjs/commit/d5ae1a07c08868c97b4f290a7c1c5c27841075b7))
* **@formatjs/temporal:** validate owned Intl candidates at Instant limits ([555ea7b](https://github.com/formatjs/formatjs/commit/555ea7b26cca0633d8c1c3633ed1766ea462b224))
* **@formatjs/temporal:** validate plain relative destination bounds ([97cf4c2](https://github.com/formatjs/formatjs/commit/97cf4c2f853645aa982f76436576146f5488b113))
* **@formatjs/temporal:** validate zoned rounding windows and fold carry ([#8125](https://github.com/formatjs/formatjs/issues/8125)) ([ac71d40](https://github.com/formatjs/formatjs/commit/ac71d4027ff95f2edb0b4142101695ad77d92135))
* **@formatjs/temporal:** verify fresh duration locale construction ([87d5bc9](https://github.com/formatjs/formatjs/commit/87d5bc9eeffaba96f2c1ef61d8142a3e06df3242))


### Performance Improvements

* **@formatjs/temporal:** speed up date and time zone operations ([2b69653](https://github.com/formatjs/formatjs/commit/2b69653fbaa19baae626aa1e05ea8bcc8b94718b))
</details>

<details><summary>@formatjs/unplugin: 1.2.23</summary>

## [1.2.23](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.2.22...@formatjs/unplugin@1.2.23) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/cli-lib bumped to 10.4.1
</details>

<details><summary>@formatjs/utils: 2.2.13</summary>

## [2.2.13](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.12...@formatjs/utils@2.2.13) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/fast-memoize bumped to 3.1.8
</details>

<details><summary>intl-messageformat: 12.2.1</summary>

## [12.2.1](https://github.com/formatjs/formatjs/compare/intl-messageformat@12.2.0...intl-messageformat@12.2.1) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/fast-memoize bumped to 3.1.8
</details>

<details><summary>react-intl: 12.2.1</summary>

## [12.2.1](https://github.com/formatjs/formatjs/compare/react-intl@12.2.0...react-intl@12.2.1) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl bumped to 6.2.1
    * intl-messageformat bumped to 12.2.1
</details>

<details><summary>vue-intl: 8.1.8</summary>

## [8.1.8](https://github.com/formatjs/formatjs/compare/vue-intl@8.1.7...vue-intl@8.1.8) (2026-11-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/intl bumped to 6.2.1
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).