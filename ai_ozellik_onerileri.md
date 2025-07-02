# 🤖 Stok Takip Sistemine Eklenebilecek AI Özellikleri

## 📊 **Mevcut Sistem Analizi**
- **Platform:** React + TypeScript + Material-UI + Supabase
- **Mevcut Özellikler:** Ürün yönetimi, stok hareketleri, temel dashboard
- **Hedef:** AI ile akıllı stok yönetimi ve tahminleme

---

## 🚀 **Hemen Uygulanabilir AI Özellikleri**

### **1. 📈 Akıllı Stok Tahmini (Demand Forecasting)**

**Nasıl Çalışır:**
- Geçmiş stok hareketlerinizi analiz eder
- Mevsimsel trendleri öğrenir
- Gelecek talebi tahmin eder

**Teknik Uygulama:**
```typescript
// Yeni API endpoint'i
const predictStockNeeds = async (productId: number, days: number) => {
  const response = await fetch('/api/ai/predict-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, days })
  });
  return response.json();
};

// Supabase Edge Function ile model çağrısı
const { data } = await supabase.functions.invoke('stock-prediction', {
  body: { product_id: productId, historical_data: stockMovements }
});
```

**Entegrasyon:**
- **Hizmet:** OpenAI API veya Google Cloud AI
- **Maliyet:** Aylık ~$20-50
- **Süre:** 1-2 hafta

---

### **2. 🔍 Akıllı Ürün Kategorilendirme**

**Nasıl Çalışır:**
- Ürün adlarını analiz eder
- Otomatik kategori önerir
- Benzer ürünleri gruplar

**Kod Örneği:**
```typescript
const categorizeProduct = async (productName: string) => {
  const prompt = `Bu ürünü kategorize et: "${productName}". 
  Kategoriler: Gıda, İçecek, Malzeme, Ekipman, Diğer`;
  
  const response = await openai.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50
  });
  
  return response.choices[0].message.content;
};
```

**Products.tsx'e Ekleme:**
```typescript
// Ürün ekleme formunda
const handleAutoCategory = async () => {
  const suggestedCategory = await categorizeProduct(productName);
  setCategory(suggestedCategory);
};
```

---

### **3. 🚨 Akıllı Kritik Stok Uyarıları**

**Nasıl Çalışır:**
- Stok hızını analiz eder
- Dinamik minimum stok seviyesi belirler
- Kişiselleştirilmiş uyarılar gönderir

**Supabase Edge Function:**
```typescript
// supabase/functions/smart-alerts/index.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { product_id } = await req.json();
  
  // AI ile optimal stok seviyesi hesapla
  const optimalLevel = await calculateOptimalStock(product_id);
  
  return new Response(JSON.stringify({ optimalLevel }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
});
```

---

### **4. 💬 AI Chatbot Asistan**

**Nasıl Çalışır:**
- Doğal dille stok sorguları
- Hızlı komutlar ve raporlar
- Sesli komut desteği

**React Bileşeni:**
```typescript
// src/components/ChatAssistant.tsx
import { useState } from 'react';
import { Button, TextField, Paper, Typography } from '@mui/material';

const ChatAssistant = () => {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');

  const handleSubmit = async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: input,
        context: 'stok-takip-sistemi'
      })
    });
    
    const aiResponse = await response.json();
    setMessages(prev => [...prev, 
      { role: 'user', content: input },
      { role: 'assistant', content: aiResponse.message }
    ]);
  };

  return (
    <Paper sx={{ p: 2, maxWidth: 400 }}>
      <Typography variant="h6">🤖 Stok Asistanı</Typography>
      {messages.map((msg, idx) => (
        <Typography key={idx} sx={{ mb: 1 }}>
          <strong>{msg.role}:</strong> {msg.content}
        </Typography>
      ))}
      <TextField 
        fullWidth 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Örn: 'Şeker stoğu ne durumda?'"
      />
      <Button onClick={handleSubmit} sx={{ mt: 1 }}>Gönder</Button>
    </Paper>
  );
};
```

---

### **5. 📸 Görsel Ürün Tanıma**

**Nasıl Çalışır:**
- Kameradan ürün fotoğrafı çeker
- AI ile ürünü tanır
- Otomatik ürün kaydı yapar

**Camera Component:**
```typescript
// src/components/ProductScanner.tsx
import { useRef, useState } from 'react';
import { Button, Box } from '@mui/material';

const ProductScanner = ({ onProductDetected }: { onProductDetected: (product: any) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    setIsScanning(true);
  };

  const captureImage = async () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    // AI ile ürün tanıma
    const response = await fetch('/api/recognize-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    
    const product = await response.json();
    onProductDetected(product);
  };

  return (
    <Box>
      {!isScanning ? (
        <Button onClick={startCamera}>📸 Ürün Tara</Button>
      ) : (
        <>
          <video ref={videoRef} autoPlay style={{ width: '100%', maxWidth: 300 }} />
          <Button onClick={captureImage}>Fotoğraf Çek</Button>
        </>
      )}
    </Box>
  );
};
```

---

### **6. 📊 Akıllı Dashboard Insights**

**Nasıl Çalışır:**
- Stok verilerini analiz eder
- Anormal durumları tespit eder
- Aksiyon önerileri sunar

**Dashboard.tsx'e Ekleme:**
```typescript
// src/components/AIInsights.tsx
const AIInsights = () => {
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    const generateInsights = async () => {
      const { data: products } = await supabase.from('products').select('*');
      const { data: movements } = await supabase.from('stock_movements').select('*');
      
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, movements })
      });
      
      const aiInsights = await response.json();
      setInsights(aiInsights.recommendations);
    };

    generateInsights();
  }, []);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">🧠 AI Önerileri</Typography>
      {insights.map((insight, idx) => (
        <Typography key={idx} sx={{ mb: 1, color: 'primary.main' }}>
          • {insight}
        </Typography>
      ))}
    </Paper>
  );
};
```

---

## 🛠️ **Hızlı Uygulama Rehberi**

### **Adım 1: AI API Kurulumu (15 dakika)**
```bash
npm install openai @supabase/functions-js
```

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});
```

### **Adım 2: Supabase Edge Functions**
```bash
# Supabase CLI kurulumu
npm install -g supabase

# Edge function oluşturma
supabase functions new ai-assistant
```

### **Adım 3: Environment Variables**
```env
REACT_APP_OPENAI_API_KEY=sk-your-openai-key
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-key
```

---

## 💰 **Maliyet Hesaplaması**

| Özellik | Hizmet | Aylık Maliyet |
|---------|---------|---------------|
| Stok Tahmini | OpenAI GPT-3.5 | $10-20 |
| Chatbot | OpenAI API | $15-30 |
| Görsel Tanıma | Google Vision API | $5-15 |
| **TOPLAM** | | **$30-65** |

---

## ⏱️ **Geliştirme Süresi**

| Özellik | Süre | Öncelik |
|---------|------|---------|
| Akıllı Kategorilendirme | 2-3 gün | 🔥 YÜksek |
| AI Chatbot | 1 hafta | 🔥 YÜksek |
| Stok Tahmini | 1-2 hafta | 🟡 Orta |
| Görsel Tanıma | 3-5 gün | 🟡 Orta |
| Dashboard Insights | 3-4 gün | 🔥 YÜksek |

---

## 🎯 **Önerilen Başlangıç Stratejisi**

### **Hafta 1-2: Temel AI Entegrasyonu**
1. OpenAI API kurulumu
2. Basit chatbot ekleme
3. Akıllı kategorilendirme

### **Hafta 3-4: Gelişmiş Özellikler**
1. Dashboard insights
2. Kritik stok uyarıları
3. Kullanıcı testleri

### **Hafta 5-6: İleri Özellikler**
1. Stok tahmini modeli
2. Görsel tanıma (opsiyonel)
3. Performance optimizasyonu

---

## 🎉 **Sonuç**

Bu AI özellikleri sayesinde stok takip sisteminiz:
- ⚡ Daha akıllı ve otomatik hale gelecek
- 📈 Stok yönetimi verimliliği artacak
- 🤖 Modern bir kullanıcı deneyimi sunacak
- 💡 Veri-driven kararlar alabilecek

**İlk adım:** OpenAI API key alıp basit chatbot'tan başlayın! 🚀