import { useEffect, useState } from "react";
import {
    FiInfo,
    FiSearch,
    FiStar
} from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import UserTopbar from "../components/UserTopbar";
import { penugasanAPI } from "../service/api";
import "./Dashboard.css";
import Detail from "./Detail";
import "./Pengawasan.css";
import Penilaian from "./penilaian";

export default function Pengawasan() {
  const [search, setSearch] = useState("");
  const [modalNilai, setModalNilai] = useState(null); // Menyimpan data item yang akan dinilai
  const [modalDetail, setModalDetail] = useState(null);
  const [dataTugas, setDataTugas] = useState([]);
  const [laporanMap, setLaporanMap] = useState({}); // Map id_penugasan -> laporan data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function untuk transform data item
  const transformItem = (item) => {
    const tanggalAwal = new Date(item.tanggal_awal).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit' 
    });
    const tanggalAkhir = new Date(item.tanggal_akhir).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit' 
    });

    const tugas = item.detail_pekerjaan || "-";
    const shift = item.shift || "-";
    const petugas = item.nama_ob || "-";

    // Tentukan status input tugas
    const isComplete = [item.detail_pekerjaan, item.shift, item.nama_ob].every(
      (field) => field && String(field).trim() !== ""
    );
    const statusInput = isComplete ? "Lengkap" : "Belum";

    // Untuk Pengawasan, status penyelesaian awalnya "Belum"
    const status = "Belum";

    return {
      id_penugasan: item.id_penugasan,
      area: item.nama_ruangan ? `${item.nama_ruangan} - Lantai ${item.lantai}` : "-",
      tugas: tugas,
      shift: shift,
      petugas: petugas,
      status: status,
      statusInput: statusInput,
      tanggalAwal: new Date(item.tanggal_awal),
      tanggalAkhir: new Date(item.tanggal_akhir),
      deskripsi: item.deskripsi || ""
    };
  };

  // Fetch data dari database
  useEffect(() => {
    const fetchPenugasan = async () => {
      try {
        setLoading(true);
        
        // Fetch penugasan data
        const penugasanResponse = await penugasanAPI.getAll();
        
        // Transform data dari database ke format yang sesuai dengan UI
        let transformedData = (penugasanResponse.data.data || []).map(transformItem);

        // Filter: hanya yang statusInput "Lengkap" dan tanggal hari ini berada dalam periode
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const filteredData = transformedData.filter((item) => {
          const start = new Date(item.tanggalAwal);
          const end = new Date(item.tanggalAkhir);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          return item.statusInput === "Lengkap" && now >= start && now <= end;
        });

        // Fetch semua laporan hanya untuk tanggal hari ini
        try {
          const todayString = new Date().toLocaleDateString('en-CA');
          const laporanResponse = await penugasanAPI.getLaporan(todayString);
          const laporanDataArray = laporanResponse.data.data || [];
          
          // Create map: id_penugasan (string) -> laporan data
          const laporan = {};
          laporanDataArray.forEach(report => {
            laporan[String(report.id_penugasan)] = report;
          });
          setLaporanMap(laporan);

          // Update status item berdasarkan laporan hari ini
          const updatedData = filteredData.map(item => ({
            ...item,
            status: laporan[String(item.id_penugasan)] ? "Selesai" : ""
          }));
          
          console.log("[Pengawasan] laporanMap keys after initial fetch:", Object.keys(laporan));
          console.log("[Pengawasan] updatedData sample:", updatedData.slice(0,3));
          setDataTugas(updatedData);
        } catch (laporanErr) {
          console.error("Error fetching laporan:", laporanErr);
          setDataTugas(filteredData);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching penugasan:", err);
        setError("Gagal memuat data pengawasan");
      } finally {
        setLoading(false);
      }
    };

    fetchPenugasan();
  }, []);

  const filtered = dataTugas.filter((item) =>
    item.tugas.toLowerCase().includes(search.toLowerCase()) ||
    item.area.toLowerCase().includes(search.toLowerCase()) ||
    item.petugas.toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <UserTopbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari tugas"
        />

        <section className="content-inner">
          <div className="page-header">
            <div className="header-text">
              <h1>Pengawasan Tugas</h1>
              <p>Pantau progres pengerjaan dan berikan penilaian</p>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <div className="header-left">
                <h3>Tugas Hari Ini</h3>
                <p className="table-date">{today}</p>
              </div>
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

            <table className="custom-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Tugas</th>
                  <th>Shift</th>
                  <th>Petugas</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      Loading data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      Tidak ada data pengawasan
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id_penugasan}>
                          <td>{item.area}</td>
                          <td>{item.tugas}</td>
                          <td>{item.shift}</td>
                          <td>{laporanMap[String(item.id_penugasan)]?.person_assigned || item.petugas}</td>
                          <td>
                            {laporanMap[String(item.id_penugasan)] ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="color-box-p" style={{
                                  backgroundColor: 
                                    laporanMap[String(item.id_penugasan)]?.nilai === "green" ? "#28a745" :
                                    laporanMap[String(item.id_penugasan)]?.nilai === "yellow" ? "#ffc107" :
                                    laporanMap[String(item.id_penugasan)]?.nilai === "red" ? "#dc3545" : "#ccc"
                                }}></span>
                                <span style={{ fontSize: "13px", fontWeight: "500", color: "#4a4a4a" }}>
                                  {laporanMap[String(item.id_penugasan)]?.nilai === "green" ? "Selesai" :
                                   laporanMap[String(item.id_penugasan)]?.nilai === "yellow" ? "Perlu Tindak Lanjut" :
                                   laporanMap[String(item.id_penugasan)]?.nilai === "red" ? "Belum Selesai" : "-"}
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="color-box-p" style={{
                                  backgroundColor: "#d3d3d3"
                                }}></span>
                                <span style={{ fontSize: "13px", fontWeight: "500", color: "#999999" }}>
                                  Belum Dinilai
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            {laporanMap[String(item.id_penugasan)] ? (
                              <button className="btn-detail" onClick={() => setModalDetail(item)}>
                                <FiInfo /> Detail
                              </button>
                            ) : (
                              <button className="btn-nilai" onClick={() => setModalNilai(item)}>
                                <FiStar /> Nilai
                              </button>
                            )}
                          </td>
                        </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="pengawasan-mobile-list">
              {loading ? (
                <div className="pengawasan-state">Loading data...</div>
              ) : error ? (
                <div className="pengawasan-state error">{error}</div>
              ) : filtered.length === 0 ? (
                <div className="pengawasan-state">Tidak ada data pengawasan</div>
              ) : (
                filtered.map((item) => {
                  const laporan = laporanMap[String(item.id_penugasan)];
                  const label =
                    laporan?.nilai === "green" ? "Selesai" :
                    laporan?.nilai === "yellow" ? "Perlu Tindak Lanjut" :
                    laporan?.nilai === "red" ? "Belum Selesai" :
                    "Belum";

                  return (
                    <article className="pengawasan-card" key={item.id_penugasan}>
                      <div className="pengawasan-card-head">
                        <h3>{item.area}</h3>
                        <span className={`pengawasan-status ${laporan ? "done" : "pending"}`}>
                          {label}
                        </span>
                      </div>

                      <div className="pengawasan-card-body">
                        <strong>{item.tugas}</strong>
                        <p>{laporan?.person_assigned || item.petugas} | {item.shift}</p>
                      </div>

                      {laporan ? (
                        <button
                          type="button"
                          className="pengawasan-card-action"
                          onClick={() => setModalDetail(item)}
                        >
                          <FiInfo /> Detail
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="pengawasan-card-action"
                          onClick={() => setModalNilai(item)}
                        >
                          <FiStar /> Nilai
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modal Nilai Menggunakan File Terpisah */}
      {modalNilai && (
        <Penilaian
          data={modalNilai} 
          onClose={() => {
            setModalNilai(null);
            // Refresh data setelah simpan hanya untuk tanggal hari ini
            const todayString = new Date().toLocaleDateString('en-CA');
            penugasanAPI.getLaporan(todayString).then(res => {
              const laporan = {};
              (res.data.data || []).forEach(report => {
                if (!laporan[String(report.id_penugasan)]) {
                  laporan[String(report.id_penugasan)] = report;
                }
              });
              setLaporanMap(laporan);
              // Refresh penugasan juga untuk update status
              penugasanAPI.getAll().then(res => {
                const updatedData = (res.data.data || []).map(transformItem);
                const filtered = updatedData.filter((item) => {
                  const start = new Date(item.tanggalAwal);
                  const end = new Date(item.tanggalAkhir);
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  start.setHours(0, 0, 0, 0);
                  end.setHours(0, 0, 0, 0);
                  return item.statusInput === "Lengkap" && now >= start && now <= end;
                });

                // Apply laporan map to each item so UI reflects latest status immediately
                console.log("[Pengawasan] laporanMap keys after modalNilai close:", Object.keys(laporan));
                const finalData = filtered.map(item => ({
                  ...item,
                  status: laporan[String(item.id_penugasan)] ? "Selesai" : ""
                }));
                console.log("[Pengawasan] finalData sample after modalNilai:", finalData.slice(0,3));
                setDataTugas(finalData);
              }).catch(err => console.error("Error refetching penugasan:", err));
            }).catch(err => console.error("Error refetching laporan:", err));
          }}
        />
      )}

      {/* Modal Detail Terpisah */}
      {modalDetail && (
        <Detail
          data={modalDetail}
          laporanData={laporanMap[String(modalDetail.id_penugasan)]}
          onClose={() => setModalDetail(null)}
          onUpdateSuccess={() => {
            // Refresh data setelah update
            setModalDetail(null);
            // Re-fetch laporan
            const todayString = new Date().toLocaleDateString('en-CA');
            penugasanAPI.getLaporan(todayString).then(res => {
              const laporan = {};
              (res.data.data || []).forEach(report => {
                laporan[String(report.id_penugasan)] = report;
              });
              setLaporanMap(laporan);
              console.log("[Pengawasan] laporanMap keys after modalDetail update:", Object.keys(laporan));
              // Also refresh penugasan list and apply status
              penugasanAPI.getAll().then(res2 => {
                const updatedData = (res2.data.data || []).map(transformItem);
                const filtered = updatedData.filter((item) => {
                  const start = new Date(item.tanggalAwal);
                  const end = new Date(item.tanggalAkhir);
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  start.setHours(0, 0, 0, 0);
                  end.setHours(0, 0, 0, 0);
                  return item.statusInput === "Lengkap" && now >= start && now <= end;
                });
                const finalData = filtered.map(item => ({
                  ...item,
                  status: laporan[item.id_penugasan] ? "Selesai" : ""
                }));
                setDataTugas(finalData);
              }).catch(err => console.error("Error refetching penugasan:", err));
            }).catch(err => console.error("Error refetching laporan:", err));
          }}
        />
      )}
    </div>
  );
}
