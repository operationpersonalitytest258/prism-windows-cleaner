mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::mole_bridge::mole_clean,
            commands::mole_bridge::mole_clean_streaming,
            commands::mole_bridge::mole_optimize,
            commands::mole_bridge::mole_purge_streaming,
            commands::mole_bridge::mole_status,
            commands::mole_bridge::mole_analyze,
            commands::mole_bridge::list_installed_apps,
            commands::mole_bridge::mole_uninstall_app,
            commands::system_info::get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
