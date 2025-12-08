//! Grid Solver - gRPC Server
//!
//! Handles line of sight, area of effect, and pathfinding calculations.

use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    info!("Starting Grid Solver...");

    // TODO: Implement gRPC server in Phase 3
    info!("Grid Solver ready on port 50052");

    // Keep the server running
    tokio::signal::ctrl_c().await?;
    info!("Shutting down Grid Solver");

    Ok(())
}
