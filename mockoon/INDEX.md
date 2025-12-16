# 📚 Xendit Mock API - Documentation Index

Selamat datang di dokumentasi Xendit Mock API untuk Hi.Events! Berikut adalah panduan untuk navigasi dokumentasi.

## 🚀 Quick Start

**Baru pertama kali?** Mulai dari sini:

1. 📖 [README.md](README.md) - **START HERE** - Overview dan basic usage
2. 🔧 [SETUP_GUIDE.md](SETUP_GUIDE.md) - Panduan setup lengkap step-by-step
3. ⚡ [CHEATSHEET.md](CHEATSHEET.md) - Quick reference untuk command yang sering dipakai

## 📋 Dokumentasi Lengkap

### Untuk Developer

| Dokumen | Deskripsi | Kapan Digunakan |
|---------|-----------|-----------------|
| [README.md](README.md) | Dokumentasi utama dengan overview fitur dan usage | Pertama kali setup atau butuh referensi umum |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Panduan setup detail dengan troubleshooting | Setup awal atau ada masalah |
| [SUMMARY.md](SUMMARY.md) | Ringkasan lengkap semua fitur dan file | Butuh overview menyeluruh |
| [CHEATSHEET.md](CHEATSHEET.md) | Command dan contoh cepat | Daily development, quick reference |
| [CHANGELOG.md](CHANGELOG.md) | History perubahan dan roadmap | Tracking updates dan planning |

### File Konfigurasi

| File | Deskripsi | Edit? |
|------|-----------|-------|
| `xendit-mock.json` | Konfigurasi Mockoon API | ✅ Ya, untuk customize endpoints |
| `docker-compose.yml` | Docker Compose untuk standalone | ✅ Ya, untuk port/config changes |
| `Dockerfile` | Custom Mockoon image | ⚠️ Jarang, hanya jika perlu custom build |
| `.env.example` | Template environment variables | 📋 Copy ke `.env` dan edit |

### Testing Scripts

| Script | Platform | Deskripsi |
|--------|----------|-----------|
| `test-api.sh` | Linux/Mac | Automated testing script (Bash) |
| `test-api.ps1` | Windows | Automated testing script (PowerShell) |

## 🎯 Panduan Berdasarkan Kebutuhan

### "Saya ingin setup untuk pertama kali"
1. Baca [README.md](README.md) - Section "Cara Menggunakan"
2. Ikuti [SETUP_GUIDE.md](SETUP_GUIDE.md) - Step 1-5
3. Run test script untuk verifikasi

### "Saya butuh command cepat"
- Langsung ke [CHEATSHEET.md](CHEATSHEET.md)

### "Ada error/masalah"
1. Cek [SETUP_GUIDE.md](SETUP_GUIDE.md) - Section "Troubleshooting"
2. Cek logs: `docker-compose logs mockoon`
3. Restart: `docker-compose restart mockoon`

### "Saya ingin customize endpoints"
1. Edit `xendit-mock.json`
2. Restart Mockoon: `docker-compose restart mockoon`
3. Test dengan `test-api` script

### "Saya ingin tahu semua fitur"
- Baca [SUMMARY.md](SUMMARY.md)

### "Saya ingin tahu apa yang berubah"
- Cek [CHANGELOG.md](CHANGELOG.md)

## 📖 Reading Order

### Untuk Pemula
```
1. README.md (10 menit)
   ↓
2. SETUP_GUIDE.md (20 menit)
   ↓
3. Run test-api script
   ↓
4. CHEATSHEET.md (bookmark untuk daily use)
```

### Untuk Advanced User
```
1. SUMMARY.md (overview lengkap)
   ↓
2. xendit-mock.json (customize)
   ↓
3. CHANGELOG.md (roadmap)
```

## 🔍 Quick Links

### Dokumentasi
- 📖 [Main README](README.md)
- 🔧 [Setup Guide](SETUP_GUIDE.md)
- 📊 [Summary](SUMMARY.md)
- ⚡ [Cheatsheet](CHEATSHEET.md)
- 📝 [Changelog](CHANGELOG.md)

### Konfigurasi
- ⚙️ [Mockoon Config](xendit-mock.json)
- 🐳 [Docker Compose](docker-compose.yml)
- 📋 [Env Example](.env.example)

### Testing
- 🧪 [Bash Script](test-api.sh)
- 🧪 [PowerShell Script](test-api.ps1)

### External Resources
- 🌐 [Mockoon Docs](https://mockoon.com/docs/latest/about/)
- 🌐 [Xendit API Docs](https://developers.xendit.co/api-reference/)
- 🌐 [Hi.Events Docs](../README.md)

## 💡 Tips

### Untuk Efisiensi
1. **Bookmark** [CHEATSHEET.md](CHEATSHEET.md) untuk daily use
2. **Keep terminal open** dengan `docker-compose logs -f mockoon`
3. **Use test scripts** daripada manual curl
4. **Check CHANGELOG** untuk updates

### Best Practices
1. Selalu test dengan script setelah perubahan
2. Monitor logs untuk debugging
3. Update dokumentasi jika customize
4. Keep `.env` up to date

## 🆘 Need Help?

### Troubleshooting Steps
1. ✅ Cek [SETUP_GUIDE.md](SETUP_GUIDE.md) - Troubleshooting section
2. ✅ Cek logs: `docker-compose logs mockoon`
3. ✅ Restart: `docker-compose restart mockoon`
4. ✅ Rebuild: `docker-compose up -d --build`

### Common Issues
- **Cannot connect**: Cek XENDIT_BASE_URL (use `mockoon:3000` not `localhost:3000`)
- **Port conflict**: Change port in docker-compose.yml
- **API not responding**: Check logs and restart

## 📊 Documentation Stats

| Metric | Count |
|--------|-------|
| Total Docs | 5 files |
| Config Files | 3 files |
| Test Scripts | 2 files |
| Total Files | 11 files |
| Total Endpoints | 4 endpoints |

## 🎓 Learning Path

### Beginner (Day 1)
- [ ] Read README.md
- [ ] Follow SETUP_GUIDE.md
- [ ] Run test-api script
- [ ] Test payment page in browser

### Intermediate (Day 2-3)
- [ ] Read SUMMARY.md
- [ ] Customize xendit-mock.json
- [ ] Integrate with Hi.Events
- [ ] Test full payment flow

### Advanced (Week 1+)
- [ ] Read CHANGELOG.md
- [ ] Contribute improvements
- [ ] Add custom endpoints
- [ ] Implement webhook simulation

## 📞 Support

Untuk pertanyaan atau issues:
1. Check dokumentasi di folder ini
2. Check Hi.Events main documentation
3. Create issue di GitHub repository

---

**Last Updated:** 2025-12-16
**Version:** 1.0.0
**Maintained by:** Antigravity AI

**Happy Coding! 🚀**
