use formatjs_intl_data::{Compiled, Data, decode};
use std::sync::{Arc, RwLock};

static NUMBERS: Compiled<RwLock<Vec<u32>>> = Compiled::new(&[0x81, 0x01]);

#[test]
fn compiled_bytes_share_records_only_within_one_registry() {
    let first = Data::compiled(&NUMBERS);
    let alias = first.clone();
    let second = Data::compiled(&NUMBERS);
    let original = first.get().unwrap();
    original.write().unwrap().push(2);
    assert!(Arc::ptr_eq(&original, &alias.get().unwrap()));
    assert_eq!(*alias.get().unwrap().read().unwrap(), vec![1, 2]);
    assert_eq!(*second.get().unwrap().read().unwrap(), vec![1]);
}

#[test]
fn malformed_truncated_and_trailing_records_reject() {
    for bytes in [&[0xff][..], &[0x82, 0x01][..], &[0x81, 0x01, 0x00][..]] {
        assert!(decode::<Vec<u32>>(bytes).is_err());
    }
    assert_eq!(decode::<Vec<u32>>(&[0x81, 0x01]).unwrap(), vec![1]);
}
