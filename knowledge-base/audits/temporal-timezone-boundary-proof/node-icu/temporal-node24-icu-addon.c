#define _GNU_SOURCE
#include <dlfcn.h>
#include <node_api.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>

typedef enum { POINTER, I32, I8, I64, F64, VOID } Type;
typedef union {
  void *pointer;
  int32_t i32;
  int64_t i64;
  double f64;
} Value;

#define SIG(r,a,b,c,d,e) (((((r)*8+(a))*8+(b))*8+(c))*8+(d))*8+(e)
typedef struct {
  const char *name;
  unsigned signature;
} Symbol;

static const Symbol symbols[] = {
    {"ucal_getTZDataVersion_78", SIG(POINTER, POINTER, VOID, VOID, VOID, VOID)},
    {"ucal_openTimeZones_78", SIG(POINTER, POINTER, VOID, VOID, VOID, VOID)},
    {"uenum_count_78", SIG(I32, POINTER, POINTER, VOID, VOID, VOID)},
    {"uenum_next_78", SIG(POINTER, POINTER, POINTER, POINTER, VOID, VOID)},
    {"uenum_close_78", SIG(VOID, POINTER, VOID, VOID, VOID, VOID)},
    {"ucal_open_78", SIG(POINTER, POINTER, I32, POINTER, I32, POINTER)},
    {"ucal_close_78", SIG(VOID, POINTER, VOID, VOID, VOID, VOID)},
    {"ucal_setMillis_78", SIG(VOID, POINTER, F64, POINTER, VOID, VOID)},
    {"ucal_getMillis_78", SIG(F64, POINTER, POINTER, VOID, VOID, VOID)},
    {"ucal_getTimeZoneTransitionDate_78", SIG(I8, POINTER, I32, POINTER, POINTER, VOID)},
    {"ucal_get_78", SIG(I32, POINTER, I32, POINTER, VOID, VOID)},
    {"ucal_getTimeZoneID_78", SIG(I32, POINTER, POINTER, I32, POINTER, VOID)},
    {"_ZNK6icu_788Calendar11getTimeZoneEv", SIG(POINTER, POINTER, VOID, VOID, VOID, VOID)},
    {"__dynamic_cast", SIG(POINTER, POINTER, POINTER, POINTER, I64, VOID)},
    {"_ZTIN6icu_788TimeZoneE", 0},
    {"_ZTIN6icu_7813BasicTimeZoneE", 0},
    {"_ZTIN6icu_7813OlsonTimeZoneE", 0},
    {"_ZTIN6icu_7812TimeZoneRuleE", 0},
    {"_ZTIN6icu_7821TimeArrayTimeZoneRuleE", 0},
    {"_ZTIN6icu_7818AnnualTimeZoneRuleE", 0},
    {"_ZNK6icu_7813OlsonTimeZone20countTransitionRulesER10UErrorCode", SIG(I32, POINTER, POINTER, VOID, VOID, VOID)},
    {"_ZNK6icu_7813OlsonTimeZone16getTimeZoneRulesERPKNS_19InitialTimeZoneRuleEPPKNS_12TimeZoneRuleERiR10UErrorCode", SIG(VOID, POINTER, POINTER, POINTER, POINTER, POINTER)},
    {"_ZNK6icu_7812TimeZoneRule12getRawOffsetEv", SIG(I32, POINTER, VOID, VOID, VOID, VOID)},
    {"_ZNK6icu_7812TimeZoneRule13getDSTSavingsEv", SIG(I32, POINTER, VOID, VOID, VOID, VOID)},
    {"_ZNK6icu_7821TimeArrayTimeZoneRule15countStartTimesEv", SIG(I32, POINTER, VOID, VOID, VOID, VOID)},
    {"_ZNK6icu_7821TimeArrayTimeZoneRule14getStartTimeAtEiRd", SIG(I8, POINTER, I32, POINTER, VOID, VOID)},
    {"_ZNK6icu_7821TimeArrayTimeZoneRule11getTimeTypeEv", SIG(I32, POINTER, VOID, VOID, VOID, VOID)},
    {"_ZNK6icu_7818AnnualTimeZoneRule12getStartYearEv", SIG(I32, POINTER, VOID, VOID, VOID, VOID)},
    {"_ZNK6icu_7818AnnualTimeZoneRule14getStartInYearEiiiRd", SIG(I8, POINTER, I32, I32, I32, POINTER)},
    {"_ZNK6icu_7818AnnualTimeZoneRule10getEndYearEv", SIG(I32, POINTER, VOID, VOID, VOID, VOID)},
};

static Type read_type(napi_env env, napi_value value) {
  char name[16];
  napi_get_value_string_utf8(env, value, name, sizeof name, NULL);
  if (!strcmp(name, "pointer")) return POINTER;
  if (!strcmp(name, "i32")) return I32;
  if (!strcmp(name, "i8")) return I8;
  if (!strcmp(name, "i64")) return I64;
  if (!strcmp(name, "f64")) return F64;
  return VOID;
}

static void *read_pointer(napi_env env, napi_value value) {
  bool buffer = false;
  napi_is_buffer(env, value, &buffer);
  if (buffer) {
    void *bytes = NULL;
    napi_get_buffer_info(env, value, &bytes, NULL);
    return bytes;
  }
  uint64_t address = 0;
  bool lossless = false;
  napi_get_value_bigint_uint64(env, value, &address, &lossless);
  return (void *)(uintptr_t)address;
}

static napi_value read_string(napi_env env, napi_callback_info info) {
  size_t count = 1;
  napi_value arguments[1], result;
  napi_get_cb_info(env, info, &count, arguments, NULL, NULL);
  napi_create_string_utf8(env, read_pointer(env, arguments[0]), NAPI_AUTO_LENGTH, &result);
  return result;
}

static void *get_symbol(napi_env env, napi_value name_value, unsigned signature, bool calling) {
  char name[192];
  napi_get_value_string_utf8(env, name_value, name, sizeof name, NULL);
  const Symbol *entry = NULL;
  for (size_t index = 0; index < sizeof symbols / sizeof symbols[0]; index++) {
    if (!strcmp(name, symbols[index].name)) {
      entry = &symbols[index];
      break;
    }
  }
  if (!entry || (calling && (!entry->signature || entry->signature != signature))) {
    napi_throw_error(env, NULL, "Unexpected ICU proof symbol or signature");
    return NULL;
  }
  void *address = dlsym(RTLD_DEFAULT, name);
  if (!address) {
    napi_throw_error(env, NULL, name);
    return NULL;
  }
  if (strcmp(name, "__dynamic_cast")) {
    Dl_info info;
    struct stat provider, executable;
    if (!dladdr(address, &info) || stat(info.dli_fname, &provider) ||
        stat("/proc/self/exe", &executable) || provider.st_dev != executable.st_dev ||
        provider.st_ino != executable.st_ino) {
      napi_throw_error(env, NULL, "ICU symbol is outside the bound Node executable");
      return NULL;
    }
  }
  return address;
}

static napi_value symbol(napi_env env, napi_callback_info info) {
  size_t count = 1;
  napi_value arguments[1], result;
  napi_get_cb_info(env, info, &count, arguments, NULL, NULL);
  void *address = get_symbol(env, arguments[0], 0, false);
  if (!address) return NULL;
  napi_create_bigint_uint64(env, (uintptr_t)address, &result);
  return result;
}

static napi_value call(napi_env env, napi_callback_info info) {
  size_t count = 8;
  napi_value arguments[8], result;
  napi_get_cb_info(env, info, &count, arguments, NULL, NULL);
  Type result_type = read_type(env, arguments[1]);
  uint32_t argc = 0;
  napi_get_array_length(env, arguments[2], &argc);
  if (argc != count - 3 || argc > 5) return NULL;
  Type type[5] = {VOID, VOID, VOID, VOID, VOID};
  Value value[5] = {0}, out = {0};
  for (uint32_t index = 0; index < argc; index++) {
    napi_value type_value;
    napi_get_element(env, arguments[2], index, &type_value);
    type[index] = read_type(env, type_value);
    napi_value argument = arguments[index + 3];
    bool lossless = false;
    switch (type[index]) {
      case POINTER: value[index].pointer = read_pointer(env, argument); break;
      case I8:
      case I32: napi_get_value_int32(env, argument, &value[index].i32); break;
      case I64: napi_get_value_bigint_int64(env, argument, &value[index].i64, &lossless); break;
      case F64: napi_get_value_double(env, argument, &value[index].f64); break;
      case VOID: return NULL;
    }
  }

  /* Only the exact signatures used by the proof scripts are needed. */
  unsigned signature = result_type;
  for (size_t index = 0; index < 5; index++) signature = signature * 8 + type[index];
  void *fn = get_symbol(env, arguments[0], signature, true);
  if (!fn) return NULL;
#define P(i) value[i].pointer
#define I(i) value[i].i32
#define L(i) value[i].i64
#define F(i) value[i].f64
  switch (signature) {
    case SIG(POINTER,POINTER,VOID,VOID,VOID,VOID): out.pointer = ((void *(*)(void *))fn)(P(0)); break;
    case SIG(POINTER,POINTER,POINTER,POINTER,VOID,VOID): out.pointer = ((void *(*)(void *,void *,void *))fn)(P(0),P(1),P(2)); break;
    case SIG(POINTER,POINTER,I32,POINTER,I32,POINTER): out.pointer = ((void *(*)(void *,int32_t,void *,int32_t,void *))fn)(P(0),I(1),P(2),I(3),P(4)); break;
    case SIG(POINTER,POINTER,POINTER,POINTER,I64,VOID): out.pointer = ((void *(*)(void *,void *,void *,int64_t))fn)(P(0),P(1),P(2),L(3)); break;
    case SIG(I32,POINTER,VOID,VOID,VOID,VOID): out.i32 = ((int32_t (*)(void *))fn)(P(0)); break;
    case SIG(I32,POINTER,POINTER,VOID,VOID,VOID): out.i32 = ((int32_t (*)(void *,void *))fn)(P(0),P(1)); break;
    case SIG(I32,POINTER,I32,POINTER,VOID,VOID): out.i32 = ((int32_t (*)(void *,int32_t,void *))fn)(P(0),I(1),P(2)); break;
    case SIG(I32,POINTER,POINTER,I32,POINTER,VOID): out.i32 = ((int32_t (*)(void *,void *,int32_t,void *))fn)(P(0),P(1),I(2),P(3)); break;
    case SIG(I8,POINTER,I32,POINTER,POINTER,VOID): out.i32 = ((int8_t (*)(void *,int32_t,void *,void *))fn)(P(0),I(1),P(2),P(3)); break;
    case SIG(I8,POINTER,I32,I32,I32,POINTER): out.i32 = ((int8_t (*)(void *,int32_t,int32_t,int32_t,void *))fn)(P(0),I(1),I(2),I(3),P(4)); break;
    case SIG(I8,POINTER,I32,POINTER,VOID,VOID): out.i32 = ((int8_t (*)(void *,int32_t,void *))fn)(P(0),I(1),P(2)); break;
    case SIG(F64,POINTER,POINTER,VOID,VOID,VOID): out.f64 = ((double (*)(void *,void *))fn)(P(0),P(1)); break;
    case SIG(VOID,POINTER,F64,POINTER,VOID,VOID): ((void (*)(void *,double,void *))fn)(P(0),F(1),P(2)); break;
    case SIG(VOID,POINTER,VOID,VOID,VOID,VOID): ((void (*)(void *))fn)(P(0)); break;
    case SIG(VOID,POINTER,POINTER,POINTER,POINTER,POINTER): ((void (*)(void *,void *,void *,void *,void *))fn)(P(0),P(1),P(2),P(3),P(4)); break;
    default: napi_throw_error(env, NULL, "Unexpected ICU proof signature"); return NULL;
  }
  switch (result_type) {
    case POINTER: napi_create_bigint_uint64(env, (uintptr_t)out.pointer, &result); break;
    case I8:
    case I32: napi_create_int32(env, out.i32, &result); break;
    case F64: napi_create_double(env, out.f64, &result); break;
    default: napi_get_undefined(env, &result); break;
  }
  return result;
}

static napi_value initialize(napi_env env, napi_value exports) {
  napi_property_descriptor properties[] = {
    {"call", NULL, call, NULL, NULL, NULL, napi_default, NULL},
    {"symbol", NULL, symbol, NULL, NULL, NULL, napi_default, NULL},
    {"toString", NULL, read_string, NULL, NULL, NULL, napi_default, NULL},
  };
  napi_define_properties(env, exports, sizeof properties / sizeof properties[0], properties);
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, initialize)
