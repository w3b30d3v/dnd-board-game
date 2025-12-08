//! D&D 5e Rules Engine - gRPC Server
//!
//! This service implements RAW (Rules As Written) D&D 5th Edition mechanics.

use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    info!("Starting D&D 5e Rules Engine...");

    // TODO: Implement gRPC server in Phase 4
    info!("Rules Engine ready on port 50051");

    // Keep the server running
    tokio::signal::ctrl_c().await?;
    info!("Shutting down Rules Engine");

    Ok(())
}
