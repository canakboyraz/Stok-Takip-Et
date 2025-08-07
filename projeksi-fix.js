// localStorage'ı temizle
localStorage.clear();

// Kullanıcı oturumunu kontrol et ve yenile
(async function() {
  // Supabase bilgileri
  const supabaseUrl = 'https://jrntktkmnkapxokoyhwc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybnRrdGttbmthcHhva295aHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMTU2OTMsImV4cCI6MjA1ODU5MTY5M30.FU6QCYxXR6kQq2FczjQ6vgSB57mno3CPdO43JTQleRI';
  
  // Supabase'i yükle (CDN üzerinden)
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@supabase/supabase-js@2';
  document.head.appendChild(script);
  
  script.onload = async () => {
    try {
      const { createClient } = supabaseJs;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log('Supabase oturumu kontrol ediliyor...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Oturum hatası:', error);
        alert('Oturum hatası: ' + error.message);
        window.location.href = '/'; // Login sayfasına git
        return;
      }
      
      if (data && data.session) {
        console.log('Aktif oturum bulundu:', data.session);
        alert('Oturum başarıyla yenilendi. Proje seçim sayfasına yönlendiriliyorsunuz.');
        window.location.href = '/projects'; // Proje seçim sayfasına git
      } else {
        console.log('Oturum bulunamadı');
        alert('Oturum bulunamadı. Giriş sayfasına yönlendiriliyorsunuz.');
        window.location.href = '/'; // Login sayfasına git
      }
    } catch (err) {
      console.error('Beklenmeyen hata:', err);
      alert('Beklenmeyen hata: ' + err.message);
    }
  };
})(); 