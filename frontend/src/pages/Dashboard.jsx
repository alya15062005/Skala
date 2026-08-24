import { useEffect, useState } from "react";
import { PieChart } from 'react-minimal-pie-chart';
import { useNavigate } from "react-router-dom";
import iconPagi from "../assets/pagi.png";
import iconSiang from "../assets/siang.png";
import iconSore from "../assets/sore.png";
import Sidebar from "../components/Sidebar"; // Import Sidebar baru
import UserTopbar from "../components/UserTopbar";
import { penugasanAPI, shiftAPI } from "../service/api";
import "./Dashboard.css";
import Penilaian from "./Penilaian";
import TambahTugas from "./TambahTugas";

import {
    FiArrowUpRight,
    FiChevronRight,
    FiEdit2,
    FiLayout,
    FiPlus,
    FiSearch
} from "react-icons/fi";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [penugasanList, setPenugasanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    tugasHariIni: 0,
    areaTercover: 0,
    tugasSelesai: 0,
    progressPercentage: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showPenilaian, setShowPenilaian] = useState(false);
  const [penilaianData, setPenilaianData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shiftList, setShiftList] = useState([]);
  const [shiftStatus, setShiftStatus] = useState([]);
  const [footerSubs, setFooterSubs] = useState({
    tugasHariIni: 'Total penugasan yang aktif',
    areaTercover: 'Total Area: 0',
    tugasSelesai: 'Dari pengawasan hari ini'
  });

  const navigate = useNavigate();
  const [laporanMap, setLaporanMap] = useState({});

  // Cek apakah penugasan masih aktif (tanggal akhir >= hari ini)
  const isPenugasanAktif = (tanggalAkhir) => {
    if (!tanggalAkhir) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(tanggalAkhir);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
  };

  // Filter data - hanya tampilkan penugasan yang belum expired
  const activePenugasan = penugasanList.filter(item => isPenugasanAktif(item.tanggal_akhir));

  const getAssignedPetugas = (item) => item.nama_ob || item.nama_lengkap || item.username || 'N/A';

  const visibleTasks = activePenugasan.filter(item => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    return (
      (item.nama_ruangan || '').toLowerCase().includes(query) ||
      (item.detail_pekerjaan || '').toLowerCase().includes(query) ||
      getAssignedPetugas(item).toLowerCase().includes(query)
    );
  });

  // Fetch penugasan data dan laporan untuk menghitung stats
  useEffect(() => {
    const fetchPenugasan = async () => {
      try {
        setLoading(true);
        const response = await penugasanAPI.getAll();
        
        if (response.data.success) {
          const data = response.data.data || [];
          setPenugasanList(data);
          
          console.log("Data penugasan from API:", data);
          
          // Filter hanya penugasan aktif (belum expired)
          const aktif = data.filter(item => isPenugasanAktif(item.tanggal_akhir));
          
          // Filter penugasan yang aktif HARI INI (tanggal_awal <= today <= tanggal_akhir)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tugasAktifHariIni = aktif.filter(item => {
            const start = new Date(item.tanggal_awal);
            const end = new Date(item.tanggal_akhir);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            
            // Cek apakah hari ini dalam periode penugasan
            const isInPeriod = today >= start && today <= end;
            
            // Cek apakah data lengkap (ada detail_pekerjaan, shift, dan nama_ob)
            const isComplete = [item.detail_pekerjaan, item.shift, item.nama_ob].every(
              (field) => field && String(field).trim() !== ""
            );
            
            return isInPeriod && isComplete;
          });
          
          console.log("Tugas aktif hari ini:", tugasAktifHariIni.length);
          
          // Calculate yesterday's active tasks for comparison
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          
          const tugasAktifKemarin = aktif.filter(item => {
            const start = new Date(item.tanggal_awal);
            const end = new Date(item.tanggal_akhir);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            
            const isInPeriod = yesterday >= start && yesterday <= end;
            
            const isComplete = [item.detail_pekerjaan, item.shift, item.nama_ob].every(
              (field) => field && String(field).trim() !== ""
            );
            
            return isInPeriod && isComplete;
          });
          
          // Total areas from all active penugasan
          const totalAreas = new Set(
            aktif.filter(item => item.id_ruangan).map(item => item.id_ruangan)
          ).size;
          const todayString = new Date().toLocaleDateString('en-CA');
          const laporanResponse = await penugasanAPI.getLaporan(todayString);
          const laporanHariIni = laporanResponse.data.data || [];
          // build map id_penugasan -> laporan
          const laporanMapObj = {};
          laporanHariIni.forEach(r => { laporanMapObj[String(r.id_penugasan)] = r; });
          setLaporanMap(laporanMapObj);
          
          console.log("Laporan hari ini:", laporanHariIni);
          
          // Tugas yang sudah dinilai hari ini (ada laporan dengan nilai)
          const tugasSelesaiHariIni = laporanHariIni.filter(
            laporan => laporan.nilai && (laporan.nilai === 'green' || laporan.nilai === 'yellow')
          ).length;

          // Area tercover (jumlah ruangan unik dari penugasan aktif hari ini)
          const areaTercover = new Set(
            tugasAktifHariIni.filter(item => item.id_ruangan).map(item => item.id_ruangan)
          ).size;

          // Progress percentage - berdasarkan laporan yang sudah ada vs tugas aktif hari ini
          const progressPercentage = tugasAktifHariIni.length > 0 
            ? Math.round((laporanHariIni.length / tugasAktifHariIni.length) * 100)
            : 0;

          console.log("Stats updated:", { 
            tugasAktifHariIni: tugasAktifHariIni.length, 
            areaTercover, 
            tugasSelesaiHariIni,
            totalLaporan: laporanHariIni.length,
            progressPercentage 
          });

          setStats({
            tugasHariIni: tugasAktifHariIni.length,
            areaTercover,
            tugasSelesai: tugasSelesaiHariIni,
            progressPercentage
          });
          
          // Calculate footer sub texts
          const diffTugas = tugasAktifHariIni.length - tugasAktifKemarin.length;
          const sisaArea = totalAreas - areaTercover;
          const sisaTugas = tugasAktifHariIni.length - tugasSelesaiHariIni;
          
          setFooterSubs({
            tugasHariIni: `${diffTugas >= 0 ? '+' : ''}${diffTugas} dari kemarin`,
            areaTercover: `Sisa ${sisaArea} dari ${totalAreas} area`,
            tugasSelesai: `Sisa ${sisaTugas} dari ${tugasAktifHariIni.length} tugas`
          });
        }
      } catch (err) {
        console.error("Error fetching penugasan/laporan:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPenugasan();
    fetchShifts();
  }, [refreshKey]);

  const fetchShifts = async () => {
    try {
      const response = await shiftAPI.getAll();
      if (response.data.success) {
        const data = response.data.data || [];
        const sortedShifts = [...data].sort((a, b) => {
          const [aHour, aMinute] = (a.jam_mulai || "00:00").slice(0, 5).split(":").map(Number);
          const [bHour, bMinute] = (b.jam_mulai || "00:00").slice(0, 5).split(":").map(Number);
          return aHour * 60 + aMinute - (bHour * 60 + bMinute);
        });
        setShiftList(sortedShifts);
      }
    } catch (err) {
      console.error("Error fetching shifts:", err);
    }
  };

  // Format tanggal
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Format status
  const getStatusClass = (status) => {
    if (!status) return 'belum';
    return status.toLowerCase() === 'selesai' ? 'selesai' : 'belum';
  };

  const fallbackShifts = [
    { nama_shift: 'Pagi', jam_mulai: '07:00', jam_selesai: '10:30', icon: iconPagi },
    { nama_shift: 'Siang', jam_mulai: '10:30', jam_selesai: '14:00', icon: iconSiang },
    { nama_shift: 'Sore', jam_mulai: '14:00', jam_selesai: '17:00', icon: iconSore }
  ];

  const shiftIconMap = {
    Pagi: iconPagi,
    Siang: iconSiang,
    Sore: iconSore,
  };

  const normalizeTime = (time) => {
    if (typeof time !== 'string') return '00:00';
    const cleaned = time.trim();
    return cleaned.length >= 5 ? cleaned.slice(0, 5) : cleaned.padEnd(5, '0');
  };

  const getShiftStatus = (shiftItems = shiftList) => {
    const shiftsToUse = shiftItems.length ? shiftItems : fallbackShifts;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return shiftsToUse.map((shift) => {
      const start = normalizeTime(shift.jam_mulai || shift.start || '00:00');
      const end = normalizeTime(shift.jam_selesai || shift.end || '00:00');
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      const isActive = currentTime >= startTime && currentTime < endTime;

      let timeRemaining = 0;
      if (isActive) {
        timeRemaining = endTime - currentTime;
      } else if (currentTime < startTime) {
        timeRemaining = startTime - currentTime;
      }

      const hours = Math.floor(timeRemaining / 60);
      const minutes = timeRemaining % 60;
      const seconds = 0;
      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      const icon = shift.icon || shiftIconMap[shift.nama_shift] || shiftIconMap[shift.name] || iconPagi;
      const name = shift.nama_shift || shift.name || 'Shift';

      return {
        ...shift,
        name,
        start,
        end,
        icon,
        isActive,
        timeRemaining: formattedTime,
        isEnded: currentTime >= endTime,
      };
    });
  };

  useEffect(() => {
    setShiftStatus(getShiftStatus(shiftList));
  }, [shiftList]);

  // Update shift status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setShiftStatus(getShiftStatus(shiftList));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [shiftList]);

  return (
    <div className="dashboard-container">
      {/* Cukup panggil komponen Sidebar */}
      <Sidebar />

      <main className="main-content">
        <UserTopbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari tugas"
        />

        <section className="content-inner">
          <div className="header-title">
            <h1>Dashboard Pengawas</h1>
            <p>Monitoring dan pengawasan tugas kebersihan</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card green">
              <div className="stat-header">
                <p>Tugas Aktif</p>
                <div className="stat-icon-circle"><FiArrowUpRight /></div>
              </div>
              <h2>{stats.tugasHariIni}</h2>
              <div className="stat-footer">
                <p className="footer-main">Tugas Hari Ini</p>
                <p className="footer-sub">{footerSubs.tugasHariIni}</p>
              </div>
            </div>

            <div className="stat-card white">
              <div className="stat-header">
                <p>Area Tercover</p>
                <div className="stat-icon-circle border"><FiArrowUpRight /></div>
              </div>
              <h2>{stats.areaTercover}</h2>
              <div className="stat-footer">
                <p className="footer-main">Area dcheck</p>
                <p className="footer-sub">{footerSubs.areaTercover}</p>
              </div>
            </div>

            <div className="stat-card white">
              <div className="stat-header">
                <p>Tugas Selesai</p>
                <div className="stat-icon-circle border"><FiArrowUpRight /></div>
              </div>
              <h2>{stats.tugasSelesai}</h2>
              <div className="stat-footer">
                <p className="footer-main">Tugas Diselesaikan</p>
                <p className="footer-sub">{footerSubs.tugasSelesai}</p>
              </div>
            </div>

            <div className="stat-card white progres-card-container">
              <div className="stat-header">
                <p>Progres Monitoring</p>
                <div className="stat-icon-circle border"><FiArrowUpRight /></div>
              </div>
              <div className="gauge-wrapper">
                <PieChart
                  data={[{ value: 100, color: '#edf2f7' }]}
                  lineWidth={25}
                  startAngle={180}
                  lengthAngle={180}
                  rounded
                  className="gauge-bg"
                />
                <PieChart
                  data={[{ value: stats.progressPercentage, color: '#0a8f3c' }]}
                  totalValue={100}
                  lineWidth={25}
                  startAngle={180}
                  lengthAngle={180}
                  rounded
                  animate
                  label={({ dataEntry }) => `${dataEntry.value}%`}
                  labelStyle={{ fontSize: '22px', fontWeight: 'bold', fill: '#2d3748' }}
                  labelPosition={0}
                  className="gauge-chart"
                />
              </div>
              <div className="progress-legend">
                <div className="legend-item"><i className="dot sudah"></i> Sudah Dinilai</div>
                <div className="legend-item"><i className="dot belum"></i> Belum Dinilai</div>
              </div>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="table-container">
              <div className="table-header task-header-card">
                <div className="header-left">
                  <div className="task-header-info">
                    <div className="task-header-title">
                      <div>
                        <h3>Tugas Hari Ini</h3>
                        <p className="table-date">{formatDate(new Date())}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="header-right">
                  <div className="header-center">
                    <div className="search-bar table-search">
                      <FiSearch />
                      <input
                        type="text"
                        placeholder="Cari tugas, area, atau petugas"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="table-actions">
                    <button
                      className="btn-monitoring"
                      onClick={() => navigate('/pengawasan')}
                    >
                      <span className="btn-icon btn-icon-monitoring">
                        <FiLayout />
                      </span>
                      Monitoring
                    </button>

                    <button
                      className="btn-add"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <span className="btn-icon btn-icon-add">
                        <FiPlus />
                      </span>
                      Tambah Tugas
                    </button>
                  </div>
                </div>
              </div>

              <div className="mobile-task-list">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>Loading data...</div>
                ) : error ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {error}</div>
                ) : visibleTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>Tidak ada tugas aktif</div>
                ) : (
                  visibleTasks.slice(0, 5).map((item, index) => (
                    <div className="mobile-task-card" key={index}>
                      <div className="card-header">
                        <div className="card-title">{item.nama_ruangan || 'N/A'}{item.lantai ? ` – ${item.lantai}` : ''}</div>
                        {(() => {
                          const lp = laporanMap[String(item.id_penugasan || item.id)];
                            if (lp) {
                              const label = lp.nilai === 'green' ? 'Selesai' : lp.nilai === 'yellow' ? 'Perlu Tindak Lanjut' : lp.nilai === 'red' ? 'Belum Selesai' : 'Dinilai';
                              const colorClass = lp.nilai === 'green' ? 'selesai' : lp.nilai === 'yellow' ? 'peringatan' : lp.nilai === 'red' ? 'belum' : 'selesai';
                              return (
                                <div className={`status-badge ${colorClass}`}>
                                  {label}
                                </div>
                              );
                            }

                            return (
                              <div className={`status-badge belum`}>
                                Belum
                              </div>
                            );
                        })()}
                      </div>
                      <div className="card-detail">{item.detail_pekerjaan || 'N/A'}</div>
                      <div className="card-meta">{getAssignedPetugas(item)} | {item.shift || 'N/A'}</div>
                      <div className="card-action">
                        {laporanMap[String(item.id_penugasan || item.id)] ? (
                          <button className="btn-detail" onClick={() => {/* open detail - navigate to pengawasan detail or reuse modal */ navigate('/pengawasan'); }}>
                            <FiChevronRight style={{ marginRight: 6 }} /> Detail
                          </button>
                        ) : (
                          <button className="btn-nilai" onClick={() => { setPenilaianData(item); setShowPenilaian(true); }}>
                            <FiEdit2 style={{ marginRight: 6 }} /> Nilai
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <table className="desktop-table">
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>Tugas</th>
                    <th>Shift</th>
                    <th>Petugas</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                        Loading data...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                        Error: {error}
                      </td>
                    </tr>
                  ) : visibleTasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                        Tidak ada tugas aktif
                      </td>
                    </tr>
                  ) : (
                    visibleTasks.slice(0, 5).map((item, index) => (
                      <tr key={index}>
                        <td>{item.nama_ruangan || 'N/A'} - Lantai {item.lantai || 'N/A'}</td>
                        <td>{item.detail_pekerjaan || 'N/A'}</td>
                        <td>{item.shift || 'N/A'}</td>
                        <td>{getAssignedPetugas(item)}</td>
                        <td>
                          {(() => {
                            const lp = laporanMap[String(item.id_penugasan || item.id)];
                            if (lp) {
                              const label = lp.nilai === 'green' ? 'Selesai' : lp.nilai === 'yellow' ? 'Perlu Tindak Lanjut' : lp.nilai === 'red' ? 'Belum Selesai' : 'Dinilai';
                              const color = lp.nilai === 'green' ? '#28a745' : lp.nilai === 'yellow' ? '#ffc107' : lp.nilai === 'red' ? '#dc3545' : '#ccc';
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="color-box-p" style={{ backgroundColor: color }}></span>
                                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#4a4a4a' }}>{label}</span>
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="color-box-p" style={{ backgroundColor: '#d3d3d3' }}></span>
                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#999999' }}>Belum Dinilai</span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="see-more" onClick={() => navigate('/penugasan')} style={{ cursor: 'pointer' }}>
                Lihat Selengkapnya <FiChevronRight />
              </div>
            </div>

            <div className="widgets">
              <div className="shift-card">
                <div className="card-header">
                  <h3>Shift</h3>
                  <div className="icon-arrow-circle"><FiArrowUpRight /></div>
                </div>
                <div className="shift-list">
                  {shiftStatus.map((shift, index) => (
                    <div key={index} className={`shift-item ${shift.isEnded ? 'disabled' : ''} ${shift.isActive ? 'active' : ''}`}>
                      <img src={shift.icon} alt={shift.name} className="shift-img-icon" />
                      <div className="shift-info">
                        <p className="shift-name">Shift {shift.name}</p>
                        <p className="shift-time">{shift.start} - {shift.end}</p>
                        <p className="shift-timer">{shift.timeRemaining} {shift.isActive ? 'Sisa' : shift.isEnded ? 'Selesai' : 'Dimulai'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
        </section>
      </main>

      <TambahTugas show={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {showPenilaian && (
        <Penilaian
          data={penilaianData}
          onClose={(newReport) => {
            setShowPenilaian(false);
            setPenilaianData(null);
            if (newReport) setRefreshKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
}
