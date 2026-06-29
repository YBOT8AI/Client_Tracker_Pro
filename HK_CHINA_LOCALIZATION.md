# HK/China Business Model Localization

**Date:** 2026-06-29  
**Priority:** CRITICAL for market fit  
**Target Markets:** Hong Kong SAR + Mainland China

---

## 🎯 MARKET-SPECIFIC REQUIREMENTS

### **Hong Kong Business Culture**

#### Key Characteristics:
- **Relationship-based (Guanxi 關係)**: Trust built through personal connections
- **Bilingual operations**: Traditional Chinese + English essential
- **WhatsApp-first communication**: 95%+ business via WhatsApp
- **FPS payments**: Faster Payment System ubiquitous
- **Tax simplicity**: No VAT, simple profits tax (16.5%)
- **Company structure**: Limited companies common, BR (Business Registration) required

#### Must-Have Features:
1. **Traditional Chinese UI** (繁體中文)
2. **WhatsApp Integration** (not just email)
3. **HKD + RMB dual currency** support
4. **BR Number tracking** (Business Registration)
5. **Tax invoice compliance** (IRD requirements)
6. **WeChat Pay / Alipay HK** payment tracking

---

### **Mainland China Business Culture**

#### Key Characteristics:
- **WeChat ecosystem dominance**: Everything happens in WeChat
- **Alipay/WeChat Pay**: Cashless society, QR codes everywhere
- **Fapiao (发票) system**: Government-controlled tax invoices
- **Social commerce**: Sales through WeChat groups, livestreams
- **Mobile-first**: Desktop usage minimal for SMBs
- **Guanxi tracking**: Gift-giving, relationship maintenance critical

#### Must-Have Features:
1. **Simplified Chinese UI** (简体中文)
2. **WeChat Mini Program** version (not just web app)
3. **Fapiao management** (tax invoice tracking)
4. **WeChat Pay / Alipay** payment reconciliation
5. **RMB-only accounting** (no multi-currency needed domestically)
6. **ID Card validation** (Chinese national ID format)
7. **Phone number format** (+86 mainland numbers)

---

## 🔧 CRITICAL INTEGRATIONS TO BUILD

### **Phase 3: Payment & Compliance (HK Focus)**

#### 3A. FPS Payment Tracking
```typescript
interface FPSPayment {
  fps_reference_id: string;
  amount: number;
  currency: 'HKD' | 'CNY';
  payer_name: string;
  payer_account: string; // Masked: ***1234
  transaction_date: string;
  bank: string; // HSBC, Hang Seng, BOC, etc.
  status: 'pending' | 'completed' | 'failed';
}
```

**Why:** 80%+ of HK SMB transactions use FPS  
**Integration:** Bank API or manual entry with OCR receipt scan

#### 3B. Tax Invoice Generator (IRD Compliant)
```typescript
interface TaxInvoice {
  invoice_number: string;
  company_br_number: string; // Business Registration
  customer_br_number?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: 0; // HK has no VAT
  }>;
  total_amount: number;
  payment_terms: string;
  company_chop_image?: string; // Digital chop stamp
}
```

**Why:** Legal requirement for B2B transactions in HK  
**Compliance:** IRD guidelines for record-keeping (7 years)

---

### **Phase 4: China Market Adaptation**

#### 4A. WeChat Pay Reconciliation
```typescript
interface WeChatPayment {
  transaction_id: string;
  openid: string; // WeChat user ID
  amount: number;
  currency: 'CNY';
  trade_type: 'APP' | 'JSAPI' | 'NATIVE' | 'MICRO';
  bank_type: string;
  cash_fee: number;
  time_start: string;
  time_end: string;
}
```

**Why:** 90%+ of China consumer payments  
**Integration:** WeChat Pay API v3

#### 4B. Fapiao (发票) Management
```typescript
interface Fapiao {
  fapiao_code: string; // 发票代码 (10 digits)
  fapiao_number: string; // 发票号码 (8 digits)
  type: 'special' | 'general'; // 专票 vs 普票
  buyer_name: string;
  buyer_tax_id: string; // 纳税人识别号
  seller_name: string;
  seller_tax_id: string;
  amount_excluding_tax: number;
  tax_rate: number; // 1%, 3%, 6%, 9%, 13%
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  status: 'issued' | 'reversed' | 'pending';
}
```

**Why:** Legal requirement for B2B in China, expense claims  
**Integration:** State Taxation Administration API

#### 4C. Chinese ID & Phone Validation
```typescript
// National ID validation (18 digits)
function validateChineseID(id: string): boolean {
  // Format: 6 digits (region) + 8 digits (birth date) + 3 digits (sequence) + 1 check digit
  const pattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  return pattern.test(id);
}

// Mainland phone validation
function validateChinaPhone(phone: string): boolean {
  // Format: +86 or 86 or 0 prefix, 11 digits starting with 1
  const pattern = /^(\+?86)?1[3-9]\d{9}$/;
  return pattern.test(phone);
}
```

---

### **Phase 5: Communication Channels**

#### 5A. WhatsApp Business API (HK)
```typescript
interface WhatsAppMessage {
  phone_number: string; // +852 format
  message_type: 'text' | 'template' | 'media';
  template_name?: string; // Pre-approved templates
  parameters?: Record<string, string>;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

// Use cases:
// - Invoice reminders
// - Payment confirmations
// - Follow-up appointment reminders
// - Birthday/anniversary greetings (guanxi building)
```

**Why:** 95% HK business communication via WhatsApp  
**Integration:** Meta WhatsApp Business API

#### 5B. WeChat Official Account Messages (China)
```typescript
interface WeChatTemplateMessage {
  touser: string; // User openid
  template_id: string;
  page?: string; // Mini program page
  data: {
    [key: string]: { value: string; color?: string };
  };
}

// Use cases:
// - Payment notifications
// - Membership updates
// - Promotional campaigns
// - Customer service
```

**Why:** Only way to message users proactively in China  
**Integration:** WeChat Official Account API

---

### **Phase 6: Localization Features**

#### 6A. Multi-Language Support
```typescript
type Language = 'en-HK' | 'zh-HK' | 'zh-CN';

const translations = {
  'en-HK': {
    dashboard: 'Dashboard',
    customers: 'Customers',
    invoices: 'Invoices',
  },
  'zh-HK': {
    dashboard: '儀表板',
    customers: '客戶',
    invoices: '發票',
  },
  'zh-CN': {
    dashboard: '仪表板',
    customers: '客户',
    invoices: '发票',
  },
};
```

**Priority:** 
1. English (baseline)
2. Traditional Chinese (HK)
3. Simplified Chinese (China)

#### 6B. Currency & Number Formatting
```typescript
const formatters = {
  'hk-hkd': new Intl.NumberFormat('en-HK', {
    style: 'currency',
    currency: 'HKD',
  }), // HK$12,345.67
  
  'hk-cny': new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'CNY',
  }), // ¥12,345.67
  
  'cn-cny': new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }), // ￥12,345.67
};
```

#### 6C. Date Formats
- **HK**: DD/MM/YYYY (British influence)
- **China**: YYYY-MM-DD (ISO standard)
- **Both**: Need to support lunar calendar for holidays/greetings

---

## 🏢 COMPANY & CONTACT DATA MODEL UPDATES

### Enhanced Company Schema
```typescript
interface Company {
  // Basic info
  name_en?: string;
  name_zh_hk?: string; // Traditional Chinese
  name_zh_cn?: string; // Simplified Chinese
  
  // Registration (HK)
  br_number?: string; // Business Registration Number
  incorporation_date?: string;
  company_type?: 'limited' | 'unlimited' | 'sole_proprietorship';
  
  // Registration (China)
  usci_code?: string; // 统一社会信用代码 (18 digits)
  legal_representative?: string; // 法定代表人
  
  // Tax info
  tax_id_hk?: string;
  tax_id_cn?: string; // 纳税人识别号
  
  // Contact preferences
  preferred_language: 'en-HK' | 'zh-HK' | 'zh-CN';
  preferred_currency: 'HKD' | 'CNY';
  preferred_communication: 'whatsapp' | 'wechat' | 'email' | 'phone';
  
  // Guanxi tracking
  relationship_strength: 1 | 2 | 3 | 4 | 5; // 1=cold, 5=hot
  last_gift_date?: string;
  last_meeting_date?: string;
  key_decision_maker?: string;
}
```

### Enhanced Contact Schema
```typescript
interface Contact {
  // Name formats
  name_english?: string;
  name_chinese_traditional?: string;
  name_chinese_simplified?: string;
  
  // Identification
  hk_id_type?: 'hkid' | 'passport' | 'none';
  hkid?: string; // HKID: A123456(7)
  china_id?: string; // 中国大陆身份证
  
  // Communication
  whatsapp_number?: string; // +852 format
  wechat_id?: string; // WeChat ID
  email?: string;
  
  // Social/commercial
  company_title_zh?: string; // 职位 (e.g., 總經理)
  industry_zh?: string; // 行业
  
  // Guanxi score
  guanxi_level: 1 | 2 | 3 | 4 | 5;
  last_interaction_date?: string;
  next_followup_date?: string;
  
  // Preferences
  birthday_lunar?: boolean; // Prefer lunar calendar birthday
  gift_preferences?: string;
}
```

---

## 💳 PAYMENT METHODS MATRIX

| Method | HK Adoption | China Adoption | Priority |
|--------|-------------|----------------|----------|
| **FPS (Faster Payment System)** | 85% | 0% | P0 (HK) |
| **WeChat Pay** | 45% | 90% | P0 (CN) |
| **Alipay** | 35% | 85% | P1 (CN) |
| **Bank Transfer** | 60% | 40% | P1 |
| **Credit Card** | 50% | 15% | P2 |
| **Cash** | 20% | 5% | P3 |
| **PayMe** | 25% | 0% | P3 (HK only) |
| **Octopus** | 15% | 0% | P3 (HK only) |

---

## 📋 COMPLIANCE CHECKLIST

### Hong Kong Compliance
- [ ] **IRD Tax Invoice Requirements**
  - Sequential numbering
  - Company BR number displayed
  - Transaction date
  - Clear description of goods/services
  - Total amount in HKD
  
- [ ] **Data Privacy (PDPO)**
  - Personal Data Privacy Ordinance compliance
  - Consent for marketing messages
  - Data retention policy (7 years for tax)
  - Right to access/correct data
  
- [ ] **Electronic Transactions Ordinance**
  - E-signature validity
  - Electronic record keeping

### China Compliance
- [ ] **Fapiao Regulations**
  - State Taxation Administration rules
  - Special Fapiao for VAT deduction
  - General Fapiao for expenses
  - Anti-forgery measures
  
- [ ] **Cybersecurity Law**
  - Data localization (store in China)
  - Cross-border data transfer restrictions
  - User consent requirements
  
- [ ] **E-commerce Law**
  - Business license display
  - Consumer protection rules
  - Dispute resolution mechanisms

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 3 (Week 1-2): HK Payments & Compliance
- [ ] FPS payment tracking (manual entry + CSV import)
- [ ] Tax invoice generator (IRD compliant)
- [ ] Traditional Chinese translation
- [ ] BR number fields
- [ ] WhatsApp Business API integration

### Phase 4 (Week 3-4): China Adaptation
- [ ] WeChat Pay reconciliation API
- [ ] Fapiao management system
- [ ] Simplified Chinese translation
- [ ] Chinese ID/phone validation
- [ ] WeChat Official Account messaging

### Phase 5 (Week 5-6): Advanced Features
- [ ] Guanxi relationship tracker
- [ ] Lunar calendar support
- [ ] Multi-currency reporting (HKD/CNY)
- [ ] Cross-border tax calculation
- [ ] Regional analytics dashboard

---

## 💰 PRICING STRATEGY BY MARKET

### Hong Kong Pricing
- **Starter**: HKD 299/month (SMBs, <50 customers)
- **Professional**: HKD 599/month (<500 customers, invoicing)
- **Enterprise**: HKD 1,299/month (unlimited, API access)

### China Pricing (Mainland)
- **Starter**: CNY 99/month (~HKD 110)
- **Professional**: CNY 299/month (~HKD 330)
- **Enterprise**: CNY 699/month (~HKD 775)

**Why lower?** China market more price-sensitive, higher volume expected

---

## 🎯 SUCCESS METRICS

### Hong Kong KPIs:
- **Adoption Rate**: 100 SMBs in first 3 months
- **Payment Integration**: 80% using FPS tracking
- **Invoice Generation**: 70% creating invoices in-app
- **Retention**: >85% monthly retention

### China KPIs:
- **WeChat Integration**: 90% connected to WeChat
- **Fapiao Usage**: 60% issuing fapiao through system
- **Mobile Usage**: >95% mobile vs desktop
- **Retention**: >80% monthly retention

---

**Next Action:** Prioritize which features to build first based on target market (HK vs China) and get TOBY's decision on market focus.
