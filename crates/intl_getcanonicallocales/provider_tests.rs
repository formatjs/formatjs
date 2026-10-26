use super::*;
use icu_provider::buf::{BufferFormat, BufferMarker};
use icu_provider::marker::DataMarkerId;
use icu_provider::prelude::*;
use std::sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
};

struct TestProvider {
    loads: Arc<AtomicUsize>,
    omit: Option<DataMarkerId>,
    region_alias_to_zz: bool,
}

impl DynamicDataProvider<BufferMarker> for TestProvider {
    fn load_data(
        &self,
        marker: DataMarkerInfo,
        request: DataRequest,
    ) -> Result<DataResponse<BufferMarker>, DataError> {
        self.loads.fetch_add(1, Ordering::SeqCst);
        if self.omit == Some(marker.id) {
            return Err(DataErrorKind::MarkerNotFound.with_req(marker, request));
        }
        let data: &'static [u8] = if marker.id == marker_id("LocaleAliasesV1") {
            if self.region_alias_to_zz {
                br#"{"language_variants":[],"sgn_region":{},"language_len2":{},"language_len3":{},"language":[],"script":{"Qaai":"Zinh"},"region_alpha":{"BU":"ZZ"},"region_num":{},"complex_region":{"SU":["RU","AM"]},"variant":{"polytoni":"polyton"},"subdivision":{}}"#
            } else {
                br#"{"language_variants":[],"sgn_region":{},"language_len2":{},"language_len3":{},"language":[],"script":{"Qaai":"Zinh"},"region_alpha":{"BU":"MM"},"region_num":{},"complex_region":{"SU":["RU","AM"]},"variant":{"polytoni":"polyton"},"subdivision":{}}"#
            }
        } else if marker.id == marker_id("LocaleLikelySubtagsLanguageV1") {
            br#"{"language_script":{},"language_region":{},"language":{"en":["Latn","US"],"hy":["Armn","AM"]},"und":["en","Latn","US"]}"#
        } else if marker.id == marker_id("LocaleLikelySubtagsScriptRegionV1") {
            br#"{"script_region":{},"script":{"Armn":["hy","AM"]},"region":{}}"#
        } else if marker.id == marker_id("LocaleLikelySubtagsExtendedV1") {
            br#"{"language_script":{},"language_region":{},"language":{},"script_region":{},"script":{},"region":{}}"#
        } else {
            return Err(DataErrorKind::MarkerNotFound.with_req(marker, request));
        };
        let mut metadata = DataResponseMetadata::default();
        metadata.buffer_format = Some(BufferFormat::Json);
        Ok(DataResponse {
            metadata,
            payload: DataPayload::from_static_buffer(data),
        })
    }
}

fn marker_id(name: &'static str) -> DataMarkerId {
    DataMarkerId::from_name(name).unwrap()
}

fn provider() -> TestProvider {
    TestProvider {
        loads: Arc::new(AtomicUsize::new(0)),
        omit: None,
        region_alias_to_zz: false,
    }
}

#[test]
fn external_data_canonicalizes_aliases_and_reuses_loaded_payloads() {
    let provider = provider();
    let loads = Arc::clone(&provider.loads);
    let canonicalizer = Canonicalizer::try_new_with_provider(&provider).unwrap();
    drop(provider);
    assert_eq!(loads.load(Ordering::SeqCst), 4);
    for (tag, expected) in [
        ("iw-BU", "he-MM"),
        ("hye-arevmda", "hyw"),
        ("en-Qaai", "en-Zinh"),
        ("el-polytoni", "el-polyton"),
        ("hy-SU", "hy-AM"),
        ("en-SU", "en-RU"),
        ("en-u-ca-islamicc-kn-yes", "en-u-ca-islamic-civil-kn"),
        ("en-t-iw-bu-m0-names", "en-t-he-mm-m0-prprname"),
        ("en-u-xx-true-foo", "en-u-xx-true-foo"),
        ("abcde-Armn-SU", "abcde-Armn-RU"),
    ] {
        assert_eq!(
            canonicalizer.canonicalize_locale(tag),
            Ok(expected.to_owned()),
            "{tag}"
        );
        #[cfg(feature = "compiled_data")]
        assert_eq!(
            canonicalizer.canonicalize_locale(tag),
            canonicalize_locale(tag),
            "{tag}"
        );
    }
    assert_eq!(
        canonicalizer.get_canonical_locales(&["iw", "he", "FR"]),
        Ok(vec!["he".to_owned(), "fr".to_owned()])
    );
    assert_eq!(
        canonicalizer.canonicalize_locale("en_US"),
        Err(InvalidLocale)
    );
    assert_eq!(loads.load(Ordering::SeqCst), 4);
}

#[test]
fn missing_base_metadata_returns_constructor_error() {
    for name in [
        "LocaleAliasesV1",
        "LocaleLikelySubtagsLanguageV1",
        "LocaleLikelySubtagsScriptRegionV1",
        "LocaleLikelySubtagsExtendedV1",
    ] {
        let provider = TestProvider {
            omit: Some(marker_id(name)),
            ..provider()
        };
        let error = Canonicalizer::try_new_with_provider(&provider).unwrap_err();
        assert_eq!(
            error.kind,
            DataErrorKind::MarkerNotFound,
            "missing {name}: {error}"
        );
    }
}

#[test]
fn canonicalizers_keep_provider_data_isolated() {
    let standard = Canonicalizer::try_new_with_provider(&provider()).unwrap();
    let alternate_provider = TestProvider {
        region_alias_to_zz: true,
        ..provider()
    };
    let alternate = Canonicalizer::try_new_with_provider(&alternate_provider).unwrap();
    for _ in 0..2 {
        assert_eq!(
            standard.canonicalize_locale("en-BU"),
            Ok("en-MM".to_owned())
        );
        assert_eq!(
            alternate.canonicalize_locale("en-BU"),
            Ok("en-ZZ".to_owned())
        );
    }
    #[cfg(feature = "compiled_data")]
    assert_eq!(canonicalize_locale("en-BU"), Ok("en-MM".to_owned()));
}

#[test]
fn canonicalizer_can_be_shared_between_runtime_threads() {
    fn assert_send_sync<T: Send + Sync>() {}
    assert_send_sync::<Canonicalizer>();
}
