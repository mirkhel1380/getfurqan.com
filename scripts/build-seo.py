"""Rebuild public discovery metadata without changing source content or access."""
from pathlib import Path
from html import escape, unescape
import json, re
import xml.etree.ElementTree as ET

ROOT = Path('dist')
BASE = 'https://getfurqan.online'
NOINDEX = {'account.html', 'admin.html', 'auth-callback.html', 'login.html',
           'progress.html', 'search.html', 'hadith.html', 'hadith-book.html', '404.html'}
PRIVATE = {'account.html', 'admin.html', 'auth-callback.html', 'login.html', '404.html'}
DYNAMIC = {'reader.html', 'study.html', 'hadith.html', 'hadith-book.html'}
DESCRIPTIONS = {
    'index.html': 'Read the Quran in Uthmani, IndoPak and Tajweed scripts. Explore translations in 13 languages, recitation, published tafsir, hadith, adhkar and prayer times with Al Furqan.',
    'reader.html': 'Read the Arabic Quran alongside a named translation. Choose Uthmani, IndoPak or Tajweed, listen to recitation and keep your reading place.',
    'account.html': 'Manage your Al Furqan account and optional private reading sync.',
    'admin.html': 'Authorized Al Furqan account administration.',
    'auth-callback.html': 'Confirm your Al Furqan email or complete your password reset.',
    'login.html': 'Sign in to your Al Furqan account or continue reading as a guest.',
    '404.html': 'This page could not be found. Return to Al Furqan, read the Quran or search for a passage.',
}

def clear_metadata(s):
    s = re.sub(r'<!-- af-seo:start -->.*?<!-- af-seo:end -->', '', s, flags=re.S)
    s = re.sub(r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>', '', s, flags=re.I)
    s = re.sub(r'<meta\b(?=[^>]*\b(?:name|property)=["\'](?:description|robots|og:[^"\']+|twitter:[^"\']+)["\'])[^>]*>', '', s, flags=re.I)
    return s

def not_found():
    base = (ROOT/'about.html').read_text()
    head = clear_metadata(base.split('<body')[0])
    head = re.sub(r'<title>.*?</title>', '<title>Page not found · Al Furqan</title>', head)
    head = head.replace('</head>', '<link rel="stylesheet" href="/not-found.css?v=20261030-seo1"></head>')
    header = re.search(r'<header class="site-header">.*?</dialog>', base, re.S)[0]
    footer = re.search(r'<footer class="site-footer">.*?</footer>', base, re.S)[0]
    # Common application scripts live after the footer; keep navigation/theme/language wiring.
    tail = base[base.index('</footer>')+len('</footer>'):]
    tail = re.sub(r'<script[^>]+src="/metadata\.js[^>]*></script>', '', tail)
    body = '''<body id="top">'''+header+'''<nav class="af-page-breadcrumb af-page-breadcrumb-wide" data-page-breadcrumb aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">404</span></nav>
<main class="not-found-main wrap"><section class="not-found-heading af-page-heading" aria-labelledby="not-found-title"><div class="not-found-mark" aria-hidden="true">404</div><div class="not-found-copy"><div class="eyebrow">AL FURQAN</div><h1 id="not-found-title">Page not found</h1><p class="lead">This link may have changed. Choose a section below to continue.</p><div class="not-found-actions"><a class="button" href="/reader.html">Read Quran <span aria-hidden="true">↗</span></a><a class="not-found-home" href="/">Home</a></div></div></section>
<section class="not-found-search" aria-labelledby="not-found-search-title"><h2 id="not-found-search-title">Search Quran</h2><form action="/search.html" method="get"><label class="sr-only" for="not-found-query">Search Quran</label><input id="not-found-query" name="q" type="search" placeholder="Search Quran" required maxlength="200"><button class="button" type="submit">Search</button></form><a href="/contact.html">Report a broken link <span aria-hidden="true">↗</span></a></section></main>'''
    (ROOT/'404.html').write_text(head+body+footer+tail)

not_found()
public = []
for path in sorted(ROOT.rglob('*.html')):
    name = path.relative_to(ROOT).as_posix()
    source = path.read_text()
    description = DESCRIPTIONS.get(name)
    if description is None:
        match = re.search(r'<meta name="description" content="([^"]*)"', source)
        description = unescape(match[1]) if match else 'Read, understand and reflect with Al Furqan.'
    title = unescape(re.search(r'<title>(.*?)</title>', source, re.S)[1])
    url = BASE+('/' if name == 'index.html' else '/'+name)
    indexable = name not in NOINDEX
    if indexable:
        public.append(url)
    robots = 'index,follow,max-image-preview:large' if indexable else ('noindex,nofollow' if name in PRIVATE else 'noindex,follow')
    tags = [f'<meta name="description" content="{escape(description, quote=True)}">', f'<meta name="robots" content="{robots}">']
    if name not in DYNAMIC:
        tags.append(f'<link rel="canonical" href="{url}">')
    values = {'og:type':'website', 'og:site_name':'Al Furqan', 'og:title':title,
              'og:description':description, 'og:url':url, 'og:locale':'en_US',
              'og:image':BASE+'/og-image.png', 'og:image:width':'1200',
              'og:image:height':'630', 'og:image:type':'image/png',
              'og:image:alt':'Al Furqan — Read, understand, reflect',
              'twitter:card':'summary_large_image', 'twitter:title':title,
              'twitter:description':description, 'twitter:image':BASE+'/og-image.png',
              'twitter:image:alt':'Al Furqan — Read, understand, reflect'}
    for key, value in values.items():
        attribute = 'property' if key.startswith('og:') else 'name'
        tags.append(f'<meta {attribute}="{key}" content="{escape(value, quote=True)}">')
    if indexable:
        graph = [
            {'@type':'Organization','@id':BASE+'/#organization','name':'Al Furqan','alternateName':'الفرقان','url':BASE+'/', 'logo':BASE+'/apple-touch-icon.png','email':'contact@getfurqan.online'},
            {'@type':'WebSite','@id':BASE+'/#website','url':BASE+'/', 'name':'Al Furqan','publisher':{'@id':BASE+'/#organization'}},
            {'@type':'WebPage','@id':url+'#webpage','url':url,'name':title,'description':description,'inLanguage':'en','isPartOf':{'@id':BASE+'/#website'}}]
        if name != 'index.html':
            graph.append({'@type':'BreadcrumbList','itemListElement':[
                {'@type':'ListItem','position':1,'name':'Al Furqan','item':BASE+'/'},
                {'@type':'ListItem','position':2,'name':title.split(' · ')[0],'item':url}]})
        tags.append('<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>')
    if name in DYNAMIC:
        tags.append('<script defer src="/metadata.js?v=20261030-seo1"></script>')
    head, tail = clear_metadata(source).split('</head>', 1)
    head = re.sub(r'[ \t]+\n', '\n', head)
    source = head+'<!-- af-seo:start -->'+''.join(tags)+'<!-- af-seo:end --></head>'+tail
    path.write_text(source)

ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
sitemap = ET.Element('{http://www.sitemaps.org/schemas/sitemap/0.9}urlset')
for url in public:
    row = ET.SubElement(sitemap, 'url')
    ET.SubElement(row, 'loc').text = url
ET.ElementTree(sitemap).write(ROOT/'sitemap.xml', encoding='utf-8', xml_declaration=True)
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+BASE+'/sitemap.xml\n')
(ROOT/'.nojekyll').write_text('')
print(f'SEO: {len(public)} public sitemap URLs; {len(list(ROOT.rglob("*.html")))} pages with metadata.')
