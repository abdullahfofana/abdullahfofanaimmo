# 🔧 دليل استكشاف أخطاء Supabase وحلها

## 📋 فهرس المشاكل

1. [خطأ في اسم متغير البيئة](#مشكلة-1-خطأ-في-اسم-متغير-البيئة)
2. [المفتاح الخاطئ (ANON KEY vs PUBLISHABLE KEY)](#مشكلة-2-المفتاح-الخاطئ)
3. [الجداول غير موجودة في قاعدة البيانات](#مشكلة-3-الجداول-غير-موجودة)
4. [مشاكل صلاحيات RLS](#مشكلة-4-مشاكل-صلاحيات-rls)
5. [الباك-إند غير متصل أو لا يعمل](#مشكلة-5-الباك-إند-غير-متصل)
6. [استخدام Firebase Storage بدلاً من Supabase](#مشكلة-6-تعارض-firebase-storage)
7. [معالجة الأخطاء غير الكافية](#مشكلة-7-معالجة-أخطاء-ضعيفة)

---

## 🚨 المشكلة #1: خطأ في اسم متغير البيئة

### ✅ الأعراض:
```
[Supabase] ⚠️ Supabase credentials not configured.
[Database] ⚠️ Using local JSON file database (fallback)
```

### ❌ الخطأ الشائع:
```env
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

### ✅ الحل الصحيح:
```env
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 📝 الخطوات:
1. افتح ملف `env`
2. تأكد من أن المتغير اسمه `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. أعد تشغيل التطبيق بعد التعديل:
   ```bash
   # أوقف التطبيق (Ctrl+C)
   # ثم أعد التشغيل
   npm start
   ```

---

## 🚨 المشكلة #2: المفتاح الخاطئ

### ✅ الأعراض:
```
[Supabase] ❌ Error: Invalid JWT token
[Backend] insert error: invalid_grant
```

### ❌ أنواع المفاتيح الخاطئة:
- ❌ `sb_publishable_...` (هذا ليس مفتاح Supabase صحيح)
- ❌ Service Role Key (خطير للاستخدام العام)
- ❌ مفتاح منتهي الصلاحية

### ✅ المفتاح الصحيح:
يجب أن يكون **anon (public) key** بهذا الشكل:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eXlta2...
```

### 📝 كيفية الحصول على المفتاح الصحيح:

#### الطريقة 1: من Dashboard
1. افتح [Supabase Dashboard](https://app.supabase.com/)
2. اختر مشروعك
3. اذهب إلى **Settings** → **API**
4. انسخ **anon/public** key من قسم "Project API keys"

#### الطريقة 2: من URL المشروع
1. URL مشروعك: `https://uuyymkcidtcwfkiqjdrs.supabase.co`
2. Project Reference: `uuyymkcidtcwfkiqjdrs`
3. اذهب مباشرة إلى: `https://app.supabase.com/project/uuyymkcidtcwfkiqjdrs/settings/api`

---

## 🚨 المشكلة #3: الجداول غير موجودة

### ✅ الأعراض:
```
[Supabase] ❌ Error accessing tables: relation "properties" does not exist
Error code: 42P01
```

### 🔍 التحقق من المشكلة:
```sql
-- في Supabase SQL Editor
SELECT * FROM properties LIMIT 1;
-- إذا ظهر خطأ "relation does not exist" فالجداول غير موجودة
```

### ✅ الحل: إنشاء الجداول

#### الخطوة 1: افتح SQL Editor
1. اذهب إلى Supabase Dashboard
2. اختر مشروعك
3. من القائمة الجانبية، اختر **SQL Editor**

#### الخطوة 2: نفذ السكربت
```sql
-- نسخ الكود من ملف supabase_schema.sql أو استخدم هذا:

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'villa', 'land', 'commercial')),
  status TEXT NOT NULL CHECK (status IN ('sale', 'rent')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area NUMERIC NOT NULL,
  location JSONB NOT NULL,
  photos JSONB NOT NULL,
  video TEXT,
  document TEXT,
  features JSONB NOT NULL,
  agent JSONB NOT NULL,
  payment JSONB NOT NULL,
  "submissionStatus" TEXT NOT NULL DEFAULT 'pending',
  "submittedAt" TEXT NOT NULL,
  "reviewedAt" TEXT,
  "rejectionReason" TEXT,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'landlord', 'renter')),
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  "user" TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties("submissionStatus");
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### الخطوة 3: اضغط Run (أو Ctrl+Enter)

#### الخطوة 4: تحقق من إنشاء الجداول
```sql
-- تحقق من الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 🚨 المشكلة #4: مشاكل صلاحيات RLS

### ✅ الأعراض:
```
Error: Missing or insufficient permissions
permission-denied
new row violates row-level security policy
```

### 🔍 التحقق من المشكلة:
```sql
-- تحقق من حالة RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- تحقق من الـ Policies الموجودة
SELECT * 
FROM pg_policies 
WHERE tablename IN ('properties', 'users', 'activities');
```

### ✅ الحل: إعداد RLS Policies

#### السيناريو 1: تعطيل RLS (للتطوير فقط - غير آمن للإنتاج)
```sql
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
```

#### السيناريو 2: إعداد Policies للوصول العام (موصى به)
```sql
-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- حذف Policies القديمة
DROP POLICY IF EXISTS "Allow public read access on properties" ON properties;
DROP POLICY IF EXISTS "Allow public insert on properties" ON properties;
DROP POLICY IF EXISTS "Allow public update on properties" ON properties;

-- إنشاء Policies جديدة
CREATE POLICY "Allow public read access on properties"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on properties"
  ON properties FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on properties"
  ON properties FOR UPDATE
  USING (true);

-- نفس الشيء للجداول الأخرى
CREATE POLICY "Allow public read access on users"
  ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users"
  ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users"
  ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on activities"
  ON activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert on activities"
  ON activities FOR INSERT WITH CHECK (true);
```

#### السيناريو 3: Policies مع المصادقة (أكثر أماناً)
```sql
-- السماح بالقراءة للجميع، الكتابة للمستخدمين المُصرح لهم فقط
CREATE POLICY "Anyone can read properties"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON properties FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = (agent->>'id')::uuid);
```

---

## 🚨 المشكلة #5: الباك-إند غير متصل

### ✅ الأعراض:
```
Network request failed
Cannot connect to backend server
Loading spinner doesn't stop
```

### 🔍 التحقق من المشكلة:

#### 1. تحقق من Console Logs:
```
[tRPC] Base URL: (empty or undefined)
[tRPC] Full API URL: /api/trpc
```

#### 2. تحقق من المتغيرات البيئية:
```javascript
console.log('EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
// إذا كانت undefined أو empty، فهذه هي المشكلة
```

### ✅ الحل:

#### الخطوة 1: تأكد من تشغيل الباك-إند
```bash
# أعد تشغيل التطبيق
npm start
# أو
bun run dev
```

#### الخطوة 2: تحقق من عمل API
- افتح المتصفح
- اذهب إلى: `http://localhost:8081/api/trpc`
- يجب أن ترى استجابة JSON أو رسالة من tRPC

#### الخطوة 3: إذا كان على الويب
- تحقق من `window.location.origin` في console
- يجب أن يكون شيء مثل: `https://42txoi7xk1c4izhr7ugj4.rork.live`

---

## 🚨 المشكلة #6: تعارض Firebase Storage

### ✅ الأعراض:
```
[PropertySubmission] Uploading files to Firebase Storage...
FirebaseError: storage/unauthorized
```

### 🔍 المشكلة:
الكود يحاول رفع الملفات إلى Firebase بينما قاعدة البيانات Supabase!

```typescript
// في PropertySubmissionProvider.tsx
const photoUrls = await firebaseStorageService.uploadMultiplePhotos(...)
// ❌ Firebase Storage
// ✅ يجب استخدام Supabase Storage أو URLs مباشرة
```

### ✅ الحلول:

#### الحل 1: استخدام Supabase Storage (موصى به)
```typescript
// إنشاء خدمة Supabase Storage
import { supabase } from '@/backend/supabase';

export const supabaseStorageService = {
  uploadPhoto: async (uri: string, propertyId: string) => {
    const fileName = `${propertyId}/${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: fileName,
    } as any);

    const { data, error } = await supabase.storage
      .from('properties')
      .upload(fileName, formData);

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from('properties')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  }
};
```

#### الحل 2: تعطيل رفع الملفات واستخدام URLs (للتطوير)
```typescript
// في handleDevSubmit
photos: [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'
],
```

#### الحل 3: إصلاح Firebase Storage Permissions
```json
// في Firebase Console → Storage → Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 🚨 المشكلة #7: معالجة أخطاء ضعيفة

### ✅ الأعراض:
- لا توجد رسالة خطأ واضحة للمستخدم
- Loading لا يتوقف عند حدوث خطأ
- صعوبة تحديد سبب المشكلة

### ✅ الحل: تحسين معالجة الأخطاء

سيتم تحديث الكود تلقائياً في الخطوة التالية...

---

## 🧪 اختبار الاتصال بـ Supabase

### اختبار سريع:
```javascript
// في Console أو في ملف مؤقت
import { supabase } from '@/backend/supabase';

// اختبار 1: الاتصال
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Supabase Key:', supabase.supabaseKey ? 'SET' : 'NOT SET');

// اختبار 2: قراءة البيانات
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Error:', error.message);
} else {
  console.log('✅ Success:', data);
}

// اختبار 3: كتابة بيانات تجريبية
const { data: testData, error: insertError } = await supabase
  .from('properties')
  .insert({
    id: 'test_' + Date.now(),
    title: 'Test Property',
    description: 'Test',
    price: 100000,
    type: 'apartment',
    status: 'sale',
    area: 100,
    location: { address: 'Test', city: 'Test', district: 'Test' },
    photos: ['https://example.com/photo.jpg'],
    features: ['test'],
    agent: { name: 'Test', phone: '123' },
    payment: { method: 'orange_money', transactionId: 'test', amount: 100 },
    submissionStatus: 'pending',
    submittedAt: new Date().toISOString(),
    is_test: true
  })
  .select()
  .single();

if (insertError) {
  console.error('❌ Insert Error:', insertError.message);
} else {
  console.log('✅ Insert Success:', testData);
}
```

---

## 📋 Checklist النهائي

قبل تقديم Property، تأكد من:

- [ ] ✅ ANON KEY صحيح ويبدأ بـ `eyJhbGci...`
- [ ] ✅ URL صحيح: `https://uuyymkcidtcwfkiqjdrs.supabase.co`
- [ ] ✅ الجداول موجودة في Supabase (properties, users, activities)
- [ ] ✅ RLS Policies مُعدّة بشكل صحيح
- [ ] ✅ الباك-إند يعمل (`npm start` نشط)
- [ ] ✅ Console Logs تظهر اتصال ناجح:
  ```
  [Supabase] ✅ Supabase configured successfully
  [Database] ✅ Using Supabase as database
  [Supabase] ✅ Tables exist and are accessible
  ```
- [ ] ✅ اختبار إدخال بيانات تجريبية نجح
- [ ] ✅ Firebase Storage مُعطّل أو Supabase Storage مُفعّل
- [ ] ✅ معالجة الأخطاء محسّنة

---

## 🆘 حلول الطوارئ

### إذا لم يعمل شيء:

#### الحل السريع: استخدام JSON Fallback
```typescript
// في backend/db.ts
// غيّر USE_SUPABASE مؤقتاً
const USE_SUPABASE = false;

// سيستخدم التطبيق db.json كقاعدة بيانات مؤقتة
```

#### إعادة تعيين Supabase بالكامل
```sql
-- في SQL Editor
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ثم أعد تنفيذ سكربت supabase_schema.sql كاملاً
```

#### تفعيل Debug Mode
```typescript
// في lib/trpc.ts
// كل الـ console.logs موجودة بالفعل
// افتح Console وراجع الـ logs بعناية
```

---

## 📞 الدعم

إذا استمرت المشاكل:
1. راجع Console Logs بعناية
2. تحقق من Supabase Dashboard → Logs
3. تأكد من أن مشروع Supabase نشط وليس في وضع Paused
4. تحقق من Billing إذا كنت تجاوزت الحد المجاني

---

**تم إنشاء هذا الدليل:** 2025-12-29
**آخر تحديث:** 2025-12-29
**الإصدار:** 1.0
