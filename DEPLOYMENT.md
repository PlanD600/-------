# הוראות פריסה - ProjectFlow

## בעיות ניווט שטופלו

האפליקציה עברה את השינויים הבאים כדי לטפל בבעיות הניווט:

### 1. שינוי ל-HashRouter
- שינינו מ-`BrowserRouter` ל-`HashRouter` כדי לטפל בבעיות עם כתובות ישירות
- עכשיו הכתובות ייראו כמו: `https://mypland.com/#/dashboard`

### 2. הוספת דף 404 מותאם
- הוספנו דף 404 מותאם עם כפתור חזרה לדשבורד
- הדף מוצג כאשר מנסים לגשת לכתובת שלא קיימת

### 3. קבצי תצורה לשרתים שונים

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Nginx (nginx.conf)
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### IIS (web.config)
```xml
<rule name="Handle History Mode and custom 404/500" stopProcessing="true">
  <match url="(.*)" />
  <conditions logicalGrouping="MatchAll">
    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
    <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
  </conditions>
  <action type="Rewrite" url="/" />
</rule>
```

#### Vercel (vercel.json)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Netlify (_redirects)
```
/*    /index.html   200
```

## הוראות פריסה

### 1. בנייה
```bash
npm run build
```

### 2. בדיקה מקומית
```bash
npm run preview
# או
npm run serve
```

### 3. פריסה על Vercel
```bash
npm run deploy:vercel
```

### 4. פריסה על Netlify
```bash
npm run deploy:netlify
```

### 5. פריסה על Docker
```bash
docker-compose up --build
```

## פתרון בעיות

### בעיה: דף 404 מופיע
**פתרון**: ודאו שהקבצים הבאים קיימים בשרת:
- `.htaccess` (Apache)
- `nginx.conf` (Nginx)
- `web.config` (IIS)
- `vercel.json` (Vercel)
- `_redirects` (Netlify)

### בעיה: הניווט לא עובד
**פתרון**: ודאו שהאפליקציה מופעלת עם `HashRouter` ולא `BrowserRouter`

### בעיה: כתובות ישירות לא עובדות
**פתרון**: עם `HashRouter`, הכתובות צריכות לכלול `#` לפני הנתיב

## הערות חשובות

1. **HashRouter**: הכתובות ייראו כמו `https://mypland.com/#/dashboard`
2. **BrowserRouter**: דורש תצורת שרת מיוחדת אבל הכתובות נראות נקיות יותר
3. **בחירת Router**: אם אתם רוצים `BrowserRouter`, תצטרכו להגדיר את השרת בהתאם

## תמיכה בשרתים

- ✅ Apache (עם mod_rewrite)
- ✅ Nginx
- ✅ IIS
- ✅ Vercel
- ✅ Netlify
- ✅ Docker + Nginx
- ✅ Firebase Hosting
- ✅ AWS S3 + CloudFront
