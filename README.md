# Siahaan.

Source for [chrisandoryan.github.io](https://chrisandoryan.github.io), built with Jekyll.

## Run locally

```shell
bundle install
bundle exec jekyll serve
```

Or with Docker:

```shell
docker run --rm -it -p 4000:4000 -v "$PWD":/site -w /site ruby:3.3 \
  sh -c "bundle install && bundle exec jekyll serve --host 0.0.0.0"
```

## Writing posts

Add a Markdown file to `_posts/` named `YYYY-MM-DD-title.md`:

```yaml
---
title: Post title
date: 2024-01-31 10:00:00 +0700
categories: [Web, SSTI]
---
```

`categories` is the only way posts are grouped. Use what the post is about (area, technique), not the event.

## Homepage snippets

The code card in the homepage hero comes from `_hero/`. Keep every snippet you have ever used there, one `.md` file each, and pick which one is live in `_config.yml`:

```yaml
hero_snippet: admin-secrets
```

| Value | What shows |
|---|---|
| `admin-secrets` | that file, every visit |
| `[memoir, deadly-bug]` | one of these, picked at random per visit |
| `random` | any file in `_hero/`, picked at random per visit |

Every snippet file has the same five fields. Leave one empty (`""`) to hide it.

````markdown
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
````

| Field | Shows as | Empty means |
|---|---|---|
| `title` | bold line in the card header | the file name is used |
| `subtitle` | small grey line under the title | nothing shown |
| `link` | where clicking the card goes, a post path or any URL | card is not clickable |
| `label` | pill on the right of the header | nothing shown |
| `align` | `left` or `center`: where the snippet sits in the card | left |

The body is a fenced code block. The language after the fence sets the highlighting.
Use `ascii` as the language for ASCII art: it keeps every line intact instead of wrapping, and tightens the line spacing.

## Deploy

Pushing to `main` builds and deploys through GitHub Actions. In the repository settings, set Pages source to **GitHub Actions**.
