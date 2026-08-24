import { useEffect, useState } from "react";
import {
    FiBarChart2,
    FiCalendar,
    FiClipboard,
    FiDownload,
    FiPieChart,
    FiPrinter,
    FiSearch,
    FiTrendingUp
} from "react-icons/fi";
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from "recharts";
import * as XLSX from "xlsx";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import { penugasanAPI } from "../service/api";
import "./Laporan.css";

// Fungsi untuk export ke format Excel (XLSX) dengan border dan auto width
const exportToExcel = (data, trendData = [], performaArea = [], distribusiData = [], ringkasanData = {}, format = 'xlsx', fileName = 'laporan_kebersihan') => {
  if (!data || data.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();

    // ==================== SHEET 1: DATA LAPORAN ====================
    const headers = ["Tanggal", "Area", "Tugas", "Petugas", "Shift", "Status"];
    const wsData = [headers];
    
    data.forEach(item => {
      const row = [
        item.tanggal || "",
        item.area || "",
        item.tugas || "",
        item.petugas || "",
        item.shift || "",
        item.status || ""
      ];
      wsData.push(row);
    });
    
    const wsLaporan = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto width - hitung lebar kolom berdasarkan konten
    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      data.forEach(item => {
        const rowData = [item.tanggal || "", item.area || "", item.tugas || "", item.petugas || "", item.shift || "", item.status || ""];
        const len = String(rowData[i]).length;
        if (len > maxLen) maxLen = Math.min(len, 80);
      });
      return { wch: maxLen + 3 };
    });
    wsLaporan['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, wsLaporan, "Data Laporan");

    // ==================== SHEET 2: TREND TUGAS HARIAN ====================
    if (trendData.length > 0) {
      const trendHeaders = ["Tanggal", "Selesai", "Total"];
      const trendWsData = [trendHeaders];
      
      trendData.forEach(item => {
        trendWsData.push([item.hari || item.Tanggal || "", item.Selesai || 0, item.Total || 0]);
      });
      
      const wsTrend = XLSX.utils.aoa_to_sheet(trendWsData);
      
      // Auto width untuk trend
      const trendColWidths = trendHeaders.map((h, i) => {
        let maxLen = h.length;
        trendData.forEach(item => {
          const values = [item.hari || item.Tanggal || "", item.Selesai || 0, item.Total || 0];
          const len = String(values[i]).length;
          if (len > maxLen) maxLen = Math.min(len, 30);
        });
        return { wch: maxLen + 3 };
      });
      wsTrend['!cols'] = trendColWidths;
      
      XLSX.utils.book_append_sheet(wb, wsTrend, "Trend Tugas Harian");
    }

    // ==================== SHEET 3: PERFORMA PER AREA ====================
    if (performaArea.length > 0) {
      const areaHeaders = ["Area", "Selesai", "Total", "Persentase"];
      const areaWsData = [areaHeaders];
      
      performaArea.forEach(item => {
        const persentase = item.Total > 0 ? Math.round((item.Selesai / item.Total) * 100) : 0;
        areaWsData.push([item.area || "", item.Selesai || 0, item.Total || 0, `${persentase}%`]);
      });
      
      const wsArea = XLSX.utils.aoa_to_sheet(areaWsData);
      
      // Auto width untuk area
      const areaColWidths = areaHeaders.map((h, i) => {
        let maxLen = h.length;
        performaArea.forEach(item => {
          const persentase = item.Total > 0 ? Math.round((item.Selesai / item.Total) * 100) : 0;
          const values = [item.area || "", item.Selesai || 0, item.Total || 0, `${persentase}%`];
          const len = String(values[i]).length;
          if (len > maxLen) maxLen = Math.min(len, 40);
        });
        return { wch: maxLen + 3 };
      });
      wsArea['!cols'] = areaColWidths;
      
      XLSX.utils.book_append_sheet(wb, wsArea, "Performa Per Area");
    }

    // ==================== SHEET 4: DISTRIBUSI PENYELESAIAN ====================
    if (distribusiData.length > 0) {
      const distHeaders = ["Status", "Jumlah"];
      const distWsData = [distHeaders];
      
      distribusiData.forEach(item => {
        distWsData.push([item.name || "", item.value || 0]);
      });
      
      // Tambahkan total
      const total = distribusiData.reduce((sum, item) => sum + (item.value || 0), 0);
      distWsData.push(["TOTAL", total]);
      
      const wsDist = XLSX.utils.aoa_to_sheet(distWsData);
      
      // Auto width untuk distribusi
      const distColWidths = distHeaders.map((h, i) => {
        let maxLen = h.length;
        distribusiData.forEach(item => {
          const values = [item.name || "", item.value || 0];
          const len = String(values[i]).length;
          if (len > maxLen) maxLen = Math.min(len, 20);
        });
        maxLen = Math.max(maxLen, 10); // Min width untuk "TOTAL"
        return { wch: maxLen + 3 };
      });
      distColWidths.push({ wch: 15 }); // Kolom untuk total
      wsDist['!cols'] = distColWidths;
      
      XLSX.utils.book_append_sheet(wb, wsDist, "Distribusi Penyelesaian");
    }

    // ==================== SHEET 5: RINGKASAN ====================
    const ringkasanHeaders = ["Metrik", "Nilai"];
    const ringkasanWsData = [
      ringkasanHeaders,
      ["Periode", ringkasanData.periode || "-"],
      ["Total Selesai", ringkasanData.totalSelesai || 0],
      ["Total Belum Selesai", ringkasanData.totalBelum || 0],
      ["Rata-rata Harian", ringkasanData.rataRataHarian || 0]
    ];
    
    const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanWsData);
    
    // Auto width untuk ringkasan
    wsRingkasan['!cols'] = [{ wch: 25 }, { wch: 20 }];
    
    XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");
    
    // Generate dan download file XLSX
    XLSX.writeFile(wb, `${fileName}_${dateStr}.xlsx`);
    
  } else {
    // Export ke format CSV
    const headers = ["Tanggal", "Area", "Tugas", "Petugas", "Shift", "Status"];
    const csvContent = [];
    
    csvContent.push(headers.join(","));
    
    data.forEach(item => {
      const row = [
        item.tanggal || "",
        item.area || "",
        item.tugas || "",
        item.petugas || "",
        item.shift || "",
        item.status || ""
      ];
      const escapedRow = row.map(field => {
        const value = String(field);
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent.push(escapedRow.join(","));
    });
    
    const csvString = csvContent.join("\n");
    const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}_${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default function Laporan() {
  const [search, setSearch] = useState("");
  const [riwayatTugas, setRiwayatTugas] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [performaArea, setPerformaArea] = useState([]);
  const [distribusiData, setDistribusiData] = useState([]);
  const [ringkasanData, setRingkasanData] = useState({
    periode: "",
    totalSelesai: 0,
    totalBelum: 0,
    rataRataHarian: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filterTanggalMulai, setFilterTanggalMulai] = useState(() => {
    // load dari localStorage, jika tidak ada gunakan kosong
    const saved = localStorage.getItem('laporan_filterTanggalMulai');
    return saved || "";
  });
  const [filterTanggalSelesai, setFilterTanggalSelesai] = useState(() => {
    const saved = localStorage.getItem('laporan_filterTanggalSelesai');
    return saved || "";
  });
  const [filterArea, setFilterArea] = useState(() => {
    const saved = localStorage.getItem('laporan_filterArea');
    return saved || "";
  });
  const [filteredData, setFilteredData] = useState([]);
  const [allAreas, setAllAreas] = useState([]);

  const normalizeDateToLocalString = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isDateWithinRange = (itemDate, start, end) => {
    const itemDateString = normalizeDateToLocalString(itemDate);
    if (!itemDateString) return false;
    return itemDateString >= start && itemDateString <= end;
  };

  // Fetch laporan data
  useEffect(() => {
    const fetchLaporanData = async () => {
      try {
        setLoading(true);
        let response;
        if (filterTanggalMulai && filterTanggalSelesai && filterTanggalMulai.trim() !== "" && filterTanggalSelesai.trim() !== "") {
          response = await penugasanAPI.getLaporan({
            tanggal_awal: filterTanggalMulai,
            tanggal_akhir: filterTanggalSelesai
          });
        } else if (filterTanggalMulai && filterTanggalMulai.trim() !== "" && 
                   (!filterTanggalSelesai || filterTanggalSelesai.trim() === "")) {
          response = await penugasanAPI.getLaporan(filterTanggalMulai);
        } else if (filterTanggalSelesai && filterTanggalSelesai.trim() !== "" && 
                   (!filterTanggalMulai || filterTanggalMulai.trim() === "")) {
          response = await penugasanAPI.getLaporan(filterTanggalSelesai);
        } else if (filterTanggalMulai && filterTanggalSelesai && filterTanggalMulai === filterTanggalSelesai && 
                   filterTanggalMulai.trim() !== "" && filterTanggalSelesai.trim() !== "") {
          response = await penugasanAPI.getLaporan(filterTanggalMulai);
        } else {
          response = await penugasanAPI.getLaporan();
        }
        const laporanList = response.data.data || [];

        const transformedData = laporanList.map((item) => {
          const tanggalFormatted = new Date(item.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: '2-digit'
          });
          const tugasText = item.detail_pekerjaan || item.deskripsi_penugasan || "-";
          
          return {
            id_laporan: item.id_laporan,
            tanggal: tanggalFormatted,
            tanggalRaw: new Date(item.tanggal),
            area: item.nama_ruangan ? `${item.nama_ruangan} - Lantai ${item.lantai}` : "-",
            tugas: tugasText,
            petugas: item.person_assigned || item.nama_ob || "-",
            shift: item.shift || "-",
            status_kehadiran: item.status_kehadiran,
            nilai: item.nilai,
            status: item.status_kehadiran === "hadir" ? "Hadir" : "Tidak Hadir"
          };
        });

        transformedData.sort((a, b) => b.tanggalRaw - a.tanggalRaw);

        setRiwayatTugas(transformedData);

        // Calculate trend data (grouped by date) - berdasarkan nilai (hijau=selesai)
        const trendMap = {};
        transformedData.forEach((item) => {
          const hari = item.tanggal;
          if (!trendMap[hari]) {
            trendMap[hari] = { hari, Selesai: 0, Total: 0 };
          }
          trendMap[hari].Total++;
          if (item.nilai === "green") {
            trendMap[hari].Selesai++;
          }
        });
        setTrendData(Object.values(trendMap).slice(0, 7));
        const areaMap = {};
        transformedData.forEach((item) => {
          const areaName = item.area;
          if (!areaMap[areaName]) {
            areaMap[areaName] = { area: areaName, Selesai: 0, Total: 0 };
          }
          areaMap[areaName].Total++;
          if (item.nilai === "green") {
            areaMap[areaName].Selesai++;
          }
        });
        setPerformaArea(Object.values(areaMap));

        // Calculate distribusi
        const totalLaporan = transformedData.length;
        const totalSelesai = transformedData.filter(item => item.nilai === "green").length;
        const totalBelum = totalLaporan - totalSelesai;
        setDistribusiData([
          { name: "Selesai", value: totalSelesai, color: "#0a8f3c" },
          { name: "Belum Selesai", value: totalBelum, color: "#ef4444" }
        ]);

        // Calculate ringkasan
        const uniqueDates = new Set(transformedData.map(item => item.tanggal));
        const periodeTxt = transformedData.length > 0 
          ? `${transformedData[transformedData.length - 1].tanggal} – ${transformedData[0].tanggal}`
          : "-";
        const avgHarian = uniqueDates.size > 0 ? Math.round(totalSelesai / uniqueDates.size) : 0;

        setRingkasanData({
          periode: periodeTxt,
          totalSelesai: totalSelesai,
          totalBelum: totalBelum,
          rataRataHarian: avgHarian
        });

        const uniqueAreas = [...new Set(transformedData.map(item => item.area).filter(a => a !== "-"))];
        setAllAreas(uniqueAreas);

        setError(null);
      } catch (err) {
        console.error("Error fetching laporan:", err);
        setError("Gagal memuat data laporan");
      } finally {
        setLoading(false);
      }
    };

    fetchLaporanData();
  }, [filterTanggalMulai, filterTanggalSelesai]); // Refetch when date filters change

  // Fungsi untuk menghitung analytics berdasarkan data yang sudah difilter
  const calculateAnalytics = (filteredData) => {
    // Calculate trend data (grouped by date) - berdasarkan nilai (hijau=selesai)
    const trendMap = {};
    filteredData.forEach((item) => {
      const hari = item.tanggal;
      if (!trendMap[hari]) {
        trendMap[hari] = { hari, Selesai: 0, Total: 0 };
      }
      trendMap[hari].Total++;
      if (item.nilai === "green") {
        trendMap[hari].Selesai++;
      }
    });
    setTrendData(Object.values(trendMap).slice(0, 7));

    // Calculate performa per area - berdasarkan nilai (hijau=selesai)
    const areaMap = {};
    filteredData.forEach((item) => {
      const areaName = item.area;
      if (!areaMap[areaName]) {
        areaMap[areaName] = { area: areaName, Selesai: 0, Total: 0 };
      }
      areaMap[areaName].Total++;
      if (item.nilai === "green") {
        areaMap[areaName].Selesai++;
      }
    });
    setPerformaArea(Object.values(areaMap));

    // Calculate distribusi
    const totalLaporan = filteredData.length;
    const totalSelesai = filteredData.filter(item => item.nilai === "green").length;
    const totalBelum = totalLaporan - totalSelesai;
    setDistribusiData([
      { name: "Selesai", value: totalSelesai, color: "#0a8f3c" },
      { name: "Belum Selesai", value: totalBelum, color: "#ef4444" }
    ]);

    // Calculate ringkasan
    const uniqueDates = new Set(filteredData.map(item => item.tanggal));
    const periodeTxt = filteredData.length > 0 
      ? `${filteredData[filteredData.length - 1].tanggal} – ${filteredData[0].tanggal}`
      : "-";
    const avgHarian = uniqueDates.size > 0 ? Math.round(totalSelesai / uniqueDates.size) : 0;

    setRingkasanData({
      periode: periodeTxt,
      totalSelesai: totalSelesai,
      totalBelum: totalBelum,
      rataRataHarian: avgHarian
    });
  };

  // Apply filters setiap ada perubahan
  const applyFilters = () => {
    let filtered = riwayatTugas;

    // Filter by tanggal mulai dan tanggal selesai untuk jangkauan tanggal
    if (filterTanggalMulai && filterTanggalSelesai && filterTanggalMulai.trim() !== "" && filterTanggalSelesai.trim() !== "") {
      filtered = filtered.filter(item => 
        isDateWithinRange(item.tanggalRaw, filterTanggalMulai, filterTanggalSelesai)
      );
    }

    // Filter by area
    if (filterArea) {
      filtered = filtered.filter(item => item.area === filterArea);
    }

    // Filter by area
    if (filterArea) {
      filtered = filtered.filter(item => item.area === filterArea);
    }

    // Hitung analytics berdasarkan data yang sudah difilter (tanpa search)
    calculateAnalytics(filtered);
  };

  // Trigger filter apply when any filter changes
  useEffect(() => {
    applyFilters();
  }, [filterTanggalMulai, filterTanggalSelesai, filterArea, riwayatTugas]);

  // Simpan filter ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem('laporan_filterTanggalMulai', filterTanggalMulai || "");
  }, [filterTanggalMulai]);

  useEffect(() => {
    localStorage.setItem('laporan_filterTanggalSelesai', filterTanggalSelesai || "");
  }, [filterTanggalSelesai]);

  useEffect(() => {
    localStorage.setItem('laporan_filterArea', filterArea || "");
  }, [filterArea]);

  // Hitung ulang analytics ketika filtered data berubah (termasuk search)
  useEffect(() => {
    const filtered = riwayatTugas.filter((item) => {
      // Terapkan filter tanggal untuk jangkauan tanggal
      let matchesDate = true;
      if (filterTanggalMulai && filterTanggalSelesai && filterTanggalMulai.trim() !== "" && filterTanggalSelesai.trim() !== "") {
        matchesDate = isDateWithinRange(item.tanggalRaw, filterTanggalMulai, filterTanggalSelesai);
      }

      // Terapkan filter area
      let matchesArea = !filterArea || item.area === filterArea;

      // Terapkan search
      const matchesSearch = 
        item.tugas.toLowerCase().includes(search.toLowerCase()) ||
        item.area.toLowerCase().includes(search.toLowerCase()) ||
        item.petugas.toLowerCase().includes(search.toLowerCase());

      return matchesDate && matchesArea && matchesSearch;
    });

    // Update filtered data dan hitung analytics
    setFilteredData(filtered);
    calculateAnalytics(filtered);
  }, [filterTanggalMulai, filterTanggalSelesai, filterArea, search, riwayatTugas]);

  if (loading) {
    return (
      <div className="laporan-page">
        <AdminSidebar />
        <main className="laporan-main">
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>⏳ Memuat data laporan...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="laporan-page">
      <AdminSidebar />

      <main className="laporan-main">
        <AdminTopbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari laporan..."
        />

        <section className="content">
          <div className="header">
            <div>
              <h1>Laporan Kebersihan</h1>
              <p>Monitor dan analisis performa tugas kebersihan</p>
            </div>
            <div className="laporan-actions">
              <button className="btn-cetak"><FiPrinter /> Cetak PDF</button>
              <button className="btn-unduh" onClick={() => exportToExcel(filteredData, trendData, performaArea, distribusiData, ringkasanData, 'xlsx', 'laporan_kebersihan')}>
                <FiDownload /> Unduh Excel
              </button>
            </div>
          </div>

          <div className="filter-card">
            <div className="filter-title">
              <div className="icon-box"><FiCalendar /></div> Filter Laporan
            </div>
            <div className="filter-grid">
              <div className="filter-item">
                <label>Tanggal Mulai</label>
                <input
                  type="date"
                  value={filterTanggalMulai}
                  onChange={(e) => setFilterTanggalMulai(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div className="filter-item">
                <label>Tanggal Selesai</label>
                <input
                  type="date"
                  value={filterTanggalSelesai}
                  onChange={(e) => setFilterTanggalSelesai(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div className="filter-item">
                <label>Filter Area</label>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  <option value="">Semua Area</option>
                  {allAreas.map((area, idx) => (
                    <option key={idx} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>Riwayat Tugas</h3>
              <div className="small-search">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Cari tugas, area, atau petugas"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="table-scroll-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Area</th>
                    <th>Tugas</th>
                    <th>Petugas</th>
                    <th>Shift</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {error ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#d32f2f" }}>
                        ❌ {error}
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                        Tidak ada data laporan
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, i) => (
                      <tr key={item.id_laporan || i}>
                        <td>{item.tanggal}</td>
                        <td>{item.area}</td>
                        <td>{item.tugas}</td>
                        <td>{item.petugas}</td>
                        <td>{item.shift}</td>
                        <td>
                          <span className={`status-badge ${item.status_kehadiran === "hadir" ? "selesai" : "belum"}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="icon-box"><FiTrendingUp /></div>
                <h3>Trend Tugas Harian</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Selesai" stroke="#0a8f3c" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="icon-box"><FiBarChart2 /></div>
                <h3>Performa Per Area</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={performaArea}>
                  <XAxis dataKey="area" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Selesai" fill="#0a8f3c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="icon-box"><FiPieChart /></div>
                <h3>Distribusi Penyelesaian</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 30, right: 80, bottom: 30, left: 80 }}>
                  <Pie
                    data={distribusiData}
                    cx="40%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                    labelPosition="right"
                  >
                    {distribusiData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card ringkasan-card">
              <div className="chart-card-header">
                <div className="icon-box"><FiClipboard /></div>
                <h3>Ringkasan Periode</h3>
              </div>
              <div className="ringkasan-list">
                <div className="ringkasan-item">
                  <span className="ringkasan-label">Periode Laporan</span>
                  <span className="ringkasan-value green">{ringkasanData.periode || "-"}</span>
                </div>
                <div className="ringkasan-item">
                  <span className="ringkasan-label">Total Tugas Hadir</span>
                  <span className="ringkasan-value green">{ringkasanData.totalSelesai} tugas</span>
                </div>
                <div className="ringkasan-item">
                  <span className="ringkasan-label">Total Tugas Tidak Hadir</span>
                  <span className="ringkasan-value green">{ringkasanData.totalBelum} tugas</span>
                </div>
                <div className="ringkasan-item">
                  <span className="ringkasan-label">Rata-rata Harian</span>
                  <span className="ringkasan-value green">{ringkasanData.rataRataHarian} tugas/hari</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
