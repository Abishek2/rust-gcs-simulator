use sqlx::{sqlite::SqlitePoolOptions, Row, SqlitePool};
use std::env;

use crate::models::event::{SimulationSession, SystemEvent};

pub async fn init_db() -> Result<SqlitePool, sqlx::Error> {
    let db_url = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://gcs_simulator.db".to_string());
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url).await?;

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}

pub async fn create_session(pool: &SqlitePool) -> Result<SimulationSession, sqlx::Error> {
    let session = SimulationSession {
        session_id: uuid::Uuid::new_v4().to_string(),
        start_time: chrono::Utc::now(),
        end_time: None,
        status: "active".to_string(),
    };

    sqlx::query(
        r#"
        INSERT INTO simulation_sessions (session_id, start_time, status)
        VALUES (?1, ?2, ?3)
        "#
    )
    .bind(&session.session_id)
    .bind(session.start_time.timestamp())
    .bind(&session.status)
    .execute(pool)
    .await?;

    Ok(session)
}

pub async fn persist_event(pool: &SqlitePool, event: &SystemEvent) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO system_events (event_id, session_id, event_type, source, severity, message, timestamp, payload)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#
    )
    .bind(&event.event_id)
    .bind(&event.session_id)
    .bind(&event.event_type)
    .bind(&event.source)
    .bind(&event.severity)
    .bind(&event.message)
    .bind(event.timestamp.timestamp())
    .bind(&event.payload)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_event_count(pool: &SqlitePool) -> Result<u64, sqlx::Error> {
    let rec = sqlx::query(
        "SELECT COUNT(*) as count FROM system_events"
    )
    .fetch_one(pool)
    .await?;

    let count: i64 = rec.try_get("count").unwrap_or(0);
    Ok(count as u64)
}

pub async fn get_events(pool: &SqlitePool) -> Result<Vec<SystemEvent>, sqlx::Error> {
    let records = sqlx::query(
        r#"
        SELECT event_id, session_id, event_type, source, severity, message, timestamp, payload
        FROM system_events
        ORDER BY timestamp DESC
        LIMIT 100
        "#
    )
    .fetch_all(pool)
    .await?;

    let events = records.into_iter().map(|rec| {
        let ts: i64 = rec.try_get("timestamp").unwrap_or(0);
        SystemEvent {
            event_id: rec.try_get("event_id").unwrap_or_default(),
            session_id: rec.try_get("session_id").unwrap_or_default(),
            event_type: rec.try_get("event_type").unwrap_or_default(),
            source: rec.try_get("source").unwrap_or_default(),
            severity: rec.try_get("severity").unwrap_or_default(),
            message: rec.try_get("message").unwrap_or_default(),
            timestamp: chrono::DateTime::from_timestamp(ts, 0).unwrap_or_default(),
            payload: rec.try_get("payload").unwrap_or_default(),
        }
    }).collect();

    Ok(events)
}

pub async fn get_sessions(pool: &SqlitePool) -> Result<Vec<SimulationSession>, sqlx::Error> {
    let records = sqlx::query(
        r#"
        SELECT session_id, start_time, end_time, status
        FROM simulation_sessions
        ORDER BY start_time DESC
        "#
    )
    .fetch_all(pool)
    .await?;

    let sessions = records.into_iter().map(|rec| {
        let start_ts: i64 = rec.try_get("start_time").unwrap_or(0);
        let end_ts: Option<i64> = rec.try_get("end_time").unwrap_or_default();
        SimulationSession {
            session_id: rec.try_get("session_id").unwrap_or_default(),
            start_time: chrono::DateTime::from_timestamp(start_ts, 0).unwrap_or_default(),
            end_time: end_ts.and_then(|ts| chrono::DateTime::from_timestamp(ts, 0)),
            status: rec.try_get("status").unwrap_or_default(),
        }
    }).collect();

    Ok(sessions)
}

pub async fn get_session_events(pool: &SqlitePool, session_id: &str) -> Result<Vec<SystemEvent>, sqlx::Error> {
    let records = sqlx::query(
        r#"
        SELECT event_id, session_id, event_type, source, severity, message, timestamp, payload
        FROM system_events
        WHERE session_id = ?1
        ORDER BY timestamp ASC
        "#
    )
    .bind(session_id)
    .fetch_all(pool)
    .await?;

    let events = records.into_iter().map(|rec| {
        let ts: i64 = rec.try_get("timestamp").unwrap_or(0);
        SystemEvent {
            event_id: rec.try_get("event_id").unwrap_or_default(),
            session_id: rec.try_get("session_id").unwrap_or_default(),
            event_type: rec.try_get("event_type").unwrap_or_default(),
            source: rec.try_get("source").unwrap_or_default(),
            severity: rec.try_get("severity").unwrap_or_default(),
            message: rec.try_get("message").unwrap_or_default(),
            timestamp: chrono::DateTime::from_timestamp(ts, 0).unwrap_or_default(),
            payload: rec.try_get("payload").unwrap_or_default(),
        }
    }).collect();

    Ok(events)
}
