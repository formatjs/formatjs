#[path = "handles.rs"]
mod handles;
use handles::Records;
use std::{cell::RefCell, rc::Rc, thread};

struct Tracked(Rc<RefCell<Vec<thread::ThreadId>>>);
impl Drop for Tracked {
    fn drop(&mut self) {
        self.0.borrow_mut().push(thread::current().id());
    }
}

#[test]
fn gc_release_drops_records_on_the_runtime_thread() {
    let drops = Rc::new(RefCell::new(Vec::new()));
    let mut records = Records::new();
    let ticket = records.insert(Tracked(drops.clone())).unwrap();
    thread::spawn(move || drop(ticket)).join().unwrap();
    assert!(drops.borrow().is_empty());
    records.drain();
    assert_eq!(*drops.borrow(), vec![thread::current().id()]);
    records.drain();
    assert_eq!(drops.borrow().len(), 1);
}

#[test]
fn tickets_cannot_access_another_installation() {
    let mut first = Records::new();
    let ticket = first.insert(7).unwrap();
    let mut second = Records::new();
    let _other = second.insert(9).unwrap();
    assert_eq!(second.get(&ticket), Err(2));
    assert_eq!(first.get(&ticket), Ok(&mut 7));
}

#[test]
fn installation_drop_releases_live_records_before_late_tickets() {
    let drops = Rc::new(RefCell::new(Vec::new()));
    let mut records = Records::new();
    let ticket = records.insert(Tracked(drops.clone())).unwrap();
    drop(records);
    assert_eq!(drops.borrow().len(), 1);
    thread::spawn(move || drop(ticket)).join().unwrap();
    assert_eq!(drops.borrow().len(), 1);
}
