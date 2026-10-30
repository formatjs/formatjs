#pragma once
#include <jsi/jsi.h>
namespace formatjs {
void installDurationFormat(facebook::jsi::Runtime &);
void installDurationFormat(facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
