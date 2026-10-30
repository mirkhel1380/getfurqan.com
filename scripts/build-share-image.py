"""Render the existing outlined Al Furqan wordmark into its social share card.
Requires the installed Inkscape CLI and Pillow. No external assets or fonts downloaded.
"""
from pathlib import Path
from xml.etree import ElementTree as ET
import subprocess
from PIL import Image

root = Path(__file__).resolve().parents[1]
logo_path = root / 'dist/logo-light.svg'
logo = ET.fromstring(logo_path.read_text())
ET.register_namespace('', 'http://www.w3.org/2000/svg')
# Preserve the existing outlined logo paths, transforms and attribution verbatim.
logo_body = ''.join(ET.tostring(child, encoding='unicode') for child in logo)
svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
<title id="title">Al Furqan — Read · Understand · Reflect</title>
<desc id="description">Quran reading, translations &amp; study at getfurqan.online.</desc>
<defs>
 <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#123d30"/><stop offset="1" stop-color="#0b2821"/></linearGradient>
 <radialGradient id="light"><stop stop-color="#28634e" stop-opacity=".6"/><stop offset="1" stop-color="#28634e" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#background)"/>
<circle cx="990" cy="260" r="410" fill="url(#light)"/>
<rect x="28.5" y="28.5" width="1143" height="573" rx="20" fill="none" stroke="#a58b56" stroke-opacity=".35"/>
<path d="M80 91h56" stroke="#cbb47d" stroke-width="3"/>
<text x="80" y="139" fill="#cbb47d" font-family="DejaVu Sans, sans-serif" font-size="17" letter-spacing="1.8">Read · Understand · Reflect</text>
<text x="76" y="239" fill="#f4e7c7" font-family="DejaVu Serif, serif" font-size="72">Al Furqan</text>
<path d="M80 278h520" stroke="#a58b56" stroke-opacity=".45"/>
<text x="80" y="343" fill="#ecf0e5" font-family="DejaVu Sans, sans-serif" font-size="32"><tspan x="80">Quran reading,</tspan><tspan x="80" dy="46">translations &amp; study</tspan></text>
<circle cx="928" cy="307" r="187" fill="#1c4c3c" fill-opacity=".35" stroke="#bba56d" stroke-opacity=".35"/>
<circle cx="928" cy="307" r="173" fill="none" stroke="#bba56d" stroke-opacity=".15"/>
<svg x="772" y="219" width="312" height="169.37" viewBox="0 0 140 76">''' + logo_body + '''</svg>
<text x="928" y="413" text-anchor="middle" fill="#cbb47d" font-family="DejaVu Sans, sans-serif" font-size="13" letter-spacing="4.4">AL FURQAN</text>
<path d="M80 490h1040" stroke="#a58b56" stroke-opacity=".25"/>
<text x="80" y="546" fill="#d9dfcf" font-family="DejaVu Sans, sans-serif" font-size="21">getfurqan.online</text>
<path d="M1079 533h35m-11-11 11 11-11 11" fill="none" stroke="#cbb47d" stroke-width="2"/>
</svg>'''
svg_path = root / 'dist/og-image.svg'
png_path = root / 'dist/og-image.png'
svg_path.write_text(svg)
subprocess.run(['inkscape', str(svg_path), '--export-type=png', '--export-filename='+str(png_path), '--export-width=1200', '--export-height=630'], check=True, capture_output=True)
with Image.open(png_path) as image:
    assert image.size == (1200, 630)
    image.convert('RGB').save(png_path, optimize=True)
print(str(png_path), png_path.stat().st_size)
