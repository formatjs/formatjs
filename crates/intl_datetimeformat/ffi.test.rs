use formatjs_intl_datetimeformat::ffi::*;
use serde_json::{Value, json};
use std::{
    cell::{Cell, RefCell},
    ffi::c_void,
    ptr,
    rc::Rc,
};
const EN: &str = include_str!(env!("FORMATJS_DATETIME_EN"));
struct Registry(*mut DateTimeRegistry);
impl Registry {
    fn new() -> Self {
        unsafe {
            let mut raw = ptr::null_mut();
            assert_eq!(formatjs_datetime_registry_create(&mut raw), 0);
            let result = Self(raw);
            assert_eq!(result.load(0, EN), 0);
            result
        }
    }
    fn load(&self, kind: u32, text: &str) -> i32 {
        unsafe { formatjs_datetime_registry_load(self.0, kind, text.as_ptr(), text.len()) }
    }
}
impl Drop for Registry {
    fn drop(&mut self) {
        unsafe { formatjs_datetime_registry_destroy(self.0) }
    }
}
struct Construction(*mut DateTimeConstruction);
impl Construction {
    fn begin(registry: &Registry) -> Self {
        unsafe {
            let mut raw = ptr::null_mut();
            assert_eq!(formatjs_datetime_begin(registry.0, &mut raw), 0);
            Self(raw)
        }
    }
    fn resolve(&self, options: Value) -> i32 {
        let text = json!({"locales":["en"],"options":options}).to_string();
        unsafe { formatjs_datetime_resolve(self.0, text.as_ptr(), text.len()) }
    }
    fn zone(&self, zone: Value) -> i32 {
        let text = zone.to_string();
        unsafe { formatjs_datetime_zone(self.0, text.as_ptr(), text.len()) }
    }
    fn capture(&self, options: Value) -> i32 {
        let text = options.to_string();
        unsafe { formatjs_datetime_capture(self.0, text.as_ptr(), text.len()) }
    }
    fn finish(&self, options: Value) -> Result<Handle, i32> {
        let text = options.to_string();
        unsafe {
            let mut raw = ptr::null_mut();
            let status = formatjs_datetime_create(self.0, text.as_ptr(), text.len(), &mut raw);
            if status == 0 {
                Ok(Handle(Rc::new(Cell::new(raw))))
            } else {
                assert!(raw.is_null());
                Err(status)
            }
        }
    }
}
impl Drop for Construction {
    fn drop(&mut self) {
        unsafe { formatjs_datetime_construction_destroy(self.0) }
    }
}
struct Handle(Rc<Cell<*mut DateTimeHandle>>);
impl Handle {
    fn query(&self, value: Value) -> Result<String, i32> {
        let text = value.to_string();
        unsafe {
            let mut bytes = DateTimeBytes {
                data: ptr::null_mut(),
                len: 0,
            };
            let status =
                formatjs_datetime_query(self.0.get(), text.as_ptr(), text.len(), &mut bytes);
            if status != 0 {
                assert!(bytes.data.is_null());
                assert_eq!(bytes.len, 0);
                return Err(status);
            }
            let value = std::str::from_utf8(std::slice::from_raw_parts(bytes.data, bytes.len))
                .unwrap()
                .to_owned();
            formatjs_datetime_bytes_free(bytes);
            Ok(value)
        }
    }
}
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe { formatjs_datetime_destroy(self.0.replace(ptr::null_mut())) }
    }
}
fn formatter(registry: &Registry, early: Value, components: Value) -> Handle {
    let construction = Construction::begin(registry);
    assert_eq!(construction.resolve(early), 0);
    assert_eq!(construction.zone(json!("UTC")), 0);
    assert_eq!(construction.capture(components), 0);
    construction.finish(json!({})).ok().unwrap()
}
#[test]
fn staged_abi_orders_phases_and_preserves_initial_timezone_names() {
    let registry = Registry::new();
    let pack = json!({"abbrvs":"X","offsets":"1e0","zones":["Test/Original|,0,0,0"]}).to_string();
    assert_eq!(registry.load(2, &pack), 0);
    let construction = Construction::begin(&registry);
    assert_eq!(construction.zone(json!("UTC")), 2);
    assert_eq!(
        registry.load(2, &pack.replace("Test/Original", "Test/Replacement")),
        0
    );
    assert_eq!(construction.resolve(json!({"hour12":false})), 0);
    assert_eq!(construction.resolve(json!({})), 2);
    assert_eq!(construction.zone(json!("Test/Replacement")), 1);
    assert_eq!(construction.zone(json!("Test/Original")), 0);
    assert_eq!(
        construction.capture(json!({"hour":"numeric","minute":"2-digit","hour12":true})),
        0
    );
    let handle = construction.finish(json!({})).ok().unwrap();
    let text = handle.query(json!({"op":"resolved"})).unwrap();
    let resolved: Value = serde_json::from_str(&text).unwrap();
    assert_eq!(resolved["timeZone"], "Test/Original");
    assert_eq!(resolved["hourCycle"], "h23");
    assert_eq!(resolved["hour12"], false);
    let keys = [
        "locale",
        "calendar",
        "numberingSystem",
        "timeZone",
        "hourCycle",
        "hour12",
        "hour",
        "minute",
    ];
    let positions = keys.map(|key| text.find(&format!("\"{key}\":")).unwrap());
    assert!(positions.windows(2).all(|window| window[0] < window[1]));
    assert_eq!(construction.capture(json!({})), 2);
}
#[test]
fn abi_validates_inputs_and_retains_formatter_after_registry_destruction() {
    unsafe {
        assert_eq!(formatjs_datetime_registry_create(ptr::null_mut()), 2);
        let mut bytes = DateTimeBytes {
            data: 1usize as *mut u8,
            len: 99,
        };
        assert_eq!(
            formatjs_datetime_query(ptr::null(), ptr::null(), 0, &mut bytes),
            2
        );
        assert!(bytes.data.is_null());
        assert_eq!(bytes.len, 0);
        assert_eq!(
            formatjs_datetime_registry_load(ptr::null(), 0, ptr::null(), usize::MAX),
            2
        );
    }
    let registry = Registry::new();
    assert_eq!(registry.load(8, EN), 2);
    assert_eq!(registry.load(0, "{bad"), 1);
    let handle = formatter(&registry, json!({}), json!({"year":"numeric"}));
    drop(registry);
    assert_eq!(
        handle
            .query(json!({"op":"format","value":{"type":"number","value":"0"}}))
            .unwrap(),
        "\"1970\""
    );
    assert_eq!(
        handle.query(json!({"op":"format","value":{"type":"number","value":"NaN"}})),
        Err(1)
    );
    assert_eq!(
        handle.query(json!({"op":"format","value":{"type":"zoned"}})),
        Err(4)
    );
    assert_eq!(handle.query(json!({"op":"unknown"})), Err(2));
    assert_eq!(handle.query(json!({"op":"format","value":{"type":"plain","kind":"PlainDate","iso":"2024-02-30[u-ca=iso8601]"}})),Err(1));
}
#[test]
fn abi_plain_values_preserve_nanoseconds_and_date_noon() {
    let registry = Registry::new();
    let handle = formatter(
        &registry,
        json!({}),
        json!({"hour":"2-digit","minute":"2-digit","second":"2-digit","fractionalSecondDigits":3}),
    );
    let plain=handle.query(json!({"op":"format","value":{"type":"plain","kind":"PlainDateTime","iso":"1969-12-31T23:59:59.999999999[u-ca=iso8601]"}})).unwrap();
    let epoch=handle.query(json!({"op":"format","value":{"type":"epoch","kind":"PlainDateTime","value":"-1","calendar":"iso8601"}})).unwrap();
    assert_eq!(plain, epoch);
    let date = formatter(
        &registry,
        json!({}),
        json!({"year":"numeric","month":"long","day":"numeric"}),
    );
    assert_eq!(date.query(json!({"op":"format","value":{"type":"plain","kind":"PlainDate","iso":"2024-02-29[u-ca=iso8601]"}})).unwrap(),"\"February 29, 2024\"");
    let construction = Construction::begin(&registry);
    assert_eq!(construction.resolve(json!({})), 0);
    assert_eq!(construction.zone(Value::Null), 0);
    assert_eq!(construction.capture(json!({"year":"numeric"})), 0);
    assert!(matches!(
        construction.finish(json!({"dateStyle":"short"})),
        Err(4)
    ));
    assert!(matches!(construction.finish(json!({})), Err(2)));
}
struct CallbackState {
    registry: *const DateTimeRegistry,
    calls: Rc<RefCell<Vec<(i32, i64)>>>,
    releases: Rc<Cell<usize>>,
    response: RefCell<Vec<u8>>,
    replace: Cell<bool>,
    fail: bool,
    year: i32,
    destroy: Option<Rc<Cell<*mut DateTimeHandle>>>,
}
unsafe extern "C" fn callback(context: *mut c_void, time: i64, out: *mut DateTimeBorrowed) -> i32 {
    let state = unsafe { &*(context as *const CallbackState) };
    state.calls.borrow_mut().push((state.year, time));
    if let Some(handle) = &state.destroy {
        unsafe { formatjs_datetime_destroy(handle.replace(ptr::null_mut())) };
    }
    if state.replace.replace(false) {
        let next = Box::new(CallbackState {
            registry: state.registry,
            calls: state.calls.clone(),
            releases: state.releases.clone(),
            response: RefCell::new(Vec::new()),
            replace: Cell::new(false),
            fail: false,
            year: 4000,
            destroy: None,
        });
        let status = unsafe {
            formatjs_datetime_registry_calendar(
                state.registry,
                b"custom".as_ptr(),
                6,
                Box::into_raw(next).cast(),
                Some(callback),
                Some(release),
            )
        };
        if status != 0 {
            return status;
        }
    }
    if state.fail {
        return 9;
    }
    let mut bytes = state.response.borrow_mut();
    *bytes = serde_json::to_vec(&json!({"era":"AD","year":state.year,"month":0,"day":1})).unwrap();
    unsafe {
        out.write(DateTimeBorrowed {
            data: bytes.as_ptr(),
            len: bytes.len(),
        });
    }
    0
}
unsafe extern "C" fn release(context: *mut c_void) {
    let state = unsafe { Box::from_raw(context as *mut CallbackState) };
    state.releases.set(state.releases.get() + 1);
}
fn custom(registry: &Registry) {
    let mut data: Value = serde_json::from_str(EN).unwrap();
    data["data"]["formats"] = json!({"gregory":{"yMMMMd":"MMMM d, y"}});
    let patch=json!({"locale":"en","calendar":"custom","data":data["data"],"formats":{"yMMMMd":"MMMM d, y"}}).to_string();
    assert_eq!(registry.load(1, &patch), 0);
}
#[test]
fn abi_callbacks_can_replace_providers_and_release_contexts_once() {
    let registry = Registry::new();
    custom(&registry);
    let calls = Rc::new(RefCell::new(Vec::new()));
    let releases = Rc::new(Cell::new(0));
    let state = Box::new(CallbackState {
        registry: registry.0,
        calls: calls.clone(),
        releases: releases.clone(),
        response: RefCell::new(Vec::new()),
        replace: Cell::new(true),
        fail: false,
        year: 3000,
        destroy: None,
    });
    assert_eq!(
        unsafe {
            formatjs_datetime_registry_calendar(
                registry.0,
                b"custom".as_ptr(),
                6,
                Box::into_raw(state).cast(),
                Some(callback),
                Some(release),
            )
        },
        0
    );
    let handle = formatter(
        &registry,
        json!({"calendar":"custom"}),
        json!({"year":"numeric","month":"long","day":"numeric"}),
    );
    let text=handle.query(json!({"op":"range","first":{"type":"number","value":"0"},"second":{"type":"number","value":"86400000"}})).unwrap();
    assert!(text.contains("3000") && text.contains("4000"));
    assert_eq!(*calls.borrow(), [(3000, 0), (4000, 86_400_000)]);
    assert_eq!(releases.get(), 1);
    drop(registry);
    assert_eq!(releases.get(), 1);
    drop(handle);
    assert_eq!(releases.get(), 2);
}
#[test]
fn abi_keeps_query_alive_after_reentrant_handle_destruction_and_distinguishes_callback_errors() {
    let registry = Registry::new();
    custom(&registry);
    let releases = Rc::new(Cell::new(0));
    let calls = Rc::new(RefCell::new(Vec::new()));
    let cell = Rc::new(Cell::new(ptr::null_mut()));
    let state = Box::new(CallbackState {
        registry: registry.0,
        calls: calls.clone(),
        releases: releases.clone(),
        response: RefCell::new(Vec::new()),
        replace: Cell::new(false),
        fail: false,
        year: 3000,
        destroy: Some(cell.clone()),
    });
    assert_eq!(
        unsafe {
            formatjs_datetime_registry_calendar(
                registry.0,
                b"custom".as_ptr(),
                6,
                Box::into_raw(state).cast(),
                Some(callback),
                Some(release),
            )
        },
        0
    );
    let handle = formatter(
        &registry,
        json!({"calendar":"custom"}),
        json!({"year":"numeric"}),
    );
    let mut handle = handle;
    cell.set(handle.0.replace(ptr::null_mut()));
    handle.0 = cell.clone();
    let text = handle
        .query(json!({"op":"format","value":{"type":"number","value":"0"}}))
        .unwrap();
    assert!(text.contains("3000"));
    assert!(cell.get().is_null());
    let state = Box::new(CallbackState {
        registry: registry.0,
        calls,
        releases: releases.clone(),
        response: RefCell::new(Vec::new()),
        replace: Cell::new(false),
        fail: true,
        year: 4000,
        destroy: None,
    });
    assert_eq!(
        unsafe {
            formatjs_datetime_registry_calendar(
                registry.0,
                b"custom".as_ptr(),
                6,
                Box::into_raw(state).cast(),
                Some(callback),
                Some(release),
            )
        },
        0
    );
    let failure = formatter(
        &registry,
        json!({"calendar":"custom"}),
        json!({"year":"numeric"}),
    );
    assert_eq!(
        failure.query(json!({"op":"format","value":{"type":"number","value":"0"}})),
        Err(5)
    );
    drop(failure);
    drop(handle);
    drop(registry);
    assert_eq!(releases.get(), 2);
}

#[test]
fn abi_yearmonth_uses_reference_dates_beyond_numeric_timeclip() {
    let registry = Registry::new();
    let handle = formatter(
        &registry,
        json!({"calendar":"iso8601"}),
        json!({"year":"numeric","month":"long"}),
    );
    let text=handle.query(json!({"op":"format","value":{"type":"plain","kind":"PlainYearMonth","iso":"+275760-09-30[u-ca=iso8601]"}})).unwrap();
    assert_eq!(text, "\"September 275760\"");
    assert_eq!(
        handle.query(json!({"op":"format","value":{"type":"number","value":"8640001468800000"}})),
        Err(1)
    );
}

#[test]
fn abi_supported_locales_reads_only_its_matcher_option() {
    let registry = Registry::new();
    let request = r#"{"locales":["EN-us","zz","en-us","en"],"options":{"localeMatcher":"lookup","calendar":7,"hour12":[]}}"#;
    unsafe {
        let mut bytes = DateTimeBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        assert_eq!(
            formatjs_datetime_supported(registry.0, request.as_ptr(), request.len(), &mut bytes),
            0
        );
        let values: Value =
            serde_json::from_slice(std::slice::from_raw_parts(bytes.data, bytes.len)).unwrap();
        assert_eq!(values, json!(["en-US", "en"]));
        formatjs_datetime_bytes_free(bytes);
        let invalid = request.replace("lookup", "invalid");
        assert_eq!(
            formatjs_datetime_supported(registry.0, invalid.as_ptr(), invalid.len(), &mut bytes),
            1
        );
        assert!(bytes.data.is_null());
        assert_eq!(bytes.len, 0);
    }
}
