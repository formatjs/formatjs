#include <formatjs/intl/datetimeformat.h>
#include <formatjs/intl/datetimeformat_calendars.h>
#include <cstdlib>
#include <cstring>
#include <string>

static void check(bool value) { if (!value) std::abort(); }
static const uint8_t *bytes(const char *value) {
  return reinterpret_cast<const uint8_t *>(value);
}
static int32_t calendar(void *, int64_t, FormatjsDateTimeBorrowed *out) {
  static const char response[] = "{\"era\":\"AD\",\"year\":2000,\"month\":0,\"day\":1}";
  *out = {bytes(response), std::strlen(response)};
  return 0;
}
static void release(void *context) { ++*static_cast<int *>(context); }
int main() {
  FormatjsDateTimeRegistry *registry = nullptr;
  check(formatjs_datetime_registry_create(&registry) == 0 && registry);
  const char zone[] = "\"+05:30\"";
  check(formatjs_datetime_registry_zone(registry, bytes(zone), std::strlen(zone)) == 0);
  FormatjsDateTimeBytes info{nullptr, 0};
  check(formatjs_datetime_registry_info(registry, &info) == 0);
  std::string text(reinterpret_cast<const char *>(info.data), info.len);
  check(text.find("\"timeZone\":\"+05:30\"") != std::string::npos);
  formatjs_datetime_bytes_free(info);
  int releases = 0;
  check(formatjs_datetime_registry_calendar(registry, bytes("custom"), 6, &releases, calendar, release) == 0);
  const char provider[] = "{\"calendar\":\"hebrew\"}";
  check(formatjs_datetime_calendar_load(registry, bytes(provider), std::strlen(provider)) == 0);
  FormatjsDateTimeConstruction *construction = nullptr;
  check(formatjs_datetime_begin(registry, &construction) == 0 && construction);
  const char locales[] = "{\"locales\":[],\"options\":{}}";
  check(formatjs_datetime_resolve(construction, bytes(locales), std::strlen(locales)) == 1);
  check(formatjs_datetime_capture(construction, bytes("{}"), 2) == 2);
  formatjs_datetime_construction_destroy(construction);
  formatjs_datetime_registry_destroy(registry);
  check(releases == 1);
  check(formatjs_datetime_registry_calendar(nullptr, bytes("custom"), 6, &releases, calendar, release) == 2);
  check(releases == 2);
  return 0;
}
