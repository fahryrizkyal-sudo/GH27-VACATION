"use client"
import React, { useState, useEffect, useRef } from "react"
import { db } from "@/app/firebase"
import { collection, getDocs, getDoc, addDoc, updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore"

// === KONFIGURASI ADMIN & GOOGLE SHEETS ===
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby-QO9AdIO2c9pgG3DYAQTfCuCdZKQXNVcnCTtVgp0OoXY5P5Tn7yuDt5b3_NPRoGzN/exec"
const ADMIN_PIN = "gh27admin" // <-- Ganti PIN rahasia lu di sini
const TARGET_PER_PERSON = 1150000

// === SHADER BACKGROUND (ATC) ===
const vertSrc = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos,0.0,1.0); }`

const fragSrc = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  u_res;
uniform float u_time;

float tanh1(float x){ float e = exp(2.0*x); return (e-1.0)/(e+1.0); }
vec4 tanh4(vec4 v){ return vec4(tanh1(v.x), tanh1(v.y), tanh1(v.z), tanh1(v.w)); }

void main(){
  vec3 FC = vec3(gl_FragCoord.xy, 0.0);
  vec3 r  = vec3(u_res, max(u_res.x, u_res.y));
  float t = u_time;

  vec4 o = vec4(0.0);

  vec3 p = vec3(0.0);
  vec3 v = vec3(1.0, 2.0, 6.0);
  float i = 0.0, z = 1.0, d = 1.0, f = 1.0;

  for ( ; i++ < 5e1;
        o.rgb += (cos((p.x + z + v) * 0.1) + 1.0) / d / f / z )
  {
    p = z * normalize(FC * 2.0 - r.xyy);

    vec4 m = cos((p + sin(p)).y * 0.4 + vec4(0.0, 33.0, 11.0, 0.0));
    p.xz = mat2(m) * p.xz;

    p.x += t / 0.2;

    z += ( d = length(cos(p / v) * v + v.zxx / 7.0) /
           ( f = 2.0 + d / exp(p.y * 0.2) ) );
  }

  o = tanh4(0.2 * o);
  o.a = 1.0;
  fragColor = o;
}`

function ShaderDemo_ATC() {
  const ref = useRef<HTMLCanvasElement>(null)
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const canvas = ref.current!, pre = preRef.current!
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: false })
    if (!gl) { pre.textContent = "WebGL2 not available"; return }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(sh) || "compile error")
      return sh
    }
    const link = (vs: string, fs: string) => {
      const p = gl.createProgram()!
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs))
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs))
      gl.linkProgram(p)
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(p) || "link error")
      return p
    }

    let prog: WebGLProgram
    try { prog = link(vertSrc, fragSrc) }
    catch (e: any) { (pre.textContent as any) = "Shader error:\n" + e.message; return }

    gl.useProgram(prog)

    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,  -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const uRes  = gl.getUniformLocation(prog, "u_res")
    const uTime = gl.getUniformLocation(prog, "u_time")

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      const w = Math.floor((canvas.clientWidth || window.innerWidth) * dpr)
      const h = Math.floor((canvas.clientHeight || window.innerHeight) * dpr)
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
    }
    const onResize = () => { resize() }
    window.addEventListener("resize", onResize, { passive: true })
    resize()

    let raf = 0
    const t0 = performance.now()
    const draw = () => {
      const t = (performance.now() - t0) / 1000
      gl.uniform1f(uTime, t)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize) }
  }, [])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block", background: "#000" }} />
      <pre ref={preRef} style={{ position: "absolute", top: 8, left: 8, color: "#fff", whiteSpace: "pre-wrap" }} />
    </div>
  )
}

// === DATA GALLERY, SISWA & RUNDOWN ===
const photos = [
  "/foto1.jpeg", "/foto2.jpeg", "/foto3.jpeg", "/foto4.jpeg", "/foto5.jpeg",
  "/foto6.jpeg", "/foto7.jpeg", "/foto8.jpeg", "/foto9.jpeg", "/foto10.jpeg",
  "/foto11.jpeg", "/foto12.jpeg", "/foto13.jpeg"
]

const GH27_STUDENTS = [
  "ABRISAM YAHYA", "AGHNIY AQILAH", "AISHA NASHIFA", "AISHAKIRANA MAULIDA SUBARKAH",
  "AISYA NABILA", "ALTHAF AQIELA WICAKSONO", "ALVARO PRANADHAFA LANDRYE", "ANNIDA MAHRUS",
  "ARIF NOFRIZALDI SAPUTRA", "ATHA SHAKILA ARANI", "ATSIRAH ZAKIAH ARRINI MOHANDEZ",
  "AURELIA ERVIANI", "CARISSA HANUN DIANDRA BAHTIAR", "CHOKY FII RAMADHANI",
  "DANISH AUFA RAIHAN", "DHABIT GHANIA WIDAYAT", "DINDA MAULIDA AZKIYA",
  "DZAKIYYAH 'IFFATTAQIYYAH FITHRI", "ERLANGGA NURHISYAM", "FADHIL AGHNIYAA MUZAKKI",
  "FAHRY RIZKY ALFATAN", "FAKHRI ISHAMUDDIN AUFA YASIR", "FATHIA MEGUMI YUDHA",
  "FAWAZAH ALFIYAH BALQIS", "GHEZIAN ABIEZZA FAUZI", "HANA RAHMAH SHALIHAH",
  "HANIA NUR SHABRINA", "HASNA MUTHIAH", "HAZIMAH JASMINE MAHENDRA", "IRSYAD ALI NURSY",
  "IRSYAD DHIYAULHAQQI PRAYETNO", "IZZAH SILMIAH AHMAD", "KAYLA ANISA AZKIA",
  "KAYLA HANIN EFRONA ZALUKHU", "KHALIS MAHESWARA SANTIKA", "KHANZANEETA ERIQA MAHYA WINARSO",
  "LINTANG CAHYA NINGTYAS", "LUTHFIYAH ANWAR", "MAISHA AQILA YUSIRWAN", "MAZAYA AULIA",
  "MAZAYA DHEAVATY PUTRI AZIS", "MIRZA AL FARABI DEWANDARU", "MOCHAMAD FACHRY RAMADHAN",
  "MUHAMMAD ALFATH SUBHAN", "MUHAMMAD AZZAM ARAFAH", "MUHAMMAD DANISH SHIRAZ MULIA",
  "MUHAMMAD IBRAHIM MUSA", "MUHAMMAD IHKAM HANIF", "MUHAMMAD ILHAM RAMADHAN",
  "MUHAMMAD ORYZA SATIVA ZWEIZIA", "MUHAMMAD RAFIIF STYAWAN", "MUHAMMAD TAUFIKURRAHMAN",
  "MUHAMMAD ZAYYAN MUGHNIY", "NADHIF AHMAD WIBOWO", "NAZLA QUEENCY LALUNA ABIDIN",
  "NIA HARMAWAN", "NI'MAH AISHA SIREGAR", "NIDA AULIA MUMTAZ", "NURRONAA ROSYIDATU HUSNAA",
  "PRADISWA ATIFISHIDQY ATHAURRAHMAN", "QAWIYAH HAKIMAH QO'IMUDDIN", "QURROTA A'YUN TANJUNG",
  "RADIEZA AMMAR DANISH", "RADHIYYAH FAYZA ZEIN", "RAFI ISHAMUDDIN AUFA YASIR",
  "RAFIF BELADDIN INDRAWAN", "RAISA NUR SHABRINA MASHFA", "RASENDRIYA ARKANANTA HIDAYAT",
  "REZA PUTRA YULIANTO", "RIDHA AYU ZAHIRA", "SAYYID HAFIDZ MUBAROK", "SITI KAYISA ADHA",
  "SULAIMAN UMAR WALIYURRAHMAN MUWAFFAQ ANNAFI MUHTADI", "SUMAYYAH AZ ZAHRA HIJJIYAH",
  "SYAFA NADA KAMILA", "SYAFIRA RAHMAH PUTRI", "SYAZA LIYANA FADHLY", "TAUFIK RAMADHAN",
  "WIRA DWI RIZKY", "ZAHRANI NAZIHA FIRDAUS", "ZEEDA BARAKA AHMAD"
]

const rundownData = [
  {
    day: "Hari 1",
    activities: [
      { time: "04.30–05.30", desc: "Kumpul di MAN 4 Jakarta", note: "Absensi dan persiapan keberangkatan" },
      { time: "05.30–06.00", desc: "Briefing dan naik bus", note: "Pastikan seluruh peserta dan barang sudah masuk" },
      { time: "06.00–10.30", desc: "Perjalanan Jakarta–Tasikmalaya", note: "Estimasi; menyesuaikan kondisi lalu lintas dan istirahat" },
      { time: "10.30–11.00", desc: "Tiba di area Gunung Galunggung", note: "Persiapan dan koordinasi dengan operator jeep" },
      { time: "11.00–13.00", desc: "Jeep Adventure Gunung Galunggung", note: "Durasi aktivitas jeep 2 jam" },
      { time: "13.00–14.00", desc: "Makan siang", note: "Istirahat dan makan" },
      { time: "14.00–17.30", desc: "Perjalanan Tasikmalaya–Pangandaran", note: "Estimasi; dapat berubah sesuai kondisi jalan" },
      { time: "17.30–18.30", desc: "Check-in villa dan pembagian kamar", note: "Beres-beres dan istirahat" },
      { time: "18.30–19.30", desc: "Makan malam", note: "" },
      { time: "19.30–21.00", desc: "Waktu bebas dan istirahat", note: "Persiapan kegiatan hari kedua" }
    ]
  },
  {
    day: "Hari 2",
    activities: [
      { time: "06.00–07.00", desc: "Bangun dan sarapan", note: "" },
      { time: "07.00–08.00", desc: "Perjalanan menuju Green Canyon", note: "Estimasi perjalanan" },
      { time: "08.00–09.30", desc: "Green Canyon – wisata perahu", note: "Paket perahu reguler; bukan body rafting" },
      { time: "09.30–10.00", desc: "Bilas dan persiapan", note: "" },
      { time: "10.00–11.00", desc: "Makan siang", note: "" },
      { time: "12.00–15.00", desc: "Kembali ke villa dan istirahat", note: "Waktu bebas di pantai" },
      { time: "15.00–18.30", desc: "Pantai Madasari dan Pantai Batu Hiu", note: "" },
      { time: "18.30–19.00", desc: "Perjalanan kembali ke hotel", note: "Persiapan acara malam" },
      { time: "18.30–19.30", desc: "Makan malam", note: "" },
      { time: "19.30–22.00", desc: "Farewell Night, BBQ, dan campfire", note: "Acara kebersamaan" }
    ]
  },
  {
    day: "Hari 3",
    activities: [
      { time: "06.00–07.00", desc: "Bangun dan sarapan", note: "" },
      { time: "07.00–08.00", desc: "Persiapan dan perjalanan ke Citumang", note: "Estimasi perjalanan" },
      { time: "08.00–11.00", desc: "Citumang – body rafting", note: "Ikuti arahan pemandu dan ketentuan keselamatan lokasi" },
      { time: "11.00–12.00", desc: "Bilas dan makan siang", note: "" },
      { time: "12.00–13.00", desc: "Kembali ke villa, packing, dan check-out", note: "" },
      { time: "13.00–20.00", desc: "Perjalanan Pangandaran–Jakarta", note: "Estimasi; menyesuaikan kondisi lalu lintas dan waktu istirahat" },
      { time: "20.00", desc: "Tiba di MAN 4 Jakarta", note: "Perkiraan waktu kedatangan" }
    ]
  }
]


// === KOMPONEN SLIDER FASILITAS (HOTEL & BIS) ===
const FacilitySlider = ({ images, title, onImageClick }: { images: string[], title: string, onImageClick: (img: string) => void }) => {
  const [idx, setIdx] = useState(0)

  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIdx((prev) => (prev + 1) % images.length)
  }
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIdx((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="flex flex-col w-full bg-black/20 p-3 rounded-2xl border border-white/10 shadow-inner">
      <p className="text-cyan-300 font-bold mb-2 text-sm text-center">{title}</p>
      <div className="relative w-full aspect-video bg-black/40 rounded-xl overflow-hidden group cursor-pointer shadow-md border border-white/5" onClick={() => onImageClick(images[idx])}>
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white w-7 h-7 flex items-center justify-center rounded-full border border-white/20 transition-all text-xs">❮</button>
        <img src={images[idx]} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white w-7 h-7 flex items-center justify-center rounded-full border border-white/20 transition-all text-xs">❯</button>
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white/90 text-[10px] px-2 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 {idx + 1}/{images.length}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {images.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-cyan-400" : "w-1.5 bg-white/30"}`} />
        ))}
      </div>
    </div>
  )
}

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
  const [copiedRek, setCopiedRek] = useState(false)

  // === GANTI DATA REKENING LU DI SINI ===
  const BANK_INFO = {
    bankName: "BANK JAGO", // Ganti nama bank lu (misal: BCA, Mandiri, BNI, BRI, SeaBank)
    accountNumber: "100696675504", // Ganti dengan nomor rekening asli lu
    accountHolder: "FAHRY RIZKY ALFATAN" // Sesuaikan atas nama rekening
  }

  const handleCopyRek = () => {
    navigator.clipboard.writeText(BANK_INFO.accountNumber)
    setCopiedRek(true)
    setTimeout(() => setCopiedRek(false), 2000)
  }
  const [proofImage, setProofImage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasSyncedRef = useRef(false)

  // === STATE ADMIN ACC ===
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [processingTxId, setProcessingTxId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("gh27_admin") === "true") {
      setIsAdmin(true)
    }
  }, [])

  useEffect(() => {
    if (hasSyncedRef.current) return
    hasSyncedRef.current = true

    const fetchData = async () => {
      try {
        const studentSnap = await getDocs(collection(db, "students"))
        const groupedByName = new Map<string, any[]>()

        studentSnap.forEach((docSnap) => {
          const data = docSnap.data()
          const cleanName = (data.name || "").trim()
          if (!cleanName) return
          if (!groupedByName.has(cleanName)) {
            groupedByName.set(cleanName, [])
          }
          groupedByName.get(cleanName)!.push({ id: docSnap.id, ...data, name: cleanName })
        })

        let needsRefetch = false

        // 1. Auto-Merge & Cleanup: Gabungkan saldo duplikat & gunakan nama siswa sebagai Document ID
        for (const [name, docs] of groupedByName.entries()) {
          const hasDuplicates = docs.length > 1
          const hasRandomId = docs.some((d) => d.id !== name)

          if (hasDuplicates || hasRandomId) {
            const mergedTotal = docs.reduce((sum, d) => sum + (Number(d.totalSaved) || 0), 0)
            await setDoc(doc(db, "students", name), { name, totalSaved: mergedTotal })
            for (const d of docs) {
              if (d.id !== name) {
                await deleteDoc(doc(db, "students", d.id))
              }
            }
            needsRefetch = true
          }
        }

        // 2. Smart Sync: Tambah nama baru dari kodingan tanpa menimpa saldo lama
        for (const rawName of GH27_STUDENTS) {
          const name = rawName.trim()
          if (!groupedByName.has(name)) {
            await setDoc(doc(db, "students", name), { name, totalSaved: 0 })
            needsRefetch = true
          }
        }

        let cleanStudents: any[] = []
        if (needsRefetch) {
          const res = await getDocs(collection(db, "students"))
          res.forEach((d) => cleanStudents.push({ id: d.id, ...d.data() }))
        } else {
          groupedByName.forEach((docs) => cleanStudents.push(docs[0]))
        }

        cleanStudents.sort((a, b) => a.name.localeCompare(b.name))

        setStudents(cleanStudents)
        if (cleanStudents.length > 0) setSelectedStudentId(cleanStudents[0].id)

        const txSnap = await getDocs(collection(db, "transactions"))
        let txList: any[] = []
        txSnap.forEach((docSnap) => {
          txList.push({ id: docSnap.id, ...docSnap.data() })
        })
        txList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
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
    if (!file) {
      setProofImage("")
      return
    }
    setErrorMessage("")
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

  // === SUBMIT FORM -> MASUK ANTREAN PENDING ===
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!amount || Number(amount) <= 0) {
      setErrorMessage("Masukkan nominal setoran yang valid terlebih dahulu.")
      return
    }

    if (!proofImage) {
      setErrorMessage("Wajib upload foto bukti transfer sebelum mengirim setoran!")
      return
    }

    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const studentDoc = students.find((s) => s.id === selectedStudentId)
      if (!studentDoc) return
      const now = new Date()
      const currentDate = now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })

      const newTx = {
        studentId: studentDoc.id,
        studentName: studentDoc.name,
        amount: Number(amount),
        date: currentDate,
        method: paymentMethod,
        proof: proofImage,
        status: "pending", // Wajib di-ACC admin dulu
        createdAt: Date.now()
      }

      const docRef = await addDoc(collection(db, "transactions"), newTx)

      setTransactions([{ id: docRef.id, ...newTx }, ...transactions])
      setSuccessMessage(`Setoran Rp${Number(amount).toLocaleString("id-ID")} untuk ${studentDoc.name} berhasil dikirim! Menunggu ACC admin sebelum masuk ke rekap.`)
      setAmount("")
      setProofImage("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (error) {
      console.error("Gagal mengirim setoran:", error)
      setErrorMessage("Terjadi kesalahan saat mengirim ke database. Coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // === AKSI ADMIN: LOGIN, ACC, & TOLAK ===
  const handleAdminButtonClick = () => {
    setMobileMenuOpen(false)
    setPinError("")
    setShowAdminModal(true)
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true)
      sessionStorage.setItem("gh27_admin", "true")
      setPinInput("")
      setPinError("")
    } else {
      setPinError("PIN Admin salah!")
    }
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    sessionStorage.removeItem("gh27_admin")
    setShowAdminModal(false)
  }

  const handleApproveTx = async (tx: any) => {
    if (!isAdmin || processingTxId) return
    setProcessingTxId(tx.id)

    try {
      const targetStudentId = tx.studentId || tx.studentName
      const studentRef = doc(db, "students", targetStudentId)
      const studentSnap = await getDoc(studentRef)

      const currentTotal = studentSnap.exists()
        ? (Number(studentSnap.data().totalSaved) || 0)
        : (Number(students.find((s) => s.name === tx.studentName)?.totalSaved) || 0)

      const newTotal = currentTotal + Number(tx.amount)

      // 1. Update saldo siswa
      await setDoc(studentRef, { name: tx.studentName, totalSaved: newTotal }, { merge: true })

      // 2. Ubah status transaksi jadi approved
      const txRef = doc(db, "transactions", tx.id)
      await updateDoc(txRef, { status: "approved", approvedAt: Date.now() })

      // 3. Kirim log (Waktu & Nominal saja) ke Google Sheets
      if (GOOGLE_SHEETS_WEBHOOK_URL) {
        try {
          const sheetTimestamp = new Date().toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })
          await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              waktu: sheetTimestamp,
              nominal: Number(tx.amount)
            })
          })
        } catch (sheetErr) {
          console.error("Gagal kirim log ke Google Sheets:", sheetErr)
        }
      }

      // 4. Update state lokal
      setStudents(students.map((s) => s.name === tx.studentName ? { ...s, totalSaved: newTotal } : s))
      setTransactions(transactions.map((t) => t.id === tx.id ? { ...t, status: "approved" } : t))
    } catch (error) {
      console.error("Gagal ACC transaksi:", error)
      alert("Gagal meng-ACC transaksi. Coba lagi.")
    } finally {
      setProcessingTxId(null)
    }
  }

  const handleRejectTx = async (tx: any) => {
    if (!isAdmin || processingTxId) return
    if (!window.confirm(`Tolak dan hapus setoran Rp${Number(tx.amount).toLocaleString("id-ID")} dari ${tx.studentName}?`)) return

    setProcessingTxId(tx.id)
    try {
      await deleteDoc(doc(db, "transactions", tx.id))
      setTransactions(transactions.filter((t) => t.id !== tx.id))
    } catch (error) {
      console.error("Gagal menolak transaksi:", error)
      alert("Gagal menghapus transaksi. Coba lagi.")
    } finally {
      setProcessingTxId(null)
    }
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingTransactions = transactions.filter((tx) => tx.status === "pending")
  const approvedTransactions = transactions.filter((tx) => tx.status !== "pending")

  const canSubmit = !isSubmitting && Boolean(proofImage) && Boolean(amount) && Number(amount) > 0

  return (
    <div className="relative min-h-screen w-full text-white selection:bg-cyan-500 selection:text-black">
      
      {/* FIXED SHADER BACKGROUND (ATC) */}
      <div className="fixed top-0 left-0 w-full h-[100dvh] z-0 pointer-events-none bg-black overflow-hidden transform-gpu">
        <ShaderDemo_ATC />
      </div>

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 px-4 py-4 md:px-12">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3 bg-black/40 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-full">
          <div onClick={() => scrollToSection("home")} className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight cursor-pointer select-none text-white">
            GH27 Vacation
          </div>

          <div className="hidden md:flex items-center gap-7 text-white/90 font-semibold text-sm">
            <button onClick={() => scrollToSection("home")} className="hover:text-cyan-400 transition-colors cursor-pointer">Home</button>
            <button onClick={() => scrollToSection("about")} className="hover:text-cyan-400 transition-colors cursor-pointer">About</button>
            <button onClick={() => scrollToSection("payment")} className="hover:text-cyan-400 transition-colors cursor-pointer">Payment</button>
            <button onClick={() => scrollToSection("money-saves")} className="hover:text-cyan-400 transition-colors cursor-pointer">Money Saves</button>
            <button
              onClick={handleAdminButtonClick}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{isAdmin ? "🔓 Admin" : "🔒 Admin"}</span>
              {pendingTransactions.length > 0 && (
                <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingTransactions.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleAdminButtonClick}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1 transition-all"
            >
              <span>{isAdmin ? "🔓" : "🔒"}</span>
              {pendingTransactions.length > 0 && (
                <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 rounded-full">
                  {pendingTransactions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold tracking-wide text-white transition-all"
            >
              {mobileMenuOpen ? "✕ Tutup" : "☰ Menu"}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden mt-2 max-w-6xl mx-auto bg-black/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl flex flex-col gap-2">
            <button onClick={() => scrollToSection("home")} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-white">Home</button>
            <button onClick={() => scrollToSection("about")} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-white">About & Rundown</button>
            <button onClick={() => scrollToSection("payment")} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-white">Payment (Setor)</button>
            <button onClick={() => scrollToSection("money-saves")} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-white">Money Saves (Rekap)</button>
            <button onClick={handleAdminButtonClick} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 font-semibold text-sm text-amber-300 flex items-center justify-between">
              <span>{isAdmin ? "🔓 Panel ACC Admin" : "🔒 Login Admin ACC"}</span>
              {pendingTransactions.length > 0 && (
                <span className="bg-amber-400 text-black text-xs font-black px-2 py-0.5 rounded-full">
                  {pendingTransactions.length} Pending
                </span>
              )}
            </button>
          </div>
        )}
      </header>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-28 md:pt-36 pb-24 space-y-24 md:space-y-32">
        
        {/* HOME SECTION */}
        <section id="home" className="scroll-mt-32 flex flex-col items-center text-center">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            ANGKATAN 27 ASRAMA MAN 4 JAKARTA
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 text-white">
            Memories & Journey of <span className="text-white">GH27</span>
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl mb-8">
            Dokumentasi kebersamaan, informasi perjalanan, dan transparansi tabungan angkatan sebelum melangkah ke jenjang berikutnya.
          </p>

          <div className="relative w-full max-w-[750px] aspect-video bg-white/10 backdrop-blur-xl border border-white/20 p-2.5 sm:p-3.5 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex items-center justify-center group">
            <button onClick={prevPhoto} className="absolute left-3 sm:left-5 z-10 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-white/15 transition-all shadow-lg flex items-center justify-center font-bold cursor-pointer">❮</button>
            <div className="relative w-full h-full bg-black/40 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer">
              <img src={photos[currentIndex]} alt={`Vacation ${currentIndex + 1}`} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" onClick={() => setPreviewImage(photos[currentIndex])} />
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white/90 text-[11px] sm:text-xs px-3 py-1.5 rounded-full border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">🔍 Zoom</div>
            </div>
            <button onClick={nextPhoto} className="absolute right-3 sm:right-5 z-10 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-white/15 transition-all shadow-lg flex items-center justify-center font-bold cursor-pointer">❯</button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {photos.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all cursor-pointer ${currentIndex === idx ? "w-6 bg-cyan-400" : "w-2 bg-white/40 hover:bg-white/70"}`} aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>
        </section>

        {/* ABOUT SECTION */}
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
                <p className="text-white/80">Acara ini diselenggarakan sebagai momen perpisahan dan kebersamaan bagi GH27 sebelum melanjutkan pendidikan ke perguruan tinggi masing-masing. Melalui kegiatan ini, diharapkan terciptanya kenangan yang indah dan mempererat tali silaturahmi, serta menjadi penutup yang berkesan.</p>
                <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl mt-4">
                  <h4 className="font-semibold text-yellow-300 mb-3">Fasilitas Akomodasi:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-white/85 text-sm mb-6">
                    <li className="flex items-center gap-2"><span className="text-white">✓</span> Tempat Penginapan (Villa)</li>
                    <li className="flex items-center gap-2"><span className="text-white">✓</span> Bus Pariwisata</li>
                    <li className="flex items-center gap-2"><span className="text-white">✓</span> Makan & Minum (8 Kali)</li>
                    <li className="flex items-center gap-2"><span className="text-white">✓</span> Tiket Pariwisata & Snack</li>
                  </ul>

                  {/* SLIDER HOTEL DAN BIS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <FacilitySlider 
                      title="Fasilitas Penginapan" 
                      images={["/hotel1.jpeg", "/hotel2.jpeg", "/hotel3.jpeg"]} 
                      onImageClick={setPreviewImage} 
                    />
                    <FacilitySlider 
                      title="Armada Bus Pariwisata" 
                      images={["/bus1.jpeg", "/bus2.jpeg", "/bus3.jpeg"]} 
                      onImageClick={setPreviewImage} 
                    />
                  </div>
                </div>
              </div>
            )}

            {aboutSubTab === "rundown" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {rundownData.map((day, idx) => (
                    <div key={idx} className="bg-white/5 p-4 sm:p-6 rounded-3xl border border-white/10">
                      <h3 className="text-lg font-bold text-yellow-300 mb-4 border-b border-white/10 pb-2">{day.day}</h3>
                      <div className="divide-y divide-white/5">
                        {day.activities.map((act, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                            <span className="text-cyan-300 font-mono text-xs sm:text-sm font-semibold shrink-0 sm:w-32 pt-0.5">
                              {act.time}
                            </span>
                            <div className="flex-1">
                              <div className="text-white/95 font-semibold">{act.desc}</div>
                              {act.note && (
                                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{act.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CATATAN PERJALANAN */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-sm font-bold text-yellow-300">Catatan Perjalanan:</h4>
                  <ul className="list-disc list-inside text-xs sm:text-sm text-white/80 space-y-1">
                    <li>Durasi aktivitas Jeep Adventure di Gunung Galunggung adalah 2 jam.</li>
                    <li>Waktu perjalanan bersifat estimasi dan dapat menyesuaikan dengan kondisi lalu lintas serta waktu istirahat.</li>
                    <li>Wisata perahu di Green Canyon menggunakan paket perahu reguler (bukan body rafting).</li>
                    <li>Aktivitas body rafting di Citumang dijadwalkan pada hari ketiga (ikuti arahan pemandu dan ketentuan keselamatan lokasi).</li>
                  </ul>
                </div>
              </div>
            )}

            {aboutSubTab === "destinasi" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-cyan-300">Destinasi Utama</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-center">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center">
                    <img src="/greencanyon.jpg" alt="Green Canyon" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md border border-white/5 cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewImage("/greencanyon.jpg")} />
                    <div className="font-bold text-yellow-300 text-base mb-1">Green Canyon</div>
                    <p className="text-xs text-white/70">Sungai & tebing eksotis</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center">
                    <img src="/madasari.jpg" alt="Pantai Madasari" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md border border-white/5 cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewImage("/madasari.jpg")} />
                    <div className="font-bold text-yellow-300 text-base mb-1">Pantai Madasari</div>
                    <p className="text-xs text-white/70">Pantai pesisir luas</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center">
                    <img src="/citumang.jpg" alt="Citumang" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md border border-white/5 cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewImage("/citumang.jpg")} />
                    <div className="font-bold text-yellow-300 text-base mb-1">Citumang</div>
                    <p className="text-xs text-white/70">Body rafting air jernih</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center">
                    <img src="/legokpari.jpg" alt="Pantai Legok Pari" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md border border-white/5 cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewImage("/legokpari.jpg")} />
                    <div className="font-bold text-yellow-300 text-base mb-1">Pantai Legok Pari</div>
                    <p className="text-xs text-white/70">Pantai landai & ombak tenang</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center">
                    <img src="/batukaras.jpg" alt="Pantai Batu Karas" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md border border-white/5 cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewImage("/batukaras.jpg")} />
                    <div className="font-bold text-yellow-300 text-base mb-1">Pantai Batu Karas</div>
                    <p className="text-xs text-white/70">Spot santai & tebing karang</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center">
                    <img src="/batununggul.jpg" alt="Pantai Batu Nunggul" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md border border-white/5 cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewImage("/batununggul.jpg")} />
                    <div className="font-bold text-yellow-300 text-base mb-1">Pantai Batu Nunggul</div>
                    <p className="text-xs text-white/70">Tebing ikonik pinggir pantai</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PAYMENT SECTION */}
        <section id="payment" className="scroll-mt-28 flex flex-col items-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Form Setoran Tabungan</h2>
            <p className="text-white/60 text-xs sm:text-sm mt-1">Pilih namamu dari anggota asrama & upload bukti transfer</p>
          </div>

          <div className="w-full max-w-lg bg-black/45 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl text-white">
            {/* INFO TARGET UANG PER ORANG */}
            <div className="mb-5 p-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-between">
              <span className="text-xs sm:text-sm text-white/80 font-medium">Total Uang Dikumpulkan / Orang</span>
              <span className="text-base sm:text-lg font-extrabold text-white">Rp {TARGET_PER_PERSON.toLocaleString("id-ID")}</span>
            </div>

            {successMessage && (
              <div className="mb-5 p-3.5 bg-white/15 border border-white/30 text-white text-xs sm:text-sm rounded-2xl text-center font-medium">{successMessage}</div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-500/20 border border-red-400/50 text-red-200 text-xs sm:text-sm rounded-2xl text-center font-medium">{errorMessage}</div>
            )}
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">Nama Siswa</label>
                <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400">
                  <option value="" disabled>-- Pilih Namamu --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900 text-white">{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">Nominal Setoran (Rp) <span className="text-red-400">*</span></label>
                <input type="number" min="1" required placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">Metode Pembayaran</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400">
                  <option value="Transfer Bank" className="bg-zinc-900">Transfer Bank</option>
                  <option value="QRIS" className="bg-zinc-900">QRIS</option>
                  <option value="Cash" className="bg-zinc-900">Cash / Tunai</option>
                </select>
              </div>

{paymentMethod === "Transfer Bank" && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Tujuan Transfer</span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {BANK_INFO.bankName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 px-3.5 py-2.5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-[11px] text-white/50">Nomor Rekening</p>
                      <p className="text-base sm:text-lg font-mono font-extrabold tracking-wider text-white">
                        {BANK_INFO.accountNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRek}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      {copiedRek ? "✓ Tersalin" : "Salin"}
                    </button>
                  </div>

                  <div className="text-xs text-white/80">
                    a.n. <span className="font-bold text-white">{BANK_INFO.accountHolder}</span>
                  </div>
                </div>
              )}
              {paymentMethod === "QRIS" && (
                <div className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/10 transition-all">
                  <p className="text-xs text-white/80 mb-3 font-medium">Scan QRIS di bawah ini:</p>
                  <img 
                    src="/qris.jpeg" 
                    alt="QRIS GH27" 
                    className="w-48 sm:w-52 rounded-xl shadow-lg border border-white/20 cursor-pointer hover:scale-105 transition-transform" 
                    onClick={() => setPreviewImage("/qris.jpeg")}
                    title="Klik untuk perbesar QRIS"
                  />
                  <p className="text-[11px] text-cyan-300 mt-3 font-bold tracking-wider">GH27 100% PTN, DIGITAL</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">Upload Foto Bukti Transfer <span className="text-red-400">* (Wajib)</span></label>
                <input ref={fileInputRef} type="file" accept="image/*" required onChange={handleImageUpload} className="w-full file:py-2 file:px-4 file:rounded-xl file:font-semibold file:bg-cyan-500 hover:file:bg-cyan-400 cursor-pointer text-xs text-white/70 file:mr-4 file:border-0 file:text-black" />
                {proofImage ? (
                  <div className="mt-3 flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <img src={proofImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-white/20" />
                    <span className="text-xs text-white font-medium">✓ Bukti siap dikirim</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/50 mt-1.5">Upload bukti pembayaran terlebih dahulu agar tombol kirim aktif.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all text-sm mt-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Mengirim Setoran..." : "Kirim Setoran & Simpan Bukti"}
              </button>
            </form>
          </div>
        </section>

        {/* MONEY SAVES SECTION */}
        <section id="money-saves" className="scroll-mt-28">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Rekapitulasi Tabungan Siswa</h2>
            <p className="text-white/60 text-xs sm:text-sm mt-1">Transparansi total saldo anggota asrama & riwayat transaksi yang sudah di-ACC</p>
          </div>

          <div className="w-full bg-black/45 backdrop-blur-xl border border-white/20 p-5 sm:p-8 rounded-3xl shadow-2xl text-white">
            {/* INFO TARGET UANG PER ORANG */}
            <div className="mb-8 p-4 rounded-2xl bg-white/10 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-center sm:text-left">
              <span className="text-xs sm:text-sm text-white/80 font-medium">Total Uang yang Harus Dikumpulkan Per Orang</span>
              <span className="text-base sm:text-lg font-extrabold text-white">Rp {TARGET_PER_PERSON.toLocaleString("id-ID")}</span>
            </div>

            {loading ? (
              <p className="text-center text-white/60 py-8">Memuat data siswa...</p>
            ) : (
              <div className="space-y-10">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-base font-bold text-cyan-300">Total Saldo Per Siswa</h3>
                    <input type="text" placeholder="🔍 Cari nama siswa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-64 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-cyan-400" />
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
                              <td className="py-2.5 px-4 text-white font-semibold whitespace-nowrap">Rp {(s.totalSaved || 0).toLocaleString("id-ID")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h3 className="text-base font-bold text-cyan-300">Riwayat Seluruh Setoran Masuk (Terverifikasi)</h3>
                    {pendingTransactions.length > 0 && (
                      <span className="text-xs bg-amber-500/20 border border-amber-400/40 text-amber-200 px-3 py-1 rounded-full">
                        ⏳ {pendingTransactions.length} setoran menunggu ACC admin
                      </span>
                    )}
                  </div>
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
                        {approvedTransactions.length === 0 ? (
                          <tr><td colSpan={5} className="py-6 text-center text-white/50">Belum ada transaksi yang di-ACC.</td></tr>
                        ) : (
                          approvedTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-4 text-white/70 whitespace-nowrap">{tx.date}</td>
                              <td className="py-2.5 px-4 font-medium">{tx.studentName}</td>
                              <td className="py-2.5 px-4 text-white font-semibold whitespace-nowrap">Rp {(tx.amount || 0).toLocaleString("id-ID")}</td>
                              <td className="py-2.5 px-4 text-white/80">{tx.method}</td>
                              <td className="py-2.5 px-4">
                                {tx.proof && tx.proof !== "Tidak ada foto" ? (
                                  <img src={tx.proof} alt="Bukti" onClick={() => setPreviewImage(tx.proof)} className="w-10 h-10 object-cover rounded-lg border border-white/25 hover:scale-110 transition-all cursor-pointer shadow-md" title="Klik untuk memperbesar foto" />
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

      <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md py-6 text-center text-xs text-white/50">
        © 2026 fahryrizky.my.id
      </footer>

      {/* MODAL PANEL ADMIN ACC */}
      {showAdminModal && (
        <div
          onClick={() => setShowAdminModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-[90]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-zinc-900/95 border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl text-white max-h-[88vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {isAdmin ? "Panel Verifikasi & ACC Setoran" : "Login Admin GH27"}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {isAdmin ? "Cek bukti transfer sebelum memasukkan ke pencatatan & Google Sheets" : "Khusus Fahry untuk verifikasi pembayaran"}
                </p>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!isAdmin ? (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                {pinError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 text-xs text-center font-medium">
                    {pinError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">Masukkan PIN Admin</label>
                  <input
                    type="password"
                    autoFocus
                    placeholder="••••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-xl text-sm cursor-pointer hover:opacity-90 transition-all"
                >
                  Buka Panel ACC
                </button>
              </form>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto space-y-3 pr-1 flex-1">
                  {pendingTransactions.length === 0 ? (
                    <div className="py-12 text-center text-white/50 text-sm">
                      Tidak ada setoran yang menunggu ACC saat ini.
                    </div>
                  ) : (
                    pendingTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-white/5 border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          {tx.proof && tx.proof !== "Tidak ada foto" && (
                            <img
                              src={tx.proof}
                              alt="Bukti Transfer"
                              onClick={() => setPreviewImage(tx.proof)}
                              className="w-16 h-16 object-cover rounded-xl border border-white/25 cursor-pointer hover:scale-105 transition-transform shrink-0"
                              title="Klik untuk perbesar bukti"
                            />
                          )}
                          <div>
                            <div className="font-bold text-sm text-white">{tx.studentName}</div>
                            <div className="text-base font-extrabold text-cyan-300 mt-0.5">
                              Rp {(tx.amount || 0).toLocaleString("id-ID")}
                            </div>
                            <div className="text-[11px] text-white/60 mt-1">
                              {tx.date} • {tx.method}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleRejectTx(tx)}
                            disabled={processingTxId === tx.id}
                            className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/35 border border-red-400/40 text-red-200 text-xs font-bold cursor-pointer disabled:opacity-40 transition-all"
                          >
                            ✕ Tolak
                          </button>
                          <button
                            onClick={() => handleApproveTx(tx)}
                            disabled={processingTxId === tx.id}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold cursor-pointer disabled:opacity-40 transition-all shadow-md"
                          >
                            {processingTxId === tx.id ? "Memproses..." : "✓ ACC"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between">
                  <span className="text-xs text-white/50">Total antrean: {pendingTransactions.length}</span>
                  <button
                    onClick={handleAdminLogout}
                    className="text-xs text-white/70 hover:text-white underline cursor-pointer"
                  >
                    Kunci / Logout Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL PREVIEW */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer z-[100]">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 text-white bg-white/20 hover:bg-white/40 border border-white/20 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm transition-all shadow-lg">✕</button>
            <img src={previewImage} alt="Preview Zoom" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl bg-black/50" />
            <p className="text-xs text-white/60 mt-3">Klik di mana saja untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  )
}