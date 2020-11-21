use hdk3::prelude::*;
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
    #[error(transparent)]
    HdkError(#[from] HdkError),
}

pub type SynResult<T> = Result<T, SynError>;
