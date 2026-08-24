import { useState } from "react";
import "./Bantuan.css";

import {
    FiChevronDown,
    FiHelpCircle,
    FiMail,
    FiPhone
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";

const faqData = [
  {
    question: "bagaimana cara membuat penugasan baru untuk OB?",
    answer:
      "Masuk ke menu Penugasan OB kemudian klik tombol Tambah Tugas dan isi seluruh data yang diperlukan."
  },
  {
    question: "Bagaimana cara melakukan pengawasan tugas?",
    answer:
      "Masuk ke menu Pengawasan lalu pilih area yang ingin diperiksa dan berikan penilaian sesuai kondisi lapangan."
  },
  {
    question: "Bagaimana cara membuat laporan mingguan?",
    answer:
      "Masuk ke menu Laporan dan pilih rentang tanggal yang diinginkan kemudian klik Generate Laporan."
  },
  {
    question: "Apa yang harus dilakukan jika OB tidak hadir?",
    answer:
      "Segera lakukan penggantian petugas melalui menu Penugasan dan laporkan ke supervisor."
  },
  {
    question: "Bagaimana cara input data lapangan ke sistem?",
    answer:
      "Gunakan menu Pengawasan lalu isi hasil monitoring beserta dokumentasi jika diperlukan."
  },
  {
    question: "Bagaimana cara melihat riwayat tugas OB?",
    answer:
      "Masuk ke menu Penugasan kemudian pilih detail petugas untuk melihat seluruh riwayat tugas."
  }
];

export default function Bantuan() {
  const [active, setActive] = useState(null);

  const toggleFaq = (index) => {
    setActive(active === index ? null : index);
  };

  return (
    <div className="help-layout">
      <Sidebar />
      <main className="help-main">
        <div className="help-page">

          <div className="help-content">

        {/* HEADER */}
        <div className="help-header">
          <h1>Bantuan</h1>
          <p>Panduan dan dukungan sistem BETA</p>
        </div>

        {/* FAQ */}
        <div className="help-card">

          <div className="help-title">

            <div className="help-icon">
              <FiHelpCircle />
            </div>

            <div>
              <h2>Frequently Asked Questions</h2>
              <span>Pertanyaan yang sering diajukan</span>
            </div>

          </div>

          <div className="faq-list">

            {faqData.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${active === index ? "active" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <FiChevronDown />
                </button>

                {active === index && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}

          </div>

        </div>

        {/* CONTACT */}
        <div className="contact-card">

          <h2>Hubungi Kami</h2>

          <p className="contact-desc">
            Tidak menemukan jawaban yang Anda cari?
            Tim support kami siap membantu Anda.
          </p>

          <div className="contact-grid">

            <div className="contact-box">

              <div className="contact-icon">
                <FiMail />
              </div>

              <div>
                <h4>Email Support</h4>
                <p>support@beta.com</p>
                <span>Respon dalam 24 jam</span>
              </div>

            </div>

            <div className="contact-box">

              <div className="contact-icon">
                <FiPhone />
              </div>

              <div>
                <h4>Phone Support</h4>
                <p>+62 21 1234 5678</p>
                <span>Senin - Jumat, 08:00 - 17:00</span>
              </div>

            </div>

          </div>

          <div className="tips-box">
            💡 Tips: Siapkan screenshot atau detail error untuk mempercepat proses troubleshooting
          </div>

        </div>
      </div>
    </div>
    </main>
  </div>
  );
}