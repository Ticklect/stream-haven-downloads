use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // Spawn the backend server when the app launches
      #[cfg(not(target_os = "android"))]
      {
        use std::process::Command;
        use std::process::Stdio;
        std::thread::spawn(|| {
          let _ = Command::new("node")
            .arg("crawler_backend.cjs")
            .current_dir("..") // Adjust if needed
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();
        });
      }
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Initialize app state
      app.manage(AppState::default());
      
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_app_info,
      validate_url,
      get_storage_info,
      clear_storage,
      download_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// App state management
#[derive(Default)]
struct AppState {
  downloads: Mutex<HashMap<String, DownloadInfo>>,
}

#[derive(Serialize, Deserialize, Clone)]
struct DownloadInfo {
  id: String,
  url: String,
  filename: String,
  status: String,
  progress: f64,
}

// Command: Get app information
#[tauri::command]
async fn get_app_info() -> Result<serde_json::Value, String> {
  Ok(serde_json::json!({
    "name": env!("CARGO_PKG_NAME"),
    "version": env!("CARGO_PKG_VERSION"),
    "description": env!("CARGO_PKG_DESCRIPTION"),
    "authors": env!("CARGO_PKG_AUTHORS"),
    "homepage": env!("CARGO_PKG_HOMEPAGE"),
  }))
}

// Command: Validate URL for security
#[tauri::command]
async fn validate_url(url: String) -> Result<bool, String> {
  // Basic URL validation
  if let Ok(parsed_url) = url::Url::parse(&url) {
    // Check for allowed protocols
    if !["http", "https"].contains(&parsed_url.scheme()) {
      return Err("Only HTTP and HTTPS protocols are allowed".to_string());
    }
    
    // Check for blocked hostnames
    let blocked_hosts = [
      "localhost", "127.0.0.1", "0.0.0.0", "::1",
      "10.0.0.0", "172.16.0.0", "192.168.0.0", "169.254.0.0"
    ];
    
    let hostname = parsed_url.host_str().unwrap_or("").to_lowercase();
    for blocked in &blocked_hosts {
      if hostname == *blocked || hostname.starts_with(blocked) {
        return Err("Access to localhost and internal networks is not allowed".to_string());
      }
    }
    
    Ok(true)
  } else {
    Err("Invalid URL format".to_string())
  }
}

// Command: Get storage information
#[tauri::command]
async fn get_storage_info() -> Result<serde_json::Value, String> {
  // This is a placeholder - in a real app you'd check actual storage
  Ok(serde_json::json!({
    "used": 0,
    "available": 1024 * 1024 * 100, // 100MB estimate
    "total": 1024 * 1024 * 100,
    "quota_exceeded": false
  }))
}

// Command: Clear storage
#[tauri::command]
async fn clear_storage() -> Result<(), String> {
  // This would clear the actual storage in a real implementation
  log::info!("Storage cleared");
  Ok(())
}

// Command: Download file (placeholder for future implementation)
#[tauri::command]
async fn download_file(
  url: String,
  filename: String,
  state: tauri::State<'_, AppState>
) -> Result<String, String> {
  // Validate URL first
  validate_url(url.clone()).await?;
  
  let download_id = format!("download_{}", chrono::Utc::now().timestamp_millis());
  
  // Add to downloads state
  {
    let mut downloads = state.downloads.lock().map_err(|_| "Failed to lock downloads")?;
    downloads.insert(download_id.clone(), DownloadInfo {
      id: download_id.clone(),
      url,
      filename,
      status: "pending".to_string(),
      progress: 0.0,
    });
  }
  
  log::info!("Download queued: {}", download_id);
  Ok(download_id)
}
