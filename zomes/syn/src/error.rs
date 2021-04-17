use hdk::prelude::*;


use std::convert::Infallible;

#[derive(thiserror::Error, Debug)]
pub enum SynError {
    #[error(transparent)]
    Serialization(#[from] SerializedBytesError),
    #[error(transparent)]
    Infallible(#[from] Infallible),
    #[error(transparent)]
    EntryError(#[from] EntryError),
    #[error(transparent)]
    Wasm(#[from] WasmError),
    #[error("hash not found")]
    HashNotFound, // internal error for functions that should be given an known hash
    #[error("{0}")]
    Generic(String),
}

pub type SynResult<T> = Result<T, SynError>;

impl From<SynError> for WasmError {
    fn from(c: SynError) -> Self {
        WasmError::Guest(c.to_string())
    }
}
