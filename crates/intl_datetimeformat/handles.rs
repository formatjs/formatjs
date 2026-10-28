//! Runtime-thread records with release tickets safe to drop from GC threads.
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

pub(crate) struct Ticket {
    id: u64,
    releases: Arc<Mutex<Vec<u64>>>,
}
impl Drop for Ticket {
    fn drop(&mut self) {
        self.releases
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .push(self.id);
    }
}

pub(crate) struct Records<T> {
    next: u64,
    values: HashMap<u64, T>,
    releases: Arc<Mutex<Vec<u64>>>,
}
impl<T> Records<T> {
    pub(crate) fn new() -> Self {
        Self {
            next: 0,
            values: HashMap::new(),
            releases: Arc::new(Mutex::new(Vec::new())),
        }
    }
    pub(crate) fn drain(&mut self) {
        let pending = std::mem::take(
            &mut *self
                .releases
                .lock()
                .unwrap_or_else(|error| error.into_inner()),
        );
        for id in pending {
            self.values.remove(&id);
        }
    }
    pub(crate) fn insert(&mut self, value: T) -> Result<Ticket, i32> {
        let id = self.next;
        self.next = self.next.checked_add(1).ok_or(2)?;
        self.values.insert(id, value);
        Ok(Ticket {
            id,
            releases: self.releases.clone(),
        })
    }
    pub(crate) fn get(&mut self, ticket: &Ticket) -> Result<&mut T, i32> {
        if !Arc::ptr_eq(&ticket.releases, &self.releases) {
            return Err(2);
        }
        self.values.get_mut(&ticket.id).ok_or(2)
    }
}
