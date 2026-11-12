"use client"
import React, { useState, useEffect } from "react"
import { ShaderBackground } from "./ui/bw-liquid"
import { db } from "@/app/firebase"
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"

const photos = [
  "/foto1.jpeg",
  "/foto2.jpeg",
  "/foto3.jpeg",
  "/foto4.jpeg",
  "/foto5.jpeg",
  "/foto6.jpeg",
  "/foto7.jpeg",
  "/foto8.jpeg",
  "/foto9.jpeg",
  "/foto10.jpeg",
  "/foto11.jpeg",
  "/foto12.jpeg",
  "/foto13.jpeg"
]

const GH27_STUDENTS = [
  "ABRISAM YAHYA AGHNIY", "AQILAHAIRA FATHINA ZUHDI", "AISHA NASHIFA", "AISHAKIRANA MAULIDA SUBARKAH",
  "Aisya Nabila", "ALTHAF AQIELA WICAKSONO", "ALVARO PRANADHAFA LANDRYE", "ANNIDA MAHRUS",
  "ARIF NOFRIZALDI SAPUTRA", "ATHA SHAKILA ARANI", "ATSIRAH ZAKIAH ARRINI MOHENDEZ",
  "AURELIA ERVIANI", "CARISSA HANUN DIANDRA BAHTIAR", "CHOKY FII RAMADHANI", "DANISH AUFA RAIHAN",
  "DHABIT GHANIA WIDAYAT", "DINDA MAULIDA AZKIYA", "DZAKIYYAH IFFATTAQIYYAH FITHRI",
  "ERLANGGA NURHISYAM", "FADHIL AGHNIYA MUZAKKI", "FAHRY RIZKY ALFATAN", "FAKHRI ISHAMUDDIN AUFA YASIR",
  "FATHIA MEGUMI YUDHA", "FAWAZAH ALFIYAH BALQIS", "GHEZIAN ABIEZZA FAUZI", "HANA RAHMAH SHALIHAH",
  "HANIA NUR SHABRINA", "HASNA MUTHIAH", "HAZIMAH JASMINE MAHENDRA", "IRSYAD ALI NURSY",
  "IRSYAD DHIYAULHAQQI PRAYETNO", "IZZAH SILMIAH AHMAD", "KAYLA ANISA AZKIA", "KAYLA HANIN EFRONA ZALUKHU",
  "KHANZANEETA ERIQA MAHYA WINARSO", "KHALIS MAHESWARA SANTIKA", "LINTANG CAHYA NINGTYAS",
  "LUTHFIYAH ANWAR", "MAISHA AQILA YUSIRWAN", "MAZAYA AULIA", "MAZAYA DHEAVATY PUTRI AZIS",
  "MIRZA AL FARABI DEWANDARU", "MOCHAMAD FACHRY RAMADHAN", "MUHAMMAD ALFATH SUBHAN",
  "MUHAMMAD AZZAM ARAFAH", "MUHAMMAD DANISH SHIRAZ MULIA", "MUHAMMAD IHKAM HANIF",
  "MUHAMMAD IBRAHIM MUSA", "MUHAMMAD ILHAM RAMADHAN", "MUHAMMAD ORYZA SATIVA ZWEIZI",
  "MUHAMMAD RAFIIF STYAWAN", "MUHAMMAD TAUFIKURRAHMAN", "MUHAMMAD ZAYYAN MUGHNIY",
  "NADHIF AHMAD WIBOWO", "NAZLA QUEENCY LALUNA ABIDIN", "NIA HARMAWAN", "NIDA AULIA MUMTAZ",
  "NI MAH AISHA SIREGAR", "NURRONAA ROSYIDATU HUSNA", "APRADISWA ATIFI", "SHIDQY ATHAURRAHMAN",
  "QAWIYAH HAKIMAH QO'IMUDDIN", "QURROTA A'YUN TANJUNG", "RADHIYYAH FAYZA ZEIN", "RADIEZA AMMAR DANISH",
  "RAFI ISHAMUDDIN AUFA YASIR", "RAFIF BELADDIN INDRAWAN", "RAISA NUR SHABRINA MASHFA",
  "SENDRIYA ARKANANTA HIDAYAT", "REZA PUTRA YULIANTO", "RIDHA AYU ZAHIRA", "SAYYID HAFIDZ MUBAROK",
  "SITI KAYISA ADHA", "SULAIMAN UMAR WALIYURRAHMAN", "MUWAFFAQ ANNAFI MUHTADI", "SUMAYYAH AZ ZAHRA HIJJIYAH",
  "SYAFA NADA KAMILA", "SYAFIRA RAHMAH PUTRI", "SYAZA LIYANA FADHLY", "TAUFIK RAMADHAN",
  "WIRA DWI RIZKY", "ZAHRANI NAZIHA FIRDAUS", "ZEEDA BARAKA AHMAD"
]

export default function ShaderBackgroundDemo() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [aboutSubTab, setAboutSubTab] = useState<"tentang" | "rundown" | "destinasi">("tentang")
  
  const [students, setStudents] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank")
  const [proofImage, setProofImage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentSnap = await getDocs(collection(db, "students"))
        let studentList: any[] = []
        studentSnap.forEach((docSnap) => {
          studentList.push({ id: docSnap.id, ...docSnap.data() })
        })

        if (studentList.length === 0) {
          for (const name of GH27_STUDENTS) {
            await addDoc(collection(db, "students"), { name: name, totalSaved: 0 })
          }
          const res = await getDocs(collection(db, "students"))
          studentList = []
          res.forEach((d) => studentList.push({ id: d.id, ...d.data() }))
        }

        const uniqueStudentsMap = new Map()
        studentList.forEach((s) => {
          if (!uniqueStudentsMap.has(s.name)) {
            uniqueStudentsMap.set(s.name, s)
          }
        })
        let cleanStudents = Array.from(uniqueStudentsMap.values())
        cleanStudents.sort((a, b) => a.name.localeCompare(b.name))
        
        setStudents(cleanStudents)
        if (cleanStudents.length > 0) setSelectedStudentId(cleanStudents[0].id)

        const txSnap = await getDocs(collection(db, "transactions"))
        let txList: any[] = []
        txSnap.forEach((docSnap) => {
          txList.push({ id: docSnap.id, ...docSnap.data() })
        })
        setTransactions(txList)
        setLoading(false)
      } catch (error) {
        console.error("Gagal mengambil data dari Firebase:", error)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const nextPhoto = () => setCurrentIndex((prev) => (prev + 1) % photos.length)
  const prevPhoto = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          const MAX_WIDTH = 800
          const MAX_HEIGHT = 800
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width)
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height)
              height = MAX_HEIGHT
            }
          }
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75)
          setProofImage(compressedDataUrl)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    try {
      const studentDoc = students.find((s) => s.id === selectedStudentId)
      if (!studentDoc) return
      const currentTotal = studentDoc.totalSaved || 0
      const newTotal = currentTotal + Number(amount)
      const currentDate = new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
      
      const studentRef = doc(db, "students", selectedStudentId)
      await updateDoc(studentRef, { totalSaved: newTotal })
      
      const newTx = {
        studentName: studentDoc.name,
        amount: Number(amount),
        date: currentDate,
        method: paymentMethod,
        proof: proofImage || "Tidak ada foto"
      }
      
      const docRef = await addDoc(collection(db, "transactions"), newTx)
      
      setStudents(students.map((s) => s.id === selectedStudentId ? { ...s, totalSaved: newTotal } : s))
      setTransactions([{ id: docRef.id, ...newTx }, ...transactions])
      setSuccessMessage(`Berhasil mengirim setoran Rp${Number(amount).toLocaleString("id-ID")} untuk ${studentDoc.name}!`)
      setAmount("")
      setProofImage("")
      setTimeout(() => setSuccessMessage(""), 4000)
    } catch (error) {
      console.error("Gagal menyimpan pembayaran:", error)
      alert("Terjadi kesalahan saat menyimpan ke database.")
    }
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white selection:bg-cyan-500 selection:text-black">
      
      {/* FIXED BACKGROUND (Tetap diam saat halaman di-scroll) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShaderBackground className="h-full w-full" />
      </div>

      {/* FIXED NAVBAR (Responsif Desktop & HP) */}
      <header className="fixed top-0 left-0 w-full z-50 px-4 py-4 md:px-12">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3 bg-black/40 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-full">
          {/* Logo */}
          <div onClick={() => scrollToSection("home")} className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight cursor-pointer select-none">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">GH27</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 ml-1.5">Vacation</span>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8 text-white/90 font-semibold text-sm">
            <button onClick={() => scrollToSection("home")} className="hover:text-cyan-400 transition-colors cursor-pointer">Home</button>
            <button onClick={() => scrollToSection("about")} className="hover:text-cyan-400 transition-colors cursor-pointer">About</button>
            <button onClick={() => scrollToSection("payment")} className="hover:text-cyan-400 transition-colors cursor-pointer">Payment</button>
            <button onClick={() => scrollToSection("money-saves")} className="hover:text-cyan-400 transition-colors cursor-pointer">Money Saves</button>
          </div>

          {/* Tombol Menu Khusus HP */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold tracking-wide text-white transition-all"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? "✕ Tutup" : "☰ Menu"}
          </button>
        </nav>

        {/* Dropdown Menu HP (Liquid Glass) */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 max-w-6xl mx-auto bg-black/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl flex flex-col gap-2">
            <button onClick={() => scrollToSection("home")} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-white flex items-center justify-between">
              <span>Home</span><span className="text-white/40">→</span>
            </button>
            <button onClick={() => scrollToSection("about")} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-white flex items-center justify-between">
              <span>About & Rundown</span><span className="text-white/40">→</span>
            </button>
            <button onClick={() => scrollToSection("payment")} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-white flex items-center justify-between">
              <span>Payment (Setor)</span><span className="text-white/40">→</span>
            </button>
            <button onClick={() => scrollToSection("money-saves")} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-white flex items-center justify-between">
              <span>Money Saves (Rekap)</span><span className="text-white/40">→</span>
            </button>
          </div>
        )}
      </header>

      {/* MAIN SCROLLABLE CONTENT */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-28 md:pt-36 pb-24 space-y-24 md:space-y-32">

        {/* === SECTION 1: HOME & GALLERY SLIDER === */}
        <section id="home" className="scroll-mt-32 flex flex-col items-center text-center">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            Angkatan 27 • 81 Members
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
            Memories & Journey of <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">GH27</span>
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl mb-8">
            Dokumentasi kebersamaan, informasi perjalanan, dan transparansi tabungan angkatan sebelum melangkah ke jenjang berikutnya.
          </p>

          {/* Liquid Glass Photo Slider */}
          <div className="relative w-full max-w-[750px] aspect-video bg-white/10 backdrop-blur-xl border border-white/20 p-2.5 sm:p-3.5 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex items-center justify-center group">
            <button onClick={prevPhoto} className="absolute left-3 sm:left-5 z-10 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-white/15 transition-all shadow-lg flex items-center justify-center font-bold cursor-pointer">❮</button>
            
            <div className="relative w-full h-full bg-black/40 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer">
              <img 
                src={photos[currentIndex]} 
                alt={`Vacation ${currentIndex + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onClick={() => setPreviewImage(photos[currentIndex])}
              />
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white/90 text-[11px] sm:text-xs px-3 py-1.5 rounded-full border border-white/15 transition-opacity pointer-events-none shadow-md">
                🔍 Tap untuk perbesar ({currentIndex + 1}/{photos.length})
              </div>
            </div>

            <button onClick={nextPhoto} className="absolute right-3 sm:right-5 z-10 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-white/15 transition-all shadow-lg flex items-center justify-center font-bold cursor-pointer">❯</button>
          </div>
          
          {/* Dots Indicator */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {photos.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all cursor-pointer ${currentIndex === idx ? "w-6 bg-cyan-400" : "w-2 bg-white/40 hover:bg-white/70"}`} aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button onClick={() => scrollToSection("payment")} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer">
              Setor Tabungan
            </button>
            <button onClick={() => scrollToSection("about")} className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-sm transition-all cursor-pointer">
              Lihat Rundown
            </button>
          </div>
        </section>

        {/* === SECTION 2: ABOUT, RUNDOWN & DESTINASI === */}
        <section id="about" className="scroll-mt-28">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">About GH27 Vacation</h2>
            <p className="text-white/60 text-xs sm:text-sm mt-1">Detail acara, jadwal kegiatan, dan destinasi tujuan</p>
          </div>

          <div className="w-full bg-black/45 backdrop-blur-xl border border-white/20 p-5 sm:p-8 rounded-3xl shadow-2xl text-white">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 border-b border-white/10 pb-4">
              <button onClick={() => setAboutSubTab("tentang")} className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${aboutSubTab === "tentang" ? "bg-cyan-500 text-black shadow-lg" : "bg-white/10 hover:bg-white/20"}`}>Tentang</button>
              <button onClick={() => setAboutSubTab("rundown")} className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${aboutSubTab === "rundown" ? "bg-cyan-500 text-black shadow-lg" : "bg-white/10 hover:bg-white/20"}`}>Rundown</button>
              <button onClick={() => setAboutSubTab("destinasi")} className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${aboutSubTab === "destinasi" ? "bg-cyan-500 text-black shadow-lg" : "bg-white/10 hover:bg-white/20"}`}>Destinasi</button>
            </div>

            {aboutSubTab === "tentang" && (
              <div className="space-y-4 text-sm sm:text-base leading-relaxed">
                <h3 className="text-xl font-bold text-cyan-300">Momen Perpisahan & Kebersamaan</h3>
                <p className="text-white/80">Acara ini diselenggarakan sebagai momen perpisahan dan kebersamaan bagi 81 penghuni GH27 sebelum melanjutkan pendidikan ke perguruan tinggi.</p>
                <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl mt-4">
                  <h4 className="font-semibold text-yellow-300 mb-3">Fasilitas Akomodasi:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-white/85 text-sm">
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Tempat Penginapan</li>
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Bus Pariwisata</li>
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Makan & Minum (8 Kali)</li>
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Tiket Pariwisata & Snack</li>
                  </ul>
                </div>
              </div>
            )}

            {aboutSubTab === "rundown" && (
              <div className="space-y-4 text-sm sm:text-base">
                <h3 className="text-xl font-bold text-cyan-300">Rundown Singkat</h3>
                <div className="space-y-3">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10"><span className="text-yellow-300 font-bold">Day 1:</span> Perjalanan ke Villa & Pantai Madasari</div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10"><span className="text-yellow-300 font-bold">Day 2:</span> Green Canyon & Farewell BBQ</div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10"><span className="text-yellow-300 font-bold">Day 3:</span> Citumang Body Rafting & Pulang</div>
                </div>
              </div>
            )}

            {aboutSubTab === "destinasi" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-cyan-300">Destinasi Utama</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10"><div className="font-bold text-yellow-300 text-base mb-1">Green Canyon</div><p className="text-xs text-white/70">Sungai & tebing eksotis</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10"><div className="font-bold text-yellow-300 text-base mb-1">Pantai Madasari</div><p className="text-xs text-white/70">Pantai pesisir luas</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10"><div className="font-bold text-yellow-300 text-base mb-1">Citumang</div><p className="text-xs text-white/70">Body rafting air jernih</p></div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* === SECTION 3: PAYMENT (FORM SETORAN) === */}
        <section id="payment" className="scroll-mt-28 flex flex-col items-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Form Setoran Tabungan</h2>
            <p className="text-white/60 text-xs sm:text-sm mt-1">Pilih namamu dari 81 anggota asrama & upload bukti transfer</p>
          </div>

          <div className="w-full max-w-lg bg-black/45 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl text-white">
            {successMessage && (
              <div className="mb-5 p-3.5 bg-green-500/20 border border-green-500 text-green-300 text-xs sm:text-sm rounded-2xl text-center font-medium">
                {successMessage}
              </div>
            )}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">Nama Siswa</label>
                <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400">
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900 text-white">{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">Nominal Setoran (Rp)</label>
                <input type="number" placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">Metode Pembayaran</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400">
                  <option value="Transfer Bank" className="bg-zinc-900">Transfer Bank</option>
                  <option value="QRIS" className="bg-zinc-900">QRIS</option>
                  <option value="Cash" className="bg-zinc-900">Cash / Tunai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">Upload Foto Bukti Transfer</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full file:py-2 file:px-4 file:rounded-xl file:font-semibold file:bg-cyan-500 hover:file:bg-cyan-400 cursor-pointer text-xs text-white/70 file:mr-4 file:border-0 file:text-black" />
                {proofImage && (
                  <div className="mt-3 flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <img src={proofImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-white/20" />
                    <span className="text-xs text-green-400 font-medium">✓ Bukti siap dikirim</span>
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all text-sm mt-2 cursor-pointer">
                Kirim Setoran & Simpan Bukti
              </button>
            </form>
          </div>
        </section>

        {/* === SECTION 4: MONEY SAVES (REKAPITULASI TABUNGAN) === */}
        <section id="money-saves" className="scroll-mt-28">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-green-400">Rekapitulasi Tabungan 81 Siswa</h2>
            <p className="text-white/60 text-xs sm:text-sm mt-1">Transparansi total saldo anggota asrama & riwayat transaksi masuk</p>
          </div>

          <div className="w-full bg-black/45 backdrop-blur-xl border border-white/20 p-5 sm:p-8 rounded-3xl shadow-2xl text-white">
            {loading ? (
              <p className="text-center text-white/60 py-8">Memuat data 81 siswa...</p>
            ) : (
              <div className="space-y-10">
                {/* Tabel Saldo Per Siswa + Search */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-base font-bold text-cyan-300">Total Saldo Per Siswa</h3>
                    <input
                      type="text"
                      placeholder="🔍 Cari nama siswa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/20 text-xs text-cyan-300 sticky top-0 bg-zinc-900/95 backdrop-blur-md">
                          <th className="py-3 px-4">No</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Total Tabungan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                        {filteredStudents.length === 0 ? (
                          <tr><td colSpan={3} className="py-6 text-center text-white/50">Nama tidak ditemukan.</td></tr>
                        ) : (
                          filteredStudents.map((s, index) => (
                            <tr key={s.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-4 text-white/60">{index + 1}</td>
                              <td className="py-2.5 px-4 font-medium">{s.name}</td>
                              <td className="py-2.5 px-4 text-green-400 font-semibold whitespace-nowrap">Rp {(s.totalSaved || 0).toLocaleString("id-ID")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabel Riwayat Transaksi */}
                <div>
                  <h3 className="text-base font-bold text-cyan-300 mb-4">Riwayat Seluruh Setoran Masuk</h3>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/20 text-xs text-cyan-300 sticky top-0 bg-zinc-900/95 backdrop-blur-md">
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Nominal</th>
                          <th className="py-3 px-4">Metode</th>
                          <th className="py-3 px-4">Bukti</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                        {transactions.length === 0 ? (
                          <tr><td colSpan={5} className="py-6 text-center text-white/50">Belum ada riwayat transaksi.</td></tr>
                        ) : (
                          transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-4 text-white/70 whitespace-nowrap">{tx.date}</td>
                              <td className="py-2.5 px-4 font-medium">{tx.studentName}</td>
                              <td className="py-2.5 px-4 text-green-400 font-semibold whitespace-nowrap">Rp {(tx.amount || 0).toLocaleString("id-ID")}</td>
                              <td className="py-2.5 px-4 text-white/80">{tx.method}</td>
                              <td className="py-2.5 px-4">
                                {tx.proof && tx.proof !== "Tidak ada foto" ? (
                                  <img
                                    src={tx.proof}
                                    alt="Bukti"
                                    onClick={() => setPreviewImage(tx.proof)}
                                    className="w-10 h-10 object-cover rounded-lg border border-white/25 hover:scale-110 transition-all cursor-pointer shadow-md"
                                    title="Klik untuk memperbesar foto"
                                  />
                                ) : (
                                  <span className="text-white/40">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md py-6 text-center text-xs text-white/50">
        © 2026 GH27 Vacation • Angkatan 27
      </footer>

      {/* POPUP MODAL PREVIEW GAMBAR BESAR */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white bg-white/20 hover:bg-white/40 border border-white/20 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm transition-all"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Preview Zoom"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl bg-black/50"
            />
            <p className="text-xs text-white/60 mt-3">Klik di mana saja untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  )
}