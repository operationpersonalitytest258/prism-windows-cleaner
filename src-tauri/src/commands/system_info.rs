use serde::Serialize;
use sysinfo::{Disks, Networks, System};

#[derive(Debug, Serialize, Clone)]
pub struct SystemInfoData {
    pub cpu_usage: f32,
    pub cpu_name: String,
    pub cpu_cores: usize,
    pub memory_used_gb: f64,
    pub memory_total_gb: f64,
    pub disk_used_gb: f64,
    pub disk_total_gb: f64,
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub uptime_hours: f64,
    pub network_received_mb: f64,
    pub network_transmitted_mb: f64,
    pub network_rx_speed_mb: f64,
    pub network_tx_speed_mb: f64,
    pub health_score: u8,
}

fn calculate_health_score(cpu: f64, mem_pct: f64, disk_pct: f64) -> u8 {
    let cpu_score = if cpu < 50.0 { 100.0 } else { 100.0 - (cpu - 50.0) * 2.0 };
    let mem_score = if mem_pct < 60.0 { 100.0 } else { 100.0 - (mem_pct - 60.0) * 2.5 };
    let disk_score = if disk_pct < 70.0 { 100.0 } else { 100.0 - (disk_pct - 70.0) * 3.3 };

    let score = (cpu_score * 0.3 + mem_score * 0.3 + disk_score * 0.4).clamp(0.0, 100.0);
    score as u8
}

fn collect_system_info(networks_arc: std::sync::Arc<std::sync::Mutex<Networks>>) -> SystemInfoData {
    let mut sys = System::new_all();
    std::thread::sleep(std::time::Duration::from_millis(100));
    sys.refresh_all();

    // CPU
    let cpu_usage = sys.global_cpu_usage();
    let cpu_name = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown".into());
    let cpu_cores = sys.cpus().len();

    // Memory
    let memory_total = sys.total_memory() as f64;
    let memory_used = sys.used_memory() as f64;
    let memory_total_gb = memory_total / 1_073_741_824.0;
    let memory_used_gb = memory_used / 1_073_741_824.0;
    let mem_pct = if memory_total > 0.0 {
        (memory_used / memory_total) * 100.0
    } else {
        0.0
    };

    // Disk
    let disks = Disks::new_with_refreshed_list();
    let mut disk_total: u64 = 0;
    let mut disk_used: u64 = 0;
    for disk in disks.list() {
        disk_total += disk.total_space();
        disk_used += disk.total_space() - disk.available_space();
    }
    let disk_total_gb = disk_total as f64 / 1_073_741_824.0;
    let disk_used_gb = disk_used as f64 / 1_073_741_824.0;
    let disk_pct = if disk_total > 0 {
        (disk_used as f64 / disk_total as f64) * 100.0
    } else {
        0.0
    };

    // Network
    let mut total_received: u64 = 0;
    let mut total_transmitted: u64 = 0;
    let mut current_received: u64 = 0;
    let mut current_transmitted: u64 = 0;

    if let Ok(mut networks) = networks_arc.lock() {
        networks.refresh_list();
        for (_name, data) in networks.list() {
            total_received += data.total_received();
            total_transmitted += data.total_transmitted();
            current_received += data.received();
            current_transmitted += data.transmitted();
        }
    }

    // OS info
    let os_name = System::name().unwrap_or_else(|| "Unknown".into());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".into());
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".into());

    // Uptime
    let uptime_secs = System::uptime();
    let uptime_hours = uptime_secs as f64 / 3600.0;

    let health_score = calculate_health_score(cpu_usage as f64, mem_pct, disk_pct);

    SystemInfoData {
        cpu_usage: (cpu_usage * 10.0).round() / 10.0,
        cpu_name,
        cpu_cores,
        memory_used_gb: (memory_used_gb * 10.0).round() / 10.0,
        memory_total_gb: (memory_total_gb * 10.0).round() / 10.0,
        disk_used_gb: (disk_used_gb * 10.0).round() / 10.0,
        disk_total_gb: (disk_total_gb * 10.0).round() / 10.0,
        os_name,
        os_version,
        hostname,
        uptime_hours: (uptime_hours * 10.0).round() / 10.0,
        network_received_mb: (total_received as f64 / 1_048_576.0 * 10.0).round() / 10.0,
        network_transmitted_mb: (total_transmitted as f64 / 1_048_576.0 * 10.0).round() / 10.0,
        network_rx_speed_mb: (current_received as f64 / 1_048_576.0 * 10.0).round() / 10.0,
        network_tx_speed_mb: (current_transmitted as f64 / 1_048_576.0 * 10.0).round() / 10.0,
        health_score,
    }
}

/// Tauri command — runs the blocking sysinfo call on a background thread
/// to avoid blocking the async runtime.
#[tauri::command]
pub async fn get_system_info(
    networks_state: tauri::State<'_, std::sync::Arc<std::sync::Mutex<Networks>>>,
) -> Result<SystemInfoData, String> {
    let networks_arc = networks_state.inner().clone();
    let handle = std::thread::spawn(move || collect_system_info(networks_arc));
    handle.join().map_err(|_| "Failed to collect system info".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn health_score_all_idle() {
        assert!(calculate_health_score(0.0, 0.0, 0.0) >= 95);
    }

    #[test]
    fn health_score_all_maxed() {
        assert!(calculate_health_score(100.0, 100.0, 100.0) <= 10);
    }

    #[test]
    fn health_score_clamps_to_0_on_extreme() {
        assert_eq!(calculate_health_score(200.0, 200.0, 200.0), 0);
    }

    #[test]
    fn health_score_medium_load() {
        let s = calculate_health_score(60.0, 70.0, 75.0);
        assert!(s >= 20 && s <= 80, "medium load score = {}", s);
    }

    #[test]
    fn collect_returns_valid_real_data() {
        let networks = std::sync::Arc::new(std::sync::Mutex::new(Networks::new_with_refreshed_list()));
        let info = collect_system_info(networks);
        assert!(!info.cpu_name.is_empty());
        assert!(info.cpu_cores > 0);
        assert!(info.memory_total_gb > 1.0);
        assert!(info.memory_used_gb > 0.0);
        assert!(info.memory_used_gb <= info.memory_total_gb);
        assert!(info.disk_total_gb > 10.0);
        assert!(info.disk_used_gb > 0.0);
        assert!(info.disk_used_gb <= info.disk_total_gb);
        assert!(info.os_name.contains("Windows"));
        assert!(!info.os_version.is_empty());
        assert!(!info.hostname.is_empty());
        assert!(info.uptime_hours > 0.0);
        assert!(info.health_score <= 100);
    }

    #[test]
    fn collect_is_thread_safe() {
        let networks = std::sync::Arc::new(std::sync::Mutex::new(Networks::new_with_refreshed_list()));
        let h = std::thread::spawn(move || collect_system_info(networks));
        let info = h.join().expect("thread panicked");
        assert!(info.cpu_cores > 0);
    }

    #[test]
    fn serialization_round_trip() {
        let networks = std::sync::Arc::new(std::sync::Mutex::new(Networks::new_with_refreshed_list()));
        let info = collect_system_info(networks);
        let json = serde_json::to_string(&info).expect("serialize");
        assert!(json.contains("cpu_name"));
        assert!(json.contains("health_score"));
        let parsed: serde_json::Value = serde_json::from_str(&json).expect("parse");
        assert!(parsed["cpu_cores"].as_u64().unwrap() > 0);
    }
}
