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
  const [activeTab, setActiveTab] = useState<"home" | "about" | "payment" | "money-saves">("home")
  const [aboutSubTab, setAboutSubTab] = useState<"tentang" | "rundown" | "destinasi">("tentang")
  
  const [students, setStudents] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
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

        // Jika database masih kosong, isi dengan 81 nama
        if (studentList.length === 0) {
          for (const name of GH27_STUDENTS) {
            await addDoc(collection(db, "students"), { name: name, totalSaved: 0 })
          }
          const res = await getDocs(collection(db, "students"))
          studentList = []
          res.forEach((d) => studentList.push({ id: d.id, ...d.data() }))
        }

        // Filter duplikat dan urutkan
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

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center">
      {/* NAVBAR */}
      <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12">
        <div onClick={() => setActiveTab("home")} className="text-2xl md:text-3xl font-black tracking-tight cursor-pointer select-none">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">GH27</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 ml-2">Vacation</span>
        </div>
        <div className="hidden md:flex items-center gap-6 px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-full text-white/90 font-semibold text-sm">
          <button onClick={() => setActiveTab("home")} className={`hover:text-white transition-all ${activeTab === "home" ? "text-cyan-400 underline underline-offset-4" : ""}`}>Home</button>
          <button onClick={() => setActiveTab("about")} className={`hover:text-white transition-all ${activeTab === "about" ? "text-cyan-400 underline underline-offset-4" : ""}`}>About</button>
          <button onClick={() => setActiveTab("payment")} className={`hover:text-white transition-all ${activeTab === "payment" ? "text-cyan-400 underline underline-offset-4" : ""}`}>Payment</button>
          <button onClick={() => setActiveTab("money-saves")} className={`hover:text-white transition-all ${activeTab === "money-saves" ? "text-cyan-400 underline underline-offset-4" : ""}`}>Money Saves</button>
        </div>
      </nav>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <ShaderBackground className="h-full w-full" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center justify-center pt-20">
        
        {/* HOME (LIQUID GLASS SLIDER) */}
        {activeTab === "home" && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            <div className="relative w-full max-w-[700px] aspect-video bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex items-center justify-center group">
              <button onClick={prevPhoto} className="absolute left-4 z-10 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md p-3 rounded-full border border-white/10 transition-all shadow-lg text-lg font-bold">❮</button>
              
              <div className="relative w-full h-full bg-black/40 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer">
                <img 
                  src={photos[currentIndex]} 
                  alt="Vacation" 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onClick={() => setPreviewImage(photos[currentIndex])}
                />
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                  🔍 Klik untuk memperbesar
                </div>
              </div>

              <button onClick={nextPhoto} className="absolute right-4 z-10 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md p-3 rounded-full border border-white/10 transition-all shadow-lg text-lg font-bold">❯</button>
            </div>
            
            <div className="flex gap-2 mt-6">
              {photos.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all ${currentIndex === idx ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`} />
              ))}
            </div>
          </div>
        )}

        {/* ABOUT */}
        {activeTab === "about" && (
          <div className="w-full bg-black/50 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-2xl shadow-2xl text-white max-h-[75vh] overflow-y-auto">
            <div className="flex justify-center gap-4 mb-6 border-b border-white/10 pb-4">
              <button onClick={() => setAboutSubTab("tentang")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${aboutSubTab === "tentang" ? "bg-cyan-500 text-black shadow-lg" : "bg-white/10 hover:bg-white/20"}`}>Tentang</button>
              <button onClick={() => setAboutSubTab("rundown")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${aboutSubTab === "rundown" ? "bg-cyan-500 text-black shadow-lg" : "bg-white/10 hover:bg-white/20"}`}>Rundown</button>
              <button onClick={() => setAboutSubTab("destinasi")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${aboutSubTab === "destinasi" ? "bg-cyan-500 text-black shadow-lg" : "bg-white/10 hover:bg-white/20"}`}>Destinasi</button>
            </div>
            {aboutSubTab === "tentang" && (
              <div className="space-y-4 text-sm md:text-base leading-relaxed">
                <h3 className="text-xl font-bold text-cyan-300">GH27 Vacation</h3>
                <p className="text-white/80">Acara ini diselenggarakan sebagai momen perpisahan dan kebersamaan bagi 81 penghuni GH27 sebelum melanjutkan pendidikan ke perguruan tinggi.</p>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl mt-4">
                  <h4 className="font-semibold text-yellow-300 mb-2">Fasilitas Akomodasi:</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/80 text-sm">
                    <li>+ Tempat Penginapan</li>
                    <li>+ Bus Pariwisata</li>
                    <li>+ Makan & Minum (8 Kali)</li>
                    <li>+ Tiket Pariwisata & Snack</li>
                  </ul>
                </div>
              </div>
            )}
            {aboutSubTab === "rundown" && (
              <div className="space-y-4 text-sm md:text-base">
                <h3 className="text-xl font-bold text-cyan-300">Rundown Singkat</h3>
                <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10"><span className="text-yellow-300 font-bold">Day 1:</span> Perjalanan ke Villa & Pantai Madasari</div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10"><span className="text-yellow-300 font-bold">Day 2:</span> Green Canyon & Farewell BBQ</div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10"><span className="text-yellow-300 font-bold">Day 3:</span> Citumang Body Rafting & Pulang</div>
                </div>
              </div>
            )}
            {aboutSubTab === "destinasi" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-cyan-300">Destinasi Utama</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10"><div className="font-bold text-yellow-300">Green Canyon</div><p className="text-xs text-white/70">Sungai & tebing eksotis</p></div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10"><div className="font-bold text-yellow-300">Pantai Madasari</div><p className="text-xs text-white/70">Pantai pesisir luas</p></div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10"><div className="font-bold text-yellow-300">Citumang</div><p className="text-xs text-white/70">Body rafting air jernih</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAYMENT */}
        {activeTab === "payment" && (
          <div className="w-full max-w-lg bg-black/50 backdrop-blur-xl border border-white/25 p-6 md:p-8 rounded-2xl shadow-2xl text-white max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-yellow-400 mb-2 text-center">Form Setoran Tabungan</h3>
            <p className="text-white/70 text-xs text-center mb-6">Pilih namamu dari 81 anggota asrama & upload screenshot bukti transfer.</p>
            {successMessage && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-300 text-xs rounded-xl text-center">
                {successMessage}
              </div>
            )}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Nama Siswa</label>
                <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 max-h-40">
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900 text-white">{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Nominal Setoran (Rp)</label>
                <input type="number" placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Metode Pembayaran</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400">
                  <option value="Transfer Bank" className="bg-zinc-900">Transfer Bank</option>
                  <option value="QRIS" className="bg-zinc-900">QRIS</option>
                  <option value="Cash" className="bg-zinc-900">Cash / Tunai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Upload Foto Bukti Transfer (Max 2MB+)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full file:py-2 file:px-4 file:rounded-xl file:font-semibold file:bg-cyan-500 hover:file:bg-cyan-400 cursor-pointer text-xs text-white/70 file:mr-4 file:border-0 file:text-black" />
                {proofImage && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-green-400">✓ Berhasil diproses</span>
                    <img src={proofImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-white/20" />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all text-sm mt-2 cursor-pointer">
                Kirim Setoran & Simpan Bukti
              </button>
            </form>
          </div>
        )}

        {/* MONEY SAVES */}
        {activeTab === "money-saves" && (
          <div className="w-full bg-black/50 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-2xl shadow-2xl text-white max-h-[75vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-green-400 mb-1 text-center">Rekapitulasi Tabungan 81 Siswa</h3>
            <p className="text-white/70 text-xs text-center mb-6">Total saldo seluruh anggota asrama beserta riwayat transaksi & bukti foto.</p>
            {loading ? (
              <p className="text-center text-white/60 py-8">Memuat data 81 siswa...</p>
            ) : (
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-cyan-300 mb-3">Total Saldo Per Siswa</h4>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto pr-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/20 text-xs text-cyan-300 sticky top-0 bg-zinc-900/90 backdrop-blur-md">
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Nama Siswa</th>
                          <th className="py-2 px-3">Total Tabungan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-sm">
                        {students.map((s, index) => (
                          <tr key={s.id} className="hover:bg-white/5">
                            <td className="py-2 px-3 text-white/60">{index + 1}</td>
                            <td className="py-2 px-3 font-medium">{s.name}</td>
                            <td className="py-2 px-3 text-green-400 font-semibold">Rp {(s.totalSaved || 0).toLocaleString("id-ID")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-cyan-300 mb-3">Riwayat Seluruh Setoran Masuk</h4>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto pr-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/20 text-xs text-cyan-300 sticky top-0 bg-zinc-900/90 backdrop-blur-md">
                          <th className="py-2 px-3">Tanggal</th>
                          <th className="py-2 px-3">Nama Siswa</th>
                          <th className="py-2 px-3">Nominal</th>
                          <th className="py-2 px-3">Metode</th>
                          <th className="py-2 px-3">Bukti Foto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-sm">
                        {transactions.length === 0 ? (
                          <tr><td colSpan={5} className="py-4 text-center text-white/50 text-xs">Belum ada riwayat transaksi.</td></tr>
                        ) : (
                          transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/5">
                              <td className="py-2 px-3 text-white/70 text-xs">{tx.date}</td>
                              <td className="py-2 px-3 font-medium">{tx.studentName}</td>
                              <td className="py-2 px-3 text-green-400 font-semibold">Rp {(tx.amount || 0).toLocaleString("id-ID")}</td>
                              <td className="py-2 px-3 text-xs text-white/80">{tx.method}</td>
                              <td className="py-2 px-3">
                                {tx.proof && tx.proof !== "Tidak ada foto" ? (
                                  <img
                                    src={tx.proof}
                                    alt="Bukti"
                                    onClick={() => setPreviewImage(tx.proof)}
                                    className="w-10 h-10 object-cover rounded border border-white/25 hover:scale-110 transition-all cursor-pointer shadow-md"
                                    title="Klik untuk memperbesar foto"
                                  />
                                ) : (
                                  <span className="text-xs text-white/40">-</span>
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
        )}
      </div>

      {/* POPUP MODAL PREVIEW GAMBAR BESAR (Dipakai Bareng untuk Bukti & Home Slider) */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer animate-fadeIn">
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