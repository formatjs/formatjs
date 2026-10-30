#pragma once
#include <jsi/jsi.h>
namespace formatjs {
void installNumberFormat(facebook::jsi::Runtime &);
void installNumberFormat(facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
