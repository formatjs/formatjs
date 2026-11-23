#!/usr/bin/env bash
set -euo pipefail

script="$TEST_TMPDIR/default_locale.js"
{
  printf 'Intl.NumberFormat.__addLocaleData(JSON.stringify('
  cat "$2"
  cat <<'JS'
));
function equal(actual, expected) {
  if (actual !== expected) throw new Error('Expected ' + expected + ', got ' + actual);
}
for (var matcher of ['lookup', 'best fit']) {
  equal(new Intl.NumberFormat(undefined, {localeMatcher: matcher}).resolvedOptions().locale, 'en');
}
JS
  printf 'Intl.NumberFormat.__addLocaleData(JSON.stringify('
  cat "$3"
  cat <<'JS'
));
for (var matcher of ['lookup', 'best fit']) {
  var options = {localeMatcher: matcher};
  equal(new Intl.NumberFormat(undefined, options).resolvedOptions().locale, hostLocale);
  equal(new Intl.NumberFormat(hostLocale, options).resolvedOptions().locale, hostLocale);
  equal(new Intl.Collator(undefined, options).resolvedOptions().locale, hostLocale);
  equal(new Intl.NumberFormat(regionLocale, options).resolvedOptions().locale, regionLocale);
  equal(new Intl.Collator(regionLocale, options).resolvedOptions().locale, regionLocale);
  equal(new Intl.NumberFormat('en', options).resolvedOptions().locale, 'en');
}
equal(new Intl.NumberFormat('zxx', {localeMatcher: 'lookup'}).resolvedOptions().locale, hostLocale);
equal(Intl.NumberFormat.supportedLocalesOf(['zxx'], {localeMatcher: 'lookup'}).length, 0);
equal(new Intl.Segmenter().resolvedOptions().locale, hostLocale);
JS
} > "$script"

runner=$1
host="$TEST_TMPDIR/host.js"
check_locale() {
  printf 'var hostLocale = "%s", regionLocale = "%s";\n' "$4" "${5:-$4}" > "$host"
  env "LC_ALL=$1" "LC_MESSAGES=$2" "LANG=$3" \
    "$runner" --native-numberformat --native-segmenter --native-collator "$host" "$script"
}

check_locale fr_FR.UTF-8 en_US.UTF-8 en_US.UTF-8 fr-FR
check_locale '' fr_CA.UTF-8 en_US.UTF-8 fr-CA
check_locale '' '' fr_FR.UTF-8 fr-FR
check_locale fr_Latn_CA.UTF-8 en_US.UTF-8 en_US.UTF-8 fr-Latn-CA fr-CA

cat > "$host" <<'JS'
for (const locale of [undefined, 'sv-US']) {
  const collator = new Intl.Collator(locale, {localeMatcher: 'lookup'});
  const {locale: resolved, collation} = collator.resolvedOptions();
  if (resolved !== 'sv-US' || collation !== 'default' || collator.compare('z', 'å') >= 0) {
    throw new Error('Expected Swedish collation for the sv-US host locale');
  }
}
JS
env LC_ALL=sv_US.UTF-8 "$runner" --native-collator "$host"
