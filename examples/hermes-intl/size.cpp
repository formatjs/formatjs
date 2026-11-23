#include <formatjs/hermes/intl.h>
#include <hermes/hermes.h>
#ifdef FORMATJS_TEMPORAL
#include <formatjs/hermes/temporal.h>
#endif

int main() {
  auto runtime = facebook::hermes::makeHermesRuntime();
  formatjs::installIntl(*runtime);
#ifdef FORMATJS_TEMPORAL
  formatjs::installTemporal(*runtime, {[] { return "UTC"; }, {}});
#endif
}
