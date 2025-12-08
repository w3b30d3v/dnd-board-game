//! Common error types.

use thiserror::Error;

#[derive(Error, Debug)]
pub enum DndError {
    #[error("Invalid position: ({x}, {y})")]
    InvalidPosition { x: i32, y: i32 },

    #[error("Entity not found: {0}")]
    EntityNotFound(String),

    #[error("Invalid action: {0}")]
    InvalidAction(String),

    #[error("Rules violation: {0}")]
    RulesViolation(String),
}
