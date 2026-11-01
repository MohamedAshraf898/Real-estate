#!/usr/bin/env python3
"""Build the WordPress theme from the static site.

    python3 tools/build-theme.py      ->  dist/linden-residences/  and  dist/linden-residences.zip

The PHP parts live in wordpress-theme/. Page templates are generated from the .html pages so the
theme and the static site never drift apart: links become WordPress page addresses, the hero title
uses the site name, and contact details come from Appearance → Customize.
"""
import json
import os
import re
import shutil
import subprocess
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_PHP = os.path.join(ROOT, 'wordpress-theme')
DIST = os.path.join(ROOT, 'dist', 'linden-residences')
ASSETS = ['tokens.css', 'site.css', 'main.js', 'data.js', 'motion.js', 'motion-plus.js', 'building3d.js', 'world3d.js', 'explore3d.js', 'favicon.svg']
PAGES = {  # html file -> (output, page key, template name)
    'index.html': ('front-page.php', 'home', None),
    'properties.html': ('templates/properties.php', 'properties', 'Properties'),
    'property.html': ('templates/property.php', 'property', 'Property details'),
    'project.html': ('templates/project.php', 'project', 'The Project'),
    'location.html': ('templates/location.php', 'location', 'Location'),
    'contact.html': ('templates/contact.php', 'contact', 'Contact'),
    'explore.html': ('templates/explore.php', 'explore', '3D Experience'),
}
KEYS = {'index': 'home', 'properties': 'properties', 'property': 'property', 'project': 'project', 'location': 'location', 'contact': 'contact', 'explore': 'explore'}


def php_link(m):
    key, query, hsh = KEYS[m.group(1)], (m.group(2) or '')[1:], (m.group(3) or '')[1:]
    args = [f"'{key}'"] + ([f"'{query}'"] if query or hsh else []) + ([f"'{hsh}'"] if hsh else [])
    return f'href="<?php echo esc_url( linden_link( {", ".join(args)} ) ); ?>"'


def template(html_name):
    out, key, name = PAGES[html_name]
    html = open(os.path.join(ROOT, html_name), encoding='utf-8').read()
    body = html[html.index('>', html.index('<body')) + 1: html.index('<script', html.index('<body'))].strip('\n')
    body = re.sub(r'href="(index|properties|property|project|location|contact|explore)\.html(\?[^"#]*)?(#[^"]*)?"', php_link, body)
    # Hero title and contact details come from WordPress.
    body = body.replace('<h1 class="hero__title"><span class="hero__line">Linden</span> <span class="hero__line">Residences</span></h1>',
                        '<h1 class="hero__title"><?php echo implode( " ", array_map( function ( $w ) { return \'<span class="hero__line">\' . esc_html( $w ) . \'</span>\'; }, explode( " ", get_bloginfo( "name" ) ) ) ); ?></h1>')
    body = body.replace('<h2 class="h4" id="o-addr">Linden Boulevard 12, New Belgrade</h2>',
                        '<h2 class="h4" id="o-addr"><?php echo esc_html( get_theme_mod( "linden_address", "Linden Boulevard 12, New Belgrade" ) ); ?></h2>')
    body = body.replace('<a href="tel:+381000000000">+381 00 000 0000</a>',
                        '<?php $ph = get_theme_mod( "linden_phone", "+381 00 000 0000" ); ?><a href="tel:<?php echo esc_attr( preg_replace( "/[^0-9+]/", "", $ph ) ); ?>"><?php echo esc_html( $ph ); ?></a>')
    body = body.replace('<a href="mailto:sales@linden-residences.example">sales@linden-residences.example</a>',
                        '<?php $em = get_theme_mod( "linden_email", get_option( "admin_email" ) ); ?><a href="mailto:<?php echo esc_attr( $em ); ?>"><?php echo esc_html( $em ); ?></a>')
    body = body.replace('<a class="btn btn--primary btn--block" href="#" onclick="return false">WhatsApp us</a>',
                        '<?php $wa = preg_replace( "/\\D/", "", get_theme_mod( "linden_whatsapp", "" ) ); ?><a class="btn btn--primary btn--block" href="<?php echo $wa ? esc_url( "https://wa.me/" . $wa ) : esc_url( linden_link( "contact" ) ); ?>">WhatsApp us</a>')
    body = body.replace('(Demo site — no data is sent.)', '')
    assert not re.search(r'href="[a-z-]+\.html', body), f'{html_name}: unconverted page link'
    head = '<?php\n'
    if name:
        head += f'/**\n * Template Name: {name}\n */\n'
    head += f"if ( ! defined( 'ABSPATH' ) ) {{ exit; }}\n$GLOBALS['linden_page'] = '{key}';\nget_header();\n?>\n"
    path = os.path.join(DIST, out)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(head + body + '\n<?php get_footer();\n')
    return out


def demo_data():
    js = "global.window={};require(process.argv[1]);const W=window;console.log(JSON.stringify(W.PROPERTIES.map(p=>Object.assign({},p,{images:p.images.map(k=>W.IMG[k](1600))}))))"
    data = json.loads(subprocess.check_output(['node', '-e', js, os.path.join(ROOT, 'assets', 'data.js')]))
    php = "<?php\n/** Demo properties added on first activation (generated from assets/data.js). */\nif ( ! defined( 'ABSPATH' ) ) { exit; }\n\nfunction linden_demo_properties() {\n\treturn json_decode( '" + json.dumps(data, ensure_ascii=False).replace('\\', '\\\\').replace("'", "\\'") + "', true );\n}\n"
    open(os.path.join(DIST, 'inc', 'demo-data.php'), 'w', encoding='utf-8').write(php)
    return len(data)


def main():
    shutil.rmtree(DIST, ignore_errors=True)
    shutil.copytree(SRC_PHP, DIST)
    os.makedirs(os.path.join(DIST, 'assets'))
    for a in ASSETS:
        shutil.copy(os.path.join(ROOT, 'assets', a), os.path.join(DIST, 'assets', a))
    built = [template(h) for h in PAGES]
    n = demo_data()
    # load demo data alongside the other includes
    fn = os.path.join(DIST, 'functions.php')
    src = open(fn, encoding='utf-8').read().replace("require get_theme_file_path( 'inc/setup.php' );", "require get_theme_file_path( 'inc/demo-data.php' );\nrequire get_theme_file_path( 'inc/setup.php' );")
    open(fn, 'w', encoding='utf-8').write(src)
    z = os.path.join(ROOT, 'dist', 'linden-residences.zip')
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        for d, _, files in os.walk(DIST):
            for f in files:
                full = os.path.join(d, f)
                zf.write(full, os.path.relpath(full, os.path.dirname(DIST)))
    print('templates:', ', '.join(built))
    print('demo properties:', n)
    print('zip:', z, round(os.path.getsize(z) / 1024), 'KB')


if __name__ == '__main__':
    main()
