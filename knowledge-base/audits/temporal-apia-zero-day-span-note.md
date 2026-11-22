# Zero signed day span in NudgeToZonedTime

Source-only derivation, no test execution or runtime fix proposed. Same shipped Apia skip already documented in temporal-calendar-count-window-audit.md; this isolates a different assertion in the assigned finite row range.

Frozen rendered comparison §7.5.35 step8 asserts TimeDurationSign(daySpan)=sign. Use origin `2011-12-31T12:00+14:00[Pacific/Apia]`, destination same date10:00+14. Exact epochs: O=1325282400000000000ns, F=1325275200000000000ns; F−O=−7200000000000ns. Both are ordinary post-transition local times.

Public route: O.until(F,{largestUnit:'day',smallestUnit:'hour',roundingMode:'trunc'}). JS options validate; endpoints unequal; nanosecond identity shortcut does not apply. unroundedZonedDifference520–573 computes same ISO day and −2h clock residual, so date fields0. Current shared time branch date-core1037–1062 resolves origin-date endpoint and signed next day from original clock.

Next requested local date is skipped2011-12-30 at12:00. Compatible resolution maps this to2011-12-31 at12:00, instant O. Thus daySpan=O−O=0 while sign=−1. Assertion fails independently of reverse-fold origin preservation: origin here is unambiguous, and reconstructing it compatibly gives the identical O.

Source detects expanded because (−2h−0)*−1≥0, increments day count to−1, retains time−2h and exact rounded epochF. Source-predicted public result is -P1DT2H, whose date addition crosses skipped date and then subtracts2h. No claim that published algorithm establishes this expected output after its violated assertion. This is a comparison inconsistency, not an arithmetic or direct runtime-defect finding.

Existing IANA authority and UTC endpoint proof are reused from temporal-calendar-count-window-audit.md. Numbered assertion text comes from frozen requirement row7.5.35/algorithm-1/step-8. Requested ECMA-262 authority boundary unchanged. Parent may choose a later literal endpoint/control execution; no disputed-value regression supplied.
