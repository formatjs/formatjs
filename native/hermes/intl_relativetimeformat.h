#pragma once
#include <jsi/jsi.h>
namespace formatjs {
void installRelativeTimeFormat(facebook::jsi::Runtime &);
void installRelativeTimeFormat(facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
