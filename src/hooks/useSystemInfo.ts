import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface SystemInfo {
  cpuUsage: number;
  cpuName: string;
  cpuCores: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  osName: string;
  osVersion: string;
  hostname: string;
  uptimeHours: number;
  networkReceivedMb: number;
  networkTransmittedMb: number;
  networkRxSpeedMb: number;
  networkTxSpeedMb: number;
  healthScore: number;
}

interface RustSystemInfo {
  cpu_usage: number;
  cpu_name: string;
  cpu_cores: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_used_gb: number;
  disk_total_gb: number;
  os_name: string;
  os_version: string;
  hostname: string;
  uptime_hours: number;
  network_received_mb: number;
  network_transmitted_mb: number;
  network_rx_speed_mb: number;
  network_tx_speed_mb: number;
  health_score: number;
}

const FALLBACK: SystemInfo = {
  cpuUsage: 0,
  cpuName: 'Unknown',
  cpuCores: 0,
  memoryUsedGb: 0,
  memoryTotalGb: 0,
  diskUsedGb: 0,
  diskTotalGb: 0,
  osName: 'Windows',
  osVersion: '',
  hostname: '',
  uptimeHours: 0,
  networkReceivedMb: 0,
  networkTransmittedMb: 0,
  networkRxSpeedMb: 0,
  networkTxSpeedMb: 0,
  healthScore: 0,
};

function mapRustToTs(data: RustSystemInfo): SystemInfo {
  return {
    cpuUsage: data.cpu_usage,
    cpuName: data.cpu_name,
    cpuCores: data.cpu_cores,
    memoryUsedGb: data.memory_used_gb,
    memoryTotalGb: data.memory_total_gb,
    diskUsedGb: data.disk_used_gb,
    diskTotalGb: data.disk_total_gb,
    osName: data.os_name,
    osVersion: data.os_version,
    hostname: data.hostname,
    uptimeHours: data.uptime_hours,
    networkReceivedMb: data.network_received_mb,
    networkTransmittedMb: data.network_transmitted_mb,
    networkRxSpeedMb: data.network_rx_speed_mb,
    networkTxSpeedMb: data.network_tx_speed_mb,
    healthScore: data.health_score,
  };
}

/**
 * Real system info hook — calls Rust sysinfo backend.
 * Auto-refreshes every 5 seconds.
 */
export function useSystemInfo() {
  const [info, setInfo] = useState<SystemInfo>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    try {
      const data = await invoke<RustSystemInfo>('get_system_info');
      setInfo(mapRustToTs(data));
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
    const interval = setInterval(fetchInfo, 1000);
    return () => clearInterval(interval);
  }, [fetchInfo]);

  return { info, loading, error, refresh: fetchInfo };
}
