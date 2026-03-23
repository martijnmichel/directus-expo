## <small>0.12.9 (2026-03-23)</small>

* chore: remove useLegacyPackaging ([a976f3d](https://github.com/martijnmichel/directus-expo/commit/a976f3d))
* ignore ([dd3d2f2](https://github.com/martijnmichel/directus-expo/commit/dd3d2f2))
* rm duplicate assets ([7c35df2](https://github.com/martijnmichel/directus-expo/commit/7c35df2))

## <small>0.12.8 (2026-03-23)</small>

* chore: bump buildnumber ([d127365](https://github.com/martijnmichel/directus-expo/commit/d127365))

## <small>0.12.7 (2026-03-23)</small>

* chore: bump version ([ddcea6d](https://github.com/martijnmichel/directus-expo/commit/ddcea6d))
* fix: remove android/ios folder from easignore ([6e953bb](https://github.com/martijnmichel/directus-expo/commit/6e953bb))

## <small>0.12.6 (2026-03-23)</small>

* chore: bump version for native ([c41b2b0](https://github.com/martijnmichel/directus-expo/commit/c41b2b0))

## <small>0.12.5 (2026-03-23)</small>

* chore: bump version ([c16225b](https://github.com/martijnmichel/directus-expo/commit/c16225b))
* display app group error ([6acdfc7](https://github.com/martijnmichel/directus-expo/commit/6acdfc7))
* update homepage ([501d1ec](https://github.com/martijnmichel/directus-expo/commit/501d1ec))
* Update package.json ([a47db96](https://github.com/martijnmichel/directus-expo/commit/a47db96))
* chord: fix app group ([395c0a1](https://github.com/martijnmichel/directus-expo/commit/395c0a1))

## <small>0.12.4 (2026-03-23)</small>

* chore: prebuild ([a5e4c53](https://github.com/martijnmichel/directus-expo/commit/a5e4c53))

## <small>0.12.3 (2026-03-23)</small>

* Merge branch 'main' of https://github.com/martijnmichel/directus-expo ([8fb884b](https://github.com/martijnmichel/directus-expo/commit/8fb884b))
* refactor: latest-items-widget on ios to widgets ([2b47c11](https://github.com/martijnmichel/directus-expo/commit/2b47c11))

## <small>0.12.2 (2026-03-23)</small>

* docs: blog post for new release ([a3f6328](https://github.com/martijnmichel/directus-expo/commit/a3f6328))
* docs: refine blog entry ([4267f4c](https://github.com/martijnmichel/directus-expo/commit/4267f4c))

## <small>0.12.1 (2026-03-23)</small>

* chore: add husky commit messages check ([8197566](https://github.com/martijnmichel/directus-expo/commit/8197566))

# [0.12.0](https://github.com/martijnmichel/directus-expo/compare/v0.11.0...v0.12.0) (2026-03-23)

### Additional changes since `v0.10.1`

- Widget support landed across iOS and Android (native targets, widget settings UI, flow/install wiring, cache and deep-link behavior).
- Widget reliability fixes were added (image archival limit handling, per-row deep links, error messaging, and access handling improvements).
- Auth/deep-linking was hardened for multi-session behavior and session-aware widget opening.
- Installer and flow permission setup were improved for widget collections and flow access checks.

# [0.11.0](https://github.com/martijnmichel/directus-expo/compare/v0.10.1...v0.11.0) (2026-03-23)


### Bug Fixes

* scroll on draggable delay ([759985d](https://github.com/martijnmichel/directus-expo/commit/759985d502d7cab450b6051fb4f5bfbf2264c76e))


### Features

* multi session per instance ([941bca3](https://github.com/martijnmichel/directus-expo/commit/941bca346d254803a44011cff0ee1c2afed36d44))


### Performance Improvements

* automatic session switch on deeplink ([4a4f37e](https://github.com/martijnmichel/directus-expo/commit/4a4f37e986cda61c927a3534b51d6eabeda6cdb9))

## [0.10.1](https://github.com/martijnmichel/directus-expo/compare/v0.10.0...v0.10.1) (2026-03-19)


### Bug Fixes

* object on junction table modal close ([44d2cf7](https://github.com/martijnmichel/directus-expo/commit/44d2cf727e6e9e3c316cc1124efa09bf04ac3a89))
* related items display values ([a371ae8](https://github.com/martijnmichel/directus-expo/commit/a371ae80fde004a2d911fc9b6d8144cdabea0328))

# [0.10.0](https://github.com/martijnmichel/directus-expo/compare/v0.9.0...v0.10.0) (2026-03-14)

# [0.9.0](https://github.com/martijnmichel/directus-expo/compare/v0.8.9...v0.9.0) (2026-03-13)


### Bug Fixes

* added required on all interfaces ([ce8a5cb](https://github.com/martijnmichel/directus-expo/commit/ce8a5cb80c6dde3f6f56e7125c6d78414fe2a770))
* added uuid to all related interfaces ([7fb6c6b](https://github.com/martijnmichel/directus-expo/commit/7fb6c6bf3c405936d4827cdd833e861846b668de))
* added uuid to document-editor & m2a ([52b21c4](https://github.com/martijnmichel/directus-expo/commit/52b21c49fb5abc725b54a6d064a9a693806ff879))
* android quickView & bottomSheet ([cda1be0](https://github.com/martijnmichel/directus-expo/commit/cda1be0e99f741f5081668bed89cc4de5ec91766))
* android tabs ([25b730c](https://github.com/martijnmichel/directus-expo/commit/25b730c7b1a01ad81f46ee7fb7bb17e13dc20fb2))
* auto-select new api in loginform ([0bcad2f](https://github.com/martijnmichel/directus-expo/commit/0bcad2f6eacf92335532c8bbd23eafc25a214589))
* better api url error handling and checking ([d9eff61](https://github.com/martijnmichel/directus-expo/commit/d9eff6186315254aa28400cc5da9ca6da4023a98))
* deep nesting related DataTable ([bb810ef](https://github.com/martijnmichel/directus-expo/commit/bb810ef25ec1bea7ae281d115e0515c82c09cc7e))
* detect filled perc from update/create items ([a2be580](https://github.com/martijnmichel/directus-expo/commit/a2be580874ad33d97a95798fd336ab9e5d8cab64))
* disable related query when no items ([03bc213](https://github.com/martijnmichel/directus-expo/commit/03bc213d29f971ee318485596d55b611e9364d74))
* drag-drop in scrollview on android ([eb23ebc](https://github.com/martijnmichel/directus-expo/commit/eb23ebc5cf4a8c296160fdfc2ffab16f632a92d4))
* editor unresponsive after image insert ([b310786](https://github.com/martijnmichel/directus-expo/commit/b310786d2d6b8d3ec672f3faa05428dcf74b1344))
* file-input ([50b350a](https://github.com/martijnmichel/directus-expo/commit/50b350aad37cd799630604369d34cb1a59d80dd0))
* filter m2m based on value ([6e5529e](https://github.com/martijnmichel/directus-expo/commit/6e5529ed3dfdce2787c77751eb3125a406a9857b))
* hash-input ([b0dcfec](https://github.com/martijnmichel/directus-expo/commit/b0dcfecc65413be200fd6ee67406848ee545b4f1))
* layout tabs & crash on no meta collection ([5e349ce](https://github.com/martijnmichel/directus-expo/commit/5e349ce7b0068efd3cce705b72e92f856d3caa46))
* light mode css on tinymce ([65edd01](https://github.com/martijnmichel/directus-expo/commit/65edd0149941e65ccd687d4ddeaa2f9b6f51d0b2))
* logout before remove storage ([c2005bc](https://github.com/martijnmichel/directus-expo/commit/c2005bc2f21a8260ef303dad5674b7ce9d609879))
* m2m correct filter ([d018913](https://github.com/martijnmichel/directus-expo/commit/d018913a66a7ef475150ecc3dea86c4085f9cdf6))
* m2m relation collection ([c372fb8](https://github.com/martijnmichel/directus-expo/commit/c372fb8656617bdbffc02db93d799ef4e303de7e))
* m2o pick modal ([bd9e7c7](https://github.com/martijnmichel/directus-expo/commit/bd9e7c78962c2f057ea6ac2077ac499cb2db06f0))
* minors fixes ([96dbb6d](https://github.com/martijnmichel/directus-expo/commit/96dbb6d51d46e1824d1319ca6a13c66eac237c4a))
* no text on file select ([859a97e](https://github.com/martijnmichel/directus-expo/commit/859a97e4b584e400f29c624d17262fbebef0fc0b))
* o2m input working with pk ([24fec42](https://github.com/martijnmichel/directus-expo/commit/24fec425bfe901525ca4cc5e8c2fb3ebee4187b7))
* o2m sort ([9fe8e0c](https://github.com/martijnmichel/directus-expo/commit/9fe8e0cedd3e0af372ca3fa2b91f0aa93b0cb472))
* pagination & types ([f7e57c4](https://github.com/martijnmichel/directus-expo/commit/f7e57c4b0949373d81febeee7f4324074fd85fb0))
* pagination 2nd page ([62a7074](https://github.com/martijnmichel/directus-expo/commit/62a707477f7a0b9a0c3bb492de4f0a471a2e6765))
* permissions for m2m & m2o ([8a73d02](https://github.com/martijnmichel/directus-expo/commit/8a73d02c4beebdc78a018859bb8a0e45c1db46af))
* positioning of toolbar ([1ab0674](https://github.com/martijnmichel/directus-expo/commit/1ab06746993290116898e56fedb8925f6b19bbf8))
* prevent duplicate raw/detail groups ([5645f4f](https://github.com/martijnmichel/directus-expo/commit/5645f4fce04127fd5f243fcda0edf97c0473cb50))
* repeater doc ([bab8211](https://github.com/martijnmichel/directus-expo/commit/bab8211028dac1a174d4f228d638ab59d937997c))
* repeater items without type & interface selected ([fc20398](https://github.com/martijnmichel/directus-expo/commit/fc2039811cf60bdb2decd87b9b86e0bce81c567e))
* slider working ([b45ae96](https://github.com/martijnmichel/directus-expo/commit/b45ae96466362f81c5691d45d24cea321ed77166))
* sort on m2a new items ([fae070c](https://github.com/martijnmichel/directus-expo/commit/fae070c8bfca074324c5754c3ed45346086bcf7a))
* sort with new items on m2m ([370cba5](https://github.com/martijnmichel/directus-expo/commit/370cba5b2b17241bb4f8e8628aadd9297ab65b40))
* sorting ([71bbf52](https://github.com/martijnmichel/directus-expo/commit/71bbf52807b785b47b8b390a1a27dbf3e5d94d2c))
* styling m2m ([bf442fb](https://github.com/martijnmichel/directus-expo/commit/bf442fb925fd985901eec84b0d02781a233fb6bf))
* translated pages ([445454e](https://github.com/martijnmichel/directus-expo/commit/445454e33f8d40346acae115446fefea6ba321bc))
* translations ([fffad9b](https://github.com/martijnmichel/directus-expo/commit/fffad9b10869d76064e9f537ff8361d4bf9dda29))
* type on usequeryoptions ([caf1dc6](https://github.com/martijnmichel/directus-expo/commit/caf1dc67f5ac2d31302eab9c9d853e63b63f7ca7))


### Features

* added website ([a7096ef](https://github.com/martijnmichel/directus-expo/commit/a7096ef9329041d4c068fcb1729a9f5268e81fd1))
* api key refresh ([dfd97fc](https://github.com/martijnmichel/directus-expo/commit/dfd97fc17e98cac37fe482ef4c519bda18c88271))
* buttons! ([be6cc56](https://github.com/martijnmichel/directus-expo/commit/be6cc569dd01ccc1b66245c7d34adad0efc87a3b))
* collection-item-dropdown ([bf76732](https://github.com/martijnmichel/directus-expo/commit/bf76732152684bc8e9090e228b39f4da51e20bd4))
* CollectionTable thumbnail ([e63fc5c](https://github.com/martijnmichel/directus-expo/commit/e63fc5ca134067f094964b1aae10e89d904f9c37))
* deep nested related value on Table Col ([6339ee6](https://github.com/martijnmichel/directus-expo/commit/6339ee6673c5530384a73da16589dfb047644a8a))
* eas update info ([880f9b0](https://github.com/martijnmichel/directus-expo/commit/880f9b069b086c408b3c55f74f4e58afffd244ac))
* edit m2a ([f2660c9](https://github.com/martijnmichel/directus-expo/commit/f2660c97f73de2063894efaf256f0f40e6564209))
* field value with transform on m20 ([b9c7868](https://github.com/martijnmichel/directus-expo/commit/b9c786879659472d2825741a95c32e6040844c73))
* FieldValue ([84ce801](https://github.com/martijnmichel/directus-expo/commit/84ce8016e69dbf6dd22f09bd8540fcdb24813849))
* file pick modal ([f853992](https://github.com/martijnmichel/directus-expo/commit/f853992b4ff02102dc576af17e743f0df7e859b4))
* file-input ([70ea220](https://github.com/martijnmichel/directus-expo/commit/70ea22066d762dfa2fcf034966fb8a1a88d422a6))
* FileBrowser/File screen ([65a2e8c](https://github.com/martijnmichel/directus-expo/commit/65a2e8ca10f47b378d49638d1badacf82be930ec))
* filter m2a based on current value ([039f6e7](https://github.com/martijnmichel/directus-expo/commit/039f6e7ecb5f30fea728fc93ec2867810fa4b7ba))
* filter o2m based on current value ([57da07a](https://github.com/martijnmichel/directus-expo/commit/57da07a4d50a3ba8652dc01997e432a46b59499e))
* fullscreen on tinymce ([1c3ba24](https://github.com/martijnmichel/directus-expo/commit/1c3ba24ddba8e7f0253195c794be926e28429bb7))
* incepted modals m2m o2m ([5e71f1a](https://github.com/martijnmichel/directus-expo/commit/5e71f1a212338401b41b1c77b7b72a1edc1e85cd))
* instance switch ([9050187](https://github.com/martijnmichel/directus-expo/commit/90501871d149c47f145947ef1636a1b0b6a113ec))
* links to translation modal editor ([6926a55](https://github.com/martijnmichel/directus-expo/commit/6926a557eb619f43656333cabf7699e6fcff19f4))
* m2a nested data in Table and Interface ([9321847](https://github.com/martijnmichel/directus-expo/commit/93218473c20550fcb35b593ec448ef9300c409ec))
* m2o relational ([6f0582a](https://github.com/martijnmichel/directus-expo/commit/6f0582ac7f1b920f026189000a585f60e7ec6696))
* multi files input m2m ([43ca49a](https://github.com/martijnmichel/directus-expo/commit/43ca49a99c5ad02cec25fbc61e0ec6ff44d375a1))
* notice & dividers ([fdeee7a](https://github.com/martijnmichel/directus-expo/commit/fdeee7ad037101d2aff6b72acefabf9b20c93147))
* o2m ([c0e93ba](https://github.com/martijnmichel/directus-expo/commit/c0e93bae729d4be6820f66f90eede1a8a576ee74))
* open translation with compare language ([0feef2b](https://github.com/martijnmichel/directus-expo/commit/0feef2bea918cad2e79cbd7793c5ce490b3672e2))
* pagination @ file select modal ([9d136c3](https://github.com/martijnmichel/directus-expo/commit/9d136c3f636db5aa07b8f6547fef3095ed982588))
* pick language from directus ([90aaa46](https://github.com/martijnmichel/directus-expo/commit/90aaa46c6ea4464c66461e3af6283f2d3e480a9e))
* primary key! ([7eac10f](https://github.com/martijnmichel/directus-expo/commit/7eac10fe0e363eac2dcb9a82826b28c06cfc27cf))
* related datatable column m2m pick ([5798ade](https://github.com/martijnmichel/directus-expo/commit/5798ade1cb19b52a20745f155aebe011a78ce8d1))
* remember i18n locale ([34bfb4e](https://github.com/martijnmichel/directus-expo/commit/34bfb4ed16b84e319842589cc5f9d4d8fcc2dde1))
* remove translation ([9c5e4de](https://github.com/martijnmichel/directus-expo/commit/9c5e4dec63bcaba6f6f6e5e8c3f64d474feeec90))
* reset button ([0df0748](https://github.com/martijnmichel/directus-expo/commit/0df07480c278b2e946004f3d065bef66b12a299d))
* server health ([bdb8809](https://github.com/martijnmichel/directus-expo/commit/bdb880925df20a0ebd320e71a12fc710642c9d6e))
* sticky table header & toolbar ([0f76577](https://github.com/martijnmichel/directus-expo/commit/0f76577970559516303b4f863f44f730a7ce4789))
* tags interface ([969c665](https://github.com/martijnmichel/directus-expo/commit/969c66544338fa56f7c9a3d6b6270d9764735509))
* tinymce webview ([55a44a6](https://github.com/martijnmichel/directus-expo/commit/55a44a6f2d256b1f748960e635ace3d3c7915e30))
* translations! ([fbb4de2](https://github.com/martijnmichel/directus-expo/commit/fbb4de29e62390038218949d420d78e2c328aa7e))
* up ([1251efa](https://github.com/martijnmichel/directus-expo/commit/1251efa43dc810692bf4cc91dd016392e2ec6311))
* update/delete file ([d59d2b7](https://github.com/martijnmichel/directus-expo/commit/d59d2b79be923ab0f0d8d982e43d28d77cb11279))
* upload/import in filebrowser ([85075e9](https://github.com/martijnmichel/directus-expo/commit/85075e93d9f8c15b7cdbeaf3f9b5e146cc0f22b4))


### Performance Improvements

* image browser! ([6ec81ef](https://github.com/martijnmichel/directus-expo/commit/6ec81ef7a378519d4c60e9fd32b647668cd6aec6))
* optimize table queries ([c8d26fd](https://github.com/martijnmichel/directus-expo/commit/c8d26fd6827b868b4ab530e1edc4e81d5cadaeef))
* rewrite o2m input ([36c0df4](https://github.com/martijnmichel/directus-expo/commit/36c0df46945e553cdb16dce7dae7a38a59f3b7a1))


### Reverts

* Revert "rewriting default interface props" ([41a2732](https://github.com/martijnmichel/directus-expo/commit/41a273239f0e4313a63492374a95862902e1ef05))

# [0.9.0](https://github.com/martijnmichel/directus-expo/compare/v0.8.9...v0.9.0) (2026-03-13)


### Bug Fixes

* added required on all interfaces ([ce8a5cb](https://github.com/martijnmichel/directus-expo/commit/ce8a5cb80c6dde3f6f56e7125c6d78414fe2a770))
* added uuid to all related interfaces ([7fb6c6b](https://github.com/martijnmichel/directus-expo/commit/7fb6c6bf3c405936d4827cdd833e861846b668de))
* added uuid to document-editor & m2a ([52b21c4](https://github.com/martijnmichel/directus-expo/commit/52b21c49fb5abc725b54a6d064a9a693806ff879))
* android quickView & bottomSheet ([cda1be0](https://github.com/martijnmichel/directus-expo/commit/cda1be0e99f741f5081668bed89cc4de5ec91766))
* android tabs ([25b730c](https://github.com/martijnmichel/directus-expo/commit/25b730c7b1a01ad81f46ee7fb7bb17e13dc20fb2))
* auto-select new api in loginform ([0bcad2f](https://github.com/martijnmichel/directus-expo/commit/0bcad2f6eacf92335532c8bbd23eafc25a214589))
* better api url error handling and checking ([d9eff61](https://github.com/martijnmichel/directus-expo/commit/d9eff6186315254aa28400cc5da9ca6da4023a98))
* deep nesting related DataTable ([bb810ef](https://github.com/martijnmichel/directus-expo/commit/bb810ef25ec1bea7ae281d115e0515c82c09cc7e))
* detect filled perc from update/create items ([a2be580](https://github.com/martijnmichel/directus-expo/commit/a2be580874ad33d97a95798fd336ab9e5d8cab64))
* disable related query when no items ([03bc213](https://github.com/martijnmichel/directus-expo/commit/03bc213d29f971ee318485596d55b611e9364d74))
* drag-drop in scrollview on android ([eb23ebc](https://github.com/martijnmichel/directus-expo/commit/eb23ebc5cf4a8c296160fdfc2ffab16f632a92d4))
* editor unresponsive after image insert ([b310786](https://github.com/martijnmichel/directus-expo/commit/b310786d2d6b8d3ec672f3faa05428dcf74b1344))
* file-input ([50b350a](https://github.com/martijnmichel/directus-expo/commit/50b350aad37cd799630604369d34cb1a59d80dd0))
* filter m2m based on value ([6e5529e](https://github.com/martijnmichel/directus-expo/commit/6e5529ed3dfdce2787c77751eb3125a406a9857b))
* hash-input ([b0dcfec](https://github.com/martijnmichel/directus-expo/commit/b0dcfecc65413be200fd6ee67406848ee545b4f1))
* layout tabs & crash on no meta collection ([5e349ce](https://github.com/martijnmichel/directus-expo/commit/5e349ce7b0068efd3cce705b72e92f856d3caa46))
* light mode css on tinymce ([65edd01](https://github.com/martijnmichel/directus-expo/commit/65edd0149941e65ccd687d4ddeaa2f9b6f51d0b2))
* logout before remove storage ([c2005bc](https://github.com/martijnmichel/directus-expo/commit/c2005bc2f21a8260ef303dad5674b7ce9d609879))
* m2m correct filter ([d018913](https://github.com/martijnmichel/directus-expo/commit/d018913a66a7ef475150ecc3dea86c4085f9cdf6))
* m2m relation collection ([c372fb8](https://github.com/martijnmichel/directus-expo/commit/c372fb8656617bdbffc02db93d799ef4e303de7e))
* m2o pick modal ([bd9e7c7](https://github.com/martijnmichel/directus-expo/commit/bd9e7c78962c2f057ea6ac2077ac499cb2db06f0))
* minors fixes ([96dbb6d](https://github.com/martijnmichel/directus-expo/commit/96dbb6d51d46e1824d1319ca6a13c66eac237c4a))
* no text on file select ([859a97e](https://github.com/martijnmichel/directus-expo/commit/859a97e4b584e400f29c624d17262fbebef0fc0b))
* o2m input working with pk ([24fec42](https://github.com/martijnmichel/directus-expo/commit/24fec425bfe901525ca4cc5e8c2fb3ebee4187b7))
* o2m sort ([9fe8e0c](https://github.com/martijnmichel/directus-expo/commit/9fe8e0cedd3e0af372ca3fa2b91f0aa93b0cb472))
* pagination & types ([f7e57c4](https://github.com/martijnmichel/directus-expo/commit/f7e57c4b0949373d81febeee7f4324074fd85fb0))
* pagination 2nd page ([62a7074](https://github.com/martijnmichel/directus-expo/commit/62a707477f7a0b9a0c3bb492de4f0a471a2e6765))
* permissions for m2m & m2o ([8a73d02](https://github.com/martijnmichel/directus-expo/commit/8a73d02c4beebdc78a018859bb8a0e45c1db46af))
* positioning of toolbar ([1ab0674](https://github.com/martijnmichel/directus-expo/commit/1ab06746993290116898e56fedb8925f6b19bbf8))
* prevent duplicate raw/detail groups ([5645f4f](https://github.com/martijnmichel/directus-expo/commit/5645f4fce04127fd5f243fcda0edf97c0473cb50))
* repeater doc ([bab8211](https://github.com/martijnmichel/directus-expo/commit/bab8211028dac1a174d4f228d638ab59d937997c))
* repeater items without type & interface selected ([fc20398](https://github.com/martijnmichel/directus-expo/commit/fc2039811cf60bdb2decd87b9b86e0bce81c567e))
* slider working ([b45ae96](https://github.com/martijnmichel/directus-expo/commit/b45ae96466362f81c5691d45d24cea321ed77166))
* sort on m2a new items ([fae070c](https://github.com/martijnmichel/directus-expo/commit/fae070c8bfca074324c5754c3ed45346086bcf7a))
* sort with new items on m2m ([370cba5](https://github.com/martijnmichel/directus-expo/commit/370cba5b2b17241bb4f8e8628aadd9297ab65b40))
* sorting ([71bbf52](https://github.com/martijnmichel/directus-expo/commit/71bbf52807b785b47b8b390a1a27dbf3e5d94d2c))
* styling m2m ([bf442fb](https://github.com/martijnmichel/directus-expo/commit/bf442fb925fd985901eec84b0d02781a233fb6bf))
* translated pages ([445454e](https://github.com/martijnmichel/directus-expo/commit/445454e33f8d40346acae115446fefea6ba321bc))
* translations ([fffad9b](https://github.com/martijnmichel/directus-expo/commit/fffad9b10869d76064e9f537ff8361d4bf9dda29))
* type on usequeryoptions ([caf1dc6](https://github.com/martijnmichel/directus-expo/commit/caf1dc67f5ac2d31302eab9c9d853e63b63f7ca7))


### Features

* added website ([a7096ef](https://github.com/martijnmichel/directus-expo/commit/a7096ef9329041d4c068fcb1729a9f5268e81fd1))
* api key refresh ([dfd97fc](https://github.com/martijnmichel/directus-expo/commit/dfd97fc17e98cac37fe482ef4c519bda18c88271))
* buttons! ([be6cc56](https://github.com/martijnmichel/directus-expo/commit/be6cc569dd01ccc1b66245c7d34adad0efc87a3b))
* collection-item-dropdown ([bf76732](https://github.com/martijnmichel/directus-expo/commit/bf76732152684bc8e9090e228b39f4da51e20bd4))
* CollectionTable thumbnail ([e63fc5c](https://github.com/martijnmichel/directus-expo/commit/e63fc5ca134067f094964b1aae10e89d904f9c37))
* deep nested related value on Table Col ([6339ee6](https://github.com/martijnmichel/directus-expo/commit/6339ee6673c5530384a73da16589dfb047644a8a))
* eas update info ([880f9b0](https://github.com/martijnmichel/directus-expo/commit/880f9b069b086c408b3c55f74f4e58afffd244ac))
* edit m2a ([f2660c9](https://github.com/martijnmichel/directus-expo/commit/f2660c97f73de2063894efaf256f0f40e6564209))
* field value with transform on m20 ([b9c7868](https://github.com/martijnmichel/directus-expo/commit/b9c786879659472d2825741a95c32e6040844c73))
* FieldValue ([84ce801](https://github.com/martijnmichel/directus-expo/commit/84ce8016e69dbf6dd22f09bd8540fcdb24813849))
* file pick modal ([f853992](https://github.com/martijnmichel/directus-expo/commit/f853992b4ff02102dc576af17e743f0df7e859b4))
* file-input ([70ea220](https://github.com/martijnmichel/directus-expo/commit/70ea22066d762dfa2fcf034966fb8a1a88d422a6))
* FileBrowser/File screen ([65a2e8c](https://github.com/martijnmichel/directus-expo/commit/65a2e8ca10f47b378d49638d1badacf82be930ec))
* filter m2a based on current value ([039f6e7](https://github.com/martijnmichel/directus-expo/commit/039f6e7ecb5f30fea728fc93ec2867810fa4b7ba))
* filter o2m based on current value ([57da07a](https://github.com/martijnmichel/directus-expo/commit/57da07a4d50a3ba8652dc01997e432a46b59499e))
* fullscreen on tinymce ([1c3ba24](https://github.com/martijnmichel/directus-expo/commit/1c3ba24ddba8e7f0253195c794be926e28429bb7))
* incepted modals m2m o2m ([5e71f1a](https://github.com/martijnmichel/directus-expo/commit/5e71f1a212338401b41b1c77b7b72a1edc1e85cd))
* instance switch ([9050187](https://github.com/martijnmichel/directus-expo/commit/90501871d149c47f145947ef1636a1b0b6a113ec))
* links to translation modal editor ([6926a55](https://github.com/martijnmichel/directus-expo/commit/6926a557eb619f43656333cabf7699e6fcff19f4))
* m2a nested data in Table and Interface ([9321847](https://github.com/martijnmichel/directus-expo/commit/93218473c20550fcb35b593ec448ef9300c409ec))
* m2o relational ([6f0582a](https://github.com/martijnmichel/directus-expo/commit/6f0582ac7f1b920f026189000a585f60e7ec6696))
* multi files input m2m ([43ca49a](https://github.com/martijnmichel/directus-expo/commit/43ca49a99c5ad02cec25fbc61e0ec6ff44d375a1))
* notice & dividers ([fdeee7a](https://github.com/martijnmichel/directus-expo/commit/fdeee7ad037101d2aff6b72acefabf9b20c93147))
* o2m ([c0e93ba](https://github.com/martijnmichel/directus-expo/commit/c0e93bae729d4be6820f66f90eede1a8a576ee74))
* open translation with compare language ([0feef2b](https://github.com/martijnmichel/directus-expo/commit/0feef2bea918cad2e79cbd7793c5ce490b3672e2))
* pagination @ file select modal ([9d136c3](https://github.com/martijnmichel/directus-expo/commit/9d136c3f636db5aa07b8f6547fef3095ed982588))
* pick language from directus ([90aaa46](https://github.com/martijnmichel/directus-expo/commit/90aaa46c6ea4464c66461e3af6283f2d3e480a9e))
* primary key! ([7eac10f](https://github.com/martijnmichel/directus-expo/commit/7eac10fe0e363eac2dcb9a82826b28c06cfc27cf))
* related datatable column m2m pick ([5798ade](https://github.com/martijnmichel/directus-expo/commit/5798ade1cb19b52a20745f155aebe011a78ce8d1))
* remember i18n locale ([34bfb4e](https://github.com/martijnmichel/directus-expo/commit/34bfb4ed16b84e319842589cc5f9d4d8fcc2dde1))
* remove translation ([9c5e4de](https://github.com/martijnmichel/directus-expo/commit/9c5e4dec63bcaba6f6f6e5e8c3f64d474feeec90))
* reset button ([0df0748](https://github.com/martijnmichel/directus-expo/commit/0df07480c278b2e946004f3d065bef66b12a299d))
* server health ([bdb8809](https://github.com/martijnmichel/directus-expo/commit/bdb880925df20a0ebd320e71a12fc710642c9d6e))
* sticky table header & toolbar ([0f76577](https://github.com/martijnmichel/directus-expo/commit/0f76577970559516303b4f863f44f730a7ce4789))
* tags interface ([969c665](https://github.com/martijnmichel/directus-expo/commit/969c66544338fa56f7c9a3d6b6270d9764735509))
* tinymce webview ([55a44a6](https://github.com/martijnmichel/directus-expo/commit/55a44a6f2d256b1f748960e635ace3d3c7915e30))
* translations! ([fbb4de2](https://github.com/martijnmichel/directus-expo/commit/fbb4de29e62390038218949d420d78e2c328aa7e))
* up ([1251efa](https://github.com/martijnmichel/directus-expo/commit/1251efa43dc810692bf4cc91dd016392e2ec6311))
* update/delete file ([d59d2b7](https://github.com/martijnmichel/directus-expo/commit/d59d2b79be923ab0f0d8d982e43d28d77cb11279))
* upload/import in filebrowser ([85075e9](https://github.com/martijnmichel/directus-expo/commit/85075e93d9f8c15b7cdbeaf3f9b5e146cc0f22b4))


### Performance Improvements

* image browser! ([6ec81ef](https://github.com/martijnmichel/directus-expo/commit/6ec81ef7a378519d4c60e9fd32b647668cd6aec6))
* optimize table queries ([c8d26fd](https://github.com/martijnmichel/directus-expo/commit/c8d26fd6827b868b4ab530e1edc4e81d5cadaeef))
* rewrite o2m input ([36c0df4](https://github.com/martijnmichel/directus-expo/commit/36c0df46945e553cdb16dce7dae7a38a59f3b7a1))


### Reverts

* Revert "rewriting default interface props" ([41a2732](https://github.com/martijnmichel/directus-expo/commit/41a273239f0e4313a63492374a95862902e1ef05))

# [0.9.0](https://github.com/martijnmichel/directus-expo/compare/v0.8.9...v0.9.0) (2026-03-13)


### Bug Fixes

* added required on all interfaces ([ce8a5cb](https://github.com/martijnmichel/directus-expo/commit/ce8a5cb80c6dde3f6f56e7125c6d78414fe2a770))
* added uuid to all related interfaces ([7fb6c6b](https://github.com/martijnmichel/directus-expo/commit/7fb6c6bf3c405936d4827cdd833e861846b668de))
* added uuid to document-editor & m2a ([52b21c4](https://github.com/martijnmichel/directus-expo/commit/52b21c49fb5abc725b54a6d064a9a693806ff879))
* android quickView & bottomSheet ([cda1be0](https://github.com/martijnmichel/directus-expo/commit/cda1be0e99f741f5081668bed89cc4de5ec91766))
* android tabs ([25b730c](https://github.com/martijnmichel/directus-expo/commit/25b730c7b1a01ad81f46ee7fb7bb17e13dc20fb2))
* auto-select new api in loginform ([0bcad2f](https://github.com/martijnmichel/directus-expo/commit/0bcad2f6eacf92335532c8bbd23eafc25a214589))
* better api url error handling and checking ([d9eff61](https://github.com/martijnmichel/directus-expo/commit/d9eff6186315254aa28400cc5da9ca6da4023a98))
* deep nesting related DataTable ([bb810ef](https://github.com/martijnmichel/directus-expo/commit/bb810ef25ec1bea7ae281d115e0515c82c09cc7e))
* detect filled perc from update/create items ([a2be580](https://github.com/martijnmichel/directus-expo/commit/a2be580874ad33d97a95798fd336ab9e5d8cab64))
* disable related query when no items ([03bc213](https://github.com/martijnmichel/directus-expo/commit/03bc213d29f971ee318485596d55b611e9364d74))
* drag-drop in scrollview on android ([eb23ebc](https://github.com/martijnmichel/directus-expo/commit/eb23ebc5cf4a8c296160fdfc2ffab16f632a92d4))
* editor unresponsive after image insert ([b310786](https://github.com/martijnmichel/directus-expo/commit/b310786d2d6b8d3ec672f3faa05428dcf74b1344))
* file-input ([50b350a](https://github.com/martijnmichel/directus-expo/commit/50b350aad37cd799630604369d34cb1a59d80dd0))
* filter m2m based on value ([6e5529e](https://github.com/martijnmichel/directus-expo/commit/6e5529ed3dfdce2787c77751eb3125a406a9857b))
* hash-input ([b0dcfec](https://github.com/martijnmichel/directus-expo/commit/b0dcfecc65413be200fd6ee67406848ee545b4f1))
* layout tabs & crash on no meta collection ([5e349ce](https://github.com/martijnmichel/directus-expo/commit/5e349ce7b0068efd3cce705b72e92f856d3caa46))
* light mode css on tinymce ([65edd01](https://github.com/martijnmichel/directus-expo/commit/65edd0149941e65ccd687d4ddeaa2f9b6f51d0b2))
* logout before remove storage ([c2005bc](https://github.com/martijnmichel/directus-expo/commit/c2005bc2f21a8260ef303dad5674b7ce9d609879))
* m2m correct filter ([d018913](https://github.com/martijnmichel/directus-expo/commit/d018913a66a7ef475150ecc3dea86c4085f9cdf6))
* m2m relation collection ([c372fb8](https://github.com/martijnmichel/directus-expo/commit/c372fb8656617bdbffc02db93d799ef4e303de7e))
* m2o pick modal ([bd9e7c7](https://github.com/martijnmichel/directus-expo/commit/bd9e7c78962c2f057ea6ac2077ac499cb2db06f0))
* minors fixes ([96dbb6d](https://github.com/martijnmichel/directus-expo/commit/96dbb6d51d46e1824d1319ca6a13c66eac237c4a))
* no text on file select ([859a97e](https://github.com/martijnmichel/directus-expo/commit/859a97e4b584e400f29c624d17262fbebef0fc0b))
* o2m input working with pk ([24fec42](https://github.com/martijnmichel/directus-expo/commit/24fec425bfe901525ca4cc5e8c2fb3ebee4187b7))
* o2m sort ([9fe8e0c](https://github.com/martijnmichel/directus-expo/commit/9fe8e0cedd3e0af372ca3fa2b91f0aa93b0cb472))
* pagination & types ([f7e57c4](https://github.com/martijnmichel/directus-expo/commit/f7e57c4b0949373d81febeee7f4324074fd85fb0))
* pagination 2nd page ([62a7074](https://github.com/martijnmichel/directus-expo/commit/62a707477f7a0b9a0c3bb492de4f0a471a2e6765))
* permissions for m2m & m2o ([8a73d02](https://github.com/martijnmichel/directus-expo/commit/8a73d02c4beebdc78a018859bb8a0e45c1db46af))
* positioning of toolbar ([1ab0674](https://github.com/martijnmichel/directus-expo/commit/1ab06746993290116898e56fedb8925f6b19bbf8))
* prevent duplicate raw/detail groups ([5645f4f](https://github.com/martijnmichel/directus-expo/commit/5645f4fce04127fd5f243fcda0edf97c0473cb50))
* repeater doc ([bab8211](https://github.com/martijnmichel/directus-expo/commit/bab8211028dac1a174d4f228d638ab59d937997c))
* repeater items without type & interface selected ([fc20398](https://github.com/martijnmichel/directus-expo/commit/fc2039811cf60bdb2decd87b9b86e0bce81c567e))
* slider working ([b45ae96](https://github.com/martijnmichel/directus-expo/commit/b45ae96466362f81c5691d45d24cea321ed77166))
* sort on m2a new items ([fae070c](https://github.com/martijnmichel/directus-expo/commit/fae070c8bfca074324c5754c3ed45346086bcf7a))
* sort with new items on m2m ([370cba5](https://github.com/martijnmichel/directus-expo/commit/370cba5b2b17241bb4f8e8628aadd9297ab65b40))
* sorting ([71bbf52](https://github.com/martijnmichel/directus-expo/commit/71bbf52807b785b47b8b390a1a27dbf3e5d94d2c))
* styling m2m ([bf442fb](https://github.com/martijnmichel/directus-expo/commit/bf442fb925fd985901eec84b0d02781a233fb6bf))
* translated pages ([445454e](https://github.com/martijnmichel/directus-expo/commit/445454e33f8d40346acae115446fefea6ba321bc))
* translations ([fffad9b](https://github.com/martijnmichel/directus-expo/commit/fffad9b10869d76064e9f537ff8361d4bf9dda29))
* type on usequeryoptions ([caf1dc6](https://github.com/martijnmichel/directus-expo/commit/caf1dc67f5ac2d31302eab9c9d853e63b63f7ca7))


### Features

* added website ([a7096ef](https://github.com/martijnmichel/directus-expo/commit/a7096ef9329041d4c068fcb1729a9f5268e81fd1))
* api key refresh ([dfd97fc](https://github.com/martijnmichel/directus-expo/commit/dfd97fc17e98cac37fe482ef4c519bda18c88271))
* buttons! ([be6cc56](https://github.com/martijnmichel/directus-expo/commit/be6cc569dd01ccc1b66245c7d34adad0efc87a3b))
* collection-item-dropdown ([bf76732](https://github.com/martijnmichel/directus-expo/commit/bf76732152684bc8e9090e228b39f4da51e20bd4))
* CollectionTable thumbnail ([e63fc5c](https://github.com/martijnmichel/directus-expo/commit/e63fc5ca134067f094964b1aae10e89d904f9c37))
* deep nested related value on Table Col ([6339ee6](https://github.com/martijnmichel/directus-expo/commit/6339ee6673c5530384a73da16589dfb047644a8a))
* eas update info ([880f9b0](https://github.com/martijnmichel/directus-expo/commit/880f9b069b086c408b3c55f74f4e58afffd244ac))
* edit m2a ([f2660c9](https://github.com/martijnmichel/directus-expo/commit/f2660c97f73de2063894efaf256f0f40e6564209))
* field value with transform on m20 ([b9c7868](https://github.com/martijnmichel/directus-expo/commit/b9c786879659472d2825741a95c32e6040844c73))
* FieldValue ([84ce801](https://github.com/martijnmichel/directus-expo/commit/84ce8016e69dbf6dd22f09bd8540fcdb24813849))
* file pick modal ([f853992](https://github.com/martijnmichel/directus-expo/commit/f853992b4ff02102dc576af17e743f0df7e859b4))
* file-input ([70ea220](https://github.com/martijnmichel/directus-expo/commit/70ea22066d762dfa2fcf034966fb8a1a88d422a6))
* FileBrowser/File screen ([65a2e8c](https://github.com/martijnmichel/directus-expo/commit/65a2e8ca10f47b378d49638d1badacf82be930ec))
* filter m2a based on current value ([039f6e7](https://github.com/martijnmichel/directus-expo/commit/039f6e7ecb5f30fea728fc93ec2867810fa4b7ba))
* filter o2m based on current value ([57da07a](https://github.com/martijnmichel/directus-expo/commit/57da07a4d50a3ba8652dc01997e432a46b59499e))
* fullscreen on tinymce ([1c3ba24](https://github.com/martijnmichel/directus-expo/commit/1c3ba24ddba8e7f0253195c794be926e28429bb7))
* incepted modals m2m o2m ([5e71f1a](https://github.com/martijnmichel/directus-expo/commit/5e71f1a212338401b41b1c77b7b72a1edc1e85cd))
* instance switch ([9050187](https://github.com/martijnmichel/directus-expo/commit/90501871d149c47f145947ef1636a1b0b6a113ec))
* links to translation modal editor ([6926a55](https://github.com/martijnmichel/directus-expo/commit/6926a557eb619f43656333cabf7699e6fcff19f4))
* m2a nested data in Table and Interface ([9321847](https://github.com/martijnmichel/directus-expo/commit/93218473c20550fcb35b593ec448ef9300c409ec))
* m2o relational ([6f0582a](https://github.com/martijnmichel/directus-expo/commit/6f0582ac7f1b920f026189000a585f60e7ec6696))
* multi files input m2m ([43ca49a](https://github.com/martijnmichel/directus-expo/commit/43ca49a99c5ad02cec25fbc61e0ec6ff44d375a1))
* notice & dividers ([fdeee7a](https://github.com/martijnmichel/directus-expo/commit/fdeee7ad037101d2aff6b72acefabf9b20c93147))
* o2m ([c0e93ba](https://github.com/martijnmichel/directus-expo/commit/c0e93bae729d4be6820f66f90eede1a8a576ee74))
* open translation with compare language ([0feef2b](https://github.com/martijnmichel/directus-expo/commit/0feef2bea918cad2e79cbd7793c5ce490b3672e2))
* pagination @ file select modal ([9d136c3](https://github.com/martijnmichel/directus-expo/commit/9d136c3f636db5aa07b8f6547fef3095ed982588))
* pick language from directus ([90aaa46](https://github.com/martijnmichel/directus-expo/commit/90aaa46c6ea4464c66461e3af6283f2d3e480a9e))
* primary key! ([7eac10f](https://github.com/martijnmichel/directus-expo/commit/7eac10fe0e363eac2dcb9a82826b28c06cfc27cf))
* related datatable column m2m pick ([5798ade](https://github.com/martijnmichel/directus-expo/commit/5798ade1cb19b52a20745f155aebe011a78ce8d1))
* remember i18n locale ([34bfb4e](https://github.com/martijnmichel/directus-expo/commit/34bfb4ed16b84e319842589cc5f9d4d8fcc2dde1))
* remove translation ([9c5e4de](https://github.com/martijnmichel/directus-expo/commit/9c5e4dec63bcaba6f6f6e5e8c3f64d474feeec90))
* reset button ([0df0748](https://github.com/martijnmichel/directus-expo/commit/0df07480c278b2e946004f3d065bef66b12a299d))
* server health ([bdb8809](https://github.com/martijnmichel/directus-expo/commit/bdb880925df20a0ebd320e71a12fc710642c9d6e))
* sticky table header & toolbar ([0f76577](https://github.com/martijnmichel/directus-expo/commit/0f76577970559516303b4f863f44f730a7ce4789))
* tags interface ([969c665](https://github.com/martijnmichel/directus-expo/commit/969c66544338fa56f7c9a3d6b6270d9764735509))
* tinymce webview ([55a44a6](https://github.com/martijnmichel/directus-expo/commit/55a44a6f2d256b1f748960e635ace3d3c7915e30))
* translations! ([fbb4de2](https://github.com/martijnmichel/directus-expo/commit/fbb4de29e62390038218949d420d78e2c328aa7e))
* up ([1251efa](https://github.com/martijnmichel/directus-expo/commit/1251efa43dc810692bf4cc91dd016392e2ec6311))
* update/delete file ([d59d2b7](https://github.com/martijnmichel/directus-expo/commit/d59d2b79be923ab0f0d8d982e43d28d77cb11279))
* upload/import in filebrowser ([85075e9](https://github.com/martijnmichel/directus-expo/commit/85075e93d9f8c15b7cdbeaf3f9b5e146cc0f22b4))


### Performance Improvements

* image browser! ([6ec81ef](https://github.com/martijnmichel/directus-expo/commit/6ec81ef7a378519d4c60e9fd32b647668cd6aec6))
* optimize table queries ([c8d26fd](https://github.com/martijnmichel/directus-expo/commit/c8d26fd6827b868b4ab530e1edc4e81d5cadaeef))
* rewrite o2m input ([36c0df4](https://github.com/martijnmichel/directus-expo/commit/36c0df46945e553cdb16dce7dae7a38a59f3b7a1))


### Reverts

* Revert "rewriting default interface props" ([41a2732](https://github.com/martijnmichel/directus-expo/commit/41a273239f0e4313a63492374a95862902e1ef05))

# [0.9.0](https://github.com/martijnmichel/directus-expo/compare/v0.8.9...v0.9.0) (2026-03-13)


### Bug Fixes

* added required on all interfaces ([ce8a5cb](https://github.com/martijnmichel/directus-expo/commit/ce8a5cb80c6dde3f6f56e7125c6d78414fe2a770))
* added uuid to all related interfaces ([7fb6c6b](https://github.com/martijnmichel/directus-expo/commit/7fb6c6bf3c405936d4827cdd833e861846b668de))
* added uuid to document-editor & m2a ([52b21c4](https://github.com/martijnmichel/directus-expo/commit/52b21c49fb5abc725b54a6d064a9a693806ff879))
* android quickView & bottomSheet ([cda1be0](https://github.com/martijnmichel/directus-expo/commit/cda1be0e99f741f5081668bed89cc4de5ec91766))
* android tabs ([25b730c](https://github.com/martijnmichel/directus-expo/commit/25b730c7b1a01ad81f46ee7fb7bb17e13dc20fb2))
* auto-select new api in loginform ([0bcad2f](https://github.com/martijnmichel/directus-expo/commit/0bcad2f6eacf92335532c8bbd23eafc25a214589))
* better api url error handling and checking ([d9eff61](https://github.com/martijnmichel/directus-expo/commit/d9eff6186315254aa28400cc5da9ca6da4023a98))
* deep nesting related DataTable ([bb810ef](https://github.com/martijnmichel/directus-expo/commit/bb810ef25ec1bea7ae281d115e0515c82c09cc7e))
* detect filled perc from update/create items ([a2be580](https://github.com/martijnmichel/directus-expo/commit/a2be580874ad33d97a95798fd336ab9e5d8cab64))
* disable related query when no items ([03bc213](https://github.com/martijnmichel/directus-expo/commit/03bc213d29f971ee318485596d55b611e9364d74))
* drag-drop in scrollview on android ([eb23ebc](https://github.com/martijnmichel/directus-expo/commit/eb23ebc5cf4a8c296160fdfc2ffab16f632a92d4))
* editor unresponsive after image insert ([b310786](https://github.com/martijnmichel/directus-expo/commit/b310786d2d6b8d3ec672f3faa05428dcf74b1344))
* file-input ([50b350a](https://github.com/martijnmichel/directus-expo/commit/50b350aad37cd799630604369d34cb1a59d80dd0))
* filter m2m based on value ([6e5529e](https://github.com/martijnmichel/directus-expo/commit/6e5529ed3dfdce2787c77751eb3125a406a9857b))
* hash-input ([b0dcfec](https://github.com/martijnmichel/directus-expo/commit/b0dcfecc65413be200fd6ee67406848ee545b4f1))
* layout tabs & crash on no meta collection ([5e349ce](https://github.com/martijnmichel/directus-expo/commit/5e349ce7b0068efd3cce705b72e92f856d3caa46))
* light mode css on tinymce ([65edd01](https://github.com/martijnmichel/directus-expo/commit/65edd0149941e65ccd687d4ddeaa2f9b6f51d0b2))
* logout before remove storage ([c2005bc](https://github.com/martijnmichel/directus-expo/commit/c2005bc2f21a8260ef303dad5674b7ce9d609879))
* m2m correct filter ([d018913](https://github.com/martijnmichel/directus-expo/commit/d018913a66a7ef475150ecc3dea86c4085f9cdf6))
* m2m relation collection ([c372fb8](https://github.com/martijnmichel/directus-expo/commit/c372fb8656617bdbffc02db93d799ef4e303de7e))
* m2o pick modal ([bd9e7c7](https://github.com/martijnmichel/directus-expo/commit/bd9e7c78962c2f057ea6ac2077ac499cb2db06f0))
* minors fixes ([96dbb6d](https://github.com/martijnmichel/directus-expo/commit/96dbb6d51d46e1824d1319ca6a13c66eac237c4a))
* no text on file select ([859a97e](https://github.com/martijnmichel/directus-expo/commit/859a97e4b584e400f29c624d17262fbebef0fc0b))
* o2m input working with pk ([24fec42](https://github.com/martijnmichel/directus-expo/commit/24fec425bfe901525ca4cc5e8c2fb3ebee4187b7))
* o2m sort ([9fe8e0c](https://github.com/martijnmichel/directus-expo/commit/9fe8e0cedd3e0af372ca3fa2b91f0aa93b0cb472))
* pagination & types ([f7e57c4](https://github.com/martijnmichel/directus-expo/commit/f7e57c4b0949373d81febeee7f4324074fd85fb0))
* pagination 2nd page ([62a7074](https://github.com/martijnmichel/directus-expo/commit/62a707477f7a0b9a0c3bb492de4f0a471a2e6765))
* permissions for m2m & m2o ([8a73d02](https://github.com/martijnmichel/directus-expo/commit/8a73d02c4beebdc78a018859bb8a0e45c1db46af))
* positioning of toolbar ([1ab0674](https://github.com/martijnmichel/directus-expo/commit/1ab06746993290116898e56fedb8925f6b19bbf8))
* prevent duplicate raw/detail groups ([5645f4f](https://github.com/martijnmichel/directus-expo/commit/5645f4fce04127fd5f243fcda0edf97c0473cb50))
* repeater doc ([bab8211](https://github.com/martijnmichel/directus-expo/commit/bab8211028dac1a174d4f228d638ab59d937997c))
* repeater items without type & interface selected ([fc20398](https://github.com/martijnmichel/directus-expo/commit/fc2039811cf60bdb2decd87b9b86e0bce81c567e))
* slider working ([b45ae96](https://github.com/martijnmichel/directus-expo/commit/b45ae96466362f81c5691d45d24cea321ed77166))
* sort on m2a new items ([fae070c](https://github.com/martijnmichel/directus-expo/commit/fae070c8bfca074324c5754c3ed45346086bcf7a))
* sort with new items on m2m ([370cba5](https://github.com/martijnmichel/directus-expo/commit/370cba5b2b17241bb4f8e8628aadd9297ab65b40))
* sorting ([71bbf52](https://github.com/martijnmichel/directus-expo/commit/71bbf52807b785b47b8b390a1a27dbf3e5d94d2c))
* styling m2m ([bf442fb](https://github.com/martijnmichel/directus-expo/commit/bf442fb925fd985901eec84b0d02781a233fb6bf))
* translated pages ([445454e](https://github.com/martijnmichel/directus-expo/commit/445454e33f8d40346acae115446fefea6ba321bc))
* translations ([fffad9b](https://github.com/martijnmichel/directus-expo/commit/fffad9b10869d76064e9f537ff8361d4bf9dda29))
* type on usequeryoptions ([caf1dc6](https://github.com/martijnmichel/directus-expo/commit/caf1dc67f5ac2d31302eab9c9d853e63b63f7ca7))


### Features

* added website ([a7096ef](https://github.com/martijnmichel/directus-expo/commit/a7096ef9329041d4c068fcb1729a9f5268e81fd1))
* api key refresh ([dfd97fc](https://github.com/martijnmichel/directus-expo/commit/dfd97fc17e98cac37fe482ef4c519bda18c88271))
* buttons! ([be6cc56](https://github.com/martijnmichel/directus-expo/commit/be6cc569dd01ccc1b66245c7d34adad0efc87a3b))
* collection-item-dropdown ([bf76732](https://github.com/martijnmichel/directus-expo/commit/bf76732152684bc8e9090e228b39f4da51e20bd4))
* CollectionTable thumbnail ([e63fc5c](https://github.com/martijnmichel/directus-expo/commit/e63fc5ca134067f094964b1aae10e89d904f9c37))
* deep nested related value on Table Col ([6339ee6](https://github.com/martijnmichel/directus-expo/commit/6339ee6673c5530384a73da16589dfb047644a8a))
* eas update info ([880f9b0](https://github.com/martijnmichel/directus-expo/commit/880f9b069b086c408b3c55f74f4e58afffd244ac))
* edit m2a ([f2660c9](https://github.com/martijnmichel/directus-expo/commit/f2660c97f73de2063894efaf256f0f40e6564209))
* field value with transform on m20 ([b9c7868](https://github.com/martijnmichel/directus-expo/commit/b9c786879659472d2825741a95c32e6040844c73))
* FieldValue ([84ce801](https://github.com/martijnmichel/directus-expo/commit/84ce8016e69dbf6dd22f09bd8540fcdb24813849))
* file pick modal ([f853992](https://github.com/martijnmichel/directus-expo/commit/f853992b4ff02102dc576af17e743f0df7e859b4))
* file-input ([70ea220](https://github.com/martijnmichel/directus-expo/commit/70ea22066d762dfa2fcf034966fb8a1a88d422a6))
* FileBrowser/File screen ([65a2e8c](https://github.com/martijnmichel/directus-expo/commit/65a2e8ca10f47b378d49638d1badacf82be930ec))
* filter m2a based on current value ([039f6e7](https://github.com/martijnmichel/directus-expo/commit/039f6e7ecb5f30fea728fc93ec2867810fa4b7ba))
* filter o2m based on current value ([57da07a](https://github.com/martijnmichel/directus-expo/commit/57da07a4d50a3ba8652dc01997e432a46b59499e))
* fullscreen on tinymce ([1c3ba24](https://github.com/martijnmichel/directus-expo/commit/1c3ba24ddba8e7f0253195c794be926e28429bb7))
* incepted modals m2m o2m ([5e71f1a](https://github.com/martijnmichel/directus-expo/commit/5e71f1a212338401b41b1c77b7b72a1edc1e85cd))
* instance switch ([9050187](https://github.com/martijnmichel/directus-expo/commit/90501871d149c47f145947ef1636a1b0b6a113ec))
* links to translation modal editor ([6926a55](https://github.com/martijnmichel/directus-expo/commit/6926a557eb619f43656333cabf7699e6fcff19f4))
* m2a nested data in Table and Interface ([9321847](https://github.com/martijnmichel/directus-expo/commit/93218473c20550fcb35b593ec448ef9300c409ec))
* m2o relational ([6f0582a](https://github.com/martijnmichel/directus-expo/commit/6f0582ac7f1b920f026189000a585f60e7ec6696))
* multi files input m2m ([43ca49a](https://github.com/martijnmichel/directus-expo/commit/43ca49a99c5ad02cec25fbc61e0ec6ff44d375a1))
* notice & dividers ([fdeee7a](https://github.com/martijnmichel/directus-expo/commit/fdeee7ad037101d2aff6b72acefabf9b20c93147))
* o2m ([c0e93ba](https://github.com/martijnmichel/directus-expo/commit/c0e93bae729d4be6820f66f90eede1a8a576ee74))
* open translation with compare language ([0feef2b](https://github.com/martijnmichel/directus-expo/commit/0feef2bea918cad2e79cbd7793c5ce490b3672e2))
* pagination @ file select modal ([9d136c3](https://github.com/martijnmichel/directus-expo/commit/9d136c3f636db5aa07b8f6547fef3095ed982588))
* pick language from directus ([90aaa46](https://github.com/martijnmichel/directus-expo/commit/90aaa46c6ea4464c66461e3af6283f2d3e480a9e))
* primary key! ([7eac10f](https://github.com/martijnmichel/directus-expo/commit/7eac10fe0e363eac2dcb9a82826b28c06cfc27cf))
* related datatable column m2m pick ([5798ade](https://github.com/martijnmichel/directus-expo/commit/5798ade1cb19b52a20745f155aebe011a78ce8d1))
* remember i18n locale ([34bfb4e](https://github.com/martijnmichel/directus-expo/commit/34bfb4ed16b84e319842589cc5f9d4d8fcc2dde1))
* remove translation ([9c5e4de](https://github.com/martijnmichel/directus-expo/commit/9c5e4dec63bcaba6f6f6e5e8c3f64d474feeec90))
* reset button ([0df0748](https://github.com/martijnmichel/directus-expo/commit/0df07480c278b2e946004f3d065bef66b12a299d))
* server health ([bdb8809](https://github.com/martijnmichel/directus-expo/commit/bdb880925df20a0ebd320e71a12fc710642c9d6e))
* sticky table header & toolbar ([0f76577](https://github.com/martijnmichel/directus-expo/commit/0f76577970559516303b4f863f44f730a7ce4789))
* tags interface ([969c665](https://github.com/martijnmichel/directus-expo/commit/969c66544338fa56f7c9a3d6b6270d9764735509))
* tinymce webview ([55a44a6](https://github.com/martijnmichel/directus-expo/commit/55a44a6f2d256b1f748960e635ace3d3c7915e30))
* translations! ([fbb4de2](https://github.com/martijnmichel/directus-expo/commit/fbb4de29e62390038218949d420d78e2c328aa7e))
* up ([1251efa](https://github.com/martijnmichel/directus-expo/commit/1251efa43dc810692bf4cc91dd016392e2ec6311))
* update/delete file ([d59d2b7](https://github.com/martijnmichel/directus-expo/commit/d59d2b79be923ab0f0d8d982e43d28d77cb11279))
* upload/import in filebrowser ([85075e9](https://github.com/martijnmichel/directus-expo/commit/85075e93d9f8c15b7cdbeaf3f9b5e146cc0f22b4))


### Performance Improvements

* image browser! ([6ec81ef](https://github.com/martijnmichel/directus-expo/commit/6ec81ef7a378519d4c60e9fd32b647668cd6aec6))
* optimize table queries ([c8d26fd](https://github.com/martijnmichel/directus-expo/commit/c8d26fd6827b868b4ab530e1edc4e81d5cadaeef))
* rewrite o2m input ([36c0df4](https://github.com/martijnmichel/directus-expo/commit/36c0df46945e553cdb16dce7dae7a38a59f3b7a1))


### Reverts

* Revert "rewriting default interface props" ([41a2732](https://github.com/martijnmichel/directus-expo/commit/41a273239f0e4313a63492374a95862902e1ef05))

# [0.9.0](https://github.com/martijnmichel/directus-expo/compare/v0.8.9...v0.9.0) (2026-03-13)


### Bug Fixes

* added required on all interfaces ([ce8a5cb](https://github.com/martijnmichel/directus-expo/commit/ce8a5cb80c6dde3f6f56e7125c6d78414fe2a770))
* added uuid to all related interfaces ([7fb6c6b](https://github.com/martijnmichel/directus-expo/commit/7fb6c6bf3c405936d4827cdd833e861846b668de))
* added uuid to document-editor & m2a ([52b21c4](https://github.com/martijnmichel/directus-expo/commit/52b21c49fb5abc725b54a6d064a9a693806ff879))
* android quickView & bottomSheet ([cda1be0](https://github.com/martijnmichel/directus-expo/commit/cda1be0e99f741f5081668bed89cc4de5ec91766))
* android tabs ([25b730c](https://github.com/martijnmichel/directus-expo/commit/25b730c7b1a01ad81f46ee7fb7bb17e13dc20fb2))
* auto-select new api in loginform ([0bcad2f](https://github.com/martijnmichel/directus-expo/commit/0bcad2f6eacf92335532c8bbd23eafc25a214589))
* better api url error handling and checking ([d9eff61](https://github.com/martijnmichel/directus-expo/commit/d9eff6186315254aa28400cc5da9ca6da4023a98))
* deep nesting related DataTable ([bb810ef](https://github.com/martijnmichel/directus-expo/commit/bb810ef25ec1bea7ae281d115e0515c82c09cc7e))
* detect filled perc from update/create items ([a2be580](https://github.com/martijnmichel/directus-expo/commit/a2be580874ad33d97a95798fd336ab9e5d8cab64))
* disable related query when no items ([03bc213](https://github.com/martijnmichel/directus-expo/commit/03bc213d29f971ee318485596d55b611e9364d74))
* drag-drop in scrollview on android ([eb23ebc](https://github.com/martijnmichel/directus-expo/commit/eb23ebc5cf4a8c296160fdfc2ffab16f632a92d4))
* editor unresponsive after image insert ([b310786](https://github.com/martijnmichel/directus-expo/commit/b310786d2d6b8d3ec672f3faa05428dcf74b1344))
* file-input ([50b350a](https://github.com/martijnmichel/directus-expo/commit/50b350aad37cd799630604369d34cb1a59d80dd0))
* filter m2m based on value ([6e5529e](https://github.com/martijnmichel/directus-expo/commit/6e5529ed3dfdce2787c77751eb3125a406a9857b))
* hash-input ([b0dcfec](https://github.com/martijnmichel/directus-expo/commit/b0dcfecc65413be200fd6ee67406848ee545b4f1))
* layout tabs & crash on no meta collection ([5e349ce](https://github.com/martijnmichel/directus-expo/commit/5e349ce7b0068efd3cce705b72e92f856d3caa46))
* light mode css on tinymce ([65edd01](https://github.com/martijnmichel/directus-expo/commit/65edd0149941e65ccd687d4ddeaa2f9b6f51d0b2))
* logout before remove storage ([c2005bc](https://github.com/martijnmichel/directus-expo/commit/c2005bc2f21a8260ef303dad5674b7ce9d609879))
* m2m correct filter ([d018913](https://github.com/martijnmichel/directus-expo/commit/d018913a66a7ef475150ecc3dea86c4085f9cdf6))
* m2m relation collection ([c372fb8](https://github.com/martijnmichel/directus-expo/commit/c372fb8656617bdbffc02db93d799ef4e303de7e))
* m2o pick modal ([bd9e7c7](https://github.com/martijnmichel/directus-expo/commit/bd9e7c78962c2f057ea6ac2077ac499cb2db06f0))
* minors fixes ([96dbb6d](https://github.com/martijnmichel/directus-expo/commit/96dbb6d51d46e1824d1319ca6a13c66eac237c4a))
* no text on file select ([859a97e](https://github.com/martijnmichel/directus-expo/commit/859a97e4b584e400f29c624d17262fbebef0fc0b))
* o2m input working with pk ([24fec42](https://github.com/martijnmichel/directus-expo/commit/24fec425bfe901525ca4cc5e8c2fb3ebee4187b7))
* o2m sort ([9fe8e0c](https://github.com/martijnmichel/directus-expo/commit/9fe8e0cedd3e0af372ca3fa2b91f0aa93b0cb472))
* pagination & types ([f7e57c4](https://github.com/martijnmichel/directus-expo/commit/f7e57c4b0949373d81febeee7f4324074fd85fb0))
* pagination 2nd page ([62a7074](https://github.com/martijnmichel/directus-expo/commit/62a707477f7a0b9a0c3bb492de4f0a471a2e6765))
* permissions for m2m & m2o ([8a73d02](https://github.com/martijnmichel/directus-expo/commit/8a73d02c4beebdc78a018859bb8a0e45c1db46af))
* positioning of toolbar ([1ab0674](https://github.com/martijnmichel/directus-expo/commit/1ab06746993290116898e56fedb8925f6b19bbf8))
* prevent duplicate raw/detail groups ([5645f4f](https://github.com/martijnmichel/directus-expo/commit/5645f4fce04127fd5f243fcda0edf97c0473cb50))
* repeater doc ([bab8211](https://github.com/martijnmichel/directus-expo/commit/bab8211028dac1a174d4f228d638ab59d937997c))
* repeater items without type & interface selected ([fc20398](https://github.com/martijnmichel/directus-expo/commit/fc2039811cf60bdb2decd87b9b86e0bce81c567e))
* slider working ([b45ae96](https://github.com/martijnmichel/directus-expo/commit/b45ae96466362f81c5691d45d24cea321ed77166))
* sort on m2a new items ([fae070c](https://github.com/martijnmichel/directus-expo/commit/fae070c8bfca074324c5754c3ed45346086bcf7a))
* sort with new items on m2m ([370cba5](https://github.com/martijnmichel/directus-expo/commit/370cba5b2b17241bb4f8e8628aadd9297ab65b40))
* sorting ([71bbf52](https://github.com/martijnmichel/directus-expo/commit/71bbf52807b785b47b8b390a1a27dbf3e5d94d2c))
* styling m2m ([bf442fb](https://github.com/martijnmichel/directus-expo/commit/bf442fb925fd985901eec84b0d02781a233fb6bf))
* translated pages ([445454e](https://github.com/martijnmichel/directus-expo/commit/445454e33f8d40346acae115446fefea6ba321bc))
* translations ([fffad9b](https://github.com/martijnmichel/directus-expo/commit/fffad9b10869d76064e9f537ff8361d4bf9dda29))
* type on usequeryoptions ([caf1dc6](https://github.com/martijnmichel/directus-expo/commit/caf1dc67f5ac2d31302eab9c9d853e63b63f7ca7))


### Features

* added website ([a7096ef](https://github.com/martijnmichel/directus-expo/commit/a7096ef9329041d4c068fcb1729a9f5268e81fd1))
* api key refresh ([dfd97fc](https://github.com/martijnmichel/directus-expo/commit/dfd97fc17e98cac37fe482ef4c519bda18c88271))
* buttons! ([be6cc56](https://github.com/martijnmichel/directus-expo/commit/be6cc569dd01ccc1b66245c7d34adad0efc87a3b))
* collection-item-dropdown ([bf76732](https://github.com/martijnmichel/directus-expo/commit/bf76732152684bc8e9090e228b39f4da51e20bd4))
* CollectionTable thumbnail ([e63fc5c](https://github.com/martijnmichel/directus-expo/commit/e63fc5ca134067f094964b1aae10e89d904f9c37))
* deep nested related value on Table Col ([6339ee6](https://github.com/martijnmichel/directus-expo/commit/6339ee6673c5530384a73da16589dfb047644a8a))
* eas update info ([880f9b0](https://github.com/martijnmichel/directus-expo/commit/880f9b069b086c408b3c55f74f4e58afffd244ac))
* edit m2a ([f2660c9](https://github.com/martijnmichel/directus-expo/commit/f2660c97f73de2063894efaf256f0f40e6564209))
* field value with transform on m20 ([b9c7868](https://github.com/martijnmichel/directus-expo/commit/b9c786879659472d2825741a95c32e6040844c73))
* FieldValue ([84ce801](https://github.com/martijnmichel/directus-expo/commit/84ce8016e69dbf6dd22f09bd8540fcdb24813849))
* file pick modal ([f853992](https://github.com/martijnmichel/directus-expo/commit/f853992b4ff02102dc576af17e743f0df7e859b4))
* file-input ([70ea220](https://github.com/martijnmichel/directus-expo/commit/70ea22066d762dfa2fcf034966fb8a1a88d422a6))
* FileBrowser/File screen ([65a2e8c](https://github.com/martijnmichel/directus-expo/commit/65a2e8ca10f47b378d49638d1badacf82be930ec))
* filter m2a based on current value ([039f6e7](https://github.com/martijnmichel/directus-expo/commit/039f6e7ecb5f30fea728fc93ec2867810fa4b7ba))
* filter o2m based on current value ([57da07a](https://github.com/martijnmichel/directus-expo/commit/57da07a4d50a3ba8652dc01997e432a46b59499e))
* fullscreen on tinymce ([1c3ba24](https://github.com/martijnmichel/directus-expo/commit/1c3ba24ddba8e7f0253195c794be926e28429bb7))
* incepted modals m2m o2m ([5e71f1a](https://github.com/martijnmichel/directus-expo/commit/5e71f1a212338401b41b1c77b7b72a1edc1e85cd))
* instance switch ([9050187](https://github.com/martijnmichel/directus-expo/commit/90501871d149c47f145947ef1636a1b0b6a113ec))
* links to translation modal editor ([6926a55](https://github.com/martijnmichel/directus-expo/commit/6926a557eb619f43656333cabf7699e6fcff19f4))
* m2a nested data in Table and Interface ([9321847](https://github.com/martijnmichel/directus-expo/commit/93218473c20550fcb35b593ec448ef9300c409ec))
* m2o relational ([6f0582a](https://github.com/martijnmichel/directus-expo/commit/6f0582ac7f1b920f026189000a585f60e7ec6696))
* multi files input m2m ([43ca49a](https://github.com/martijnmichel/directus-expo/commit/43ca49a99c5ad02cec25fbc61e0ec6ff44d375a1))
* notice & dividers ([fdeee7a](https://github.com/martijnmichel/directus-expo/commit/fdeee7ad037101d2aff6b72acefabf9b20c93147))
* o2m ([c0e93ba](https://github.com/martijnmichel/directus-expo/commit/c0e93bae729d4be6820f66f90eede1a8a576ee74))
* open translation with compare language ([0feef2b](https://github.com/martijnmichel/directus-expo/commit/0feef2bea918cad2e79cbd7793c5ce490b3672e2))
* pagination @ file select modal ([9d136c3](https://github.com/martijnmichel/directus-expo/commit/9d136c3f636db5aa07b8f6547fef3095ed982588))
* pick language from directus ([90aaa46](https://github.com/martijnmichel/directus-expo/commit/90aaa46c6ea4464c66461e3af6283f2d3e480a9e))
* primary key! ([7eac10f](https://github.com/martijnmichel/directus-expo/commit/7eac10fe0e363eac2dcb9a82826b28c06cfc27cf))
* related datatable column m2m pick ([5798ade](https://github.com/martijnmichel/directus-expo/commit/5798ade1cb19b52a20745f155aebe011a78ce8d1))
* remember i18n locale ([34bfb4e](https://github.com/martijnmichel/directus-expo/commit/34bfb4ed16b84e319842589cc5f9d4d8fcc2dde1))
* remove translation ([9c5e4de](https://github.com/martijnmichel/directus-expo/commit/9c5e4dec63bcaba6f6f6e5e8c3f64d474feeec90))
* reset button ([0df0748](https://github.com/martijnmichel/directus-expo/commit/0df07480c278b2e946004f3d065bef66b12a299d))
* server health ([bdb8809](https://github.com/martijnmichel/directus-expo/commit/bdb880925df20a0ebd320e71a12fc710642c9d6e))
* sticky table header & toolbar ([0f76577](https://github.com/martijnmichel/directus-expo/commit/0f76577970559516303b4f863f44f730a7ce4789))
* tags interface ([969c665](https://github.com/martijnmichel/directus-expo/commit/969c66544338fa56f7c9a3d6b6270d9764735509))
* tinymce webview ([55a44a6](https://github.com/martijnmichel/directus-expo/commit/55a44a6f2d256b1f748960e635ace3d3c7915e30))
* translations! ([fbb4de2](https://github.com/martijnmichel/directus-expo/commit/fbb4de29e62390038218949d420d78e2c328aa7e))
* up ([1251efa](https://github.com/martijnmichel/directus-expo/commit/1251efa43dc810692bf4cc91dd016392e2ec6311))
* update/delete file ([d59d2b7](https://github.com/martijnmichel/directus-expo/commit/d59d2b79be923ab0f0d8d982e43d28d77cb11279))
* upload/import in filebrowser ([85075e9](https://github.com/martijnmichel/directus-expo/commit/85075e93d9f8c15b7cdbeaf3f9b5e146cc0f22b4))


### Performance Improvements

* image browser! ([6ec81ef](https://github.com/martijnmichel/directus-expo/commit/6ec81ef7a378519d4c60e9fd32b647668cd6aec6))
* optimize table queries ([c8d26fd](https://github.com/martijnmichel/directus-expo/commit/c8d26fd6827b868b4ab530e1edc4e81d5cadaeef))
* rewrite o2m input ([36c0df4](https://github.com/martijnmichel/directus-expo/commit/36c0df46945e553cdb16dce7dae7a38a59f3b7a1))


### Reverts

* Revert "rewriting default interface props" ([41a2732](https://github.com/martijnmichel/directus-expo/commit/41a273239f0e4313a63492374a95862902e1ef05))

# [0.9.0](https://github.com/martijnmichel/directus-expo/compare/v0.8.9...v0.9.0) (2026-03-13)


### Bug Fixes

* added required on all interfaces ([ce8a5cb](https://github.com/martijnmichel/directus-expo/commit/ce8a5cb80c6dde3f6f56e7125c6d78414fe2a770))
* added uuid to all related interfaces ([7fb6c6b](https://github.com/martijnmichel/directus-expo/commit/7fb6c6bf3c405936d4827cdd833e861846b668de))
* added uuid to document-editor & m2a ([52b21c4](https://github.com/martijnmichel/directus-expo/commit/52b21c49fb5abc725b54a6d064a9a693806ff879))
* android quickView & bottomSheet ([cda1be0](https://github.com/martijnmichel/directus-expo/commit/cda1be0e99f741f5081668bed89cc4de5ec91766))
* android tabs ([25b730c](https://github.com/martijnmichel/directus-expo/commit/25b730c7b1a01ad81f46ee7fb7bb17e13dc20fb2))
* auto-select new api in loginform ([0bcad2f](https://github.com/martijnmichel/directus-expo/commit/0bcad2f6eacf92335532c8bbd23eafc25a214589))
* better api url error handling and checking ([d9eff61](https://github.com/martijnmichel/directus-expo/commit/d9eff6186315254aa28400cc5da9ca6da4023a98))
* deep nesting related DataTable ([bb810ef](https://github.com/martijnmichel/directus-expo/commit/bb810ef25ec1bea7ae281d115e0515c82c09cc7e))
* detect filled perc from update/create items ([a2be580](https://github.com/martijnmichel/directus-expo/commit/a2be580874ad33d97a95798fd336ab9e5d8cab64))
* disable related query when no items ([03bc213](https://github.com/martijnmichel/directus-expo/commit/03bc213d29f971ee318485596d55b611e9364d74))
* drag-drop in scrollview on android ([eb23ebc](https://github.com/martijnmichel/directus-expo/commit/eb23ebc5cf4a8c296160fdfc2ffab16f632a92d4))
* editor unresponsive after image insert ([b310786](https://github.com/martijnmichel/directus-expo/commit/b310786d2d6b8d3ec672f3faa05428dcf74b1344))
* file-input ([50b350a](https://github.com/martijnmichel/directus-expo/commit/50b350aad37cd799630604369d34cb1a59d80dd0))
* filter m2m based on value ([6e5529e](https://github.com/martijnmichel/directus-expo/commit/6e5529ed3dfdce2787c77751eb3125a406a9857b))
* hash-input ([b0dcfec](https://github.com/martijnmichel/directus-expo/commit/b0dcfecc65413be200fd6ee67406848ee545b4f1))
* layout tabs & crash on no meta collection ([5e349ce](https://github.com/martijnmichel/directus-expo/commit/5e349ce7b0068efd3cce705b72e92f856d3caa46))
* light mode css on tinymce ([65edd01](https://github.com/martijnmichel/directus-expo/commit/65edd0149941e65ccd687d4ddeaa2f9b6f51d0b2))
* logout before remove storage ([c2005bc](https://github.com/martijnmichel/directus-expo/commit/c2005bc2f21a8260ef303dad5674b7ce9d609879))
* m2m correct filter ([d018913](https://github.com/martijnmichel/directus-expo/commit/d018913a66a7ef475150ecc3dea86c4085f9cdf6))
* m2m relation collection ([c372fb8](https://github.com/martijnmichel/directus-expo/commit/c372fb8656617bdbffc02db93d799ef4e303de7e))
* m2o pick modal ([bd9e7c7](https://github.com/martijnmichel/directus-expo/commit/bd9e7c78962c2f057ea6ac2077ac499cb2db06f0))
* minors fixes ([96dbb6d](https://github.com/martijnmichel/directus-expo/commit/96dbb6d51d46e1824d1319ca6a13c66eac237c4a))
* no text on file select ([859a97e](https://github.com/martijnmichel/directus-expo/commit/859a97e4b584e400f29c624d17262fbebef0fc0b))
* o2m input working with pk ([24fec42](https://github.com/martijnmichel/directus-expo/commit/24fec425bfe901525ca4cc5e8c2fb3ebee4187b7))
* o2m sort ([9fe8e0c](https://github.com/martijnmichel/directus-expo/commit/9fe8e0cedd3e0af372ca3fa2b91f0aa93b0cb472))
* pagination & types ([f7e57c4](https://github.com/martijnmichel/directus-expo/commit/f7e57c4b0949373d81febeee7f4324074fd85fb0))
* pagination 2nd page ([62a7074](https://github.com/martijnmichel/directus-expo/commit/62a707477f7a0b9a0c3bb492de4f0a471a2e6765))
* permissions for m2m & m2o ([8a73d02](https://github.com/martijnmichel/directus-expo/commit/8a73d02c4beebdc78a018859bb8a0e45c1db46af))
* positioning of toolbar ([1ab0674](https://github.com/martijnmichel/directus-expo/commit/1ab06746993290116898e56fedb8925f6b19bbf8))
* prevent duplicate raw/detail groups ([5645f4f](https://github.com/martijnmichel/directus-expo/commit/5645f4fce04127fd5f243fcda0edf97c0473cb50))
* repeater doc ([bab8211](https://github.com/martijnmichel/directus-expo/commit/bab8211028dac1a174d4f228d638ab59d937997c))
* repeater items without type & interface selected ([fc20398](https://github.com/martijnmichel/directus-expo/commit/fc2039811cf60bdb2decd87b9b86e0bce81c567e))
* slider working ([b45ae96](https://github.com/martijnmichel/directus-expo/commit/b45ae96466362f81c5691d45d24cea321ed77166))
* sort on m2a new items ([fae070c](https://github.com/martijnmichel/directus-expo/commit/fae070c8bfca074324c5754c3ed45346086bcf7a))
* sort with new items on m2m ([370cba5](https://github.com/martijnmichel/directus-expo/commit/370cba5b2b17241bb4f8e8628aadd9297ab65b40))
* sorting ([71bbf52](https://github.com/martijnmichel/directus-expo/commit/71bbf52807b785b47b8b390a1a27dbf3e5d94d2c))
* styling m2m ([bf442fb](https://github.com/martijnmichel/directus-expo/commit/bf442fb925fd985901eec84b0d02781a233fb6bf))
* translated pages ([445454e](https://github.com/martijnmichel/directus-expo/commit/445454e33f8d40346acae115446fefea6ba321bc))
* translations ([fffad9b](https://github.com/martijnmichel/directus-expo/commit/fffad9b10869d76064e9f537ff8361d4bf9dda29))
* type on usequeryoptions ([caf1dc6](https://github.com/martijnmichel/directus-expo/commit/caf1dc67f5ac2d31302eab9c9d853e63b63f7ca7))


### Features

* added website ([a7096ef](https://github.com/martijnmichel/directus-expo/commit/a7096ef9329041d4c068fcb1729a9f5268e81fd1))
* api key refresh ([dfd97fc](https://github.com/martijnmichel/directus-expo/commit/dfd97fc17e98cac37fe482ef4c519bda18c88271))
* buttons! ([be6cc56](https://github.com/martijnmichel/directus-expo/commit/be6cc569dd01ccc1b66245c7d34adad0efc87a3b))
* collection-item-dropdown ([bf76732](https://github.com/martijnmichel/directus-expo/commit/bf76732152684bc8e9090e228b39f4da51e20bd4))
* CollectionTable thumbnail ([e63fc5c](https://github.com/martijnmichel/directus-expo/commit/e63fc5ca134067f094964b1aae10e89d904f9c37))
* deep nested related value on Table Col ([6339ee6](https://github.com/martijnmichel/directus-expo/commit/6339ee6673c5530384a73da16589dfb047644a8a))
* eas update info ([880f9b0](https://github.com/martijnmichel/directus-expo/commit/880f9b069b086c408b3c55f74f4e58afffd244ac))
* edit m2a ([f2660c9](https://github.com/martijnmichel/directus-expo/commit/f2660c97f73de2063894efaf256f0f40e6564209))
* field value with transform on m20 ([b9c7868](https://github.com/martijnmichel/directus-expo/commit/b9c786879659472d2825741a95c32e6040844c73))
* FieldValue ([84ce801](https://github.com/martijnmichel/directus-expo/commit/84ce8016e69dbf6dd22f09bd8540fcdb24813849))
* file pick modal ([f853992](https://github.com/martijnmichel/directus-expo/commit/f853992b4ff02102dc576af17e743f0df7e859b4))
* file-input ([70ea220](https://github.com/martijnmichel/directus-expo/commit/70ea22066d762dfa2fcf034966fb8a1a88d422a6))
* FileBrowser/File screen ([65a2e8c](https://github.com/martijnmichel/directus-expo/commit/65a2e8ca10f47b378d49638d1badacf82be930ec))
* filter m2a based on current value ([039f6e7](https://github.com/martijnmichel/directus-expo/commit/039f6e7ecb5f30fea728fc93ec2867810fa4b7ba))
* filter o2m based on current value ([57da07a](https://github.com/martijnmichel/directus-expo/commit/57da07a4d50a3ba8652dc01997e432a46b59499e))
* fullscreen on tinymce ([1c3ba24](https://github.com/martijnmichel/directus-expo/commit/1c3ba24ddba8e7f0253195c794be926e28429bb7))
* incepted modals m2m o2m ([5e71f1a](https://github.com/martijnmichel/directus-expo/commit/5e71f1a212338401b41b1c77b7b72a1edc1e85cd))
* instance switch ([9050187](https://github.com/martijnmichel/directus-expo/commit/90501871d149c47f145947ef1636a1b0b6a113ec))
* links to translation modal editor ([6926a55](https://github.com/martijnmichel/directus-expo/commit/6926a557eb619f43656333cabf7699e6fcff19f4))
* m2a nested data in Table and Interface ([9321847](https://github.com/martijnmichel/directus-expo/commit/93218473c20550fcb35b593ec448ef9300c409ec))
* m2o relational ([6f0582a](https://github.com/martijnmichel/directus-expo/commit/6f0582ac7f1b920f026189000a585f60e7ec6696))
* multi files input m2m ([43ca49a](https://github.com/martijnmichel/directus-expo/commit/43ca49a99c5ad02cec25fbc61e0ec6ff44d375a1))
* notice & dividers ([fdeee7a](https://github.com/martijnmichel/directus-expo/commit/fdeee7ad037101d2aff6b72acefabf9b20c93147))
* o2m ([c0e93ba](https://github.com/martijnmichel/directus-expo/commit/c0e93bae729d4be6820f66f90eede1a8a576ee74))
* open translation with compare language ([0feef2b](https://github.com/martijnmichel/directus-expo/commit/0feef2bea918cad2e79cbd7793c5ce490b3672e2))
* pagination @ file select modal ([9d136c3](https://github.com/martijnmichel/directus-expo/commit/9d136c3f636db5aa07b8f6547fef3095ed982588))
* pick language from directus ([90aaa46](https://github.com/martijnmichel/directus-expo/commit/90aaa46c6ea4464c66461e3af6283f2d3e480a9e))
* primary key! ([7eac10f](https://github.com/martijnmichel/directus-expo/commit/7eac10fe0e363eac2dcb9a82826b28c06cfc27cf))
* related datatable column m2m pick ([5798ade](https://github.com/martijnmichel/directus-expo/commit/5798ade1cb19b52a20745f155aebe011a78ce8d1))
* remember i18n locale ([34bfb4e](https://github.com/martijnmichel/directus-expo/commit/34bfb4ed16b84e319842589cc5f9d4d8fcc2dde1))
* remove translation ([9c5e4de](https://github.com/martijnmichel/directus-expo/commit/9c5e4dec63bcaba6f6f6e5e8c3f64d474feeec90))
* reset button ([0df0748](https://github.com/martijnmichel/directus-expo/commit/0df07480c278b2e946004f3d065bef66b12a299d))
* server health ([bdb8809](https://github.com/martijnmichel/directus-expo/commit/bdb880925df20a0ebd320e71a12fc710642c9d6e))
* sticky table header & toolbar ([0f76577](https://github.com/martijnmichel/directus-expo/commit/0f76577970559516303b4f863f44f730a7ce4789))
* tags interface ([969c665](https://github.com/martijnmichel/directus-expo/commit/969c66544338fa56f7c9a3d6b6270d9764735509))
* tinymce webview ([55a44a6](https://github.com/martijnmichel/directus-expo/commit/55a44a6f2d256b1f748960e635ace3d3c7915e30))
* translations! ([fbb4de2](https://github.com/martijnmichel/directus-expo/commit/fbb4de29e62390038218949d420d78e2c328aa7e))
* up ([1251efa](https://github.com/martijnmichel/directus-expo/commit/1251efa43dc810692bf4cc91dd016392e2ec6311))
* update/delete file ([d59d2b7](https://github.com/martijnmichel/directus-expo/commit/d59d2b79be923ab0f0d8d982e43d28d77cb11279))
* upload/import in filebrowser ([85075e9](https://github.com/martijnmichel/directus-expo/commit/85075e93d9f8c15b7cdbeaf3f9b5e146cc0f22b4))


### Performance Improvements

* image browser! ([6ec81ef](https://github.com/martijnmichel/directus-expo/commit/6ec81ef7a378519d4c60e9fd32b647668cd6aec6))
* optimize table queries ([c8d26fd](https://github.com/martijnmichel/directus-expo/commit/c8d26fd6827b868b4ab530e1edc4e81d5cadaeef))
* rewrite o2m input ([36c0df4](https://github.com/martijnmichel/directus-expo/commit/36c0df46945e553cdb16dce7dae7a38a59f3b7a1))


### Reverts

* Revert "rewriting default interface props" ([41a2732](https://github.com/martijnmichel/directus-expo/commit/41a273239f0e4313a63492374a95862902e1ef05))

## [0.8.9](https://github.com/martijnmichel/directus-expo/compare/v0.8.8...v0.8.9) (2026-03-11)


### Bug Fixes

* repeater items without type & interface selected ([bb19b4d](https://github.com/martijnmichel/directus-expo/commit/bb19b4d9b80860cecb11d6d451decb3a96543500))

## [0.8.8](https://github.com/martijnmichel/directus-expo/compare/v0.8.7...v0.8.8) (2026-03-11)


### Features

* m2a nested data in Table and Interface ([58c0bd8](https://github.com/martijnmichel/directus-expo/commit/58c0bd8c381ab607bfad741ab03f5c2689eec1cf))

## [0.8.7](https://github.com/martijnmichel/directus-expo/compare/v0.8.6...v0.8.7) (2026-03-11)


### Features

* deep nested related value on Table Col ([8c0ac2e](https://github.com/martijnmichel/directus-expo/commit/8c0ac2edc132e02000b0add6ccca36505cabb7e7))

## [0.8.6](https://github.com/martijnmichel/directus-expo/compare/v0.8.5...v0.8.6) (2026-03-11)


### Performance Improvements

* optimize table queries ([fad4dc4](https://github.com/martijnmichel/directus-expo/commit/fad4dc433405340dbf67156c369445b1b0393912))

## [0.8.5](https://github.com/martijnmichel/directus-expo/compare/v0.8.4...v0.8.5) (2026-03-11)


### Bug Fixes

* disable related query when no items ([a94c730](https://github.com/martijnmichel/directus-expo/commit/a94c730168a22b20929957c27e9c91721435e0f4))

## [0.8.4](https://github.com/martijnmichel/directus-expo/compare/v0.8.3...v0.8.4) (2026-03-11)


### Features

* m2o relational ([d52fa28](https://github.com/martijnmichel/directus-expo/commit/d52fa28ac408458ad68840c6b78f12566fe14afa))


### Performance Improvements

* rewrite o2m input ([55354d4](https://github.com/martijnmichel/directus-expo/commit/55354d4018e0217ebae7696722577599e3828dfa))

## [0.8.3](https://github.com/martijnmichel/directus-expo/compare/v0.8.2...v0.8.3) (2026-03-11)


### Features

* related datatable column m2m pick ([e588ec1](https://github.com/martijnmichel/directus-expo/commit/e588ec1e7a8115d3f2b82cf7a3574112cd108eb2))

## [0.8.2](https://github.com/martijnmichel/directus-expo/compare/v0.8.1...v0.8.2) (2026-03-11)


### Bug Fixes

* light mode css on tinymce ([105f206](https://github.com/martijnmichel/directus-expo/commit/105f20680a2c18d4ee46c8f7b1ed52218580ae04))

## [0.8.1](https://github.com/martijnmichel/directus-expo/compare/v0.8.0...v0.8.1) (2026-03-11)


### Bug Fixes

* logout before remove storage ([1f878ad](https://github.com/martijnmichel/directus-expo/commit/1f878ad3f04a07ec2322e0decf6c4b1589fc29b8))


### Features

* api key refresh ([34c9873](https://github.com/martijnmichel/directus-expo/commit/34c98732cdd68cdd8a81cc4d787ca0115171b9e2))
* instance switch ([6057eb4](https://github.com/martijnmichel/directus-expo/commit/6057eb40b0955e1b4c546e0f9ab684ded8061bfb))

# [0.8.0](https://github.com/martijnmichel/directus-expo/compare/v0.7.3...v0.8.0) (2026-03-10)


### Bug Fixes

* deep nesting related DataTable ([8219628](https://github.com/martijnmichel/directus-expo/commit/82196286340bab01254e06bb1944e200ecf514ed))

## [0.7.3](https://github.com/martijnmichel/directus-expo/compare/v0.7.2...v0.7.3) (2026-03-10)


### Features

* CollectionTable thumbnail ([085ec52](https://github.com/martijnmichel/directus-expo/commit/085ec5207562b9a16ef7ef94842d50c090e9944a))

## [0.7.2](https://github.com/martijnmichel/directus-expo/compare/v0.7.1...v0.7.2) (2026-03-10)

## [0.7.1](https://github.com/martijnmichel/directus-expo/compare/v0.7.0...v0.7.1) (2025-02-26)

# [0.7.0](https://github.com/martijnmichel/directus-expo/compare/v0.6.21...v0.7.0) (2025-02-15)

## [0.6.21](https://github.com/martijnmichel/directus-expo/compare/v0.6.20...v0.6.21) (2025-02-15)


### Features

* field value with transform on m20 ([774baf2](https://github.com/martijnmichel/directus-expo/commit/774baf29a0e77c82618c8163b1a0e4619283f21c))
* FieldValue ([a40fece](https://github.com/martijnmichel/directus-expo/commit/a40fece61d2e57d4d889c511befabf725dbd99ff))

## [0.6.20](https://github.com/martijnmichel/directus-expo/compare/v0.6.19...v0.6.20) (2025-02-08)


### Bug Fixes

* better api url error handling and checking ([8db0231](https://github.com/martijnmichel/directus-expo/commit/8db0231564990f37015a9642fa5ef35569eb8642))

## [0.6.19](https://github.com/martijnmichel/directus-expo/compare/v0.6.18...v0.6.19) (2025-02-06)


### Bug Fixes

* auto-select new api in loginform ([73f44be](https://github.com/martijnmichel/directus-expo/commit/73f44bea70fc5ea58a5a8537da502c31433a84db))

## [0.6.18](https://github.com/martijnmichel/directus-expo/compare/v0.6.17...v0.6.18) (2025-02-05)


### Features

* buttons! ([5588fbf](https://github.com/martijnmichel/directus-expo/commit/5588fbf5ade5bca5cdf8a113766b3f7d9a9b3045))

## [0.6.17](https://github.com/martijnmichel/directus-expo/compare/v0.6.16...v0.6.17) (2025-02-05)


### Bug Fixes

* detect filled perc from update/create items ([70d934c](https://github.com/martijnmichel/directus-expo/commit/70d934c79977f617ee5c2bc02dbac3b0ce2b3cd4))


### Features

* links to translation modal editor ([ae6a7e2](https://github.com/martijnmichel/directus-expo/commit/ae6a7e2cc515817109b26681556c85d26cbb3316))
* open translation with compare language ([a7f5407](https://github.com/martijnmichel/directus-expo/commit/a7f54075e141e1433efee4f00f809264525ce3e3))
* remove translation ([e579238](https://github.com/martijnmichel/directus-expo/commit/e57923873857d9e8ec6d03edc137163391e9a13d))
* translations! ([474246a](https://github.com/martijnmichel/directus-expo/commit/474246af4885f6bdd9a77bf607f0c27f96775d3c))

## [0.6.16](https://github.com/martijnmichel/directus-expo/compare/v0.6.15...v0.6.16) (2025-02-03)


### Features

* added website ([f228d84](https://github.com/martijnmichel/directus-expo/commit/f228d846d4f13cee446ce99d2cf3a31a1ab0c0e6))

## [0.6.15](https://github.com/martijnmichel/directus-expo/compare/v0.6.14...v0.6.15) (2025-02-03)


### Features

* notice & dividers ([383e35b](https://github.com/martijnmichel/directus-expo/commit/383e35bb4c96d8ec2e034a8324051592210cff5e))

## [0.6.14](https://github.com/martijnmichel/directus-expo/compare/v0.6.13...v0.6.14) (2025-02-03)


### Bug Fixes

* added required on all interfaces ([0fb27d0](https://github.com/martijnmichel/directus-expo/commit/0fb27d0d0b3183e63be25a4c41337a9b348eb2c9))
* drag-drop in scrollview on android ([631b679](https://github.com/martijnmichel/directus-expo/commit/631b67921ead45b0784c0e13eda9377fb34e8ac6))
* no text on file select ([856b9be](https://github.com/martijnmichel/directus-expo/commit/856b9be73b74accb3d37b4691baa8804dbda5197))

## [0.6.13](https://github.com/martijnmichel/directus-expo/compare/v0.6.12...v0.6.13) (2025-02-02)


### Bug Fixes

* o2m sort ([fc83e31](https://github.com/martijnmichel/directus-expo/commit/fc83e311674f3e80fc26aa27de1c29f2356e6645))
* sorting ([3a40b22](https://github.com/martijnmichel/directus-expo/commit/3a40b226da424ac8c2f489ae755352425b74f0ef))

## [0.6.12](https://github.com/martijnmichel/directus-expo/compare/v0.6.11...v0.6.12) (2025-02-02)

## [0.6.11](https://github.com/martijnmichel/directus-expo/compare/v0.6.10...v0.6.11) (2025-02-01)


### Bug Fixes

* added uuid to all related interfaces ([966709b](https://github.com/martijnmichel/directus-expo/commit/966709bad2883665ca2756d428f2d61fd11e96a0))
* added uuid to document-editor & m2a ([d2ffe58](https://github.com/martijnmichel/directus-expo/commit/d2ffe5824fc161f81f79f2f02adff8f9ab5ef2c5))


### Features

* edit m2a ([475bb77](https://github.com/martijnmichel/directus-expo/commit/475bb77284e7fd7062fe8ce71eab0c7c61e29de7))

## [0.6.10](https://github.com/martijnmichel/directus-expo/compare/v0.6.9...v0.6.10) (2025-01-31)


### Features

* pick language from directus ([69332f8](https://github.com/martijnmichel/directus-expo/commit/69332f8a277d0bafd7dc5eb1f1c79d6caf576af6))

## [0.6.9](https://github.com/martijnmichel/directus-expo/compare/v0.6.8...v0.6.9) (2025-01-31)


### Bug Fixes

* sort on m2a new items ([50e12ac](https://github.com/martijnmichel/directus-expo/commit/50e12acf6bdf6d1f03787f8ba4a4cffa002e4db0))
* sort with new items on m2m ([98ccc49](https://github.com/martijnmichel/directus-expo/commit/98ccc49da733c99e620d49ea4a7d6242de04c8cd))


### Features

* filter m2a based on current value ([3b7023d](https://github.com/martijnmichel/directus-expo/commit/3b7023df104ebc13cb4ff20d400624d503f7b206))

## [0.6.8](https://github.com/martijnmichel/directus-expo/compare/v0.6.7...v0.6.8) (2025-01-31)

## [0.6.7](https://github.com/martijnmichel/directus-expo/compare/v0.6.6...v0.6.7) (2025-01-31)


### Features

* filter o2m based on current value ([27e6f35](https://github.com/martijnmichel/directus-expo/commit/27e6f35f101b52936a7ad916ad4fab3556ded59f))

## [0.6.6](https://github.com/martijnmichel/directus-expo/compare/v0.6.5...v0.6.6) (2025-01-31)


### Bug Fixes

* o2m input working with pk ([9f1c1e4](https://github.com/martijnmichel/directus-expo/commit/9f1c1e42022e23403b62c49cf69f9a25a8c4a8ee))

## [0.6.5](https://github.com/martijnmichel/directus-expo/compare/v0.6.4...v0.6.5) (2025-01-29)


### Bug Fixes

* android tabs ([5b208cb](https://github.com/martijnmichel/directus-expo/commit/5b208cb46e1aed7dac1970a1c1da5262e385968d))


### Features

* eas update info ([ddc4baf](https://github.com/martijnmichel/directus-expo/commit/ddc4bafde543fd3acdac3640b7976dedad41a5d7))
* incepted modals m2m o2m ([a2763c5](https://github.com/martijnmichel/directus-expo/commit/a2763c567a7ed206d96a7a575ea3c4b9233c84c2))

## [0.6.4](https://github.com/martijnmichel/directus-expo/compare/v0.6.3...v0.6.4) (2025-01-28)


### Features

* o2m ([0a6eef2](https://github.com/martijnmichel/directus-expo/commit/0a6eef2fab54c0d3e099780e6fb405e617edb87a))

## [0.6.3](https://github.com/martijnmichel/directus-expo/compare/v0.6.2...v0.6.3) (2025-01-28)


### Features

* file pick modal ([a05309b](https://github.com/martijnmichel/directus-expo/commit/a05309b85d12630f3c64804c6dd20eb3b77b0de7))
* pagination @ file select modal ([231d322](https://github.com/martijnmichel/directus-expo/commit/231d3223de28a0a1badd3b10aebcfb1e9b5669aa))

## [0.6.2](https://github.com/martijnmichel/directus-expo/compare/v0.6.1...v0.6.2) (2025-01-27)


### Bug Fixes

* positioning of toolbar ([1cfef1f](https://github.com/martijnmichel/directus-expo/commit/1cfef1f3ed35880cdc15f1adca36e27506a5cc1b))


### Features

* reset button ([63f4173](https://github.com/martijnmichel/directus-expo/commit/63f4173f53d8c7c8517b71d3d0c804506c64c234))

## [0.6.1](https://github.com/martijnmichel/directus-expo/compare/v0.6.0...v0.6.1) (2025-01-27)


### Features

* sticky table header & toolbar ([a8f5879](https://github.com/martijnmichel/directus-expo/commit/a8f58799b541b7a055a1f6d6d87225ca3ffc9260))

# [0.6.0](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.6.0) (2025-01-26)


### Bug Fixes

* editor unresponsive after image insert ([e780713](https://github.com/martijnmichel/directus-expo/commit/e78071307db440e3b8a7f1fdbe274bda0e9e5ba4))
* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* filter m2m based on value ([2238bc0](https://github.com/martijnmichel/directus-expo/commit/2238bc0cd46b13b28b99aa8e88c746e990f6b3c4))
* hash-input ([694fc97](https://github.com/martijnmichel/directus-expo/commit/694fc9703ea875fe0a16e565280b9c0d11a5331d))
* layout tabs & crash on no meta collection ([a4b104c](https://github.com/martijnmichel/directus-expo/commit/a4b104ce291165b68b05d3c65f36e71fc5dea54f))
* m2m correct filter ([6b78e41](https://github.com/martijnmichel/directus-expo/commit/6b78e41ac9ea2962b65c2139d42f2f93fee74da6))
* m2m relation collection ([db2da22](https://github.com/martijnmichel/directus-expo/commit/db2da2221168c64b059dec8b997d768f1ff99aa8))
* m2o pick modal ([be5821b](https://github.com/martijnmichel/directus-expo/commit/be5821b8f68339034903295bdb570baf5f6f761f))
* minors fixes ([a17cfe3](https://github.com/martijnmichel/directus-expo/commit/a17cfe39ffd8c45d4ead4f388f63009219110892))
* pagination & types ([a1fb5ab](https://github.com/martijnmichel/directus-expo/commit/a1fb5abffd4057ae7c578309c33b5fd1131e5221))
* pagination 2nd page ([9942d25](https://github.com/martijnmichel/directus-expo/commit/9942d25137ae81a65db278f97074db5ab4d5ed73))
* prevent duplicate raw/detail groups ([0c45b2d](https://github.com/martijnmichel/directus-expo/commit/0c45b2df19db717553096303e73a8a5e7c12f296))
* slider working ([51d3555](https://github.com/martijnmichel/directus-expo/commit/51d355587a95fc1c46b2f2e90f5f55f8c0f027bb))
* styling m2m ([1d62aed](https://github.com/martijnmichel/directus-expo/commit/1d62aedc47f65ddf20805919685e6cc769cbba00))
* translated pages ([d7c4045](https://github.com/martijnmichel/directus-expo/commit/d7c40450b7a8f348bfbb290b6c6eb33c25b1a413))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))
* type on usequeryoptions ([533930e](https://github.com/martijnmichel/directus-expo/commit/533930ecad00e2a95f8b9660222c1b28c074a545))


### Features

* collection-item-dropdown ([f347b7e](https://github.com/martijnmichel/directus-expo/commit/f347b7e1a4f1696563ab462d7b9e6734b4e26a51))
* primary key! ([799d595](https://github.com/martijnmichel/directus-expo/commit/799d5957378701a3dba9c92b78fd0b8e74f594c3))

# [0.6.0](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.6.0) (2025-01-26)


### Bug Fixes

* editor unresponsive after image insert ([e780713](https://github.com/martijnmichel/directus-expo/commit/e78071307db440e3b8a7f1fdbe274bda0e9e5ba4))
* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* filter m2m based on value ([2238bc0](https://github.com/martijnmichel/directus-expo/commit/2238bc0cd46b13b28b99aa8e88c746e990f6b3c4))
* hash-input ([694fc97](https://github.com/martijnmichel/directus-expo/commit/694fc9703ea875fe0a16e565280b9c0d11a5331d))
* layout tabs & crash on no meta collection ([a4b104c](https://github.com/martijnmichel/directus-expo/commit/a4b104ce291165b68b05d3c65f36e71fc5dea54f))
* m2m correct filter ([6b78e41](https://github.com/martijnmichel/directus-expo/commit/6b78e41ac9ea2962b65c2139d42f2f93fee74da6))
* m2m relation collection ([db2da22](https://github.com/martijnmichel/directus-expo/commit/db2da2221168c64b059dec8b997d768f1ff99aa8))
* m2o pick modal ([be5821b](https://github.com/martijnmichel/directus-expo/commit/be5821b8f68339034903295bdb570baf5f6f761f))
* minors fixes ([a17cfe3](https://github.com/martijnmichel/directus-expo/commit/a17cfe39ffd8c45d4ead4f388f63009219110892))
* pagination & types ([a1fb5ab](https://github.com/martijnmichel/directus-expo/commit/a1fb5abffd4057ae7c578309c33b5fd1131e5221))
* pagination 2nd page ([9942d25](https://github.com/martijnmichel/directus-expo/commit/9942d25137ae81a65db278f97074db5ab4d5ed73))
* prevent duplicate raw/detail groups ([0c45b2d](https://github.com/martijnmichel/directus-expo/commit/0c45b2df19db717553096303e73a8a5e7c12f296))
* slider working ([51d3555](https://github.com/martijnmichel/directus-expo/commit/51d355587a95fc1c46b2f2e90f5f55f8c0f027bb))
* styling m2m ([1d62aed](https://github.com/martijnmichel/directus-expo/commit/1d62aedc47f65ddf20805919685e6cc769cbba00))
* translated pages ([d7c4045](https://github.com/martijnmichel/directus-expo/commit/d7c40450b7a8f348bfbb290b6c6eb33c25b1a413))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))
* type on usequeryoptions ([533930e](https://github.com/martijnmichel/directus-expo/commit/533930ecad00e2a95f8b9660222c1b28c074a545))


### Features

* collection-item-dropdown ([f347b7e](https://github.com/martijnmichel/directus-expo/commit/f347b7e1a4f1696563ab462d7b9e6734b4e26a51))
* primary key! ([799d595](https://github.com/martijnmichel/directus-expo/commit/799d5957378701a3dba9c92b78fd0b8e74f594c3))

# [0.6.0](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.6.0) (2025-01-25)


### Bug Fixes

* editor unresponsive after image insert ([e780713](https://github.com/martijnmichel/directus-expo/commit/e78071307db440e3b8a7f1fdbe274bda0e9e5ba4))
* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* filter m2m based on value ([2238bc0](https://github.com/martijnmichel/directus-expo/commit/2238bc0cd46b13b28b99aa8e88c746e990f6b3c4))
* hash-input ([694fc97](https://github.com/martijnmichel/directus-expo/commit/694fc9703ea875fe0a16e565280b9c0d11a5331d))
* layout tabs & crash on no meta collection ([a4b104c](https://github.com/martijnmichel/directus-expo/commit/a4b104ce291165b68b05d3c65f36e71fc5dea54f))
* m2m correct filter ([6b78e41](https://github.com/martijnmichel/directus-expo/commit/6b78e41ac9ea2962b65c2139d42f2f93fee74da6))
* m2m relation collection ([db2da22](https://github.com/martijnmichel/directus-expo/commit/db2da2221168c64b059dec8b997d768f1ff99aa8))
* m2o pick modal ([be5821b](https://github.com/martijnmichel/directus-expo/commit/be5821b8f68339034903295bdb570baf5f6f761f))
* minors fixes ([a17cfe3](https://github.com/martijnmichel/directus-expo/commit/a17cfe39ffd8c45d4ead4f388f63009219110892))
* prevent duplicate raw/detail groups ([0c45b2d](https://github.com/martijnmichel/directus-expo/commit/0c45b2df19db717553096303e73a8a5e7c12f296))
* slider working ([51d3555](https://github.com/martijnmichel/directus-expo/commit/51d355587a95fc1c46b2f2e90f5f55f8c0f027bb))
* styling m2m ([1d62aed](https://github.com/martijnmichel/directus-expo/commit/1d62aedc47f65ddf20805919685e6cc769cbba00))
* translated pages ([d7c4045](https://github.com/martijnmichel/directus-expo/commit/d7c40450b7a8f348bfbb290b6c6eb33c25b1a413))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))


### Features

* collection-item-dropdown ([f347b7e](https://github.com/martijnmichel/directus-expo/commit/f347b7e1a4f1696563ab462d7b9e6734b4e26a51))
* primary key! ([799d595](https://github.com/martijnmichel/directus-expo/commit/799d5957378701a3dba9c92b78fd0b8e74f594c3))

## [0.5.1](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.5.1) (2025-01-24)


### Bug Fixes

* editor unresponsive after image insert ([e780713](https://github.com/martijnmichel/directus-expo/commit/e78071307db440e3b8a7f1fdbe274bda0e9e5ba4))
* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* hash-input ([694fc97](https://github.com/martijnmichel/directus-expo/commit/694fc9703ea875fe0a16e565280b9c0d11a5331d))
* layout tabs & crash on no meta collection ([a4b104c](https://github.com/martijnmichel/directus-expo/commit/a4b104ce291165b68b05d3c65f36e71fc5dea54f))
* m2m relation collection ([db2da22](https://github.com/martijnmichel/directus-expo/commit/db2da2221168c64b059dec8b997d768f1ff99aa8))
* m2o pick modal ([be5821b](https://github.com/martijnmichel/directus-expo/commit/be5821b8f68339034903295bdb570baf5f6f761f))
* minors fixes ([a17cfe3](https://github.com/martijnmichel/directus-expo/commit/a17cfe39ffd8c45d4ead4f388f63009219110892))
* prevent duplicate raw/detail groups ([0c45b2d](https://github.com/martijnmichel/directus-expo/commit/0c45b2df19db717553096303e73a8a5e7c12f296))
* slider working ([51d3555](https://github.com/martijnmichel/directus-expo/commit/51d355587a95fc1c46b2f2e90f5f55f8c0f027bb))
* translated pages ([d7c4045](https://github.com/martijnmichel/directus-expo/commit/d7c40450b7a8f348bfbb290b6c6eb33c25b1a413))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))


### Features

* collection-item-dropdown ([f347b7e](https://github.com/martijnmichel/directus-expo/commit/f347b7e1a4f1696563ab462d7b9e6734b4e26a51))

## [0.5.1](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.5.1) (2025-01-24)


### Bug Fixes

* editor unresponsive after image insert ([e780713](https://github.com/martijnmichel/directus-expo/commit/e78071307db440e3b8a7f1fdbe274bda0e9e5ba4))
* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* hash-input ([694fc97](https://github.com/martijnmichel/directus-expo/commit/694fc9703ea875fe0a16e565280b9c0d11a5331d))
* layout tabs & crash on no meta collection ([a4b104c](https://github.com/martijnmichel/directus-expo/commit/a4b104ce291165b68b05d3c65f36e71fc5dea54f))
* m2m relation collection ([db2da22](https://github.com/martijnmichel/directus-expo/commit/db2da2221168c64b059dec8b997d768f1ff99aa8))
* m2o pick modal ([be5821b](https://github.com/martijnmichel/directus-expo/commit/be5821b8f68339034903295bdb570baf5f6f761f))
* minors fixes ([a17cfe3](https://github.com/martijnmichel/directus-expo/commit/a17cfe39ffd8c45d4ead4f388f63009219110892))
* prevent duplicate raw/detail groups ([0c45b2d](https://github.com/martijnmichel/directus-expo/commit/0c45b2df19db717553096303e73a8a5e7c12f296))
* slider working ([51d3555](https://github.com/martijnmichel/directus-expo/commit/51d355587a95fc1c46b2f2e90f5f55f8c0f027bb))
* translated pages ([d7c4045](https://github.com/martijnmichel/directus-expo/commit/d7c40450b7a8f348bfbb290b6c6eb33c25b1a413))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))

## [0.5.1](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.5.1) (2025-01-24)


### Bug Fixes

* editor unresponsive after image insert ([e780713](https://github.com/martijnmichel/directus-expo/commit/e78071307db440e3b8a7f1fdbe274bda0e9e5ba4))
* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* hash-input ([694fc97](https://github.com/martijnmichel/directus-expo/commit/694fc9703ea875fe0a16e565280b9c0d11a5331d))
* layout tabs & crash on no meta collection ([a4b104c](https://github.com/martijnmichel/directus-expo/commit/a4b104ce291165b68b05d3c65f36e71fc5dea54f))
* m2m relation collection ([db2da22](https://github.com/martijnmichel/directus-expo/commit/db2da2221168c64b059dec8b997d768f1ff99aa8))
* minors fixes ([a17cfe3](https://github.com/martijnmichel/directus-expo/commit/a17cfe39ffd8c45d4ead4f388f63009219110892))
* prevent duplicate raw/detail groups ([0c45b2d](https://github.com/martijnmichel/directus-expo/commit/0c45b2df19db717553096303e73a8a5e7c12f296))
* slider working ([51d3555](https://github.com/martijnmichel/directus-expo/commit/51d355587a95fc1c46b2f2e90f5f55f8c0f027bb))
* translated pages ([d7c4045](https://github.com/martijnmichel/directus-expo/commit/d7c40450b7a8f348bfbb290b6c6eb33c25b1a413))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))

## [0.5.1](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.5.1) (2025-01-24)


### Bug Fixes

* editor unresponsive after image insert ([e780713](https://github.com/martijnmichel/directus-expo/commit/e78071307db440e3b8a7f1fdbe274bda0e9e5ba4))
* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* layout tabs & crash on no meta collection ([a4b104c](https://github.com/martijnmichel/directus-expo/commit/a4b104ce291165b68b05d3c65f36e71fc5dea54f))
* m2m relation collection ([db2da22](https://github.com/martijnmichel/directus-expo/commit/db2da2221168c64b059dec8b997d768f1ff99aa8))
* minors fixes ([a17cfe3](https://github.com/martijnmichel/directus-expo/commit/a17cfe39ffd8c45d4ead4f388f63009219110892))
* prevent duplicate raw/detail groups ([0c45b2d](https://github.com/martijnmichel/directus-expo/commit/0c45b2df19db717553096303e73a8a5e7c12f296))
* translated pages ([d7c4045](https://github.com/martijnmichel/directus-expo/commit/d7c40450b7a8f348bfbb290b6c6eb33c25b1a413))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))

## [0.5.1](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.5.1) (2025-01-23)


### Bug Fixes

* editor unresponsive after image insert ([e780713](https://github.com/martijnmichel/directus-expo/commit/e78071307db440e3b8a7f1fdbe274bda0e9e5ba4))
* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* prevent duplicate raw/detail groups ([0c45b2d](https://github.com/martijnmichel/directus-expo/commit/0c45b2df19db717553096303e73a8a5e7c12f296))
* translated pages ([d7c4045](https://github.com/martijnmichel/directus-expo/commit/d7c40450b7a8f348bfbb290b6c6eb33c25b1a413))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))

## [0.5.1](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.5.1) (2025-01-23)


### Bug Fixes

* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))
* translations ([d841119](https://github.com/martijnmichel/directus-expo/commit/d841119165aaf7cb9c25d41156595022bc0b8bcb))

## [0.5.1](https://github.com/martijnmichel/directus-expo/compare/v0.5.0...v0.5.1) (2025-01-23)


### Bug Fixes

* file-input ([46ba557](https://github.com/martijnmichel/directus-expo/commit/46ba5578d8e094c4ad1f6da7ed791d6282fb469b))

# [0.5.0](https://github.com/martijnmichel/directus-expo/compare/v0.4.0...v0.5.0) (2025-01-22)


### Features

* multi files input m2m ([ed3ce22](https://github.com/martijnmichel/directus-expo/commit/ed3ce2289e046c7a3a3f905f29fa5bea8297eba8))

# [0.4.0](https://github.com/martijnmichel/directus-expo/compare/v0.3.2...v0.4.0) (2025-01-22)


### Features

* file-input ([ebbc9ae](https://github.com/martijnmichel/directus-expo/commit/ebbc9ae8066791d35349ccc81be16dad1bc66d4f))

## [0.3.2](https://github.com/martijnmichel/directus-expo/compare/v0.3.1...v0.3.2) (2025-01-22)


### Bug Fixes

* repeater doc ([7b28b9a](https://github.com/martijnmichel/directus-expo/commit/7b28b9a25194096c763feac28c638c4c5f93e66a))


### Features

* remember i18n locale ([3056f4d](https://github.com/martijnmichel/directus-expo/commit/3056f4dee792fe0b9676a49429a1d937e43a4aac))
* server health ([ec16614](https://github.com/martijnmichel/directus-expo/commit/ec166146d8bc36e675db2ca0af4284f40e3b4d2b))
* tags interface ([a7016f1](https://github.com/martijnmichel/directus-expo/commit/a7016f136bf8818565c487c48b01158bee554b32))

## [0.3.1](https://github.com/martijnmichel/directus-expo/compare/v0.3.0...v0.3.1) (2025-01-22)


### Bug Fixes

* android quickView & bottomSheet ([448c7a6](https://github.com/martijnmichel/directus-expo/commit/448c7a6c92eae18439b17cfe9d7a1724d619fda3))

# [0.3.0](https://github.com/martijnmichel/directus-expo/compare/v0.2.3...v0.3.0) (2025-01-21)


### Features

* upload/import in filebrowser ([58b38cb](https://github.com/martijnmichel/directus-expo/commit/58b38cb763c85768fb31439fa374703e472c928b))


### Performance Improvements

* image browser! ([f5584ae](https://github.com/martijnmichel/directus-expo/commit/f5584ae7d74683a59b9e9189559c76bffb764dad))

## [0.2.3](https://github.com/martijnmichel/directus-expo/compare/v0.2.2...v0.2.3) (2025-01-21)


### Features

* update/delete file ([e9ce136](https://github.com/martijnmichel/directus-expo/commit/e9ce136de3d759089256119fc198720fd4f2e6a6))

## [0.2.2](https://github.com/martijnmichel/directus-expo/compare/v0.2.1...v0.2.2) (2025-01-21)


### Features

* FileBrowser/File screen ([709501d](https://github.com/martijnmichel/directus-expo/commit/709501d930ed50712c6acfa10000020d886241b4))

## [0.2.1](https://github.com/martijnmichel/directus-expo/compare/v0.2.0...v0.2.1) (2025-01-20)


### Features

* fullscreen on tinymce ([017b2f5](https://github.com/martijnmichel/directus-expo/commit/017b2f5789ac41caedbb51a89c642a919fbea7f6))
* tinymce webview ([689016f](https://github.com/martijnmichel/directus-expo/commit/689016f3922e7b41708335f0f75b3f7f8551520a))

# [0.2.0](https://github.com/martijnmichel/directus-expo/compare/v0.1.1...v0.2.0) (2025-01-18)
