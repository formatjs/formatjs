if(NOT FORMATJS_HERMES_SDK)
  message(FATAL_ERROR "Set FORMATJS_HERMES_SDK to the extracted FormatJS Hermes SDK")
endif()

include("${FORMATJS_HERMES_SDK}/cmake/FormatJSIntl.cmake")
formatjs_intl(hermesapi_obj hermesapi)
