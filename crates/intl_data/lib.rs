use serde::de::DeserializeOwned;
use std::{
    marker::PhantomData,
    sync::{Arc, OnceLock},
};

pub struct Compiled<T> {
    bytes: &'static [u8],
    marker: PhantomData<fn() -> T>,
}
impl<T: DeserializeOwned> Compiled<T> {
    pub const fn new(bytes: &'static [u8]) -> Self {
        Self {
            bytes,
            marker: PhantomData,
        }
    }
    pub fn get(&self) -> Result<Arc<T>, String> {
        decode(self.bytes).map(Arc::new)
    }
}

pub struct Lazy<T: 'static> {
    data: &'static Compiled<T>,
    value: OnceLock<Result<Arc<T>, String>>,
}
pub enum Data<T: 'static> {
    Owned(Arc<T>),
    Compiled(Arc<Lazy<T>>),
}
impl<T> Clone for Data<T> {
    fn clone(&self) -> Self {
        match self {
            Self::Owned(value) => Self::Owned(value.clone()),
            Self::Compiled(value) => Self::Compiled(value.clone()),
        }
    }
}
impl<T: DeserializeOwned> Data<T> {
    pub fn compiled(data: &'static Compiled<T>) -> Self {
        Self::Compiled(Arc::new(Lazy {
            data,
            value: OnceLock::new(),
        }))
    }
    pub fn get(&self) -> Result<Arc<T>, String> {
        match self {
            Self::Owned(value) => Ok(value.clone()),
            Self::Compiled(value) => value.value.get_or_init(|| value.data.get()).clone(),
        }
    }
}

pub fn decode<T: DeserializeOwned>(bytes: &[u8]) -> Result<T, String> {
    let mut input = bytes;
    let value = ciborium::de::from_reader(&mut input).map_err(|error| error.to_string())?;
    if !input.is_empty() {
        return Err("Trailing compiled locale data".into());
    }
    Ok(value)
}
