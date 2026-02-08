# Performance Optimization Cookbook

Practical techniques and patterns for optimizing application performance.

## General Principles

### Measure First
```bash
# Always profile before optimizing
# "Premature optimization is the root of all evil" - Donald Knuth

# Tools:
# - Chrome DevTools Performance tab
# - Lighthouse
# - WebPageTest
# - New Relic / DataDog
```

### Performance Budgets
- Time to Interactive (TTI): < 5s
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

## Frontend Performance

### Code Splitting
```javascript
// React lazy loading
const Dashboard = React.lazy(() => import('./Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>

// Dynamic imports
button.addEventListener('click', async () => {
  const module = await import('./heavy-module.js');
  module.init();
});
```

### Image Optimization
```html
<!-- Use modern formats -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Description">
</picture>

<!-- Lazy loading -->
<img src="image.jpg" loading="lazy" alt="Description">

<!-- Responsive images -->
<img srcset="small.jpg 480w, medium.jpg 800w, large.jpg 1200w"
     sizes="(max-width: 600px) 480px, 800px"
     src="medium.jpg" alt="Description">
```

### CSS Optimization
```css
/* Avoid expensive properties */
/* Slow: */
.element {
  filter: blur(10px);
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

/* Faster: Use transform and opacity */
.element {
  transform: translateZ(0);
  will-change: transform;
}

/* Avoid layout thrashing */
/* Bad: */
const height = element.offsetHeight;
element.style.height = height + 10 + 'px';
const width = element.offsetWidth;
element.style.width = width + 10 + 'px';

/* Good: Batch reads and writes */
const height = element.offsetHeight;
const width = element.offsetWidth;
element.style.height = height + 10 + 'px';
element.style.width = width + 10 + 'px';
```

### JavaScript Optimization
```javascript
// Debounce expensive operations
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);

// Use requestAnimationFrame for animations
function animate() {
  element.style.transform = `translateX(${x}px)`;
  requestAnimationFrame(animate);
}

// Web Workers for heavy computation
const worker = new Worker('heavy-calc.worker.js');
worker.postMessage(largeDataset);
worker.onmessage = (e) => {
  console.log('Result:', e.data);
};
```

## Backend Performance

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);

-- Avoid SELECT *
SELECT id, name, email FROM users WHERE status = 'active';

-- Use LIMIT
SELECT * FROM logs ORDER BY created_at DESC LIMIT 100;

-- Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000
});
```

### Caching Strategies

```javascript
// 1. In-Memory Cache
const cache = new Map();

async function getUser(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }

  const user = await database.getUser(id);
  cache.set(id, user);
  setTimeout(() => cache.delete(id), 60000); // Expire after 1 min

  return user;
}

// 2. Redis Cache
async function getCachedData(key) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFromDatabase();
  await redis.setex(key, 3600, JSON.stringify(data)); // 1 hour TTL

  return data;
}

// 3. HTTP Caching
res.setHeader('Cache-Control', 'public, max-age=3600');
res.setHeader('ETag', generateETag(content));
```

### API Optimization

```javascript
// 1. Response Compression
app.use(compression());

// 2. Pagination
GET /api/users?page=1&limit=20

// 3. Field Selection
GET /api/users?fields=id,name,email

// 4. Batch Requests
POST /api/batch
{
  "requests": [
    { "method": "GET", "url": "/users/1" },
    { "method": "GET", "url": "/posts/1" }
  ]
}

// 5. Rate Limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### N+1 Query Problem

```javascript
// Bad: N+1 queries
const users = await User.findAll();
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// Good: Single query with JOIN
const users = await User.findAll({
  include: [Post]
});

// Or use DataLoader
const postLoader = new DataLoader(async (userIds) => {
  const posts = await Post.findAll({
    where: { userId: { $in: userIds } }
  });
  return userIds.map(id => posts.filter(p => p.userId === id));
});
```

## Network Performance

### HTTP/2 & HTTP/3
```nginx
# Enable HTTP/2
listen 443 ssl http2;

# Enable compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Enable keep-alive
keepalive_timeout 65;
```

### CDN Usage
```html
<!-- Serve static assets from CDN -->
<link rel="stylesheet" href="https://cdn.example.com/styles.css">
<script src="https://cdn.example.com/app.js"></script>
```

### Preloading & Prefetching
```html
<!-- Preload critical resources -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="font.woff2" as="font" crossorigin>

<!-- Prefetch future navigation -->
<link rel="prefetch" href="/next-page.html">

<!-- DNS prefetch -->
<link rel="dns-prefetch" href="//api.example.com">

<!-- Preconnect -->
<link rel="preconnect" href="https://cdn.example.com">
```

## Monitoring & Profiling

### Performance API
```javascript
// Measure page load
const perfData = performance.getEntriesByType('navigation')[0];
console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd);
console.log('Load Complete:', perfData.loadEventEnd);

// Custom marks
performance.mark('start-task');
// ... do work
performance.mark('end-task');
performance.measure('task-duration', 'start-task', 'end-task');

const measures = performance.getEntriesByType('measure');
console.log('Task took:', measures[0].duration, 'ms');
```

### Real User Monitoring (RUM)
```javascript
// Track Core Web Vitals
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === 'first-contentful-paint') {
      analytics.track('FCP', entry.startTime);
    }
  }
}).observe({ entryTypes: ['paint'] });

// Track Largest Contentful Paint
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  analytics.track('LCP', lastEntry.renderTime || lastEntry.loadTime);
}).observe({ entryTypes: ['largest-contentful-paint'] });
```

## Best Practices

1. **Measure Everything**: Use real metrics, not assumptions
2. **Optimize the Critical Path**: Focus on what users see first
3. **Reduce Bundle Size**: Tree-shake, minify, compress
4. **Lazy Load**: Load resources only when needed
5. **Cache Aggressively**: At every layer (browser, CDN, server, database)
6. **Optimize Images**: Compress, use modern formats, lazy load
7. **Minimize Reflows**: Batch DOM operations
8. **Use a CDN**: Serve static assets from edge locations
9. **Enable Compression**: gzip or brotli for text resources
10. **Monitor Production**: Track real user metrics continuously

## Performance Checklist

- [ ] Images optimized (compressed, lazy loaded, responsive)
- [ ] JavaScript code-split and minified
- [ ] CSS minified and critical CSS inlined
- [ ] HTTP/2 or HTTP/3 enabled
- [ ] Gzip/Brotli compression enabled
- [ ] CDN configured for static assets
- [ ] Database queries optimized (indexes, no N+1)
- [ ] Caching implemented (browser, server, database)
- [ ] API responses paginated
- [ ] Performance monitoring in place (RUM + synthetic)
