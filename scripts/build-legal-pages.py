"""Build the two public legal notices, reusing the current shared navigation."""
from pathlib import Path
from html import escape as e
import json,re

r=Path('dist')
data=json.loads(Path('content-legal.json').read_text())
base=(r/'contact.html').read_text()
header=re.search(r'<header class="site-header">.*?</dialog>',base,re.S)[0]
footer=re.search(r'<footer class="site-footer">.*?</footer>',base,re.S)[0]
head=base.split('<body id="top">')[0]
head=re.sub(r'<script defer src="/contact.js[^>]*></script>','',head)
head=re.sub(r'/contact.css\?[^"\s]+','/legal.css?v=20261029-legal1',head)
for key in ['privacy','terms']:
    page=data[key]
    toc=''.join('<a href="#'+s['id']+'">'+e(s['title'])+'</a>' for s in page['sections'])
    sections=''.join('<section id="'+s['id']+'"><h2>'+e(s['title'])+'</h2>'+''.join('<p>'+e(p)+'</p>' for p in s['paragraphs'])+'</section>' for s in page['sections'])
    tabs=''.join('<a href="/'+k+'.html"'+(' aria-current="page"' if k==key else '')+'>'+e(data[k]['title'])+'</a>' for k in ['privacy','terms'])
    body=f'''<main class="legal-shell"><nav class="legal-tabs" aria-label="Legal information">{tabs}</nav><div class="legal-hero"><span class="legal-eyebrow">AL FURQAN · YOUR INFORMATION &amp; YOUR USE</span><h1>{e(page['title'])}</h1><p class="legal-lead">{e(page['lead'])}</p><p class="legal-updated"><span>Last updated</span><time datetime="{data['updated']}">29 October 2026</time></p></div><div class="legal-layout"><aside class="legal-side"><span class="legal-eyebrow">On this page</span><nav class="legal-toc" aria-label="On this page">{toc}<a href="#legal-contact">Contact Al Furqan</a></nav></aside><article class="legal-copy" aria-label="{e(page['title'])}">{sections}<aside class="legal-contact" id="legal-contact"><h2>Contact Al Furqan</h2><p>Questions about privacy or these terms? Get in touch.</p><a href="mailto:contact@getfurqan.online" dir="ltr" translate="no">contact@getfurqan.online</a><p class="legal-contact-links"><a href="/contact.html">Contact form</a><a href="/{'terms' if key=='privacy' else 'privacy'}.html">{e(data['terms' if key=='privacy' else 'privacy']['title'])}</a><a href="#top">Back to top ↑</a></p></aside></article></div></main>'''
    h=re.sub(r'<title>.*?</title>','<title>'+e(page['title'])+' · Al Furqan</title>',head)
    h=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="'+e(page['lead'])+'">',h)
    h=h.replace('</head>','<link rel="canonical" href="https://getfurqan.online/'+key+'.html"></head>')
    (r/(key+'.html')).write_text(h+'<body id="top">'+header+body+footer+'</body></html>')
